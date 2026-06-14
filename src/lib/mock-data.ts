import { useSyncExternalStore } from "react";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type IssueStatus = "open" | "in_progress" | "resolved" | "reopened" | "closed";
export type Severity = "low" | "medium" | "high" | "critical";
export type BlockerStatus = "open" | "in_progress" | "resolved";
export type DecisionStatus = "pending" | "approved" | "rejected" | "deferred";
export type ReportStatus = "draft" | "ready" | "sent";
export type ReportType = "daily" | "weekly" | "monthly";

export interface Project {
  id: string;
  name: string;
  address: string;
  client: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
}

export interface ContractorRow {
  id: string;
  contractor: string;
  trade: string;
  workers: number;
  notes: string;
}

export interface EquipmentRow {
  id: string;
  name: string;
  quantity: number;
  notes: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  workItem: string;
  area: string;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  workHours: string;
  weather: string;
  submittedBy: string;
  exceptionalEvents: string;
  contractorNotes: string;
  contractors: ContractorRow[];
  equipment: EquipmentRow[];
  workDescription: string[];
  photos: PhotoItem[];
  createdAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  location: string;
  title: string;
  description: string;
  responsibleContractor: string;
  assignedTo: string;
  dueDate: string;
  severity: Severity;
  status: IssueStatus;
  photos: PhotoItem[];
  comments: { id: string; author: string; text: string; date: string }[];
  createdAt: string;
}

export interface Blocker {
  id: string;
  projectId: string;
  title: string;
  description: string;
  impact: string;
  responsible: string;
  dueDate: string;
  status: BlockerStatus;
  priority: Severity;
  createdAt: string;
}

export interface Decision {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requestedBy: string;
  owner: string;
  dueDate: string;
  status: DecisionStatus;
  createdAt: string;
}

export interface Report {
  id: string;
  projectId: string;
  dailyLogId?: string;
  date: string;
  createdAt: string;
  status: ReportStatus;
  type: ReportType;
  sentAt?: string;
}

interface Store {
  projects: Project[];
  dailyLogs: DailyLog[];
  issues: Issue[];
  blockers: Blocker[];
  decisions: Decision[];
  reports: Report[];
}

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const photo = (i: number, caption: string, area = "", workItem = ""): PhotoItem => ({
  id: uid(),
  url: `https://images.unsplash.com/photo-${
    ["1503387762-592deb58ef4e", "1581094794329-c8112a89af12", "1541888946425-d81bb19240f5", "1504307651254-35680f356dfd", "1590725140246-20acdee442be", "1582407947304-fd86f028f716"][i % 6]
  }?auto=format&fit=crop&w=800&q=70`,
  caption,
  area,
  workItem,
});

const state: Store = {
  projects: [
    {
      id: "pr1",
      name: "הצלפים 24",
      address: "הצלפים 24, רעננה",
      client: "יזמות בן-דוד בע״מ",
      manager: "אבי כהן",
      status: "active",
      startDate: "2026-01-15",
      targetDate: "2027-03-30",
    },
    {
      id: "pr2",
      name: "שדרות ירושלים 18",
      address: "שדרות ירושלים 18, בת ים",
      client: "אזורים בנייה",
      manager: "רונן לוי",
      status: "active",
      startDate: "2025-09-01",
      targetDate: "2026-12-15",
    },
    {
      id: "pr3",
      name: "נוף הגליל 12",
      address: "האורנים 12, נוף הגליל",
      client: "עיריית נוף הגליל",
      manager: "שירה גל",
      status: "planning",
      startDate: "2026-07-01",
      targetDate: "2027-10-30",
    },
  ],
  dailyLogs: [],
  issues: [],
  blockers: [],
  decisions: [],
  reports: [],
};

