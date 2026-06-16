import { supabase } from "@/lib/supabase";
import type { Report, ReportStatus, ReportType, DailyLog, Project } from "@/lib/mock-data";
import { dailyLogRepository } from "./dailyLogRepository";
import { projectRepository } from "./projectRepository";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_REPORTS, DEMO_DAILY_LOGS, DEMO_PROJECTS } from "@/lib/demo-data";

function dbToReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    dailyLogId: (row.daily_log_id as string) ?? undefined,
    date: row.date as string,
    createdAt: row.created_at as string,
    status: row.status as ReportStatus,
    type: row.type as ReportType,
    sentAt: (row.sent_at as string) ?? undefined,
  };
}

export interface ReportDetail {
  report: Report;
  log: DailyLog | null;
  project: Project | null;
}

export const reportRepository = {
  async list(filter?: { projectId?: string }): Promise<Report[]> {
    if (DEMO_MODE) {
      return filter?.projectId
        ? DEMO_REPORTS.filter((r) => r.projectId === filter.projectId)
        : [...DEMO_REPORTS];
    }
    let query = supabase
      .from("report")
      .select("*")
      .order("date", { ascending: false });
    if (filter?.projectId) query = query.eq("project_id", filter.projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r) => dbToReport(r as Record<string, unknown>));
  },

  async getDetail(id: string): Promise<ReportDetail> {
    if (DEMO_MODE) {
      const report = DEMO_REPORTS.find((r) => r.id === id) ?? DEMO_REPORTS[0];
      const log = report.dailyLogId
        ? (DEMO_DAILY_LOGS.find((l) => l.id === report.dailyLogId) ?? null)
        : (DEMO_DAILY_LOGS.find((l) => l.projectId === report.projectId) ?? null);
      const project = DEMO_PROJECTS.find((p) => p.id === report.projectId) ?? null;
      return { report, log, project };
    }
    const { data, error } = await supabase
      .from("report")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    const report = dbToReport(data as Record<string, unknown>);

    const [log, project] = await Promise.all([
      report.dailyLogId ? dailyLogRepository.get(report.dailyLogId) : Promise.resolve(null),
      projectRepository.get(report.projectId),
    ]);

    return { report, log, project };
  },

  async generateFromLog(logId: string, projectId: string, date: string): Promise<Report> {
    // Return existing report if already generated for this log
    const { data: existing } = await supabase
      .from("report")
      .select("*")
      .eq("daily_log_id", logId)
      .maybeSingle();

    if (existing) return dbToReport(existing as Record<string, unknown>);

    const { data, error } = await supabase
      .from("report")
      .insert({
        project_id: projectId,
        daily_log_id: logId,
        type: "daily",
        date: date,
        status: "ready",
      })
      .select()
      .single();
    if (error) throw error;
    return dbToReport(data as Record<string, unknown>);
  },

  async markSent(id: string): Promise<Report> {
    const { data, error } = await supabase
      .from("report")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return dbToReport(data as Record<string, unknown>);
  },
};
