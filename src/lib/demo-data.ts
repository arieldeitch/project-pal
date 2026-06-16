import type { Site, Project, Task, DailyLog, Issue, Blocker, Decision, Report, SitePhoto } from "./mock-data";

// ─── SITES ───────────────────────────────────────────────────────────────────

export const DEMO_SITES: Site[] = [
  {
    id: "s1",
    name: "שכונת נוף הכרמל",
    address: "רחוב הכרמל 1, חיפה",
    type: "residential",
    client: 'רמי בנייה בע"מ',
    status: "active",
    startDate: "2025-01-01",
    targetDate: "2026-12-31",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s2",
    name: "מגדלי הדר ירושלים",
    address: "שדרות ירושלים 20, ירושלים",
    type: "residential",
    client: 'כנען השקעות נדל"ן',
    status: "active",
    startDate: "2025-05-01",
    targetDate: "2027-12-31",
    createdAt: "2025-05-01T08:00:00Z",
  },
  {
    id: "s3",
    name: "מרכז מסחרי גבעת זאב",
    address: "שדרות גבעת זאב 5, גבעת זאב",
    type: "commercial",
    client: 'מנורה נכסים בע"מ',
    status: "active",
    startDate: "2025-04-01",
    targetDate: "2027-06-30",
    createdAt: "2025-04-01T08:00:00Z",
  },
  {
    id: "s4",
    name: "בית ספר יסודי מודיעין",
    address: "רחוב האקדמיה 12, מודיעין",
    type: "infrastructure",
    client: "עיריית מודיעין-מכבים-רעות",
    status: "planning",
    startDate: "2026-03-01",
    targetDate: "2027-12-31",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "s5",
    name: "בניין משרדים הר חוצבים",
    address: "רחוב הר חוצבים 15, ירושלים",
    type: "commercial",
    client: "טק פארק ירושלים",
    status: "completed",
    startDate: "2024-01-01",
    targetDate: "2026-03-31",
    createdAt: "2024-01-01T08:00:00Z",
  },
];

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const DEMO_PROJECTS: Project[] = [
  // Site 1 – נוף הכרמל (healthy, progressing well)
  {
    id: "p01",
    siteId: "s1",
    name: "בניין A - נוף הכרמל",
    address: "רחוב הכרמל 1א, חיפה",
    client: 'רמי בנייה בע"מ',
    manager: "אריאל דייטש",
    status: "active",
    startDate: "2025-01-15",
    targetDate: "2026-09-30",
  },
  {
    id: "p02",
    siteId: "s1",
    name: "בניין B - נוף הכרמל",
    address: "רחוב הכרמל 1ב, חיפה",
    client: 'רמי בנייה בע"מ',
    manager: "דוד לוי",
    status: "active",
    startDate: "2025-03-01",
    targetDate: "2026-12-31",
  },
  {
    id: "p03",
    siteId: "s1",
    name: "תשתיות ורחובות פנימיים",
    address: "שכונת נוף הכרמל, חיפה",
    client: 'רמי בנייה בע"מ',
    manager: "עידן פרץ",
    status: "active",
    startDate: "2025-01-01",
    targetDate: "2026-07-30",
  },
  // Site 2 – הדר ירושלים (has open issues)
  {
    id: "p04",
    siteId: "s2",
    name: "מגדל צפון - הדר ירושלים",
    address: "שדרות ירושלים 20א, ירושלים",
    client: 'כנען השקעות נדל"ן',
    manager: "אריאל דייטש",
    status: "active",
    startDate: "2025-06-01",
    targetDate: "2027-03-31",
  },
  {
    id: "p05",
    siteId: "s2",
    name: "מגדל דרום - הדר ירושלים",
    address: "שדרות ירושלים 20ב, ירושלים",
    client: 'כנען השקעות נדל"ן',
    manager: "דוד לוי",
    status: "active",
    startDate: "2025-08-01",
    targetDate: "2027-06-30",
  },
  {
    id: "p06",
    siteId: "s2",
    name: "חניון תת-קרקעי - הדר",
    address: "שדרות ירושלים 20, ירושלים",
    client: 'כנען השקעות נדל"ן',
    manager: "עידן פרץ",
    status: "active",
    startDate: "2025-05-01",
    targetDate: "2026-11-30",
  },
  // Site 3 – גבעת זאב (blocked / on hold)
  {
    id: "p07",
    siteId: "s3",
    name: "אגף מסחרי A - גבעת זאב",
    address: "שדרות גבעת זאב 5א",
    client: 'מנורה נכסים בע"מ',
    manager: "אריאל דייטש",
    status: "on_hold",
    startDate: "2025-04-01",
    targetDate: "2026-10-31",
  },
  {
    id: "p08",
    siteId: "s3",
    name: "אגף מסחרי B - גבעת זאב",
    address: "שדרות גבעת זאב 5ב",
    client: 'מנורה נכסים בע"מ',
    manager: "עדי אברהם",
    status: "planning",
    startDate: "2026-01-01",
    targetDate: "2027-04-30",
  },
  // Site 4 – מודיעין (waiting management decisions)
  {
    id: "p09",
    siteId: "s4",
    name: "בניין לימודים ראשי - מודיעין",
    address: "רחוב האקדמיה 12, מודיעין",
    client: "עיריית מודיעין-מכבים-רעות",
    manager: "דוד לוי",
    status: "planning",
    startDate: "2026-03-01",
    targetDate: "2027-08-31",
  },
  {
    id: "p10",
    siteId: "s4",
    name: "מגרשי ספורט ואולמות",
    address: "רחוב האקדמיה 12, מודיעין",
    client: "עיריית מודיעין-מכבים-רעות",
    manager: "עידן פרץ",
    status: "planning",
    startDate: "2026-06-01",
    targetDate: "2027-09-30",
  },
  // Site 5 – הר חוצבים (completed)
  {
    id: "p11",
    siteId: "s5",
    name: "קומות 1-5 - הר חוצבים",
    address: "רחוב הר חוצבים 15, ירושלים",
    client: "טק פארק ירושלים",
    manager: "אריאל דייטש",
    status: "completed",
    startDate: "2024-01-01",
    targetDate: "2025-12-31",
  },
  {
    id: "p12",
    siteId: "s5",
    name: "קומות 6-10 - הר חוצבים",
    address: "רחוב הר חוצבים 15, ירושלים",
    client: "טק פארק ירושלים",
    manager: "דוד לוי",
    status: "completed",
    startDate: "2024-03-01",
    targetDate: "2026-02-28",
  },
];

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const DEMO_TASKS: Task[] = [
  // p01 – בניין A (healthy, 75%)
  { id: "t001", projectId: "p01", title: "אישור תוכניות קונסטרוקציה", description: "בדיקת ואישור כלל תוכניות הקונסטרוקציה על ידי מהנדס פיקוח", status: "completed", priority: "high", assignedTo: "אריאל דייטש", dueDate: "2025-02-28", progress: 100, createdAt: "2025-01-20T08:00:00Z", updates: [], comments: [] },
  { id: "t002", projectId: "p01", title: "יציקת יסודות ורצפה", description: "יציקת בטון יסודות ורצפת קרקע - קומת מרתף ו-0", status: "completed", priority: "critical", assignedTo: "רועי כהן", dueDate: "2025-04-30", progress: 100, createdAt: "2025-02-01T08:00:00Z", updates: [], comments: [] },
  { id: "t003", projectId: "p01", title: "בניית שלד קומות 1-4", description: "הקמת שלד בטון - קומות 1 עד 4 כולל קורות ועמודים", status: "completed", priority: "high", assignedTo: "רועי כהן", dueDate: "2025-08-31", progress: 100, createdAt: "2025-04-15T08:00:00Z", updates: [], comments: [] },
  { id: "t004", projectId: "p01", title: "בניית שלד קומות 5-8", description: "המשך הקמת השלד - קומות 5 עד 8", status: "in_progress", priority: "critical", assignedTo: "מאור אוחיון", dueDate: "2026-02-28", progress: 80, createdAt: "2025-09-01T08:00:00Z", updates: [], comments: [] },
  { id: "t005", projectId: "p01", title: "עבודות אינסטלציה - קומות 1-5", description: "הנחת צנרת מים חמים קרים וביוב בכל הקומות", status: "in_progress", priority: "high", assignedTo: "יוסי מזרחי", dueDate: "2026-05-31", progress: 60, createdAt: "2025-10-01T08:00:00Z", updates: [], comments: [] },
  { id: "t006", projectId: "p01", title: "התקנת תשתיות חשמל", description: "הנחת כבלים ותעלות חשמל בכל קומות הבניין", status: "in_progress", priority: "high", assignedTo: "אלעד ביטון", dueDate: "2026-06-30", progress: 55, createdAt: "2025-10-15T08:00:00Z", updates: [], comments: [] },
  { id: "t007", projectId: "p01", title: "עבודות גמר פנים", description: "ריצוף, חיפוי, טיח וצבע בכל הדירות", status: "not_started", priority: "medium", assignedTo: "שירן לוי", dueDate: "2026-08-31", progress: 0, createdAt: "2025-11-01T08:00:00Z", updates: [], comments: [] },
  { id: "t008", projectId: "p01", title: "בדיקות מסירה ופיקוח", description: "בדיקות סופיות לפני מסירה ללקוח", status: "not_started", priority: "medium", assignedTo: "יוסי מזרחי", dueDate: "2026-09-15", progress: 0, createdAt: "2025-11-01T08:00:00Z", updates: [], comments: [] },

  // p02 – בניין B (healthy, 60%)
  { id: "t009", projectId: "p02", title: "אישור היתר בנייה", description: "הגשת בקשה לוועדה המקומית לתכנון ובנייה", status: "completed", priority: "critical", assignedTo: "אריאל דייטש", dueDate: "2025-03-31", progress: 100, createdAt: "2025-03-01T08:00:00Z", updates: [], comments: [] },
  { id: "t010", projectId: "p02", title: "עבודות עפר ויסוד", description: "חפירה והכנת יסודות - בניין B", status: "completed", priority: "high", assignedTo: "רועי כהן", dueDate: "2025-06-30", progress: 100, createdAt: "2025-04-01T08:00:00Z", updates: [], comments: [] },
  { id: "t011", projectId: "p02", title: "בניית שלד קומות 1-3", description: "הקמת שלד בטון קומות 1 עד 3", status: "completed", priority: "high", assignedTo: "רועי כהן", dueDate: "2025-11-30", progress: 100, createdAt: "2025-07-01T08:00:00Z", updates: [], comments: [] },
  { id: "t012", projectId: "p02", title: "בניית שלד קומות 4-6", description: "המשך בניית השלד - קומות 4 עד 6", status: "in_progress", priority: "high", assignedTo: "מאור אוחיון", dueDate: "2026-04-30", progress: 70, createdAt: "2025-12-01T08:00:00Z", updates: [], comments: [] },
  { id: "t013", projectId: "p02", title: "עבודות אינסטלציה", description: "מערכות מים וביוב - בניין B", status: "in_progress", priority: "medium", assignedTo: "יוסי מזרחי", dueDate: "2026-07-31", progress: 40, createdAt: "2026-01-01T08:00:00Z", updates: [], comments: [] },
  { id: "t014", projectId: "p02", title: "התקנת מרכזי חשמל", description: "חדר חשמל ולוחות חלוקה - בניין B", status: "in_progress", priority: "medium", assignedTo: "אלעד ביטון", dueDate: "2026-08-31", progress: 30, createdAt: "2026-01-15T08:00:00Z", updates: [], comments: [] },
  { id: "t015", projectId: "p02", title: "מיסוך וחיפוי חיצוני", description: "עבודות חיפוי אבן וחיצוניות - בניין B", status: "not_started", priority: "medium", assignedTo: "שירן לוי", dueDate: "2026-10-31", progress: 0, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },

  // p03 – תשתיות (healthy, 88%)
  { id: "t016", projectId: "p03", title: "תכנון תשתיות וביוב", description: "הכנת תוכניות תשתיות ביוב ומים לשכונה", status: "completed", priority: "high", assignedTo: "עידן פרץ", dueDate: "2025-03-15", progress: 100, createdAt: "2025-01-10T08:00:00Z", updates: [], comments: [] },
  { id: "t017", projectId: "p03", title: "חפירה להנחת צנרת", description: "חפירת תעלות עבור צנרת ביוב ומים ראשית", status: "completed", priority: "high", assignedTo: "לירון כהן", dueDate: "2025-06-30", progress: 100, createdAt: "2025-03-20T08:00:00Z", updates: [], comments: [] },
  { id: "t018", projectId: "p03", title: "הנחת צינורות ביוב ומים", description: "התקנת כל מערכת הצנרת הראשית בשכונה", status: "completed", priority: "high", assignedTo: "יוסי מזרחי", dueDate: "2025-09-30", progress: 100, createdAt: "2025-07-01T08:00:00Z", updates: [], comments: [] },
  { id: "t019", projectId: "p03", title: "סלילת כבישים פנימיים", description: "סלילת כל כבישי השכונה הפנימיים ומדרכות", status: "completed", priority: "high", assignedTo: "לירון כהן", dueDate: "2025-12-31", progress: 100, createdAt: "2025-10-01T08:00:00Z", updates: [], comments: [] },
  { id: "t020", projectId: "p03", title: "התקנת תאורת רחוב", description: "הצבת עמודי תאורה וחיבור חשמל ברחובות הפנימיים", status: "in_progress", priority: "medium", assignedTo: "אלעד ביטון", dueDate: "2026-04-30", progress: 75, createdAt: "2026-01-05T08:00:00Z", updates: [], comments: [] },
  { id: "t021", projectId: "p03", title: "ריהוט רחוב ונטיעות", description: "הצבת ספסלים, מאחסן אופניים ונטיעת עצים", status: "in_progress", priority: "low", assignedTo: "עדי אברהם", dueDate: "2026-06-30", progress: 50, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },

  // p04 – מגדל צפון (has issues, 45%)
  { id: "t022", projectId: "p04", title: "אישור תוכניות אדריכליות", description: "אישור תוכניות אדריכלות מגדל צפון על ידי כל הגורמים", status: "completed", priority: "high", assignedTo: "אריאל דייטש", dueDate: "2025-09-30", progress: 100, createdAt: "2025-06-10T08:00:00Z", updates: [], comments: [] },
  { id: "t023", projectId: "p04", title: "יציקת יסודות - מגדל צפון", description: "יציקת בטון יסודות לפי תוכנית קונסטרוקציה מאושרת", status: "completed", priority: "critical", assignedTo: "רועי כהן", dueDate: "2025-12-31", progress: 100, createdAt: "2025-10-01T08:00:00Z", updates: [], comments: [] },
  { id: "t024", projectId: "p04", title: "בניית שלד קומות 1-5", description: "הקמת שלד בטון - 5 קומות ראשונות", status: "in_progress", priority: "critical", assignedTo: "מאור אוחיון", dueDate: "2026-04-30", progress: 80, createdAt: "2026-01-01T08:00:00Z", updates: [], comments: [] },
  { id: "t025", projectId: "p04", title: "בניית שלד קומות 6-10", description: "המשך הקמת השלד - קומות 6 עד 10", status: "in_progress", priority: "high", assignedTo: "לירון כהן", dueDate: "2026-08-31", progress: 30, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },
  { id: "t026", projectId: "p04", title: "עבודות אינסטלציה קומות 1-5", description: "הנחת צנרת מים וביוב בחמש הקומות הראשונות", status: "blocked", priority: "high", assignedTo: "יוסי מזרחי", dueDate: "2026-06-30", progress: 15, createdAt: "2026-02-15T08:00:00Z", updates: [], comments: [] },
  { id: "t027", projectId: "p04", title: "בדיקות בטון - קומות 1-5", description: "בדיקות אגח וקוביות בטון בכל הקומות שנוצקו", status: "in_progress", priority: "critical", assignedTo: "יוסי מזרחי", dueDate: "2026-05-31", progress: 60, createdAt: "2026-03-01T08:00:00Z", updates: [], comments: [] },
  { id: "t028", projectId: "p04", title: "אישור פיקוח עליון - שלד", description: "קבלת אישור מפיקוח עליון על שלמות השלד", status: "in_progress", priority: "high", assignedTo: "עידן פרץ", dueDate: "2026-07-31", progress: 40, createdAt: "2026-03-15T08:00:00Z", updates: [], comments: [] },
  { id: "t029", projectId: "p04", title: "התקנת מערכת כיבוי אש", description: "תכנון והתקנת מערכת ספרינקלרים בכל קומות המגדל", status: "not_started", priority: "high", assignedTo: "אלעד ביטון", dueDate: "2026-10-31", progress: 0, createdAt: "2026-04-01T08:00:00Z", updates: [], comments: [] },

  // p05 – מגדל דרום (has issues, 35%)
  { id: "t030", projectId: "p05", title: "תכנון ותיאום קונסטרוקציה", description: "גיבוש תוכנית קונסטרוקציה מגדל דרום", status: "completed", priority: "high", assignedTo: "דוד לוי", dueDate: "2025-11-30", progress: 100, createdAt: "2025-08-10T08:00:00Z", updates: [], comments: [] },
  { id: "t031", projectId: "p05", title: "יציקת יסודות - מגדל דרום", description: "יציקת יסודות לפי פתרון הנדסי מאושר", status: "in_progress", priority: "critical", assignedTo: "רועי כהן", dueDate: "2026-03-31", progress: 85, createdAt: "2025-12-01T08:00:00Z", updates: [], comments: [] },
  { id: "t032", projectId: "p05", title: "בניית שלד קומות 1-3", description: "הקמת שלד בטון ראשוני - 3 קומות", status: "in_progress", priority: "high", assignedTo: "מאור אוחיון", dueDate: "2026-07-31", progress: 45, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },
  { id: "t033", projectId: "p05", title: "עבודות עפר ועמדת קידוח", description: "קידוח וחיזוק קרקע לפני יציקה", status: "blocked", priority: "critical", assignedTo: "לירון כהן", dueDate: "2026-05-31", progress: 20, createdAt: "2026-01-15T08:00:00Z", updates: [], comments: [] },
  { id: "t034", projectId: "p05", title: "בדיקות קרקע נוספות", description: "בדיקות נוספות לאחר ממצאי הקידוח הראשוני", status: "blocked", priority: "high", assignedTo: "יוסי מזרחי", dueDate: "2026-04-30", progress: 10, createdAt: "2026-01-20T08:00:00Z", updates: [], comments: [] },
  { id: "t035", projectId: "p05", title: "חיפוי אבן ירושלמית - חזית", description: "עבודות חיפוי אבן ירושלמית לחזיתות המגדל", status: "not_started", priority: "medium", assignedTo: "שירן לוי", dueDate: "2027-01-31", progress: 0, createdAt: "2026-03-01T08:00:00Z", updates: [], comments: [] },

  // p06 – חניון (has issues, 55%)
  { id: "t036", projectId: "p06", title: "תכנון חניון תת-קרקעי", description: "הכנת תוכניות מפורטות לחניון - 3 קומות תת-קרקע", status: "completed", priority: "high", assignedTo: "עידן פרץ", dueDate: "2025-08-31", progress: 100, createdAt: "2025-05-10T08:00:00Z", updates: [], comments: [] },
  { id: "t037", projectId: "p06", title: "חפירה תת-קרקעית", description: "חפירה של 3 קומות מתחת לפני הקרקע", status: "completed", priority: "high", assignedTo: "לירון כהן", dueDate: "2025-12-31", progress: 100, createdAt: "2025-09-01T08:00:00Z", updates: [], comments: [] },
  { id: "t038", projectId: "p06", title: "יציקת קורות ועמודים", description: "יציקת שלד קונקרט לכל קומות החניון", status: "in_progress", priority: "critical", assignedTo: "רועי כהן", dueDate: "2026-04-30", progress: 70, createdAt: "2026-01-01T08:00:00Z", updates: [], comments: [] },
  { id: "t039", projectId: "p06", title: "התקנת מערכת ניקוז", description: "מערכת ניקוז שיטפונות וקולטי גשמים בחניון", status: "in_progress", priority: "medium", assignedTo: "יוסי מזרחי", dueDate: "2026-06-30", progress: 50, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },
  { id: "t040", projectId: "p06", title: "עבודות חשמל חניון", description: "תאורה, שלטים ומערכת עלייה וירידה בחניון", status: "not_started", priority: "medium", assignedTo: "אלעד ביטון", dueDate: "2026-08-31", progress: 0, createdAt: "2026-03-01T08:00:00Z", updates: [], comments: [] },

  // p07 – אגף A (blocked / on_hold)
  { id: "t041", projectId: "p07", title: "אישור היתר בנייה - אגף A", description: "הגשה ומעקב אחר היתר בנייה מהוועדה המקומית", status: "in_progress", priority: "critical", assignedTo: "אריאל דייטש", dueDate: "2026-04-30", progress: 50, createdAt: "2025-04-10T08:00:00Z", updates: [], comments: [] },
  { id: "t042", projectId: "p07", title: "תכנון אדריכלי מעודכן", description: "עדכון תוכניות אדריכלות לפי דרישות הוועדה", status: "blocked", priority: "high", assignedTo: "עדי אברהם", dueDate: "2026-05-31", progress: 25, createdAt: "2025-05-01T08:00:00Z", updates: [], comments: [] },
  { id: "t043", projectId: "p07", title: "עבודות עפר - אגף A", description: "הכנת הקרקע וחפירות לקראת הקמת האגף", status: "blocked", priority: "high", assignedTo: "לירון כהן", dueDate: "2026-06-30", progress: 30, createdAt: "2025-06-01T08:00:00Z", updates: [], comments: [] },
  { id: "t044", projectId: "p07", title: "יציקת יסודות - אגף A", description: "יציקת בטון יסודות בהתאם לתוכנית מאושרת", status: "blocked", priority: "critical", assignedTo: "רועי כהן", dueDate: "2026-08-31", progress: 0, createdAt: "2025-07-01T08:00:00Z", updates: [], comments: [] },
  { id: "t045", projectId: "p07", title: "בחירת ספק אלומיניום לחזית", description: "מכרז ובחירת ספק אלומיניום לחזית המסחרית", status: "blocked", priority: "high", assignedTo: "שירן לוי", dueDate: "2026-07-31", progress: 0, createdAt: "2025-08-01T08:00:00Z", updates: [], comments: [] },
  { id: "t046", projectId: "p07", title: "תכנון תשתיות - אגף A", description: "תכנון מערכות חשמל, אינסטלציה ומיזוג", status: "not_started", priority: "medium", assignedTo: "יוסי מזרחי", dueDate: "2026-09-30", progress: 0, createdAt: "2025-09-01T08:00:00Z", updates: [], comments: [] },

  // p08 – אגף B (planning)
  { id: "t047", projectId: "p08", title: "הגשת תוכניות לרשות", description: "הגשת בקשה להיתר בנייה - אגף B", status: "not_started", priority: "high", assignedTo: "עדי אברהם", dueDate: "2026-08-31", progress: 0, createdAt: "2026-01-10T08:00:00Z", updates: [], comments: [] },
  { id: "t048", projectId: "p08", title: "מכרז קבלן ראשי - אגף B", description: "פרסום ובחירת קבלן ראשי לביצוע האגף", status: "not_started", priority: "high", assignedTo: "אריאל דייטש", dueDate: "2026-09-30", progress: 0, createdAt: "2026-01-15T08:00:00Z", updates: [], comments: [] },
  { id: "t049", projectId: "p08", title: "אישור חזית מסחרית - אגף B", description: "קבלת אישור עיצוב חזית מגורמי תכנון", status: "not_started", priority: "medium", assignedTo: "עדי אברהם", dueDate: "2026-10-31", progress: 0, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },
  { id: "t050", projectId: "p08", title: "תכנון תשתיות - אגף B", description: "הכנת תוכניות תשתיות מכניות וחשמל", status: "not_started", priority: "medium", assignedTo: "יוסי מזרחי", dueDate: "2026-11-30", progress: 0, createdAt: "2026-02-15T08:00:00Z", updates: [], comments: [] },

  // p09 – ביה"ס מודיעין (planning/decisions)
  { id: "t051", projectId: "p09", title: "אישור תוכניות עיריית מודיעין", description: "הגשה ואישור תוכניות מאת מחלקת הנדסה עירייה", status: "in_progress", priority: "high", assignedTo: "דוד לוי", dueDate: "2026-07-31", progress: 30, createdAt: "2026-03-10T08:00:00Z", updates: [], comments: [] },
  { id: "t052", projectId: "p09", title: "הגשה לוועדת תכנון ובנייה", description: "הגשת בקשה ל-תב\"ע ואישור ועדה מקומית", status: "not_started", priority: "critical", assignedTo: "עידן פרץ", dueDate: "2026-09-30", progress: 0, createdAt: "2026-03-15T08:00:00Z", updates: [], comments: [] },
  { id: "t053", projectId: "p09", title: "בחירת קבלן ביצוע", description: "פרסום מכרז ובחירת קבלן מבצע", status: "not_started", priority: "high", assignedTo: "דוד לוי", dueDate: "2026-10-31", progress: 0, createdAt: "2026-04-01T08:00:00Z", updates: [], comments: [] },
  { id: "t054", projectId: "p09", title: "תכנון פנים וכיתות לימוד", description: "עיצוב ותכנון כיתות, ספרייה ואולמות", status: "not_started", priority: "medium", assignedTo: "שירן לוי", dueDate: "2026-11-30", progress: 0, createdAt: "2026-04-15T08:00:00Z", updates: [], comments: [] },
  { id: "t055", projectId: "p09", title: "הכנת מפרטים טכניים", description: "כתיבת מפרטים מלאים לכל ביצוע הפרויקט", status: "not_started", priority: "medium", assignedTo: "יוסי מזרחי", dueDate: "2026-08-31", progress: 0, createdAt: "2026-04-20T08:00:00Z", updates: [], comments: [] },

  // p10 – מגרשי ספורט (planning/decisions)
  { id: "t056", projectId: "p10", title: "תכנון מגרשי ספורט", description: "תכנון אדריכלי ומלאכת מחשבת למגרשי ספורט", status: "not_started", priority: "high", assignedTo: "עידן פרץ", dueDate: "2026-09-30", progress: 0, createdAt: "2026-06-05T08:00:00Z", updates: [], comments: [] },
  { id: "t057", projectId: "p10", title: "אישור ועדת חינוך עירייה", description: "קבלת אישור תוכניות מוועדת חינוך המועצה", status: "not_started", priority: "critical", assignedTo: "עדי אברהם", dueDate: "2026-08-31", progress: 0, createdAt: "2026-06-05T08:00:00Z", updates: [], comments: [] },
  { id: "t058", projectId: "p10", title: "מכרז ציוד ספורט", description: "פרסום מכרז לציוד ספורט ואביזרים", status: "not_started", priority: "medium", assignedTo: "דוד לוי", dueDate: "2026-11-30", progress: 0, createdAt: "2026-06-05T08:00:00Z", updates: [], comments: [] },
  { id: "t059", projectId: "p10", title: "תכנון מבנה אולם ספורט", description: "תכנון מבנה האולם המקורה כולל גג וכיסאות", status: "not_started", priority: "medium", assignedTo: "שירן לוי", dueDate: "2026-10-31", progress: 0, createdAt: "2026-06-05T08:00:00Z", updates: [], comments: [] },

  // p11 – קומות 1-5 הר חוצבים (completed)
  { id: "t060", projectId: "p11", title: "עבודות גמר קומות 1-2", description: "ריצוף, חיפוי וצבע קומות 1 ו-2", status: "completed", priority: "high", assignedTo: "אריאל דייטש", dueDate: "2025-06-30", progress: 100, createdAt: "2024-06-01T08:00:00Z", updates: [], comments: [] },
  { id: "t061", projectId: "p11", title: "עבודות גמר קומות 3-4", description: "ריצוף, חיפוי וצבע קומות 3 ו-4", status: "completed", priority: "high", assignedTo: "רועי כהן", dueDate: "2025-09-30", progress: 100, createdAt: "2024-09-01T08:00:00Z", updates: [], comments: [] },
  { id: "t062", projectId: "p11", title: "עבודות גמר קומה 5", description: "גמר מלא כולל ריצוף חיפוי צבע ותאורה", status: "completed", priority: "medium", assignedTo: "מאור אוחיון", dueDate: "2025-11-30", progress: 100, createdAt: "2024-12-01T08:00:00Z", updates: [], comments: [] },
  { id: "t063", projectId: "p11", title: "בדיקות מסירה קומות 1-5", description: "בדיקות סופיות לפני מסירה - כל הקומות", status: "completed", priority: "high", assignedTo: "יוסי מזרחי", dueDate: "2025-12-15", progress: 100, createdAt: "2025-12-01T08:00:00Z", updates: [], comments: [] },
  { id: "t064", projectId: "p11", title: "מסירת שטח ללקוח - קומות 1-5", description: "חתימה על פרוטוקול מסירה ומסירת המפתחות", status: "completed", priority: "high", assignedTo: "אריאל דייטש", dueDate: "2025-12-31", progress: 100, createdAt: "2025-12-15T08:00:00Z", updates: [], comments: [] },

  // p12 – קומות 6-10 הר חוצבים (completed)
  { id: "t065", projectId: "p12", title: "עבודות גמר קומות 6-7", description: "ריצוף, חיפוי וצבע קומות 6 ו-7", status: "completed", priority: "high", assignedTo: "דוד לוי", dueDate: "2025-09-30", progress: 100, createdAt: "2024-09-01T08:00:00Z", updates: [], comments: [] },
  { id: "t066", projectId: "p12", title: "עבודות גמר קומות 8-9", description: "ריצוף, חיפוי וצבע קומות 8 ו-9", status: "completed", priority: "high", assignedTo: "מאור אוחיון", dueDate: "2025-12-31", progress: 100, createdAt: "2024-12-01T08:00:00Z", updates: [], comments: [] },
  { id: "t067", projectId: "p12", title: "עבודות גמר קומה 10", description: "גמר מלא קומה 10 - חדר גג ומחסנים", status: "completed", priority: "medium", assignedTo: "לירון כהן", dueDate: "2026-01-31", progress: 100, createdAt: "2025-12-20T08:00:00Z", updates: [], comments: [] },
  { id: "t068", projectId: "p12", title: "בדיקות מסירה קומות 6-10", description: "בדיקות סופיות לפני מסירה - קומות 6 עד 10", status: "completed", priority: "high", assignedTo: "יוסי מזרחי", dueDate: "2026-02-15", progress: 100, createdAt: "2026-02-01T08:00:00Z", updates: [], comments: [] },
  { id: "t069", projectId: "p12", title: "מסירת שטח ללקוח - קומות 6-10", description: "פרוטוקול מסירה סופי ומסירת מפתחות לכל הקומות", status: "completed", priority: "high", assignedTo: "דוד לוי", dueDate: "2026-02-28", progress: 100, createdAt: "2026-02-15T08:00:00Z", updates: [], comments: [] },
  { id: "t070", projectId: "p11", title: "סקר פגמים שנה ראשונה", description: "ביקור ותיקוני אחריות שנה ראשונה מסירה", status: "completed", priority: "medium", assignedTo: "עדי אברהם", dueDate: "2026-03-31", progress: 100, createdAt: "2026-03-01T08:00:00Z", updates: [], comments: [] },
];

