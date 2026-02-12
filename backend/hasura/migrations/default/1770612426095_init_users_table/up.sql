CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE auth_provider AS ENUM ('email', 'google', 'steam');

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    password_hash TEXT,
    username TEXT UNIQUE,
    provider auth_provider NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_provider_identity_unique
    UNIQUE(provider, provider_id)
);

CREATE INDEX idx_users_provider
ON public.users(provider);
