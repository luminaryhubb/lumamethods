-- Dump SQL for Luma Methods minimal schema
-- Run once to create tables

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  discriminator TEXT,
  avatar TEXT,
  email TEXT,
  role TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uses (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  uses_left INTEGER DEFAULT 3,
  last_reset DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')
);

CREATE TABLE IF NOT EXISTS shortners (
  id SERIAL PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  target TEXT NOT NULL,
  owner_id TEXT REFERENCES users(id),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pastes (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  owner_id TEXT REFERENCES users(id),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builders (
  id SERIAL PRIMARY KEY,
  owner_id TEXT REFERENCES users(id),
  platform TEXT,
  private_link TEXT,
  option_chosen TEXT,
  output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shortners_views ON shortners(views);
CREATE INDEX IF NOT EXISTS idx_pastes_views ON pastes(views);
