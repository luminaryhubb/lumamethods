Luma Methods — Fullstack Project (Vite React + Express)
==========================================================

This project includes:
- frontend/ (Vite + React + Tailwind)
- backend/ (Express) with real Discord OAuth flow implemented (you must set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET)

Important steps to run locally:
1. Clone or unzip project.
2. Backend:
   - cd backend
   - cp .env.example .env and fill DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_CALLBACK_URL (eg http://localhost:3000/auth/callback)
   - npm install
   - node server.js
3. Frontend (dev):
   - cd frontend
   - npm install
   - npm run dev
4. For full integration, run backend on port 3000 and frontend dev on 5173 (vite). In production you can build frontend and serve via backend static files.

OAuth notes:
- The backend implements the standard Discord OAuth2 authorization_code flow.
- After user authorizes, backend exchanges code for token, fetches /users/@me and stores user in session.
- Admins are controlled via ADMIN_IDS environment variable (comma-separated discord ids).

Security:
- Use HTTPS in production and set cookie.secure = true in session config.
- Store session secret and client secret securely.
- Replace sqlite with a persistent DB for production (Postgres, MySQL, etc.).
