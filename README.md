# LumaMethods - Fullstack (React TypeScript + Tailwind) + Express (Discord OAuth2)

## What this is
- Frontend: Vite + React + TypeScript + Tailwind
- Backend: Express + passport-discord for OAuth2
- The backend serves API routes and handles Discord OAuth2.
- After login the client will show a black welcome screen: "Bem vindo (apelido do discord)!"

## Environment (server/.env)
This project includes a `.env` file with the values you provided. **Secrets are sensitive** — don't share the ZIP publicly.

## How to run (locally)
1. Install dependencies (root will run both):
   - `npm run install-all`
2. Build client:
   - `npm --prefix client run build`
3. Start server:
   - `npm --prefix server start`
4. Open `http://localhost:3000`

## Deploying to Render
- Create a Web Service that runs `npm --prefix server start`.
- Set environment variables (or keep the provided .env).
- When deploying Render will run the server which serves the built client.

## Notes
- This repo contains sample code and minimal error handling. Use for testing and adapt for production.
