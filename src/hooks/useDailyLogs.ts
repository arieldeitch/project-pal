import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyLogRepository, type CreateDailyLogInput } from "@/repositories/dailyLogRepository";

const KEYS = {
  all: (filter?: { projectId?: string }) => ["dailyLogs", filter ?? null] as const,
  detail: (id: string) => ["dailyLogs", id] as const,
};

export function useDailyLogs(filter?: { projectId?: string }) {
  return useQuery({
    queryKey: KEYS.all(filter),
    queryFn: () => dailyLogRepository.list(filter),
  });
}

export function useDailyLog(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => dailyLogRepository.get(id),
    enabled: !!id,
  });
}

export function useCreateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDailyLogInput) => dailyLogRepository.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailyLogs"] });
    },
  });
}