// Seed daily logs
const seedLog = (projectId: string, date: string, submittedBy: string, work: string[], events = "אין"): DailyLog => ({
  id: uid(),
  projectId,
  date,
  workHours: "07:00-15:00",
  weather: "חמים, 28°",
  submittedBy,
  exceptionalEvents: events,
  contractorNotes: "אין",
  contractors: [
    { id: uid(), contractor: "א.ש שלד", trade: "שלד", workers: 5, notes: "" },
    { id: uid(), contractor: "צמ״ה אורן", trade: 'צמ"ה', workers: 1, notes: "מיני מחפרון כולל מפעיל" },
  ],
  equipment: [
    { id: uid(), name: "מיני מחפרון", quantity: 1, notes: "" },
    { id: uid(), name: "משאית מנוף", quantity: 1, notes: "" },
    { id: uid(), name: "כלים חשמליים", quantity: 4, notes: "" },
  ],
  workDescription: work,
  photos: [
    photo(0, "יציקת בטון רזה", "אזור A", "יציקה"),
    photo(1, "קשירת ברזל קומה 2", "קומה 2", "ברזל"),
  ],
  createdAt: date + "T15:30:00",
});

state.dailyLogs = [
  seedLog("pr1", daysAgo(0), "אבי כהן", ["קשירת ברזל קומה 2", "המשך חפירת יסודות בצד מערבי", "יציקת בטון רזה אזור A"]),
  seedLog("pr1", daysAgo(1), "אבי כהן", ["סיום יסודות", "הורדת תבניות והרכבתן מחדש"]),
  seedLog("pr1", daysAgo(2), "אבי כהן", ["חפירת יסודות", "קשירת ברזל"], "ספק בטון איחר ב-3 שעות"),
  seedLog("pr1", daysAgo(3), "אבי כהן", ["יציקת רצפת מרתף", "פירוק תבניות"]),
  seedLog("pr2", daysAgo(0), "רונן לוי", ["טיח פנים קומה 4", "צביעה קומה 3", "הרכבת חלונות"]),
  seedLog("pr2", daysAgo(1), "רונן לוי", ["טיח פנים קומה 4", "התקנת אינסטלציה"]),
  seedLog("pr2", daysAgo(2), "רונן לוי", ["איטום גג", "צביעת חזית"]),
  seedLog("pr2", daysAgo(4), "רונן לוי", ["עבודות חשמל קומה 5"], "הופסקה עבודה עקב גשם"),
  seedLog("pr2", daysAgo(5), "רונן לוי", ["טיח חוץ", "קווי מים"]),
  seedLog("pr3", daysAgo(7), "שירה גל", ["סיור תכנון באתר", "סימון גבולות"]),
];

