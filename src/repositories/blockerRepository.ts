import { supabase } from "@/lib/supabase";
import type { Blocker, BlockerStatus, Severity } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_BLOCKERS } from "@/lib/demo-data";

function dbToBlocker(row: Record<string, unknown>): Blocker {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    impact: (row.impact as string) ?? "",
    responsible: (row.responsible as string) ?? "",
    dueDate: (row.due_date as string) ?? "",
    status: row.status as BlockerStatus,
    priority: row.priority as Severity,
    createdAt: row.created_at as string,
  };
}

export type CreateBlockerInput = {
  projectId: string;
  title: string;
  description: string;
  impact: string;
  responsible: string;
  dueDate: string;
  status: BlockerStatus;
  priority: Severity;
};

export const blockerRepository = {
  async list(filter?: { projectId?: string }): Promise<Blocker[]> {
    if (DEMO_MODE) {
      return filter?.projectId
        ? DEMO_BLOCKERS.filter((b) => b.projectId === filter.projectId)
        : [...DEMO_BLOCKERS];
    }
    let query = supabase
      .from("blocker")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter?.projectId) query = query.eq("project_id", filter.projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r) => dbToBlocker(r as Record<string, unknown>));
  },

  async create(input: CreateBlockerInput): Promise<Blocker> {
    const { data, error } = await supabase
      .from("blocker")
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description,
        impact: input.impact,
        responsible: input.responsible,
        due_date: input.dueDate || null,
        status: input.status,
        priority: input.priority,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToBlocker(data as Record<string, unknown>);
  },

  async update(id: string, input: Partial<CreateBlockerInput>): Promise<Blocker> {
    const patch: Record<string, unknown> = {};
    if (input.projectId !== undefined) patch.project_id = input.projectId;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.impact !== undefined) patch.impact = input.impact;
    if (input.responsible !== undefined) patch.responsible = input.responsible;
    if (input.dueDate !== undefined) patch.due_date = input.dueDate || null;
    if (input.status !== undefined) patch.status = input.status;
    if (input.priority !== undefined) patch.priority = input.priority;

    const { data, error } = await supabase
      .from("blocker")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return dbToBlocker(data as Record<string, unknown>);
  },
};
