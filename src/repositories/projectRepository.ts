import { supabase } from "@/lib/supabase";
import type { Project, ProjectStatus } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_PROJECTS } from "@/lib/demo-data";

function dbToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    siteId: (row.site_id as string) ?? undefined,
    name: row.name as string,
    address: row.address as string,
    client: row.client as string,
    manager: row.manager as string,
    status: row.status as ProjectStatus,
    startDate: row.start_date as string,
    targetDate: row.target_date as string,
  };
}

export const projectRepository = {
  async list(): Promise<Project[]> {
    if (DEMO_MODE) return [...DEMO_PROJECTS];
    const { data, error } = await supabase
      .from("project")
      .select("*")
      .order("name");
    if (error) throw error;
    return data.map(dbToProject);
  },

  async get(id: string): Promise<Project | null> {
    if (DEMO_MODE) return DEMO_PROJECTS.find((p) => p.id === id) ?? null;
    const { data, error } = await supabase
      .from("project")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToProject(data) : null;
  },

  async create(input: Omit<Project, "id">): Promise<Project> {
    const { data, error } = await supabase
      .from("project")
      .insert({
        name: input.name,
        address: input.address,
        client: input.client,
        manager: input.manager,
        status: input.status,
        start_date: input.startDate,
        target_date: input.targetDate,
        site_id: input.siteId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToProject(data);
  },

  async update(id: string, input: Partial<Omit<Project, "id">>): Promise<Project> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.address !== undefined) patch.address = input.address;
    if (input.client !== undefined) patch.client = input.client;
    if (input.manager !== undefined) patch.manager = input.manager;
    if (input.status !== undefined) patch.status = input.status;
    if (input.startDate !== undefined) patch.start_date = input.startDate;
    if (input.targetDate !== undefined) patch.target_date = input.targetDate;
    if (input.siteId !== undefined) patch.site_id = input.siteId ?? null;

    const { data, error } = await supabase
      .from("project")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return dbToProject(data);
  },
};