state.issues = [
  { id: uid(), projectId: "pr1", location: "קומה 2 - אזור B", title: "סדק בקיר חיצוני", description: "סדק אופקי באורך 80 ס״מ", responsibleContractor: "א.ש שלד", assignedTo: "אבי כהן", dueDate: daysAgo(-3), severity: "high", status: "open", photos: [photo(2, "סדק")], comments: [], createdAt: daysAgo(1) },
  { id: uid(), projectId: "pr1", location: "מרתף", title: "חוסר איטום", description: "חדירת מים בפינה צפונית", responsibleContractor: "איטום עזרא", assignedTo: "אבי כהן", dueDate: daysAgo(-1), severity: "critical", status: "in_progress", photos: [], comments: [{ id: uid(), author: "אבי כהן", text: "תואם איטום נוסף", date: daysAgo(0) }], createdAt: daysAgo(2) },
  { id: uid(), projectId: "pr1", location: "קומה 1", title: "ברזל לא בקוטר הנכון", description: "התגלה Φ12 במקום Φ14", responsibleContractor: "א.ש שלד", assignedTo: "מהנדס בקרה", dueDate: daysAgo(-5), severity: "high", status: "open", photos: [], comments: [], createdAt: daysAgo(3) },
  { id: uid(), projectId: "pr2", location: "קומה 4", title: "טיח לא ישר", description: "סטייה של 2 ס״מ בקיר מערב", responsibleContractor: "טיח אלי", assignedTo: "רונן לוי", dueDate: daysAgo(-2), severity: "medium", status: "in_progress", photos: [], comments: [], createdAt: daysAgo(1) },
  { id: uid(), projectId: "pr2", location: "גג", title: "ניקוז לקוי", description: "מים מצטברים בפינה", responsibleContractor: "איטום עזרא", assignedTo: "רונן לוי", dueDate: daysAgo(0), severity: "high", status: "open", photos: [], comments: [], createdAt: daysAgo(2) },
  { id: uid(), projectId: "pr2", location: "קומה 3", title: "צבע לא תואם דוגמה", description: "גוון שונה מהמאושר", responsibleContractor: "צבע נדב", assignedTo: "רונן לוי", dueDate: daysAgo(-7), severity: "low", status: "resolved", photos: [], comments: [], createdAt: daysAgo(5) },
  { id: uid(), projectId: "pr2", location: "כניסה", title: "דלת לא מותקנת היטב", description: "הדלת לא נסגרת כראוי", responsibleContractor: "מסגרות גל", assignedTo: "רונן לוי", dueDate: daysAgo(-1), severity: "medium", status: "open", photos: [], comments: [], createdAt: daysAgo(1) },
  { id: uid(), projectId: "pr1", location: "חצר", title: "פסולת בנייה", description: "ערמת פסולת חוסמת מעבר", responsibleContractor: "א.ש שלד", assignedTo: "אבי כהן", dueDate: daysAgo(0), severity: "low", status: "open", photos: [], comments: [], createdAt: daysAgo(0) },
  { id: uid(), projectId: "pr1", location: "קומה 3", title: "חוסר במחברי ברזל", description: "ספקה לא הגיעה", responsibleContractor: "ספק ברזל", assignedTo: "אבי כהן", dueDate: daysAgo(-2), severity: "high", status: "reopened", photos: [], comments: [], createdAt: daysAgo(4) },
  { id: uid(), projectId: "pr3", location: "כללי", title: "חסר אישור תכנון", description: "ממתין לאישור עירייה", responsibleContractor: "—", assignedTo: "שירה גל", dueDate: daysAgo(-14), severity: "critical", status: "open", photos: [], comments: [], createdAt: daysAgo(7) },
  { id: uid(), projectId: "pr2", location: "קומה 5", title: "חשמל לא תקני", description: "חיווט לא לפי תכנית", responsibleContractor: "חשמל כהן", assignedTo: "רונן לוי", dueDate: daysAgo(-3), severity: "high", status: "in_progress", photos: [], comments: [], createdAt: daysAgo(2) },
  { id: uid(), projectId: "pr2", location: "מעלית", title: "פיר לא מאונך", description: "סטייה של 1 ס״מ", responsibleContractor: "מעליות שינדלר", assignedTo: "רונן לוי", dueDate: daysAgo(-7), severity: "critical", status: "closed", photos: [], comments: [], createdAt: daysAgo(10) },
];

state.blockers = [
  { id: uid(), projectId: "pr1", title: "בטון לא סופק בזמן", description: "ספק בטון מאחר 3 ימים", impact: "עיכוב יציקת קומה 3", responsible: "מנהל רכש", dueDate: daysAgo(-1), status: "open", priority: "critical", createdAt: daysAgo(1) },
  { id: uid(), projectId: "pr1", title: "חסר אישור קונסטרוקטור", description: "ממתינים לחתימה על תוכנית עדכון", impact: "לא ניתן ליצוק", responsible: "אבי כהן", dueDate: daysAgo(0), status: "in_progress", priority: "high", createdAt: daysAgo(2) },
  { id: uid(), projectId: "pr2", title: "חסרה תוכנית יועץ אקוסטיקה", description: "תוכנית לא הועברה", impact: "עיכוב בקירות פנים", responsible: "מתאם תכנון", dueDate: daysAgo(-2), status: "open", priority: "high", createdAt: daysAgo(3) },
  { id: uid(), projectId: "pr2", title: "ספק לא הגיע", description: "ספק חלונות לא הופיע", impact: "עיכוב הרכבה", responsible: "רונן לוי", dueDate: daysAgo(0), status: "open", priority: "medium", createdAt: daysAgo(0) },
  { id: uid(), projectId: "pr3", title: "חסר היתר בנייה", description: "ממתין מהעירייה", impact: "לא ניתן להתחיל", responsible: "שירה גל", dueDate: daysAgo(-10), status: "open", priority: "critical", createdAt: daysAgo(15) },
  { id: uid(), projectId: "pr1", title: "תקלת מנוף", description: "המנוף שבת", impact: "עיכוב הרמת חומרים", responsible: "ספק מנופים", dueDate: daysAgo(-1), status: "resolved", priority: "high", createdAt: daysAgo(5) },
];

