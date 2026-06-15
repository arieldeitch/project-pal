import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskRepository } from "@/repositories/taskRepository";
import type { Task, TaskUpdate } from "@/lib/mock-data";

const KEYS = {
  all: ["tasks"] as const,
  byProject: (projectId: string) => ["tasks", "project", projectId] as const,
  detail: (id: string) => ["tasks", id] as const,
};

export function useTasks() {
  return useQuery({ queryKey: KEYS.all, queryFn: taskRepository.list });
}

export function useTasksByProject(projectId: string) {
  return useQuery({
    queryKey: KEYS.byProject(projectId),
    queryFn: () => taskRepository.listByProject(projectId),
    enabled: Boolean(projectId),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => taskRepository.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Task, "id" | "createdAt" | "updates" | "progress" | "status">) =>
      taskRepository.create(input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.byProject(task.projectId) });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<Task, "id" | "createdAt" | "updates">>;
    }) => taskRepository.update(id, input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.byProject(task.projectId) });
      qc.invalidateQueries({ queryKey: KEYS.detail(task.id) });
    },
  });
}

export function useAddTaskUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<TaskUpdate, "id" | "createdAt">) => taskRepository.addUpdate(input),
    onSuccess: (update) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(update.taskId) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { taskId: string; authorId?: string; authorName: string; body: string }) =>
      taskRepository.addComment(input),
    onSuccess: (comment) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(comment.taskId) });
    },
  });
}
