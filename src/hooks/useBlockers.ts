import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blockerRepository, type CreateBlockerInput } from "@/repositories/blockerRepository";

const KEYS = {
  all: (filter?: { projectId?: string }) => ["blockers", filter ?? null] as const,
};

export function useBlockers(filter?: { projectId?: string }) {
  return useQuery({
    queryKey: KEYS.all(filter),
    queryFn: () => blockerRepository.list(filter),
  });
}

export function useCreateBlocker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockerInput) => blockerRepository.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blockers"] }),
  });
}

export function useUpdateBlocker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBlockerInput> }) =>
      blockerRepository.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blockers"] }),
  });
}
