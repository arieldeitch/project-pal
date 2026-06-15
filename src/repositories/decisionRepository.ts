import { supabase } from "@/lib/supabase";
import type { Decision, DecisionStatus } from "@/lib/mock-data";

function dbToDecision(row: Record<string, unknown>): Decision {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    requestedBy: (row.requested_by as string) ?? "",
    owner: (row.owner as string) ?? "",
    dueDate: (row.due_date as string) ?? "",
    status: row.status as DecisionStatus,
    createdAt: row.created_at as string,
  };
}

export type CreateDecisionInput = {
  projectId: string;
  title: string;
  description: string;
  requestedBy: string;
  owner: string;
  dueDate: string;
  status: DecisionStatus;
};

export const decisionRepository = {
  async list(filter?: { projectId?: string }): Promise<Decision[]> {
    let query = supabase
      .from("decision")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter?.projectId) query = query.eq("project_id", filter.projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r) => dbToDecision(r as Record<string, unknown>));
  },

  async create(input: CreateDecisionInput): Promise<Decision> {
    const { data, error } = await supabase
      .from("decision")
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description,
        requested_by: input.requestedBy,
        owner: input.owner,
        due_date: input.dueDate || null,
        status: input.status,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToDecision(data as Record<string, unknown>);
  },

  async update(id: string, input: Partial<CreateDecisionInput>): Promise<Decision> {
    const patch: Record<string, unknown> = {};
    if (input.projectId !== undefined) patch.project_id = input.projectId;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.requestedBy !== undefined) patch.requested_by = input.requestedBy;
    if (input.owner !== undefined) patch.owner = input.owner;
    if (input.dueDate !== undefined) patch.due_date = input.dueDate || null;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await supabase
      .from("decision")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return dbToDecision(data as Record<string, unknown>);
  },
};
