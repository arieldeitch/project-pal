import { supabase } from "@/lib/supabase";
import type { Task, TaskStatus, TaskPriority, TaskUpdate, TaskComment } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_TASKS } from "@/lib/demo-data";

const TASK_SELECT = `
  *,
  updates:task_update(*),
  comments:task_comment(*)
`;

function dbToTaskUpdate(row: Record<string, unknown>): TaskUpdate {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    submittedBy: row.submitted_by as string,
    content: row.content as string,
    progressAfter: row.progress_after as number,
    createdAt: row.created_at as string,
  };
}

function dbToTaskComment(row: Record<string, unknown>): TaskComment {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    authorId: (row.author_id as string) ?? undefined,
    authorName: row.author_name as string,
    body: row.body as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function dbToTask(row: Record<string, unknown>): Task {
  const updates = Array.isArray(row.updates)
    ? (row.updates as Record<string, unknown>[]).map(dbToTaskUpdate)
    : undefined;
  const comments = Array.isArray(row.comments)
    ? (row.comments as Record<string, unknown>[]).map(dbToTaskComment)
    : undefined;

  return {
    id: row.id as string,
    projectId: row.project_id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    assignedTo: row.assigned_to as string,
    dueDate: (row.due_date as string) ?? undefined,
    progress: row.progress as number,
    createdAt: row.created_at as string,
    updates,
    comments,
  };
}

export const taskRepository = {
  async list(): Promise<Task[]> {
    if (DEMO_MODE) return [...DEMO_TASKS];
    const { data, error } = await supabase
      .from("task")
      .select(TASK_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(dbToTask);
  },

  async listByProject(projectId: string): Promise<Task[]> {
    if (DEMO_MODE) return DEMO_TASKS.filter((t) => t.projectId === projectId);
    const { data, error } = await supabase
      .from("task")
      .select(TASK_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(dbToTask);
  },

  async get(id: string): Promise<Task | null> {
    if (DEMO_MODE) return DEMO_TASKS.find((t) => t.id === id) ?? null;
    const { data, error } = await supabase
      .from("task")
      .select(TASK_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToTask(data) : null;
  },

  async create(input: Omit<Task, "id" | "createdAt" | "updates" | "progress" | "status">): Promise<Task> {
    const { data, error } = await supabase
      .from("task")
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigned_to: input.assignedTo,
        due_date: input.dueDate ?? null,
      })
      .select(TASK_SELECT)
      .single();
    if (error) throw error;
    return dbToTask(data);
  },

  async update(id: string, input: Partial<Omit<Task, "id" | "createdAt" | "updates">>): Promise<Task> {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
    if (input.dueDate !== undefined) patch.due_date = input.dueDate;
    if (input.progress !== undefined) patch.progress = input.progress;

    const { data, error } = await supabase
      .from("task")
      .update(patch)
      .eq("id", id)
      .select(TASK_SELECT)
      .single();
    if (error) throw error;
    return dbToTask(data);
  },

  async addUpdate(input: Omit<TaskUpdate, "id" | "createdAt">): Promise<TaskUpdate> {
    const { data, error } = await supabase
      .from("task_update")
      .insert({
        task_id: input.taskId,
        submitted_by: input.submittedBy,
        content: input.content,
        progress_after: input.progressAfter,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToTaskUpdate(data);
  },

  async addComment(input: { taskId: string; authorId?: string; authorName: string; body: string }): Promise<TaskComment> {
    const { data, error } = await supabase
      .from("task_comment")
      .insert({
        task_id: input.taskId,
        author_id: input.authorId ?? null,
        author_name: input.authorName,
        body: input.body,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToTaskComment(data);
  },
};
