-- Create tables for Luma Methods
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  discriminator TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'basic',
  uses_daily INT DEFAULT 3,
  uses_today INT DEFAULT 0,
  last_reset TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  views INT DEFAULT 0,
  author TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shortners (
  id TEXT PRIMARY KEY,
  url TEXT,
  original TEXT,
  creator TEXT,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builders (
  game_key TEXT PRIMARY KEY,
  name TEXT,
  link TEXT
);

CREATE TABLE IF NOT EXISTS builder_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  type TEXT,
  input TEXT,
  output TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB
);
