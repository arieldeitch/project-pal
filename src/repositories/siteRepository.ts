import { supabase } from "@/lib/supabase";
import type { Site, SiteStatus, SiteType } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_SITES } from "@/lib/demo-data";

function dbToSite(row: Record<string, unknown>): Site {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    type: row.type as SiteType,
    client: row.client as string,
    status: row.status as SiteStatus,
    startDate: (row.start_date as string) ?? undefined,
    targetDate: (row.target_date as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export const siteRepository = {
  async list(): Promise<Site[]> {
    if (DEMO_MODE) return [...DEMO_SITES];
    const { data, error } = await supabase
      .from("site")
      .select("*")
      .order("name");
    if (error) throw error;
    return data.map(dbToSite);
  },

  async get(id: string): Promise<Site | null> {
    if (DEMO_MODE) return DEMO_SITES.find((s) => s.id === id) ?? null;
    const { data, error } = await supabase
      .from("site")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToSite(data) : null;
  },

  async create(input: Omit<Site, "id" | "createdAt">): Promise<Site> {
    const { data, error } = await supabase
      .from("site")
      .insert({
        name: input.name,
        address: input.address,
        type: input.type,
        client: input.client,
        status: input.status,
        start_date: input.startDate ?? null,
        target_date: input.targetDate ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToSite(data);
  },

  async update(id: string, input: Partial<Omit<Site, "id" | "createdAt">>): Promise<Site> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.address !== undefined) patch.address = input.address;
    if (input.type !== undefined) patch.type = input.type;
    if (input.client !== undefined) patch.client = input.client;
    if (input.status !== undefined) patch.status = input.status;
    if (input.startDate !== undefined) patch.start_date = input.startDate;
    if (input.targetDate !== undefined) patch.target_date = input.targetDate;

    const { data, error } = await supabase
      .from("site")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return dbToSite(data);
  },
};
