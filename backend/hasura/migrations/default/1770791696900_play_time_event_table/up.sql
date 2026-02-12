CREATE TABLE playtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    appid BIGINT,
    minutes_played INTEGER,
    playtime_minutes BIGINT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    playtime_updated_at TIMESTAMPTZ
);
