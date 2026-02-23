CREATE TABLE public.user_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT user_providers_provider_identity_unique UNIQUE(provider, provider_id),
    CONSTRAINT user_providers_user_provider_unique UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_providers_user_id ON public.user_providers(user_id);
