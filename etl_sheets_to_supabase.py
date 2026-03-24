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


def main():
    log.info("=== Démarrage de la pipeline ETL ===")
    df = extract_from_sheets()
    df = transform(df)
    load_to_supabase(df)
    log.info("=== Pipeline terminée avec succès ===")


if __name__ == "__main__":
    main()