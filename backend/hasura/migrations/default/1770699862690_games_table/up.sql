CREATE TABLE public.games (
    appid BIGINT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    developer TEXT,
    publisher TEXT,
    release_date DATE,
    header_image TEXT,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retired_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,

    CONSTRAINT games_appid_check
    CHECK (appid > 0)

);

CREATE INDEX idx_games_active
ON public.games(retired_at);

CREATE INDEX idx_games_retired
ON public.games(retired_at)
WHERE retired_at IS NULL;
