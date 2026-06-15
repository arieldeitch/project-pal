import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { lastLogDate } from "@/lib/mock-data";
import { ProjectStatusBadge } from "@/components/StatusBadges";
import { useProjects, useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useIssues } from "@/hooks/useIssues";
import { useBlockers } from "@/hooks/useBlockers";
import { useSites } from "@/hooks/useSites";
import type { Project, ProjectStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "פרויקטים - מהיסוד" }] }),
  component: ProjectsList,
});

const STATUS_OPTIONS: ProjectStatus[] = ["planning", "active", "on_hold", "completed"];
const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "תכנון",
  active: "פעיל",
  on_hold: "מושהה",
  completed: "הושלם",
};

const EMPTY_FORM = {
  siteId: "",
  name: "",
  address: "",
  client: "",
  manager: "",
  status: "planning" as ProjectStatus,
  startDate: "",
  targetDate: "",
};

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  title,
}: {
  initial: typeof EMPTY_FORM;
  onSubmit: (f: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isPending: boolean;
  title: string;
}) {
  const { data: sites } = useSites();
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">אתר</label>
          <select
            value={form.siteId}
            onChange={(e) => set("siteId", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- ללא אתר --</option>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">סטטוס</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as ProjectStatus)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">שם הפרויקט *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">כתובת *</label>
          <input
            required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">לקוח *</label>
          <input
            required
            value={form.client}
            onChange={(e) => set("client", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">מנהל פרויקט *</label>
          <input
            required
            value={form.manager}
            onChange={(e) => set("manager", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">תאריך התחלה *</label>
          <input
            required
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">תאריך יעד *</label>
          <input
            required
            type="date"
            value={form.targetDate}
            onChange={(e) => set("targetDate", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            dir="ltr"
          />
        </div>
        <div className="col-span-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "שומר..." : "שמור"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProjectsList() {
  const { data: projects = [] } = useProjects();
  const { data: dailyLogs = [] } = useDailyLogs();
  const { data: issues = [] } = useIssues();
  const { data: blockers = [] } = useBlockers();
  const { data: sites = [] } = useSites();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const siteName = (id?: string) => id ? sites.find((s) => s.id === id)?.name : undefined;
  const openIssues = (pid: string) =>
    issues.filter((i) => i.projectId === pid && i.status !== "closed" && i.status !== "resolved").length;
  const openBlockers = (pid: string) =>
    blockers.filter((b) => b.projectId === pid && b.status !== "resolved").length;

  function handleCreate(form: typeof EMPTY_FORM) {
    createProject.mutate(
      {
        ...form,
        siteId: form.siteId || undefined,
      },
      {
        onSuccess: () => { toast.success("הפרויקט נוצר בהצלחה"); setShowCreate(false); },
        onError: () => toast.error("שגיאה ביצירת הפרויקט"),
      },
    );
  }

  function handleEdit(form: typeof EMPTY_FORM) {
    if (!editProject) return;
    updateProject.mutate(
      {
        id: editProject.id,
        data: { ...form, siteId: form.siteId || undefined },
      },
      {
        onSuccess: () => { toast.success("הפרויקט עודכן בהצלחה"); setEditProject(null); },
        onError: () => toast.error("שגיאה בעדכון הפרויקט"),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">פרויקטים</h1>
          <p className="text-sm text-muted-foreground">סקירת כל פרויקטי הבנייה</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          פרויקט חדש
        </button>
      </div>

      {showCreate && (
        <ProjectForm
          title="פרויקט חדש"
          initial={EMPTY_FORM}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          isPending={createProject.isPending}
        />
      )}

      {editProject && (
        <ProjectForm
          title={`עריכה: ${editProject.name}`}
          initial={{
            siteId: editProject.siteId ?? "",
            name: editProject.name,
            address: editProject.address,
            client: editProject.client,
            manager: editProject.manager,
            status: editProject.status,
            startDate: editProject.startDate,
            targetDate: editProject.targetDate,
          }}
          onSubmit={handleEdit}
          onCancel={() => setEditProject(null)}
          isPending={updateProject.isPending}
        />
      )}

      <Card>
        <CardHeader><CardTitle>{projects.length} פרויקטים</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם הפרויקט</TableHead>
                <TableHead>אתר</TableHead>
                <TableHead>כתובת</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>מנהל פרויקט</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>יומן אחרון</TableHead>
                <TableHead>ליקויים</TableHead>
                <TableHead>חסמים</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="font-medium hover:underline">{p.name}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.siteId ? (
                      <Link to="/sites/$siteId" params={{ siteId: p.siteId }} className="hover:underline text-primary">
                        {siteName(p.siteId) ?? "—"}
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.address}</TableCell>
                  <TableCell>{p.client}</TableCell>
                  <TableCell>{p.manager}</TableCell>
                  <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{lastLogDate(p.id, dailyLogs) ?? "—"}</TableCell>
                  <TableCell>{openIssues(p.id)}</TableCell>
                  <TableCell>{openBlockers(p.id)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setEditProject(p)}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="עריכה"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow><TableCell colSpan={10} className="py-6 text-center text-muted-foreground">אין פרויקטים</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
