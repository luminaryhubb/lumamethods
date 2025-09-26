Luma Methods - Full project (backend + frontend)

How to run locally:
1. Copy .env.example -> .env and fill variables (DATABASE_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_CALLBACK_URL)
2. Run migrations: psql -h <host> -U <user> -d <db> -f migrations/create_tables.sql
3. npm install
4. npm start
