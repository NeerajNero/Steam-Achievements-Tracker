CREATE TABLE public.achievements (
    appid BIGINT NOT NULL REFERENCES public.games(appid) ON DELETE RESTRICT,
    achievements_code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_unlocked TEXT NOT NULL,
    icon_locked TEXT NOT NULL,
    icon_unlocked_url TEXT NOT NULL,
    icon_locked_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (appid, achievements_code)
);

CREATE INDEX idx_achievements_appid
ON achievements(appid);
