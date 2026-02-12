CREATE TABLE user_sync_status (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_synced_at TIMESTAMPTZ,
    last_successful_sync_at TIMESTAMPTZ,
    sync_in_progress BOOLEAN DEFAULT FALSE,
    manual_sync_used BOOLEAN DEFAULT FALSE,
    manual_sync_reset_at TIMESTAMPTZ,
    last_error TEXT
);

CREATE INDEX idx_user_sync_status_last_synced
ON public.user_sync_status(last_synced_at)
WHERE sync_in_progress IS FALSE;

CREATE INDEX idx_sync_due_users
ON public.user_sync_status(last_successful_sync_at)
WHERE sync_in_progress = FALSE;
