"""Read-only verse text lookup.

Connects with a Postgres role that must be granted SELECT only on
verses/surahs — this service never writes to the database.
"""
import os
import psycopg2

DATABASE_URL = os.getenv('DATABASE_URL')


def get_reference_text(surah_id: str, from_verse: int, to_verse: int) -> str:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT arabic_text
                FROM verses
                WHERE surah_id = %s AND verse_number BETWEEN %s AND %s
                ORDER BY verse_number
                """,
                (surah_id, from_verse, to_verse),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return ' '.join(r[0] for r in rows)
