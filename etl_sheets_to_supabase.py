"""
ETL Pipeline : Google Sheets → Supabase
Table cible : public.games_gam
Schedulé via Github Actions (cron quotidien)
"""

import os
import json
import logging
import gspread
import pandas as pd
from supabase import create_client, Client
from google.oauth2.service_account import Credentials

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────────────
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

# Variables d'environnement (définies dans Github Actions Secrets)
SUPABASE_URL      = os.environ["SUPABASE_URL"]
SUPABASE_KEY      = os.environ["SUPABASE_SERVICE_KEY"]   # service_role key
SHEET_ID          = os.environ["GOOGLE_SHEET_ID"]         # ID dans l'URL du Sheet
GOOGLE_CREDS_JSON = os.environ["GOOGLE_CREDENTIALS_JSON"] # JSON du service account

# Colonnes attendues dans le Google Sheet (dans cet ordre)
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
    "comment_gam",
    "image_gam",
    "publisher_gam",
    "owner_gam",
]

# Colonnes obligatoires (NOT NULL dans Supabase)
REQUIRED_COLUMNS = [
    "name_gam",
    "genre_gam",
    "min_player_gam",
    "playtime_gam",
    "minimum_age_gam",
    "difficulty_gam",
    "owner_gam",
]

# Colonnes numériques à caster en int
INTEGER_COLUMNS = ["min_player_gam", "max_player_gam", "minimum_age_gam"]


# ─── Extract ─────────────────────────────────────────────────────────────────
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


# ─── Transform ───────────────────────────────────────────────────────────────
def transform(df: pd.DataFrame) -> pd.DataFrame:
    log.info("Transformation des données...")

    # Remplacer les cellules vides par None
    df = df.replace("", None)

    # Supprimer les lignes sans les champs obligatoires
    before = len(df)
    df = df.dropna(subset=REQUIRED_COLUMNS)
    dropped = before - len(df)
    if dropped:
        log.warning(f"  {dropped} ligne(s) ignorée(s) — champs obligatoires manquants.")

    # Strip des espaces sur les colonnes texte
    str_cols = df.select_dtypes(include="object").columns
    df[str_cols] = df[str_cols].apply(lambda c: c.str.strip() if c.dtype == "object" else c)

    # Cast des colonnes numériques
    for col in INTEGER_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    # Déduplication dans le Sheet (même nom + même propriétaire)
    before = len(df)
    df = df.drop_duplicates(subset=["name_gam", "owner_gam"], keep="last")
    dupes = before - len(df)
    if dupes:
        log.warning(f"  {dupes} doublon(s) supprimé(s) dans le Sheet.")

    log.info(f"  {len(df)} lignes prêtes à être chargées.")
    return df


# ─── Load ────────────────────────────────────────────────────────────────────
def load_to_supabase(df: pd.DataFrame) -> None:
    log.info("Connexion à Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Récupérer les couples (name_gam, owner_gam) déjà en base
    existing = supabase.table("games_gam").select("name_gam, owner_gam").execute()
    existing_set = {
        (row["name_gam"], row["owner_gam"])
        for row in existing.data
    }

    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    new_rows    = []
    update_rows = []

    for row in records:
        key = (row["name_gam"], row["owner_gam"])
        if key in existing_set:
            update_rows.append(row)
        else:
            new_rows.append(row)

    # Insert des nouveaux jeux
    if new_rows:
        supabase.table("games_gam").insert(new_rows).execute()
        log.info(f"  ✅ {len(new_rows)} nouveau(x) jeu(x) inséré(s).")

    # Upsert des jeux existants (mise à jour si modifiés dans le Sheet)
    if update_rows:
        supabase.table("games_gam").upsert(
            update_rows,
            on_conflict="name_gam,owner_gam"
        ).execute()
        log.info(f"  🔄 {len(update_rows)} jeu(x) mis à jour.")

    if not new_rows and not update_rows:
        log.info("  Aucune modification détectée.")


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    log.info("=== Démarrage de la pipeline ETL ===")
    df = extract_from_sheets()
    df = transform(df)
    load_to_supabase(df)
    log.info("=== Pipeline terminée avec succès ===")


if __name__ == "__main__":
    main()