import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, CheckSquare, User, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { taskStatusLabel, taskPriorityLabel } from "@/lib/mock-data";
import type { TaskStatus, TaskPriority } from "@/lib/mock-data";

export const Route = createFileRoute("/tasks/")({
  component: TasksPage,
});

const statusColors: Record<TaskStatus, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
};

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks();
  const { data: projects } = useProjects();
  const createTask = useCreateTask();

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    assignedTo: "",
    dueDate: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) { toast.error("יש לבחור פרויקט"); return; }
    createTask.mutate(
      { ...form, dueDate: form.dueDate || undefined },
      {
        onSuccess: () => {
          toast.success("המשימה נוצרה בהצלחה");
          setShowForm(false);
          setForm({ projectId: "", title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" });
        },
        onError: () => toast.error("שגיאה ביצירת המשימה"),
      },
    );
  }

  const filtered = tasks?.filter((t) => filterStatus === "all" || t.status === filterStatus) ?? [];
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? id;

  if (isLoading) return <p className="text-sm text-muted-foreground">טוען משימות...</p>;
  if (error) return <p className="text-sm text-destructive">שגיאה בטעינת המשימות</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">משימות</h1>
          <p className="text-sm text-muted-foreground">{tasks?.length ?? 0} משימות במערכת</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          משימה חדשה
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {(["all", "not_started", "in_progress", "blocked", "completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? "הכל" : taskStatusLabel[s]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">משימה חדשה</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">פרויקט *</label>
              <select
                required
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- בחר פרויקט --</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">כותרת *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">תיאור</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">עדיפות</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {(Object.keys(taskPriorityLabel) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{taskPriorityLabel[p]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">אחראי</label>
              <input
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">תאריך יעד</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                dir="ltr"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={createTask.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {createTask.isPending ? "שומר..." : "שמור"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!filtered.length ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <CheckSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">אין משימות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Link
              key={task.id}
              to="/tasks/$taskId"
              params={{ taskId: task.id }}
              className="block rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status]}`}>
                      {taskStatusLabel[task.status]}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
                      {taskPriorityLabel[task.priority]}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-semibold text-foreground">{task.title}</h3>
                  <p className="text-xs text-muted-foreground">{projectName(task.projectId)}</p>
                </div>
                <div className="flex-shrink-0 text-left">
                  <div className="text-lg font-bold text-foreground">{task.progress}%</div>
                  <div className="h-1.5 w-20 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {task.assignedTo && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assignedTo}
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {task.dueDate}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