state.decisions = [
  { id: uid(), projectId: "pr1", title: "אישור יציקת קומה 3", description: "האם להתחיל יציקה למרות איחור בטון", requestedBy: "אבי כהן", owner: "מנכ״ל", dueDate: daysAgo(0), status: "pending", createdAt: daysAgo(1) },
  { id: uid(), projectId: "pr1", title: "בחירת ספק חלונות", description: "שני הצעות במחיר דומה", requestedBy: "אבי כהן", owner: "מנהל רכש", dueDate: daysAgo(-2), status: "pending", createdAt: daysAgo(3) },
  { id: uid(), projectId: "pr2", title: "אישור שינוי תכנון מטבחים", description: "הלקוח מבקש שינוי בעיצוב", requestedBy: "רונן לוי", owner: "אדריכל", dueDate: daysAgo(-3), status: "approved", createdAt: daysAgo(7) },
  { id: uid(), projectId: "pr2", title: "אישור חריגה תקציבית", description: "תוספת 80,000 ₪ לאיטום", requestedBy: "רונן לוי", owner: "מנכ״ל", dueDate: daysAgo(-1), status: "pending", createdAt: daysAgo(2) },
  { id: uid(), projectId: "pr3", title: "אישור תאריך התחלה", description: "דחייה אפשרית בחודש", requestedBy: "שירה גל", owner: "מנכ״ל", dueDate: daysAgo(-5), status: "deferred", createdAt: daysAgo(10) },
  { id: uid(), projectId: "pr1", title: "אישור חומר חלופי", description: "החלפת ברזל לקוטר חלופי", requestedBy: "אבי כהן", owner: "מהנדס ראשי", dueDate: daysAgo(-4), status: "rejected", createdAt: daysAgo(6) },
];

// Seed reports from first 8 daily logs
state.reports = state.dailyLogs.slice(0, 8).map((log, i) => ({
  id: uid(),
  projectId: log.projectId,
  dailyLogId: log.id,
  date: log.date,
  createdAt: log.createdAt,
  status: (i < 3 ? "sent" : i < 6 ? "ready" : "draft") as ReportStatus,
  type: "daily" as ReportType,
  sentAt: i < 3 ? log.date : undefined,
}));