// ─── ISSUES ───────────────────────────────────────────────────────────────────

export const DEMO_ISSUES: Issue[] = [
  // p04 – מגדל צפון (critical issues)
  { id: "i01", projectId: "p04", location: "קומה 3 - קיר דרומי", title: "סדק בקיר דרומי - קומה 3", description: "סדק רחב בקיר החיצוני הדרומי, רוחב כ-3 מ\"מ, ייתכן כניסה לרטיבות", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "יוסי מזרחי", dueDate: "2026-06-30", severity: "critical", status: "open", photos: [], comments: [{ id: "ic01", author: "יוסי מזרחי", text: "נבדק בשטח - הסדק ממשיך להתרחב. צריך טיפול מיידי.", date: "2026-06-10" }], createdAt: "2026-06-05T08:00:00Z" },
  { id: "i02", projectId: "p04", location: "קומה 2 - רצפה", title: "חריגה במפלס רצפה", description: "רצפה קומה 2 בחריגה של 15 מ\"מ מהמפלס המתוכנן", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "רועי כהן", dueDate: "2026-06-15", severity: "high", status: "in_progress", photos: [], comments: [{ id: "ic02", author: "רועי כהן", text: "תכנון תיקון הוגש למהנדס - ממתין לאישור", date: "2026-06-08" }], createdAt: "2026-05-28T08:00:00Z" },
  { id: "i03", projectId: "p04", location: "עמוד 14 - קומה 1", title: "כשל בבדיקת בטון - עמוד 14", description: "דגימת בטון מעמוד 14 כשלה בבדיקת לחיצה - 22 MPa במקום 30 MPa נדרש", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "יוסי מזרחי", dueDate: "2026-06-20", severity: "critical", status: "open", photos: [], comments: [], createdAt: "2026-06-02T08:00:00Z" },
  { id: "i04", projectId: "p04", location: "קומות 3-4 - כלל", title: "אי-התאמה תוכניות לביצוע", description: "נמצא פער בין תוכנית קונסטרוקציה מאושרת לבין ביצוע בשטח בעמדות הברזל", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "עידן פרץ", dueDate: "2026-07-31", severity: "high", status: "open", photos: [], comments: [], createdAt: "2026-06-10T08:00:00Z" },
  { id: "i05", projectId: "p04", location: "כניסה ראשית - קומה 1", title: "חסם ביציאת חירום", description: "יציאת חירום ראשית חסומה על ידי ציוד בנייה - הפרת דרישת בטיחות", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "לירון כהן", dueDate: "2026-06-20", severity: "critical", status: "open", photos: [], comments: [{ id: "ic03", author: "לירון כהן", text: "הוזמן פיקוח בטיחות לביקור אתר מחר", date: "2026-06-16" }], createdAt: "2026-06-12T08:00:00Z" },
  { id: "i06", projectId: "p04", location: "עמוד 7 - קומה B", title: "חסר ברזל בעמוד - לא תואם מפרט", description: "עמוד 7 בקומת מרתף מכיל 4 ברזלים בקוטר 16 במקום 6 ברזלים כנדרש", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "יוסי מזרחי", dueDate: "2026-07-31", severity: "high", status: "open", photos: [], comments: [], createdAt: "2026-06-14T08:00:00Z" },

  // p05 – מגדל דרום (critical issues)
  { id: "i07", projectId: "p05", location: "גג ביניים - קומה 3", title: "איטום לקוי בגג ביניים", description: "נמצאו נזילות מים בגג ביניים בין קומות 2 ו-3 לאחר גשם ראשון", responsibleContractor: 'קבלן כלל בנייה בע"מ', assignedTo: "מאור אוחיון", dueDate: "2026-06-25", severity: "critical", status: "open", photos: [], comments: [], createdAt: "2026-06-08T08:00:00Z" },
  { id: "i08", projectId: "p05", location: "ביסוס עמוד 7", title: "פגם בביסוס עמוד 7", description: "בדיקת ראש כלונס לעמוד 7 הראתה חלל לא מתוכנן בעומק 3 מטר", responsibleContractor: 'קבלן כלל בנייה בע"מ', assignedTo: "רועי כהן", dueDate: "2026-06-30", severity: "critical", status: "open", photos: [], comments: [{ id: "ic04", author: "רועי כהן", text: "מהנדס קרקע זומן לבדיקה מיידית", date: "2026-06-14" }], createdAt: "2026-06-07T08:00:00Z" },
  { id: "i09", projectId: "p05", location: "קיר מזרח - קומה 2", title: "רטיבות קיר מזרחי - קומה 2", description: "כתמי רטיבות נרחבים בקיר המזרחי, כנראה חדירה מהחפירה", responsibleContractor: 'קבלן כלל בנייה בע"מ', assignedTo: "יוסי מזרחי", dueDate: "2026-07-31", severity: "medium", status: "open", photos: [], comments: [], createdAt: "2026-06-10T08:00:00Z" },
  { id: "i10", projectId: "p05", location: "קומה 1 - תקרה", title: "חריגה גובה תקרה - קומה 1", description: "גובה תקרה מנקודות מדידה מרובות: 2.65 מ' במקום 2.75 מ' כנדרש", responsibleContractor: 'קבלן כלל בנייה בע"מ', assignedTo: "לירון כהן", dueDate: "2026-07-15", severity: "high", status: "in_progress", photos: [], comments: [{ id: "ic05", author: "לירון כהן", text: "מהנדס קונסטרוקציה בדק - ממתין להחלטה על פתרון", date: "2026-06-11" }], createdAt: "2026-06-01T08:00:00Z" },
  { id: "i11", projectId: "p05", location: "דגימה 3 - מעבדה", title: "איכות בטון נמוכה - דגימה 3", description: "תוצאות מעבדה לדגימה 3: 24 MPa ב-28 ימים. נדרש מינימום 30 MPa לפי מפרט", responsibleContractor: 'קבלן כלל בנייה בע"מ', assignedTo: "מאור אוחיון", dueDate: "2026-06-22", severity: "critical", status: "reopened", photos: [], comments: [{ id: "ic06", author: "מאור אוחיון", text: "דגימה ב' נלקחה ונשלחה למעבדה, ממתים לתוצאות", date: "2026-06-15" }], createdAt: "2026-05-25T08:00:00Z" },

  // p06 – חניון
  { id: "i12", projectId: "p06", location: "חדר תקשורת - קומה -1", title: "חוסר בתשתית תקשורת", description: "לא הוכנה תשתית תקשורת בחדר שנועד לכך, לא לפי תוכנית", responsibleContractor: "חשמלאי בן-דוד", assignedTo: "אלעד ביטון", dueDate: "2026-06-30", severity: "medium", status: "in_progress", photos: [], comments: [], createdAt: "2026-06-05T08:00:00Z" },
  { id: "i13", projectId: "p06", location: "תקרה קומה -2", title: "פריצת תקרה לא מתוכננת", description: "נמצאה חריצה לא מתוכננת בתקרת קומה -2, לא לפי תוכנית הנדסית", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "רועי כהן", dueDate: "2026-07-15", severity: "high", status: "open", photos: [], comments: [], createdAt: "2026-06-08T08:00:00Z" },
  { id: "i14", projectId: "p06", location: "מערכת ניקוז - כניסה", title: "נזילת מים - מערכת ניקוז", description: "נזילה פעילה במנקז הראשי, מים מצטברים בפינה הדרום-מזרחית של קומה -1", responsibleContractor: "אינסטלטור מגן", assignedTo: "יוסי מזרחי", dueDate: "2026-07-10", severity: "high", status: "open", photos: [], comments: [{ id: "ic07", author: "יוסי מזרחי", text: "אינסטלטור הגיע לבדיקה, הזמין חומרים לתיקון", date: "2026-06-14" }], createdAt: "2026-06-12T08:00:00Z" },
  { id: "i15", projectId: "p06", location: "גג חניון", title: "פגם בציפוי אטימה - גג", description: "ציפוי האטימה על גג החניון בחריגה מהמפרט, עובי בלתי מספק", responsibleContractor: "חברת אטימה נהריה", assignedTo: "עידן פרץ", dueDate: "2026-07-31", severity: "high", status: "in_progress", photos: [], comments: [], createdAt: "2026-05-30T08:00:00Z" },

  // p07 – גבעת זאב
  { id: "i16", projectId: "p07", location: "אגף A - כלל", title: "הפרות בתוכנית אדריכלית", description: "נמצאו 3 הפרות עיקריות בין תוכנית ההגשה לבין הביצוע הנוכחי בשטח", responsibleContractor: "לא ידוע", assignedTo: "אריאל דייטש", dueDate: "2026-07-31", severity: "critical", status: "open", photos: [], comments: [], createdAt: "2026-05-15T08:00:00Z" },
  { id: "i17", projectId: "p07", location: "ועדת תכנון", title: "אי-הגשת היתר בנייה בזמן", description: "היתר הבנייה לא הוגש בלוח הזמנים המתוכנן, קנסות צפויים", responsibleContractor: "לא ידוע", assignedTo: "עדי אברהם", dueDate: "2026-06-30", severity: "high", status: "in_progress", photos: [], comments: [{ id: "ic08", author: "עדי אברהם", text: "פגישה עם ועדת תכנון נקבעה ל-22.06", date: "2026-06-16" }], createdAt: "2026-05-01T08:00:00Z" },
  { id: "i18", projectId: "p07", location: "קרקע - אגף A", title: "פגמים בדוח סקר קרקע", description: "דוח סקר קרקע ראשוני הכיל שגיאות בנתונים - נדרש סקר מחדש", responsibleContractor: "חברת קרקע-טק", assignedTo: "אריאל דייטש", dueDate: "2026-08-31", severity: "medium", status: "open", photos: [], comments: [], createdAt: "2026-04-20T08:00:00Z" },

  // p01/p02/p03 – נוף הכרמל (mostly resolved)
  { id: "i19", projectId: "p01", location: "לובי ראשי - קומה 0", title: "פגם בריצוף לובי", description: "אריח ריצוף שבור בלובי ראשי - יש להחליף לפני מסירה", responsibleContractor: "קבלן גמר אריאלי", assignedTo: "שירן לוי", dueDate: "2026-04-30", severity: "low", status: "resolved", photos: [], comments: [{ id: "ic09", author: "שירן לוי", text: "אריח הוחלף - ליקוי טופל", date: "2026-04-20" }], createdAt: "2026-04-10T08:00:00Z" },
  { id: "i20", projectId: "p01", location: "גג - מפלס עליון", title: "בעיה בצנרת גשמים - גג", description: "קולט גשמים אחד חסום, מים עולים על השפה", responsibleContractor: "אינסטלטור מגן", assignedTo: "יוסי מזרחי", dueDate: "2026-05-15", severity: "medium", status: "resolved", photos: [], comments: [{ id: "ic10", author: "יוסי מזרחי", text: "הקולט נוקה ונבדק לאחר גשם - פועל תקין", date: "2026-05-10" }], createdAt: "2026-04-25T08:00:00Z" },
  { id: "i21", projectId: "p02", location: "קומה 2 - כל הדירות", title: "חריגה קלה גובה תקרה - קומה 2", description: "גובה תקרה 2.72 מ' במקום 2.75 מ' - בתוך טולרנס מקובל אך יש לתעד", responsibleContractor: 'קבלן שלד כהן בע"מ', assignedTo: "רועי כהן", dueDate: "2026-04-30", severity: "low", status: "resolved", photos: [], comments: [], createdAt: "2026-04-15T08:00:00Z" },
  { id: "i22", projectId: "p03", location: "כביש פנימי 1", title: "פגם בסלילה - כביש פנימי", description: "בליטה בכביש פנימי ראשי ליד הגן, עלולה לגרום נזק לרכבים", responsibleContractor: "חברת כבישים ישראלית", assignedTo: "לירון כהן", dueDate: "2026-06-30", severity: "medium", status: "in_progress", photos: [], comments: [], createdAt: "2026-06-01T08:00:00Z" },
  { id: "i23", projectId: "p03", location: "כביש פנימי 2", title: "שקע בכביש פנימי", description: "שקע קטן בכביש פנימי 2 ליד בניין B - נוצר כנראה מהתנחלות קרקע", responsibleContractor: "חברת כבישים ישראלית", assignedTo: "לירון כהן", dueDate: "2026-07-15", severity: "low", status: "open", photos: [], comments: [], createdAt: "2026-06-10T08:00:00Z" },

  // p11/p12 – הר חוצבים (resolved - historical)
  { id: "i24", projectId: "p11", location: "קומה 3 - כל החדרים", title: "שריטות ריצוף קומה 3", description: "שריטות בריצוף פורצלן בקומה 3 שנגרמו במהלך עבודות", responsibleContractor: "קבלן גמר אריאלי", assignedTo: "שירן לוי", dueDate: "2025-11-30", severity: "low", status: "resolved", photos: [], comments: [], createdAt: "2025-11-10T08:00:00Z" },
  { id: "i25", projectId: "p12", location: "קומה 8 - חדר 802", title: "בעיה בציר דלת - קומה 8", description: "ציר דלת חדר 802 לא מהוסה כראוי, דלת נוגעת בריצוף", responsibleContractor: "נגרייה מרכזית", assignedTo: "שירן לוי", dueDate: "2026-01-31", severity: "low", status: "resolved", photos: [], comments: [], createdAt: "2026-01-10T08:00:00Z" },
];

