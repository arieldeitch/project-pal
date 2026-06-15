import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { issueRepository, type CreateIssueInput } from "@/repositories/issueRepository";
import type { IssueStatus } from "@/lib/mock-data";

const KEYS = {
  all: (filter?: { projectId?: string }) => ["issues", filter ?? null] as const,
};

export function useIssues(filter?: { projectId?: string }) {
  return useQuery({
    queryKey: KEYS.all(filter),
    queryFn: () => issueRepository.list(filter),
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => issueRepository.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateIssueInput & { status: IssueStatus }>;
    }) => issueRepository.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}

export function useAddIssueComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, author, body }: { issueId: string; author: string; body: string }) =>
      issueRepository.addComment(issueId, author, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}
