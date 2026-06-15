import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, User, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTask, useAddTaskUpdate, useAddTaskComment } from "@/hooks/useTasks";
import { useSession } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { taskStatusLabel, taskPriorityLabel } from "@/lib/mock-data";
import type { TaskStatus, TaskPriority } from "@/lib/mock-data";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskDetailPage,
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

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const { data: task, isLoading, error } = useTask(taskId);
  const { data: projects } = useProjects();
  const addUpdate = useAddTaskUpdate();
  const addComment = useAddTaskComment();
  const { session } = useSession();

  const [updateForm, setUpdateForm] = useState({ submittedBy: session?.user?.email ?? "", content: "", progressAfter: 0 });
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [commentBody, setCommentBody] = useState("");

  if (isLoading) return <p className="text-sm text-muted-foreground">טוען משימה...</p>;
  if (error || !task) throw notFound();

  const project = projects?.find((p) => p.id === task.projectId);

  function handleSubmitUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updateForm.submittedBy || !updateForm.content) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    addUpdate.mutate(
      { taskId: task!.id, ...updateForm },
      {
        onSuccess: () => {
          toast.success("העדכון נשמר בהצלחה");
          setShowUpdateForm(false);
          setUpdateForm({ submittedBy: session?.user?.email ?? "", content: "", progressAfter: task!.progress });
        },
        onError: () => toast.error("שגיאה בשמירת העדכון"),
      },
    );
  }

  const sortedUpdates = [...(task.updates ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const sortedComments = [...(task.comments ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    addComment.mutate(
      {
        taskId: task!.id,
        authorId: session?.user?.id,
        authorName: session?.user?.email ?? "מנהל",
        body: commentBody.trim(),
      },
      {
        onSuccess: () => { toast.success("ההערה נשמרה"); setCommentBody(""); },
        onError: () => toast.error("שגיאה בשמירת ההערה"),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tasks" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
          {project && (
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="text-sm text-primary hover:underline"
            >
              {project.name}
            </Link>
          )}
        </div>
        <div className="flex-shrink-0 space-y-1 text-right">
          <span className={`block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status]}`}>
            {taskStatusLabel[task.status]}
          </span>
          <span className={`block rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
            {taskPriorityLabel[task.priority]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-4">
          {task.description && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 text-sm font-semibold">תיאור</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Progress */}
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">התקדמות</h2>
              <span className="text-2xl font-bold text-foreground">{task.progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Updates */}
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">עדכוני ביצוע ({sortedUpdates.length})</h2>
              <button
                onClick={() => {
                  setUpdateForm((f) => ({ ...f, progressAfter: task.progress }));
                  setShowUpdateForm(true);
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                הוסף עדכון
              </button>
            </div>

            {showUpdateForm && (
              <form onSubmit={handleSubmitUpdate} className="mb-4 space-y-3 rounded-md border bg-muted/30 p-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">שם המגיש *</label>
                  <input
                    required
                    value={updateForm.submittedBy}
                    onChange={(e) => setUpdateForm({ ...updateForm, submittedBy: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">תוכן העדכון *</label>
                  <textarea
                    required
                    rows={3}
                    value={updateForm.content}
                    onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">התקדמות לאחר העדכון ({updateForm.progressAfter}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={updateForm.progressAfter}
                    onChange={(e) => setUpdateForm({ ...updateForm, progressAfter: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={addUpdate.isPending}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {addUpdate.isPending ? "שומר..." : "שמור עדכון"}
                  </button>
                </div>
              </form>
            )}

            {!sortedUpdates.length ? (
              <p className="text-sm text-muted-foreground">אין עדכונים עדיין</p>
            ) : (
              <ul className="space-y-3">
                {sortedUpdates.map((u) => (
                  <li key={u.id} className="border-r-2 border-primary pr-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{u.submittedBy}</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(u.createdAt).toLocaleString("he-IL")}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {u.progressAfter}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{u.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Management Comments */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold">הערות הנהלה ({sortedComments.length})</h2>

            {sortedComments.length > 0 && (
              <ul className="mb-4 space-y-3">
                {sortedComments.map((c) => (
                  <li key={c.id} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-medium">{c.authorName}</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(c.createdAt).toLocaleString("he-IL")}</span>
                    </div>
                    <p className="text-sm text-foreground">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddComment} className="space-y-2">
              <textarea
                rows={2}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="הוסף הערת הנהלה..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addComment.isPending || !commentBody.trim()}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {addComment.isPending ? "שומר..." : "הוסף הערה"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Meta */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">פרטים</h2>
            <dl className="space-y-2 text-sm">
              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">אחראי</dt>
                    <dd className="font-medium">{task.assignedTo}</dd>
                  </div>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">תאריך יעד</dt>
                    <dd className="font-medium">{task.dueDate}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">נוצר</dt>
                  <dd className="font-medium">{new Date(task.createdAt).toLocaleDateString("he-IL")}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
