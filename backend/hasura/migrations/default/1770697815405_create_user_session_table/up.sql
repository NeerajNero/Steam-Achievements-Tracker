
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    ip_address INET,
    device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    revoked_at TIMESTAMPTZ,

    CONSTRAINT session_expiry_check 
        CHECK (expires_at > created_at),

    CONSTRAINT unique_user_device_session
        UNIQUE(user_id, device_id)
);

CREATE INDEX idx_sessions_expiry
ON public.user_sessions(expires_at);

CREATE INDEX idx_sessions_user
ON public.user_sessions(user_id);

CREATE INDEX idx_active_sessions
ON public.user_sessions(user_id)
WHERE revoked_at IS NULL;

CREATE INDEX idx_sessions_last_used
ON public.user_sessions(last_used_at);
