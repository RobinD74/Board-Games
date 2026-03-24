import os
import json
import logging
import gspread
import pandas as pd
from supabase import create_client, Client
from google.oauth2.service_account import Credentials

# First we define the file to target, the secrets, the table and the required fields

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

SUPABASE_URL      = os.environ["SUPABASE_URL"]
SUPABASE_KEY      = os.environ["SUPABASE_SERVICE_KEY"]
SHEET_ID          = os.environ["GOOGLE_SHEET_ID"]
GOOGLE_CREDS_JSON = os.environ["GOOGLE_CREDENTIALS_JSON"]

SHEET_COLUMNS = [
    "name_gam",
    "genre_gam",
    "genre2_gam",
    "genre3_gam",
    "subgenre_gam",
    "subgenre2_gam",
    "subgenre3_gam",
    "min_player_gam",
    "max_player_gam",
    "playtime_gam",
    "minimum_age_gam",
    "difficulty_gam",
    "language_gam",
    "image_gam",
    "publisher_gam",
    "owner_gam",
]

REQUIRED_COLUMNS = [
    "name_gam",
    "genre_gam",
    "min_player_gam",
    "playtime_gam",
    "minimum_age_gam",
    "difficulty_gam",
    "owner_gam",
]

INTEGER_COLUMNS = ["min_player_gam", "max_player_gam", "minimum_age_gam"]

# ── Extensions tab config ──────────────────────────────────────────
EXT_SHEET_COLUMNS = [
    "game_name_ext",
    "name_ext",
    "owner_ext",
]

EXT_REQUIRED_COLUMNS = ["game_name_ext", "name_ext", "owner_ext"]


# ═══════════════════════════════════════════════════════════════════
#  GAMES pipeline
# ═══════════════════════════════════════════════════════════════════

# Then extract the data
def extract_from_sheets() -> pd.DataFrame:
    log.info("Connexion à Google Sheets...")
    creds_dict = json.loads(GOOGLE_CREDS_JSON)
    creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    client = gspread.authorize(creds)

    sheet = client.open_by_key(SHEET_ID).sheet1
    records = sheet.get_all_records(expected_headers=SHEET_COLUMNS)
    df = pd.DataFrame(records)

    log.info(f"  {len(df)} lignes extraites du Sheet.")
    return df

# Then check if required columns are present, replace empty ones by none
def transform(df: pd.DataFrame) -> pd.DataFrame:
    log.info("Transformation des données...")

    if df.empty or not all(col in df.columns for col in REQUIRED_COLUMNS):
        log.warning("  Sheet vide ou colonnes manquantes — pipeline arrêtée proprement.")
        return pd.DataFrame(columns=SHEET_COLUMNS)

    df = df.replace("", None)

    before = len(df)
    df = df.dropna(subset=REQUIRED_COLUMNS)
    dropped = before - len(df)
    if dropped:
        log.warning(f"  {dropped} ligne(s) ignorée(s) — champs obligatoires manquants.")

    str_cols = df.select_dtypes(include=["object", "str"]).columns
    df[str_cols] = df[str_cols].apply(lambda c: c.map(lambda x: x.strip() if isinstance(x, str) else x))

    for col in INTEGER_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    before = len(df)
    df = df.drop_duplicates(subset=["name_gam", "owner_gam"], keep="last")
    dupes = before - len(df)
    if dupes:
        log.warning(f"  {dupes} doublon(s) supprimé(s) dans le Sheet.")

    log.info(f"  {len(df)} lignes prêtes à être chargées.")
    return df

