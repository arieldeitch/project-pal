import { supabase } from "@/lib/supabase";
import type { DailyLog, ContractorRow, EquipmentRow, PhotoItem } from "@/lib/mock-data";

// Gray placeholder shown when a real storage URL is unavailable
const PHOTO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'%3Eאין תמונה%3C/text%3E%3C/svg%3E";

function photoUrl(storageKey: string): string {
  return storageKey?.startsWith("https://") ? storageKey : PHOTO_PLACEHOLDER;
}

function dbToDailyLog(row: Record<string, unknown>): DailyLog {
  const contractorRows = (row.contractor_row as Record<string, unknown>[] | null) ?? [];
  const equipmentRows = (row.equipment_row as Record<string, unknown>[] | null) ?? [];
  const photos = (row.photo as Record<string, unknown>[] | null) ?? [];

  return {
    id: row.id as string,
    projectId: row.project_id as string,
    date: row.date as string,
    workHours: (row.work_hours as string) ?? "",
    weather: (row.weather as string) ?? "",
    submittedBy: (row.submitted_by as string) ?? "",
    exceptionalEvents: (row.exceptional_events as string) ?? "",
    contractorNotes: (row.contractor_notes as string) ?? "",
    workDescription: (row.work_description as string[]) ?? [],
    contractors: [...contractorRows]
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((c): ContractorRow => ({
        id: c.id as string,
        contractor: (c.contractor as string) ?? "",
        trade: (c.trade as string) ?? "",
        workers: (c.workers as number) ?? 1,
        notes: (c.notes as string) ?? "",
      })),
    equipment: [...equipmentRows]
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((e): EquipmentRow => ({
        id: e.id as string,
        name: (e.name as string) ?? "",
        quantity: (e.quantity as number) ?? 1,
        notes: (e.notes as string) ?? "",
      })),
    photos: photos.map((p): PhotoItem => ({
      id: p.id as string,
      url: photoUrl(p.storage_key as string),
      caption: (p.caption as string) ?? "",
      workItem: (p.work_item as string) ?? "",
      area: (p.area as string) ?? "",
    })),
    createdAt: row.created_at as string,
  };
}

const LOG_SELECT = `
  *,
  contractor_row (id, contractor, trade, workers, notes, sort_order),
  equipment_row (id, name, quantity, notes, sort_order),
  photo!daily_log_id (id, storage_key, caption, work_item, area)
`;

export type CreateDailyLogInput = {
  projectId: string;
  date: string;
  workHours: string;
  weather: string;
  submittedBy: string;
  exceptionalEvents: string;
  contractorNotes: string;
  contractors: Omit<ContractorRow, "id">[];
  equipment: Omit<EquipmentRow, "id">[];
  workDescription: string[];
};

export const dailyLogRepository = {
  async list(filter?: { projectId?: string }): Promise<DailyLog[]> {
    let query = supabase.from("daily_log").select(LOG_SELECT).order("date", { ascending: false });
    if (filter?.projectId) query = query.eq("project_id", filter.projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(dbToDailyLog);
  },

  async get(id: string): Promise<DailyLog | null> {
    const { data, error } = await supabase
      .from("daily_log")
      .select(LOG_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToDailyLog(data as Record<string, unknown>) : null;
  },

  async create(input: CreateDailyLogInput): Promise<DailyLog> {
    const { data: log, error: logErr } = await supabase
      .from("daily_log")
      .insert({
        project_id: input.projectId,
        date: input.date,
        work_hours: input.workHours,
        weather: input.weather,
        submitted_by: input.submittedBy,
        exceptional_events: input.exceptionalEvents,
        contractor_notes: input.contractorNotes,
        work_description: input.workDescription,
      })
      .select("id")
      .single();
    if (logErr) throw logErr;

    if (input.contractors.length > 0) {
      const { error: crErr } = await supabase.from("contractor_row").insert(
        input.contractors.map((c, i) => ({
          daily_log_id: log.id,
          contractor: c.contractor,
          trade: c.trade,
          workers: c.workers,
          notes: c.notes,
          sort_order: i,
        }))
      );
      if (crErr) throw crErr;
    }

    if (input.equipment.length > 0) {
      const { error: erErr } = await supabase.from("equipment_row").insert(
        input.equipment.map((e, i) => ({
          daily_log_id: log.id,
          name: e.name,
          quantity: e.quantity,
          notes: e.notes,
          sort_order: i,
        }))
      );
      if (erErr) throw erErr;
    }

    const full = await dailyLogRepository.get(log.id);
    return full!;
  },
};