// ─── BLOCKERS ─────────────────────────────────────────────────────────────────

export const DEMO_BLOCKERS: Blocker[] = [
  // p07 – גבעת זאב (major blockers)
  { id: "b01", projectId: "p07", title: "חסר אישור יועץ בטיחות", description: "הפרויקט ממתין לאישור חתום של יועץ בטיחות מוסמך לפני המשך עבודות", impact: "עצירה מלאה של עבודות השלד", responsible: "אריאל דייטש", dueDate: "2026-06-30", status: "open", priority: "critical", createdAt: "2026-05-10T08:00:00Z" },
  { id: "b02", projectId: "p07", title: "עיכוב בהנפקת היתר בנייה", description: "הרשות המקומית עיכבה הנפקת ההיתר בשל השגות של שכנים", impact: "אי-אפשרות לבצע שום עבודה פיזית", responsible: "עדי אברהם", dueDate: "2026-07-15", status: "open", priority: "critical", createdAt: "2026-04-20T08:00:00Z" },
  { id: "b03", projectId: "p07", title: "תוכניות לא מאושרות - ועדת תכנון", description: "תוכניות ההגשה הוחזרו לתיקונים על ידי הוועדה המקומית לתכנון", impact: "לא ניתן להגיש לאישור עד תיקון התוכניות", responsible: "אריאל דייטש", dueDate: "2026-06-25", status: "in_progress", priority: "high", createdAt: "2026-04-15T08:00:00Z" },
  { id: "b04", projectId: "p07", title: "עיכוב אספקת ברזל - ספק ראשי", description: "ספק הברזל הראשי הודיע על עיכוב של 6 שבועות בשל בעיות ייצור", impact: "עצירת עבודות ברזל ויציקות בטון", responsible: "לירון כהן", dueDate: "2026-06-20", status: "open", priority: "high", createdAt: "2026-05-25T08:00:00Z" },
  { id: "b05", projectId: "p07", title: "מחסור בכוח אדם - קבלן ראשי", description: "קבלן ביצוע מדווח על מחסור של 8 פועלים מיומנים לסגירת הפרויקט", impact: "האטה משמעותית בקצב הביצוע", responsible: "רועי כהן", dueDate: "2026-07-31", status: "open", priority: "medium", createdAt: "2026-06-01T08:00:00Z" },

  // p08 – גבעת זאב B
  { id: "b06", projectId: "p08", title: "המתנה להחלטת לקוח - פרוגרמה", description: "לקוח (מנורה נכסים) טרם אישר את הפרוגרמה הסופית לחלוקת המסחר", impact: "לא ניתן להמשיך בתכנון מפורט", responsible: "עדי אברהם", dueDate: "2026-07-01", status: "open", priority: "critical", createdAt: "2026-06-01T08:00:00Z" },
  { id: "b07", projectId: "p08", title: "עיכוב חיבור חשמל ראשי", description: "חברת החשמל הודיעה על עיכוב של 4 חודשים בחיבור החשמל הראשי לאגף", impact: "לא ניתן לנסות מערכות חשמל ותאורה", responsible: "אלעד ביטון", dueDate: "2026-08-31", status: "open", priority: "high", createdAt: "2026-06-05T08:00:00Z" },
  { id: "b08", projectId: "p08", title: "ממתין לאישור שינוי חזית", description: "שינוי עיצוב חזית מסחרית טעון אישור ועדת שימור עירונית", impact: "לא ניתן לסיים תוכניות הגשה לעיריה", responsible: "עדי אברהם", dueDate: "2026-07-15", status: "open", priority: "high", createdAt: "2026-05-20T08:00:00Z" },

  // p04/p05/p06 – ירושלים
  { id: "b09", projectId: "p04", title: "תוצאות בדיקת בטון - ממתין", description: "תוצאות בדיקות בטון מקומה 1 עדיין לא התקבלו מהמעבדה", impact: "לא ניתן להמשיך יציקות בקומות הבאות", responsible: "יוסי מזרחי", dueDate: "2026-06-25", status: "in_progress", priority: "high", createdAt: "2026-06-10T08:00:00Z" },
  { id: "b10", projectId: "p05", title: "עיכוב בקבלת תוצאות קידוח", description: "ממצאי קידוח גיאוטכני עדיין לא הגיעו מהמפקח הגיאולוג", impact: "לא ניתן לאשר פתרון הנדסי ליסודות", responsible: "רועי כהן", dueDate: "2026-06-28", status: "open", priority: "critical", createdAt: "2026-06-08T08:00:00Z" },
  { id: "b11", projectId: "p05", title: "חסר תוכנית קונסטרוקציה מאושרת", description: "תוכנית הקונסטרוקציה עדיין לא קיבלה חתימת מהנדס מאשר", impact: "עצירת יציקות ועבודות שלד", responsible: "עידן פרץ", dueDate: "2026-07-15", status: "open", priority: "high", createdAt: "2026-06-05T08:00:00Z" },
  { id: "b12", projectId: "p06", title: "המתנה לאישור ועדת בטיחות - חניון", description: "ביקור ועדת בטיחות לאתר החניון טרם בוצע - נדרש לפני המשך חפירה", impact: "לא ניתן להמשיך חפירה לעומק", responsible: "לירון כהן", dueDate: "2026-07-31", status: "in_progress", priority: "medium", createdAt: "2026-06-01T08:00:00Z" },

  // p09/p10 – מודיעין
  { id: "b13", projectId: "p09", title: "ממתין לאישור ועדת חינוך עירייה", description: "פרוגרמת בית הספר ממתינה לאישור ועדת חינוך של עיריית מודיעין", impact: "לא ניתן לסיים תוכניות ולפנות לתכנון מפורט", responsible: "דוד לוי", dueDate: "2026-07-31", status: "open", priority: "critical", createdAt: "2026-06-01T08:00:00Z" },
  { id: "b14", projectId: "p09", title: "ממתין לאישור תקציב עירייה", description: "תקציב הפרויקט טרם אושר בהחלטת מועצת עיריית מודיעין", impact: "לא ניתן לחתום חוזה עם קבלן או לסיים הזמנות", responsible: "עידן פרץ", dueDate: "2026-08-31", status: "open", priority: "high", createdAt: "2026-06-10T08:00:00Z" },
  { id: "b15", projectId: "p10", title: "עיכוב בקבלת תוכניות מאדריכל", description: "אדריכל הפרויקט עיכב הגשת תוכניות מפורטות לאולם הספורט", impact: "לא ניתן להגיש לאישור ולמכרז", responsible: "עדי אברהם", dueDate: "2026-08-31", status: "open", priority: "medium", createdAt: "2026-06-05T08:00:00Z" },
];

