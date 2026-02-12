CREATE TYPE sync_job_status AS ENUM (
    'pending',
    'running',
    'success',
    'failed'
);

CREATE TYPE sync_job_type AS ENUM (
    'full_sync',
    'achievements_only'
);

CREATE TABLE public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_type sync_job_type NOT NULL,
    status sync_job_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts SMALLINT NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_jobs_pending
ON public.sync_jobs(status)
WHERE status = 'pending';

CREATE UNIQUE INDEX idx_one_active_sync_per_user
ON public.sync_jobs(user_id)
WHERE status IN ('pending', 'running');