const listeners = new Set<() => void>();
let snapshot: Store = { ...state };
const emit = () => {
  snapshot = {
    projects: [...state.projects],
    dailyLogs: [...state.dailyLogs],
    issues: [...state.issues],
    blockers: [...state.blockers],
    decisions: [...state.decisions],
    reports: [...state.reports],
  };
  listeners.forEach((l) => l());
};
emit();

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => snapshot,
  addProject(p: Omit<Project, "id">) {
    state.projects.push({ ...p, id: uid() });
    emit();
  },
  updateProject(id: string, p: Partial<Project>) {
    const i = state.projects.findIndex((x) => x.id === id);
    if (i >= 0) state.projects[i] = { ...state.projects[i], ...p };
    emit();
  },
  addDailyLog(l: Omit<DailyLog, "id" | "createdAt">) {
    const newLog: DailyLog = { ...l, id: uid(), createdAt: new Date().toISOString() };
    state.dailyLogs.unshift(newLog);
    emit();
    return newLog;
  },
  updateDailyLog(id: string, l: Partial<DailyLog>) {
    const i = state.dailyLogs.findIndex((x) => x.id === id);
    if (i >= 0) state.dailyLogs[i] = { ...state.dailyLogs[i], ...l };
    emit();
  },
  deleteDailyLog(id: string) {
    state.dailyLogs = state.dailyLogs.filter((x) => x.id !== id);
    emit();
  },
  addIssue(x: Omit<Issue, "id" | "createdAt" | "comments" | "photos"> & { comments?: Issue["comments"]; photos?: PhotoItem[] }) {
    state.issues.push({ ...x, comments: x.comments ?? [], photos: x.photos ?? [], id: uid(), createdAt: new Date().toISOString() });
    emit();
  },
  updateIssue(id: string, x: Partial<Issue>) {
    const i = state.issues.findIndex((y) => y.id === id);
    if (i >= 0) state.issues[i] = { ...state.issues[i], ...x };
    emit();
  },
  addBlocker(b: Omit<Blocker, "id" | "createdAt">) {
    state.blockers.push({ ...b, id: uid(), createdAt: new Date().toISOString() });
    emit();
  },
  updateBlocker(id: string, b: Partial<Blocker>) {
    const i = state.blockers.findIndex((x) => x.id === id);
    if (i >= 0) state.blockers[i] = { ...state.blockers[i], ...b };
    emit();
  },
  addDecision(d: Omit<Decision, "id" | "createdAt">) {
    state.decisions.push({ ...d, id: uid(), createdAt: new Date().toISOString() });
    emit();
  },
  updateDecision(id: string, d: Partial<Decision>) {
    const i = state.decisions.findIndex((x) => x.id === id);
    if (i >= 0) state.decisions[i] = { ...state.decisions[i], ...d };
    emit();
  },
  generateReportFromLog(logId: string): Report | undefined {
    const log = state.dailyLogs.find((l) => l.id === logId);
    if (!log) return;
    const existing = state.reports.find((r) => r.dailyLogId === logId);
    if (existing) return existing;
    const r: Report = {
      id: uid(),
      projectId: log.projectId,
      dailyLogId: logId,
      date: log.date,
      createdAt: new Date().toISOString(),
      status: "ready",
      type: "daily",
    };
    state.reports.unshift(r);
    emit();
    return r;
  },
  markReportSent(id: string) {
    const i = state.reports.findIndex((x) => x.id === id);
    if (i >= 0) state.reports[i] = { ...state.reports[i], status: "sent", sentAt: new Date().toISOString() };
    emit();
  },
};

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: "תכנון",
  active: "פעיל",
  on_hold: "מושהה",
  completed: "הושלם",
};

export const issueStatusLabel: Record<IssueStatus, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "טופל",
  reopened: "נפתח מחדש",
  closed: "סגור",
};

export const severityLabel: Record<Severity, string> = {
  low: "נמוך",
  medium: "בינוני",
  high: "גבוה",
  critical: "קריטי",
};

export const blockerStatusLabel: Record<BlockerStatus, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "נפתר",
};

export const decisionStatusLabel: Record<DecisionStatus, string> = {
  pending: "ממתין",
  approved: "אושר",
  rejected: "נדחה",
  deferred: "נדחה לאחר זמן",
};

export const reportStatusLabel: Record<ReportStatus, string> = {
  draft: "טיוטה",
  ready: "מוכן",
  sent: "נשלח",
};

export const reportTypeLabel: Record<ReportType, string> = {
  daily: "יומי",
  weekly: "שבועי",
  monthly: "חודשי",
};

export function hasLogToday(projectId: string, logs: DailyLog[]) {
  const t = today();
  return logs.some((l) => l.projectId === projectId && l.date === t);
}

export function lastLogDate(projectId: string, logs: DailyLog[]) {
  const filtered = logs.filter((l) => l.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date));
  return filtered[0]?.date;
}