# game exists? update, insert
def load_to_supabase(df: pd.DataFrame) -> None:
    if df.empty:
        log.info("  Aucune donnée à charger.")
        return
    log.info("Connexion à Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    existing = supabase.table("games_gam").select("name_gam, owner_gam").execute()
    existing_set = {
        (row["name_gam"], row["owner_gam"])
        for row in existing.data
    }

    df = df.drop(columns=["id_gam"], errors="ignore")

    df = df.astype(object).where(pd.notnull(df), None)
    records = df.to_dict(orient="records")
    records = [
        {k: (None if isinstance(v, float) and pd.isna(v) else v) for k, v in row.items()}
        for row in records
    ]
    new_rows    = []
    update_rows = []

    for row in records:
        key = (row["name_gam"], row["owner_gam"])
        if key in existing_set:
            update_rows.append(row)
        else:
            new_rows.append(row)

    if new_rows:
        supabase.table("games_gam").insert(new_rows).execute()
        log.info(f"  ✅ {len(new_rows)} nouveau(x) jeu(x) inséré(s).")
    if update_rows:
        supabase.table("games_gam").upsert(
            update_rows,
            on_conflict="name_gam,owner_gam"
        ).execute()
        log.info(f"  🔄 {len(update_rows)} jeu(x) mis à jour.")

    if not new_rows and not update_rows:
        log.info("  Aucune modification détectée.")


# ═══════════════════════════════════════════════════════════════════
#  EXTENSIONS pipeline
# ═══════════════════════════════════════════════════════════════════

def extract_extensions() -> pd.DataFrame:
    """Extract data from the 'Extensions' tab (2nd sheet)."""
    log.info("Extraction des extensions depuis le Sheet...")
    creds_dict = json.loads(GOOGLE_CREDS_JSON)
    creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    client = gspread.authorize(creds)

    spreadsheet = client.open_by_key(SHEET_ID)
    try:
        ext_sheet = spreadsheet.worksheet("Extensions")
    except gspread.exceptions.WorksheetNotFound:
        log.warning("  Onglet 'Extensions' introuvable — étape ignorée.")
        return pd.DataFrame(columns=EXT_SHEET_COLUMNS)

    records = ext_sheet.get_all_records(expected_headers=EXT_SHEET_COLUMNS)
    df = pd.DataFrame(records)
    log.info(f"  {len(df)} lignes extraites de l'onglet Extensions.")
    return df


def transform_extensions(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and validate extension rows."""
    log.info("Transformation des extensions...")

    if df.empty or not all(col in df.columns for col in EXT_REQUIRED_COLUMNS):
        log.warning("  Onglet Extensions vide ou colonnes manquantes.")
        return pd.DataFrame(columns=EXT_SHEET_COLUMNS)

    df = df.replace("", None)

    before = len(df)
    df = df.dropna(subset=EXT_REQUIRED_COLUMNS)
    dropped = before - len(df)
    if dropped:
        log.warning(f"  {dropped} extension(s) ignorée(s) — champs obligatoires manquants.")

    str_cols = df.select_dtypes(include=["object", "str"]).columns
    df[str_cols] = df[str_cols].apply(lambda c: c.map(lambda x: x.strip() if isinstance(x, str) else x))

    before = len(df)
    df = df.drop_duplicates(subset=["game_name_ext", "name_ext", "owner_ext"], keep="last")
    dupes = before - len(df)
    if dupes:
        log.warning(f"  {dupes} doublon(s) supprimé(s) dans les extensions.")

    log.info(f"  {len(df)} extension(s) prête(s) à être chargées.")
    return df


def load_extensions_to_supabase(df: pd.DataFrame) -> None:
    """Resolve game_name_ext → game_id_ext, then full-refresh extensions_ext."""
    if df.empty:
        log.info("  Aucune extension à charger.")
        return

    log.info("Chargement des extensions dans Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Build a lookup: game name → id_gam
    games = supabase.table("games_gam").select("id_gam, name_gam").execute()
    name_to_id = {row["name_gam"]: row["id_gam"] for row in games.data}

    # Resolve game names to IDs
    records = []
    skipped = 0
    for _, row in df.iterrows():
        game_id = name_to_id.get(row["game_name_ext"])
        if game_id is None:
            skipped += 1
            continue
        records.append({
            "game_id_ext": game_id,
            "name_ext":    row["name_ext"],
            "owner_ext":   row["owner_ext"],
        })

    if skipped:
        log.warning(f"  {skipped} extension(s) ignorée(s) — jeu introuvable dans la base.")

    if not records:
        log.info("  Aucune extension valide à charger.")
        return

    # Full refresh: delete all existing extensions, then re-insert from Sheet
    supabase.table("extensions_ext").delete().neq("id_ext", -1).execute()
    log.info("  🗑️  Table extensions_ext vidée.")

    supabase.table("extensions_ext").insert(records).execute()
    log.info(f"  ✅ {len(records)} extension(s) insérée(s).")


# ═══════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════

def main():
    log.info("=== Démarrage de la pipeline ETL ===")

    # Games
    df = extract_from_sheets()
    df = transform(df)
    load_to_supabase(df)

    # Extensions
    ext_df = extract_extensions()
    ext_df = transform_extensions(ext_df)
    load_extensions_to_supabase(ext_df)

    log.info("=== Pipeline terminée avec succès ===")


if __name__ == "__main__":
    main()