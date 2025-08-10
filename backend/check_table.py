from sqlmodel import create_engine, text
from app.core.config import settings

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

with engine.connect() as conn:
    # Check if censusdata table exists
    result = conn.execute(
        text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'censusdata';"
        )
    ).fetchall()

    print(f"CensusData table exists: {len(result) > 0}")
    print(f"Tables found: {result}")

    # List all tables
    all_tables = conn.execute(
        text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        )
    ).fetchall()

    print(f"\nAll tables in database:")
    for table in all_tables:
        print(f"  - {table[0]}")
