import { useSyncExternalStore } from "react";

export type TaskStatus = "open" | "in_progress" | "done";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
}

export interface Report {
  id: string;
  projectId: string;
  date: string;
  submittedBy: string;
  text: string;
  comment: string;
}

export interface Project {
  id: string;
  siteId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  status: "active" | "inactive";
}

interface Store {
  sites: Site[];
  projects: Project[];
  tasks: Task[];
  reports: Report[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

const state: Store = {
  sites: [
    { id: "s1", name: "מגדל אחד העם", address: "אחד העם 12, תל אביב", status: "active" },
    { id: "s2", name: "פרויקט רמת השרון", address: "סוקולוב 88, רמת השרון", status: "active" },
    { id: "s3", name: "מתחם הדר יוסף", address: "ברודצקי 45, תל אביב", status: "inactive" },
  ],
  projects: [
    { id: "p1", siteId: "s1", name: "שלד קומות 1-10", description: "יציקת שלד קומות נמוכות", status: "active", dueDate: "2026-09-30" },
    { id: "p2", siteId: "s1", name: "מערכות חשמל", description: "תשתיות חשמל לכל הקומות", status: "planning", dueDate: "2026-12-15" },
    { id: "p3", siteId: "s2", name: "עבודות עפר", description: "חפירה והכנת קרקע", status: "completed", dueDate: "2026-05-01" },
    { id: "p4", siteId: "s2", name: "יסודות", description: "יציקת יסודות", status: "active", dueDate: "2026-08-20" },
    { id: "p5", siteId: "s3", name: "אישורי תכנון", description: "ליווי תהליך רישוי", status: "on_hold", dueDate: "2026-11-01" },
  ],
  tasks: [
    { id: "t1", projectId: "p1", title: "הזמנת ברזל לקומה 3", description: "תיאום מול ספק הברזל", status: "in_progress", dueDate: "2026-07-01", assignee: "דני כהן" },
    { id: "t2", projectId: "p1", title: "בדיקת איכות יציקה", description: "מהנדס בקרה באתר", status: "open", dueDate: "2026-07-10", assignee: "רונית לוי" },
    { id: "t3", projectId: "p1", title: "אישור בטיחות", description: "סקירת ממונה בטיחות", status: "done", dueDate: "2026-06-01", assignee: "משה אברהם" },
    { id: "t4", projectId: "p2", title: "תכנון לוחות חשמל", description: "תכנון ראשוני", status: "open", dueDate: "2026-08-15", assignee: "יוסי שמש" },
    { id: "t5", projectId: "p4", title: "בדיקת קרקע", description: "דוח קרקע מעודכן", status: "in_progress", dueDate: "2026-07-05", assignee: "שירה גל" },
    { id: "t6", projectId: "p4", title: "הזמנת בטון", description: "תיאום משאיות", status: "open", dueDate: "2026-07-20", assignee: "דני כהן" },
  ],
  reports: [
    { id: "r1", projectId: "p1", date: "2026-06-10", submittedBy: "דני כהן", text: "הושלמה יציקת קומה 2. חומרי גלם בדרך לקומה 3.", comment: "להאיץ הזמנת ברזל" },
    { id: "r2", projectId: "p4", date: "2026-06-12", submittedBy: "שירה גל", text: "החלה חפירה ליסודות. מזג האוויר מעכב מעט.", comment: "" },
    { id: "r3", projectId: "p1", date: "2026-06-13", submittedBy: "רונית לוי", text: "בדיקת איכות עברה בהצלחה.", comment: "מצוין" },
  ],
};

const listeners = new Set<() => void>();
let snapshot = { ...state };
const emit = () => {
  snapshot = {
    sites: [...state.sites],
    projects: [...state.projects],
    tasks: [...state.tasks],
    reports: [...state.reports],
  };
  listeners.forEach((l) => l());
};

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get() {
    return snapshot;
  },
  // Sites
  addSite(s: Omit<Site, "id">) {
    state.sites.push({ ...s, id: uid() });
    emit();
  },
  updateSite(id: string, s: Partial<Site>) {
    const i = state.sites.findIndex((x) => x.id === id);
    if (i >= 0) state.sites[i] = { ...state.sites[i], ...s };
    emit();
  },
  deleteSite(id: string) {
    state.sites = state.sites.filter((x) => x.id !== id);
    state.projects = state.projects.filter((p) => p.siteId !== id);
    emit();
  },
  // Projects
  addProject(p: Omit<Project, "id">) {
    state.projects.push({ ...p, id: uid() });
    emit();
  },
  updateProject(id: string, p: Partial<Project>) {
    const i = state.projects.findIndex((x) => x.id === id);
    if (i >= 0) state.projects[i] = { ...state.projects[i], ...p };
    emit();
  },
  deleteProject(id: string) {
    state.projects = state.projects.filter((x) => x.id !== id);
    state.tasks = state.tasks.filter((t) => t.projectId !== id);
    state.reports = state.reports.filter((r) => r.projectId !== id);
    emit();
  },
  // Tasks
  addTask(t: Omit<Task, "id">) {
    state.tasks.push({ ...t, id: uid() });
    emit();
  },
  updateTask(id: string, t: Partial<Task>) {
    const i = state.tasks.findIndex((x) => x.id === id);
    if (i >= 0) state.tasks[i] = { ...state.tasks[i], ...t };
    emit();
  },
  deleteTask(id: string) {
    state.tasks = state.tasks.filter((x) => x.id !== id);
    emit();
  },
  // Reports
  addReport(r: Omit<Report, "id">) {
    state.reports.push({ ...r, id: uid() });
    emit();
  },
  updateReport(id: string, r: Partial<Report>) {
    const i = state.reports.findIndex((x) => x.id === id);
    if (i >= 0) state.reports[i] = { ...state.reports[i], ...r };
    emit();
  },
  deleteReport(id: string) {
    state.reports = state.reports.filter((x) => x.id !== id);
    emit();
  },
};

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  open: "פתוח",
  in_progress: "בביצוע",
  done: "הושלם",
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: "תכנון",
  active: "פעיל",
  on_hold: "מושהה",
  completed: "הושלם",
};
