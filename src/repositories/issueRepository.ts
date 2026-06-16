import { supabase } from "@/lib/supabase";
import type { Issue, IssueStatus, Severity, PhotoItem } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_ISSUES } from "@/lib/demo-data";

const PHOTO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'%3Eאין תמונה%3C/text%3E%3C/svg%3E";

function photoUrl(storageKey: string): string {
  return storageKey?.startsWith("https://") ? storageKey : PHOTO_PLACEHOLDER;
}

function dbToIssue(row: Record<string, unknown>): Issue {
  const photos = (row.photo as Record<string, unknown>[] | null) ?? [];
  const comments = (row.issue_comment as Record<string, unknown>[] | null) ?? [];

  return {
    id: row.id as string,
    projectId: row.project_id as string,
    location: (row.location as string) ?? "",
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    responsibleContractor: (row.responsible_contractor as string) ?? "",
    assignedTo: (row.assigned_to as string) ?? "",
    dueDate: (row.due_date as string) ?? "",
    severity: row.severity as Severity,
    status: row.status as IssueStatus,
    photos: photos.map((p): PhotoItem => ({
      id: p.id as string,
      url: photoUrl(p.storage_key as string),
      caption: (p.caption as string) ?? "",
      workItem: (p.work_item as string) ?? "",
      area: (p.area as string) ?? "",
    })),
    comments: comments.map((c) => ({
      id: c.id as string,
      author: (c.author as string) ?? "",
      text: (c.body as string) ?? "",
      date: ((c.created_at as string) ?? "").slice(0, 10),
    })),
    createdAt: row.created_at as string,
  };
}

const ISSUE_SELECT = `
  *,
  photo!issue_id (id, storage_key, caption, work_item, area),
  issue_comment (id, author, body, created_at)
`;

export type CreateIssueInput = {
  projectId: string;
  title: string;
  description: string;
  location: string;
  responsibleContractor: string;
  assignedTo: string;
  dueDate: string;
  severity: Severity;
  status: IssueStatus;
};

export const issueRepository = {
  async list(filter?: { projectId?: string }): Promise<Issue[]> {
    if (DEMO_MODE) {
      return filter?.projectId
        ? DEMO_ISSUES.filter((i) => i.projectId === filter.projectId)
        : [...DEMO_ISSUES];
    }
    let query = supabase
      .from("issue")
      .select(ISSUE_SELECT)
      .order("created_at", { ascending: false });
    if (filter?.projectId) query = query.eq("project_id", filter.projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r) => dbToIssue(r as Record<string, unknown>));
  },

  async create(input: CreateIssueInput): Promise<Issue> {
    const { data, error } = await supabase
      .from("issue")
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description,
        location: input.location,
        responsible_contractor: input.responsibleContractor,
        assigned_to: input.assignedTo,
        due_date: input.dueDate || null,
        severity: input.severity,
        status: input.status,
      })
      .select(ISSUE_SELECT)
      .single();
    if (error) throw error;
    return dbToIssue(data as Record<string, unknown>);
  },

  async addComment(issueId: string, author: string, body: string): Promise<void> {
    const { error } = await supabase
      .from("issue_comment")
      .insert({ issue_id: issueId, author, body });
    if (error) throw error;
  },

  async update(id: string, input: Partial<CreateIssueInput & { status: IssueStatus }>): Promise<Issue> {
    const patch: Record<string, unknown> = {};
    if (input.projectId !== undefined) patch.project_id = input.projectId;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.location !== undefined) patch.location = input.location;
    if (input.responsibleContractor !== undefined) patch.responsible_contractor = input.responsibleContractor;
    if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
    if (input.dueDate !== undefined) patch.due_date = input.dueDate || null;
    if (input.severity !== undefined) patch.severity = input.severity;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await supabase
      .from("issue")
      .update(patch)
      .eq("id", id)
      .select(ISSUE_SELECT)
      .single();
    if (error) throw error;
    return dbToIssue(data as Record<string, unknown>);
  },
};
