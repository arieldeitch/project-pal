import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { decisionRepository, type CreateDecisionInput } from "@/repositories/decisionRepository";

const KEYS = {
  all: (filter?: { projectId?: string }) => ["decisions", filter ?? null] as const,
};

export function useDecisions(filter?: { projectId?: string }) {
  return useQuery({
    queryKey: KEYS.all(filter),
    queryFn: () => decisionRepository.list(filter),
  });
}

export function useCreateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDecisionInput) => decisionRepository.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decisions"] }),
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDecisionInput> }) =>
      decisionRepository.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decisions"] }),
  });
}
