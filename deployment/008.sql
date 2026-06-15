-- ============================================================
-- MIGRATION 008: SEED DATA — SITES AND TASKS
-- Adds 3 sample sites, links existing projects to sites,
-- and adds 6 sample tasks (2 per project).
-- Depends on: migrations 001 (project), 005 (site), 006 (task)
-- NOTE: Requires seed projects from migration 004 to exist.
-- ============================================================

DO $$
DECLARE
    site_tlv    UUID := gen_random_uuid();
    site_haifa  UUID := gen_random_uuid();
    site_bs     UUID := gen_random_uuid();

    proj_1      UUID;
    proj_2      UUID;
    proj_3      UUID;
BEGIN

-- ============================================================
-- INSERT SITES
-- ============================================================
INSERT INTO public.site (id, name, address, type, client, status, start_date, target_date) VALUES
    (site_tlv,
     'פרויקט מגדל תל אביב',
     'רחוב רוטשילד 100, תל אביב',
     'commercial',
     'חברת השקעות TLV',
     'active',
     '2025-03-01',
     '2027-06-30'),

    (site_haifa,
     'קומפלקס מגורים חיפה',
     'שדרות הנשיא 45, חיפה',
     'residential',
     'קבוצת נדל"ן נוף הים',
     'active',
     '2025-06-01',
     '2026-12-31'),

    (site_bs,
     'מרכז לוגיסטי באר שבע',
     'אזור תעשייה צפוני, באר שבע',
     'industrial',
     'לוגיסטיקה בע"מ',
     'planning',
     '2026-01-01',
     '2027-03-31');


-- ============================================================
-- FETCH EXISTING PROJECT IDs (seeded in migration 004)
-- ============================================================
SELECT id INTO proj_1 FROM public.project ORDER BY created_at ASC LIMIT 1 OFFSET 0;
SELECT id INTO proj_2 FROM public.project ORDER BY created_at ASC LIMIT 1 OFFSET 1;
SELECT id INTO proj_3 FROM public.project ORDER BY created_at ASC LIMIT 1 OFFSET 2;


-- ============================================================
-- LINK PROJECTS TO SITES
-- ============================================================
UPDATE public.project SET site_id = site_tlv   WHERE id = proj_1;
UPDATE public.project SET site_id = site_haifa  WHERE id = proj_2;
UPDATE public.project SET site_id = site_bs     WHERE id = proj_3;


-- ============================================================
-- INSERT TASKS (2 per project = 6 total)
-- ============================================================
INSERT INTO public.task (project_id, title, description, status, priority, assigned_to, due_date, progress) VALUES
    -- Project 1 tasks
    (proj_1,
     'יציקת רצפת קומה 3',
     'יציקת בטון לרצפת קומה 3, כולל חיזוק ברזל ותיאום עם קבלן החשמל',
     'in_progress',
     'high',
     'יוסי כהן',
     '2026-06-20',
     60),

    (proj_1,
     'התקנת חלונות חזית',
     'התקנת 24 יחידות חלונות אלומיניום בחזית הבניין',
     'not_started',
     'medium',
     'רוני לוי',
     '2026-07-05',
     0),

    -- Project 2 tasks
    (proj_2,
     'עבודות איטום גג',
     'ציפוי גג בשכבת איטום ביטומנית, כולל פינות ועמודות',
     'in_progress',
     'critical',
     'מאיר אברהם',
     '2026-06-18',
     40),

    (proj_2,
     'הנחת צנרת אינסטלציה קומה 1',
     'הנחת צינורות מים חמים וקרים בדירות 1-8',
     'blocked',
     'high',
     'דוד נחום',
     '2026-06-25',
     20),

    -- Project 3 tasks
    (proj_3,
     'עבודות עפר ויסודות',
     'חפירה ויציקת יסודות לאגף A של המרכז הלוגיסטי',
     'not_started',
     'high',
     'שלמה גרוס',
     '2026-07-15',
     0),

    (proj_3,
     'גידור היקפי אתר',
     'התקנת גידור זמני סביב כל שטח הפרויקט לפי דרישות הבטיחות',
     'completed',
     'low',
     'אמיר שמש',
     '2026-06-10',
     100);

END $$;
