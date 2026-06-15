-- ============================================================
-- MIGRATION 005: SITE TABLE
-- Adds the Site entity as top-level container above Project.
-- MVP hierarchy: Site → Project → Task
-- Depends on: migration 001 (project table), migration 003 (set_updated_at)
-- ============================================================

-- ============================================================
-- TABLE: site
-- Top-level asset/construction site container.
-- ============================================================
CREATE TABLE public.site (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    address     TEXT        NOT NULL DEFAULT '',
    type        TEXT        NOT NULL DEFAULT 'residential'
                            CHECK (type IN ('residential','commercial','industrial','infrastructure')),
    client      TEXT        NOT NULL DEFAULT '',
    status      TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('planning','active','completed','on_hold')),
    start_date  DATE,
    target_date DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_status ON public.site(status);

CREATE TRIGGER trg_site_updated_at
    BEFORE UPDATE ON public.site
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ALTER project: add site_id FK (nullable — preserves existing data)
-- ============================================================
ALTER TABLE public.project
    ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.site(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_site_id ON public.project(site_id);