// ─── DECISIONS ────────────────────────────────────────────────────────────────

export const DEMO_DECISIONS: Decision[] = [
  // p09 – מודיעין (waiting decisions)
  { id: "d01", projectId: "p09", title: "אישור תוכניות בניין לימודים", description: "אישור סופי לתוכניות אדריכלות בניין הלימודים הראשי - 3 קומות, 24 כיתות", requestedBy: "דוד לוי", owner: "עידן פרץ", dueDate: "2026-07-15", status: "pending", createdAt: "2026-06-01T08:00:00Z" },
  { id: "d02", projectId: "p09", title: "אישור תקציב ריצוף ופנים", description: "אישור תקציב נוסף של 800,000 ₪ לריצוף פורצלן מיוחד ופנים כיתות", requestedBy: "שירן לוי", owner: "דוד לוי", dueDate: "2026-07-31", status: "pending", createdAt: "2026-06-05T08:00:00Z" },
  { id: "d03", projectId: "p09", title: "בחירת יועץ נגישות", description: "בחירה מבין 3 יועצי נגישות שהגישו הצעות - נדרש אישור הנהלה", requestedBy: "עדי אברהם", owner: "אריאל דייטש", dueDate: "2026-08-15", status: "pending", createdAt: "2026-06-10T08:00:00Z" },
  { id: "d04", projectId: "p09", title: "בחירת קבלן ביצוע - ביה\"ס", description: "בחירה מבין 4 מתמודדים במכרז קבלן ראשי לביצוע ביה\"ס", requestedBy: "דוד לוי", owner: "אריאל דייטש", dueDate: "2026-09-15", status: "pending", createdAt: "2026-06-15T08:00:00Z" },

  // p10 – מגרשי ספורט
  { id: "d05", projectId: "p10", title: "אישור חומרים למגרשי ספורט", description: "בחירה בין דשא סינטטי לדשא טבעי למגרשי כדורגל ורגבי", requestedBy: "עידן פרץ", owner: "דוד לוי", dueDate: "2026-07-20", status: "pending", createdAt: "2026-06-05T08:00:00Z" },
  { id: "d06", projectId: "p10", title: "אישור אדריכל אולם ספורט", description: "אישור עבודה עם אדריכל חדש לאולם הספורט לאחר ניתוק עם הקודם", requestedBy: "דוד לוי", owner: "אריאל דייטש", dueDate: "2026-07-31", status: "pending", createdAt: "2026-06-08T08:00:00Z" },
  { id: "d07", projectId: "p10", title: "אישור תקציב אולם ספורט", description: "תקציב אולם ספורט עלה ב-15% מעריכה ראשונית - נדרש אישור הנהלה", requestedBy: "עדי אברהם", owner: "אריאל דייטש", dueDate: "2026-08-31", status: "pending", createdAt: "2026-06-12T08:00:00Z" },

  // p07/p08 – גבעת זאב
  { id: "d08", projectId: "p07", title: "אישור ספק אלומיניום לחזית", description: "בחירה מבין 3 ספקי אלומיניום לחזיתות המסחריות של האגף", requestedBy: "עדי אברהם", owner: "אריאל דייטש", dueDate: "2026-06-30", status: "pending", createdAt: "2026-05-25T08:00:00Z" },
  { id: "d09", projectId: "p07", title: "אישור שינוי חזית מסחרית", description: "הלקוח מבקש שינוי בעיצוב החזית - נדרש אישור ותוספת תקציב של 250,000 ₪", requestedBy: "אריאל דייטש", owner: "דוד לוי", dueDate: "2026-07-15", status: "pending", createdAt: "2026-05-20T08:00:00Z" },
  { id: "d10", projectId: "p08", title: "אישור פרוגרמה מסחרית - אגף B", description: "אישור סופי לחלוקת השטחים המסחריים בין חנויות, מסעדות ומשרדים", requestedBy: "עדי אברהם", owner: "אריאל דייטש", dueDate: "2026-07-01", status: "pending", createdAt: "2026-06-01T08:00:00Z" },

  // p04/p02 – אחרים
  { id: "d11", projectId: "p04", title: "אישור חברת בטון חלופית", description: "אישור להחלפת ספק הבטון לאחר כשלי הבדיקות - ספק חלופי זוהה", requestedBy: "יוסי מזרחי", owner: "אריאל דייטש", dueDate: "2026-05-31", status: "approved", createdAt: "2026-05-10T08:00:00Z" },
  { id: "d12", projectId: "p02", title: "אישור תוספת קומה - שינוי היתר", description: "בקשה לתוספת קומה 7 לבניין B - נדחה לדיון בפגישה הבאה עם הלקוח", requestedBy: "דוד לוי", owner: "אריאל דייטש", dueDate: "2026-06-15", status: "deferred", createdAt: "2026-05-30T08:00:00Z" },
];

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export const DEMO_REPORTS: Report[] = [
  // p01 – בניין A (healthy, many reports)
  { id: "r01", projectId: "p01", date: "2026-06-15", createdAt: "2026-06-15T18:00:00Z", status: "sent", type: "daily", sentAt: "2026-06-15T18:30:00Z" },
  { id: "r02", projectId: "p01", date: "2026-06-12", createdAt: "2026-06-12T18:00:00Z", status: "sent", type: "daily", sentAt: "2026-06-12T18:30:00Z" },
  { id: "r03", projectId: "p01", date: "2026-06-08", createdAt: "2026-06-08T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-08T18:30:00Z" },
  { id: "r04", projectId: "p01", date: "2026-05-31", createdAt: "2026-05-31T18:00:00Z", status: "sent", type: "monthly", sentAt: "2026-06-01T08:00:00Z" },

  // p02 – בניין B
  { id: "r05", projectId: "p02", date: "2026-06-14", createdAt: "2026-06-14T18:00:00Z", status: "sent", type: "daily", sentAt: "2026-06-14T18:30:00Z" },
  { id: "r06", projectId: "p02", date: "2026-06-08", createdAt: "2026-06-08T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-08T18:30:00Z" },
  { id: "r07", projectId: "p02", date: "2026-05-31", createdAt: "2026-05-31T18:00:00Z", status: "sent", type: "monthly", sentAt: "2026-06-01T09:00:00Z" },

  // p03 – תשתיות
  { id: "r08", projectId: "p03", date: "2026-06-16", createdAt: "2026-06-16T14:00:00Z", status: "ready", type: "daily" },
  { id: "r09", projectId: "p03", date: "2026-06-09", createdAt: "2026-06-09T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-09T18:30:00Z" },

  // p04 – מגדל צפון
  { id: "r10", projectId: "p04", date: "2026-06-15", createdAt: "2026-06-15T18:00:00Z", status: "sent", type: "daily", sentAt: "2026-06-15T19:00:00Z" },
  { id: "r11", projectId: "p04", date: "2026-06-09", createdAt: "2026-06-09T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-09T19:00:00Z" },
  { id: "r12", projectId: "p04", date: "2026-06-01", createdAt: "2026-06-01T18:00:00Z", status: "sent", type: "monthly", sentAt: "2026-06-02T08:00:00Z" },

  // p05 – מגדל דרום
  { id: "r13", projectId: "p05", date: "2026-06-16", createdAt: "2026-06-16T10:00:00Z", status: "draft", type: "daily" },
  { id: "r14", projectId: "p05", date: "2026-06-08", createdAt: "2026-06-08T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-08T19:00:00Z" },

  // p06 – חניון
  { id: "r15", projectId: "p06", date: "2026-06-14", createdAt: "2026-06-14T18:00:00Z", status: "sent", type: "daily", sentAt: "2026-06-14T19:00:00Z" },
  { id: "r16", projectId: "p06", date: "2026-06-07", createdAt: "2026-06-07T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-07T19:00:00Z" },

  // p07 – גבעת זאב (on hold)
  { id: "r17", projectId: "p07", date: "2026-06-10", createdAt: "2026-06-10T18:00:00Z", status: "sent", type: "weekly", sentAt: "2026-06-10T19:00:00Z" },
  { id: "r18", projectId: "p07", date: "2026-05-31", createdAt: "2026-05-31T18:00:00Z", status: "sent", type: "monthly", sentAt: "2026-06-01T10:00:00Z" },

  // p09 – ביה"ס מודיעין
  { id: "r19", projectId: "p09", date: "2026-06-15", createdAt: "2026-06-15T16:00:00Z", status: "draft", type: "daily" },

  // p11/p12 – הר חוצבים (completed - historical)
  { id: "r20", projectId: "p11", date: "2025-12-31", createdAt: "2025-12-31T18:00:00Z", status: "sent", type: "monthly", sentAt: "2026-01-01T09:00:00Z" },
  { id: "r21", projectId: "p11", date: "2026-01-15", createdAt: "2026-01-15T18:00:00Z", status: "sent", type: "daily", sentAt: "2026-01-15T18:30:00Z" },
  { id: "r22", projectId: "p12", date: "2026-02-28", createdAt: "2026-02-28T18:00:00Z", status: "sent", type: "monthly", sentAt: "2026-03-01T08:00:00Z" },
];

