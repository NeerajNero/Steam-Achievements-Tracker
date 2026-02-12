CREATE TABLE public.user_games (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    appid BIGINT NOT NULL REFERENCES public.games(appid) ON DELETE RESTRICT,
    owned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    playtime_minutes BIGINT NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    completion_percentage SMALLINT,
    total_achievements INT NOT NULL DEFAULT 0,
    unlocked_achievements INT NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_unlocked_achievement_code TEXT,
    last_unlocked_achievement_at TIMESTAMPTZ,

    source TEXT DEFAULT 'steam'
        CHECK (source IN ('steam', 'manual', 'import')),

    PRIMARY KEY (user_id, appid),

    CONSTRAINT completion_between_0_100
        CHECK (completion_percentage BETWEEN 0 AND 100),

    CONSTRAINT playtime_positive
        CHECK (playtime_minutes >= 0)

);

CREATE INDEX idx_user_games_appid
ON public.user_games(appid);

CREATE INDEX idx_user_games_last_played
ON public.user_games(last_played_at DESC);

CREATE INDEX idx_user_games_user_last_played
ON public.user_games(user_id, last_played_at DESC);

CREATE INDEX idx_user_games_favorites
ON public.user_games(user_id)
WHERE is_favorite = TRUE;

CREATE INDEX idx_user_games_recent
ON public.user_games(user_id, last_played_at DESC)
WHERE last_played_at IS NOT NULL;
