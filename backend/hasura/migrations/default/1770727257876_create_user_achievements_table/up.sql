CREATE TABLE public.user_achievements (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    appid BIGINT NOT NULL REFERENCES public.games(appid),
    achievements_code TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlock_progress SMALLINT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, appid, achievements_code),

    FOREIGN KEY (appid, achievements_code)
        REFERENCES public.achievements(appid, achievements_code)
        ON DELETE RESTRICT
);

CREATE INDEX idx_user_achievements_lookup
ON public.user_achievements(user_id, appid);

CREATE INDEX idx_recent_unlocks
ON public.user_achievements(user_id, unlocked_at DESC);

CREATE INDEX idx_user_achievements_user
ON user_achievements(user_id);


