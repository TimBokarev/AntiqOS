-- AntiqOS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: entities (персонажи/объекты)
-- ============================================
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,     -- "medusa"
    name VARCHAR(255) NOT NULL,             -- "Медуза Горгона"
    subtitle VARCHAR(255),                  -- "Хранительница галереи"
    avatar_url TEXT,
    welcome_message TEXT NOT NULL,
    system_prompt TEXT,                     -- Промпт для LLM
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast slug lookup
CREATE INDEX idx_entities_slug ON entities(slug);

-- ============================================
-- TABLE: sessions (сессии пользователей)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    thread_id VARCHAR(100) NOT NULL,        -- Для "Очистить чат"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_entity_id ON sessions(entity_id);
CREATE INDEX idx_sessions_thread_id ON sessions(thread_id);

-- ============================================
-- TABLE: messages (история чата)
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    thread_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,              -- 'user' | 'assistant'
    content_type VARCHAR(20) NOT NULL,      -- 'text' | 'image' | 'audio'
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Entities: public read for active entities
CREATE POLICY "Public can read active entities"
    ON entities FOR SELECT
    USING (is_active = true);

-- Sessions: anon can create and read their own sessions
CREATE POLICY "Anyone can create sessions"
    ON sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
    ON sessions FOR SELECT
    USING (true);

CREATE POLICY "Anyone can update sessions"
    ON sessions FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can delete sessions"
    ON sessions FOR DELETE
    USING (true);

-- Messages: anon can create and read messages
CREATE POLICY "Anyone can create messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can read messages"
    ON messages FOR SELECT
    USING (true);

CREATE POLICY "Anyone can delete messages"
    ON messages FOR DELETE
    USING (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Dashboard > Storage

-- 1. Create bucket: entity-avatars (public)
-- 2. Create bucket: user-uploads (public)
-- 3. Create bucket: voice-recordings (public)

-- Storage policies (run in SQL Editor):

-- entity-avatars: public read
INSERT INTO storage.buckets (id, name, public) VALUES ('entity-avatars', 'entity-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- user-uploads: public read, authenticated upload
INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- voice-recordings: public read, authenticated upload
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for uploads
CREATE POLICY "Anyone can upload to user-uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can read user-uploads"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can upload to voice-recordings"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'voice-recordings');

CREATE POLICY "Anyone can read voice-recordings"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'voice-recordings');

CREATE POLICY "Anyone can read entity-avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'entity-avatars');

-- ============================================
-- SAMPLE DATA
-- ============================================
-- Insert a sample entity for testing
INSERT INTO entities (slug, name, subtitle, welcome_message, system_prompt)
VALUES (
    'medusa',
    'Медуза Горгона',
    'Хранительница галереи',
    'Приветствую тебя, смертный! Я Медуза Горгона, хранительница этой галереи. Не бойся смотреть мне в глаза — я давно научилась контролировать свой дар. Что привело тебя ко мне?',
    'Ты — Медуза Горгона, мифологическое существо из древнегреческих легенд. Ты хранительница художественной галереи. Говори величественно, но дружелюбно. Можешь рассказывать истории из своей мифологической жизни и делиться знаниями об искусстве. Отвечай на русском языке.'
);
