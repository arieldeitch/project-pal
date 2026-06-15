import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportRepository } from "@/repositories/reportRepository";

const KEYS = {
  all: (filter?: { projectId?: string }) => ["reports", filter ?? null] as const,
  detail: (id: string) => ["reports", "detail", id] as const,
};

export function useReports(filter?: { projectId?: string }) {
  return useQuery({
    queryKey: KEYS.all(filter),
    queryFn: () => reportRepository.list(filter),
  });
}

export function useReportDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => reportRepository.getDetail(id),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      projectId,
      date,
    }: {
      logId: string;
      projectId: string;
      date: string;
    }) => reportRepository.generateFromLog(logId, projectId, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useMarkReportSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportRepository.markSent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