// ─── DAILY LOGS ───────────────────────────────────────────────────────────────

export const DEMO_DAILY_LOGS: DailyLog[] = [
  {
    id: "l01", projectId: "p01", date: "2026-06-16", workHours: "8", weather: "שמש מלאה 28°C",
    submittedBy: "אריאל דייטש", exceptionalEvents: "", contractorNotes: "קבלן שלד בשדה - עבודה שוטפת",
    workDescription: ["המשך הקמת שלד קומה 7", "הנחת ברזל לתקרת קומה 6", "בדיקת מפלסים קומה 5"],
    contractors: [
      { id: "c001", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 12, notes: "עבודה שוטפת" },
      { id: "c002", contractor: "אינסטלטור מגן", trade: "אינסטלציה", workers: 4, notes: "הנחת צנרת קומה 5" },
    ],
    equipment: [
      { id: "e001", name: "עגורן צריח", quantity: 1, notes: "שעות פעולה: 7" },
      { id: "e002", name: "מיקסר בטון", quantity: 2, notes: "" },
    ],
    photos: [
      { id: "ph-l01-1", url: "https://picsum.photos/seed/concrete-pour/800/600", caption: "יציקת תקרת קומה 6", workItem: "יציקת בטון", area: "קומה 6" },
      { id: "ph-l01-2", url: "https://picsum.photos/seed/rebar-work/800/600", caption: "הנחת ברזל לתקרת קומה 6", workItem: "ברזל", area: "קומה 6" },
      { id: "ph-l01-3", url: "https://picsum.photos/seed/construction-crane/800/600", caption: "עגורן צריח בפעולה - הרמת חומרים", workItem: "ציוד", area: "חצר" },
    ],
    createdAt: "2026-06-16T17:00:00Z",
  },
  {
    id: "l02", projectId: "p01", date: "2026-06-15", workHours: "9", weather: "שמש חלקית 26°C",
    submittedBy: "רועי כהן", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["יציקת תקרת קומה 6", "הנחת ברזל קומה 7", "בדיקות בטון דגימה 8"],
    contractors: [{ id: "c003", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 14, notes: "" }],
    equipment: [{ id: "e003", name: "עגורן צריח", quantity: 1, notes: "שעות פעולה: 9" }],
    photos: [], createdAt: "2026-06-15T18:00:00Z",
  },
  {
    id: "l03", projectId: "p01", date: "2026-06-14", workHours: "8", weather: "מעונן חלקית 24°C",
    submittedBy: "מאור אוחיון", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["הכנת תבניות קומה 7", "המשך הנחת אינסטלציה קומה 5"],
    contractors: [
      { id: "c004", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 10, notes: "" },
      { id: "c005", contractor: "אינסטלטור מגן", trade: "אינסטלציה", workers: 3, notes: "" },
    ],
    equipment: [{ id: "e004", name: "עגורן צריח", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-14T18:00:00Z",
  },
  {
    id: "l04", projectId: "p02", date: "2026-06-14", workHours: "8", weather: "שמש מלאה 27°C",
    submittedBy: "דוד לוי", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["המשך הקמת שלד קומה 5", "הנחת חשמל קומה 3", "בדיקת מלט מכונה"],
    contractors: [
      { id: "c006", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 11, notes: "" },
      { id: "c007", contractor: "חשמלאי בן-דוד", trade: "חשמל", workers: 3, notes: "" },
    ],
    equipment: [{ id: "e005", name: "עגורן צריח", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-14T18:00:00Z",
  },
  {
    id: "l05", projectId: "p02", date: "2026-06-11", workHours: "9", weather: "מעונן 22°C",
    submittedBy: "רועי כהן", exceptionalEvents: "גשם קל בשעות 14:00-15:00, הופסקה יציקת בטון", contractorNotes: "",
    workDescription: ["יציקת תקרת קומה 4", "הנחת ברזל קומה 5"],
    contractors: [{ id: "c008", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 13, notes: "" }],
    equipment: [{ id: "e006", name: "עגורן צריח", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-11T18:00:00Z",
  },
  {
    id: "l06", projectId: "p03", date: "2026-06-16", workHours: "8", weather: "שמש מלאה 29°C",
    submittedBy: "עידן פרץ", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["התקנת עמודי תאורה כביש פנימי 2", "חיבור חשמל תאורת רחוב", "בדיקת מדרכות"],
    contractors: [
      { id: "c009", contractor: "חשמלאי בן-דוד", trade: "חשמל", workers: 5, notes: "" },
      { id: "c010", contractor: "נגרייה מרכזית", trade: "ריהוט רחוב", workers: 3, notes: "" },
    ],
    equipment: [{ id: "e007", name: "מנוף הרמה", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-16T17:30:00Z",
  },
  {
    id: "l07", projectId: "p03", date: "2026-06-13", workHours: "9", weather: "שמש מלאה 28°C",
    submittedBy: "לירון כהן", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["התקנת עמודי תאורה כביש פנימי 1", "נטיעת עצים בכיכר המרכזית"],
    contractors: [{ id: "c011", contractor: "חשמלאי בן-דוד", trade: "חשמל", workers: 6, notes: "" }],
    equipment: [],
    photos: [], createdAt: "2026-06-13T18:00:00Z",
  },
  {
    id: "l08", projectId: "p04", date: "2026-06-15", workHours: "8", weather: "מעונן חלקית 25°C",
    submittedBy: "אריאל דייטש",
    exceptionalEvents: "נמצא סדק בקיר קומה 3 - פוקוח זומן לבדיקה",
    contractorNotes: "קבלן שלד מתעכב בשל בעיית בטון",
    workDescription: ["המשך בניית שלד קומה 5", "בדיקת קורות קומה 4", "תיעוד ממצאי סדק קומה 3"],
    contractors: [
      { id: "c012", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 9, notes: "עיכוב בשל בדיקות" },
      { id: "c013", contractor: "מעבדת בטון מרכזית", trade: "בדיקות", workers: 2, notes: "נלקחו דגימות בטון" },
    ],
    equipment: [{ id: "e008", name: "עגורן צריח", quantity: 1, notes: "" }],
    photos: [
      { id: "ph-l08-1", url: "https://picsum.photos/seed/wall-crack/800/600", caption: "סדק בקיר קומה 3 - תיעוד לפיקוח", workItem: "בדיקות", area: "קומה 3" },
      { id: "ph-l08-2", url: "https://picsum.photos/seed/concrete-test/800/600", caption: "נטילת דגימות בטון למעבדה", workItem: "בדיקות", area: "קומה 1" },
    ],
    createdAt: "2026-06-15T18:00:00Z",
  },
  {
    id: "l09", projectId: "p04", date: "2026-06-12", workHours: "9", weather: "שמש 27°C",
    submittedBy: "מאור אוחיון", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["יציקת תקרת קומה 4", "הנחת ברזל קומה 5"],
    contractors: [{ id: "c014", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 12, notes: "" }],
    equipment: [{ id: "e009", name: "עגורן צריח", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-12T18:00:00Z",
  },
  {
    id: "l10", projectId: "p05", date: "2026-06-14", workHours: "7", weather: "שמש 26°C",
    submittedBy: "דוד לוי",
    exceptionalEvents: "קבלן קידוח לא הגיע בשל בעיה ציוד",
    contractorNotes: "ממתין לתוצאות קידוח - עבודה מוגבלת",
    workDescription: ["עבודת שלד מה שמותר", "הכנת תבניות לאחר קבלת אישור"],
    contractors: [{ id: "c015", contractor: 'קבלן כלל בנייה בע"מ', trade: "שלד כללי", workers: 7, notes: "עבודה חלקית" }],
    equipment: [],
    photos: [], createdAt: "2026-06-14T17:30:00Z",
  },
  {
    id: "l11", projectId: "p06", date: "2026-06-15", workHours: "8", weather: "שמש 27°C",
    submittedBy: "עידן פרץ", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["יציקת עמודים קומה -2", "הכנת תבניות קומה -1", "בדיקת מערכת ניקוז"],
    contractors: [
      { id: "c016", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 10, notes: "" },
      { id: "c017", contractor: "אינסטלטור מגן", trade: "אינסטלציה", workers: 3, notes: "בדיקת ניקוז" },
    ],
    equipment: [{ id: "e010", name: "עגורן ניידי", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-15T18:00:00Z",
  },
  {
    id: "l12", projectId: "p06", date: "2026-06-12", workHours: "9", weather: "שמש 28°C",
    submittedBy: "לירון כהן", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["יציקת תקרת קומה -3", "המשך חפירה קומה -1"],
    contractors: [{ id: "c018", contractor: 'קבלן שלד כהן בע"מ', trade: "שלד בטון", workers: 11, notes: "" }],
    equipment: [{ id: "e011", name: "עגורן ניידי", quantity: 1, notes: "" }],
    photos: [], createdAt: "2026-06-12T18:00:00Z",
  },
  {
    id: "l13", projectId: "p07", date: "2026-06-10", workHours: "4", weather: "שמש 25°C",
    submittedBy: "אריאל דייטש",
    exceptionalEvents: "פרויקט בהקפאה - עבודת פיקוח בלבד היום",
    contractorNotes: "קבלן לא בשטח - ממתין לאישורים",
    workDescription: ["ביקור סקר שטח", "תיעוד מצב קיים"],
    contractors: [],
    equipment: [],
    photos: [], createdAt: "2026-06-10T14:00:00Z",
  },
  {
    id: "l14", projectId: "p11", date: "2025-12-30", workHours: "8", weather: "קר 12°C",
    submittedBy: "אריאל דייטש", exceptionalEvents: "", contractorNotes: "גמר מלא",
    workDescription: ["נקיון סופי", "הכנת פרוטוקולי מסירה", "בדיקות מערכות אחרונות"],
    contractors: [{ id: "c019", contractor: "קבלן גמר אריאלי", trade: "גמר", workers: 6, notes: "ניקוי סופי" }],
    equipment: [],
    photos: [], createdAt: "2025-12-30T18:00:00Z",
  },
  {
    id: "l15", projectId: "p12", date: "2026-02-27", workHours: "8", weather: "מעונן 14°C",
    submittedBy: "דוד לוי", exceptionalEvents: "", contractorNotes: "",
    workDescription: ["בדיקות מסירה קומות 6-10", "תיקוני ליקויים אחרונים", "הכנת פרוטוקול"],
    contractors: [{ id: "c020", contractor: "קבלן גמר אריאלי", trade: "גמר", workers: 5, notes: "" }],
    equipment: [],
    photos: [], createdAt: "2026-02-27T18:00:00Z",
  },
];

// ─── SITE PHOTOS ──────────────────────────────────────────────────────────────

export const DEMO_PHOTOS: SitePhoto[] = [
  // נוף הכרמל - p01 (healthy, progressing well)
  {
    id: "sp01", projectId: "p01", dailyLogId: "l01",
    fileName: "foundation_zone_b.jpg",
    fileUrl: "https://picsum.photos/seed/foundation-b/800/600",
    caption: "יציקת יסודות אזור B",
    category: "התקדמות",
    uploadedBy: "אריאל דייטש",
    uploadedAt: "2026-06-16T09:30:00Z",
  },
  {
    id: "sp02", projectId: "p01", dailyLogId: "l01",
    fileName: "rebar_inspection.jpg",
    fileUrl: "https://picsum.photos/seed/rebar-inspection/800/600",
    caption: "בדיקות ברזל לפני יציקה",
    category: "איכות",
    uploadedBy: "אריאל דייטש",
    uploadedAt: "2026-06-16T10:15:00Z",
  },
  {
    id: "sp03", projectId: "p01", dailyLogId: "l02",
    fileName: "floor6_concrete.jpg",
    fileUrl: "https://picsum.photos/seed/floor6-concrete/800/600",
    caption: "יציקת תקרת קומה 6",
    category: "ביצוע",
    uploadedBy: "רועי כהן",
    uploadedAt: "2026-06-15T11:00:00Z",
  },

  // מגדלי הדר ירושלים - p04 (has issues)
  {
    id: "sp04", projectId: "p04", dailyLogId: "l08",
    fileName: "plumbing_floor2.jpg",
    fileUrl: "https://picsum.photos/seed/plumbing-floor2/800/600",
    caption: "עבודות אינסטלציה קומה 2",
    category: "ביצוע",
    uploadedBy: "מאור אוחיון",
    uploadedAt: "2026-06-15T08:45:00Z",
  },
  {
    id: "sp05", projectId: "p04", dailyLogId: "l08",
    fileName: "electrical_comm.jpg",
    fileUrl: "https://picsum.photos/seed/electrical-comm/800/600",
    caption: "עבודות חשמל חדר תקשורת",
    category: "ביצוע",
    uploadedBy: "אריאל דייטש",
    uploadedAt: "2026-06-15T09:20:00Z",
  },
  {
    id: "sp06", projectId: "p04", dailyLogId: "l08",
    fileName: "wall_crack_doc.jpg",
    fileUrl: "https://picsum.photos/seed/wall-crack-doc/800/600",
    caption: "סדק בקיר דרומי - קומה 3",
    category: "ליקוי",
    uploadedBy: "אריאל דייטש",
    uploadedAt: "2026-06-15T14:10:00Z",
  },

  // מרכז מסחרי גבעת זאב - p07 (on hold)
  {
    id: "sp07", projectId: "p07", dailyLogId: "l13",
    fileName: "iron_delay.jpg",
    fileUrl: "https://picsum.photos/seed/iron-delay/800/600",
    caption: "עיכוב אספקת ברזל - מחסן ריק",
    category: "חסם",
    uploadedBy: "אריאל דייטש",
    uploadedAt: "2026-06-10T10:00:00Z",
  },

  // נוף הכרמל - p02 (בניין B)
  {
    id: "sp08", projectId: "p02", dailyLogId: "l04",
    fileName: "aluminum_west.jpg",
    fileUrl: "https://picsum.photos/seed/aluminum-facade/800/600",
    caption: "התקנת אלומיניום חזית מערבית",
    category: "התקדמות",
    uploadedBy: "דוד לוי",
    uploadedAt: "2026-06-14T13:00:00Z",
  },

  // הר חוצבים - p12 (completed)
  {
    id: "sp09", projectId: "p12", dailyLogId: "l15",
    fileName: "handover_floor4.jpg",
    fileUrl: "https://picsum.photos/seed/handover-floor4/800/600",
    caption: "בדיקות מסירה קומה 4",
    category: "בקרה",
    uploadedBy: "דוד לוי",
    uploadedAt: "2026-02-27T11:00:00Z",
  },

  // נוף הכרמל - p01 (more recent for dashboard)
  {
    id: "sp10", projectId: "p01", dailyLogId: "l03",
    fileName: "formwork_floor7.jpg",
    fileUrl: "https://picsum.photos/seed/formwork-floor7/800/600",
    caption: "הכנת תבניות קומה 7",
    category: "ביצוע",
    uploadedBy: "מאור אוחיון",
    uploadedAt: "2026-06-14T09:00:00Z",
  },
  {
    id: "sp11", projectId: "p06", dailyLogId: "l11",
    fileName: "columns_b2.jpg",
    fileUrl: "https://picsum.photos/seed/columns-basement/800/600",
    caption: "יציקת עמודים קומה -2",
    category: "ביצוע",
    uploadedBy: "עידן פרץ",
    uploadedAt: "2026-06-15T08:30:00Z",
  },
  {
    id: "sp12", projectId: "p03", dailyLogId: "l06",
    fileName: "street_lights.jpg",
    fileUrl: "https://picsum.photos/seed/street-lights/800/600",
    caption: "התקנת עמודי תאורה - כביש פנימי 2",
    category: "התקדמות",
    uploadedBy: "עידן פרץ",
    uploadedAt: "2026-06-16T10:30:00Z",
  },
];
