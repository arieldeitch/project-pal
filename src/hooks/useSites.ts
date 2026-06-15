import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { siteRepository } from "@/repositories/siteRepository";
import type { Site } from "@/lib/mock-data";

const KEYS = {
  all: ["sites"] as const,
  detail: (id: string) => ["sites", id] as const,
};

export function useSites() {
  return useQuery({ queryKey: KEYS.all, queryFn: siteRepository.list });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => siteRepository.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Site, "id" | "createdAt">) => siteRepository.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Site, "id" | "createdAt">> }) =>
      siteRepository.update(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}
