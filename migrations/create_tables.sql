-- migrations/create_tables.sql

-- Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pastes
CREATE TABLE IF NOT EXISTS pastes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Builders (links/jogos buildados)
CREATE TABLE IF NOT EXISTS builders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    game_name VARCHAR(255) NOT NULL,
    link TEXT NOT NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Configurações do site
CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) DEFAULT 'Luma Methods',
    site_color VARCHAR(50) DEFAULT '#000000',
    logo_url TEXT,
    maintenance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Shorteners (encurtadores)
CREATE TABLE IF NOT EXISTS shorteners (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
