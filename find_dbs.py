import psycopg2
c = psycopg2.connect(host="localhost", port=5432, user="postgres", password="Ayush@0943", dbname="orderServiceDB")
cur = c.cursor()
cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name;
""")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)
for t in tables:
    cur.execute("""
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = %s ORDER BY ordinal_position
    """, (t,))
    print(f"\n{t}:")
    for col, dtype in cur.fetchall():
        print(f"  {col:<30} {dtype}")
cur.close(); c.close()
