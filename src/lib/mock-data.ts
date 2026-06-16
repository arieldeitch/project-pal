// App-domain types (camelCase). These are the canonical shape used by all UI components.
// Data is now fetched from Supabase via repositories and React Query hooks.

export type SiteType = "residential" | "commercial" | "industrial" | "infrastructure";
export type SiteStatus = "planning" | "active" | "completed" | "on_hold";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type IssueStatus = "open" | "in_progress" | "resolved" | "reopened" | "closed";
export type Severity = "low" | "medium" | "high" | "critical";
export type BlockerStatus = "open" | "in_progress" | "resolved";
export type DecisionStatus = "pending" | "approved" | "rejected" | "deferred";
export type ReportStatus = "draft" | "ready" | "sent";
export type ReportType = "daily" | "weekly" | "monthly";

export interface Site {
  id: string;
  name: string;
  address: string;
  type: SiteType;
  client: string;
  status: SiteStatus;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  siteId?: string;
  name: string;
  address: string;
  client: string;
  manager: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate?: string;
  progress: number;
  createdAt: string;
  updates?: TaskUpdate[];
  comments?: TaskComment[];
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  submittedBy: string;
  content: string;
  progressAfter: number;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId?: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
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

export type PhotoCategory = "התקדמות" | "ביצוע" | "איכות" | "ליקוי" | "חסם" | "בקרה";

export interface SitePhoto {
  id: string;
  projectId: string;
  dailyLogId?: string;
  fileName: string;
  fileUrl: string;
  caption: string;
  category: PhotoCategory;
  uploadedBy: string;
  uploadedAt: string;
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

export const siteTypeLabel: Record<SiteType, string> = {
  residential: "מגורים",
  commercial: "מסחרי",
  industrial: "תעשייה",
  infrastructure: "תשתיות",
};

export const siteStatusLabel: Record<SiteStatus, string> = {
  planning: "תכנון",
  active: "פעיל",
  completed: "הושלם",
  on_hold: "מושהה",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  not_started: "טרם התחיל",
  in_progress: "בביצוע",
  completed: "הושלם",
  blocked: "חסום",
};

export const taskPriorityLabel: Record<TaskPriority, string> = {
  low: "נמוך",
  medium: "בינוני",
  high: "גבוה",
  critical: "קריטי",
};

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
  const t = new Date().toISOString().slice(0, 10);
  return logs.some((l) => l.projectId === projectId && l.date === t);
}

export function lastLogDate(projectId: string, logs: DailyLog[]) {
  const filtered = logs
    .filter((l) => l.projectId === projectId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return filtered[0]?.date;
}
