import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Plus, ArrowRight, Pencil, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, store } from "@/lib/mock-data";
import { ProjectFormDialog, TaskFormDialog, ReportFormDialog } from "@/components/CrudDialogs";
import { ProjectStatusBadge, TaskStatusBadge } from "@/components/StatusBadges";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({ meta: [{ title: "פרויקט - מהיסוד PM" }] }),
  component: ProjectDetail,
  notFoundComponent: () => <div className="text-center text-muted-foreground">הפרויקט לא נמצא</div>,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { projects, sites, tasks, reports } = useStore();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();
  const site = sites.find((s) => s.id === project.siteId);
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectReports = reports.filter((r) => r.projectId === projectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost">
            <Link to="/sites/$siteId" params={{ siteId: project.siteId }}><ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{site?.name}</p>
          </div>
        </div>
        <ProjectFormDialog project={project} trigger={<Button variant="outline"><Pencil className="ml-2 h-4 w-4" />עריכה</Button>} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">סטטוס</p>
            <div className="mt-2"><ProjectStatusBadge status={project.status} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">תאריך יעד</p>
            <p className="mt-2 text-lg font-semibold">{project.dueDate || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">תיאור</p>
            <p className="mt-2 text-sm">{project.description || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">משימות ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="reports">דוחות ({projectReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>משימות</CardTitle>
              <TaskFormDialog projectId={projectId} trigger={<Button size="sm"><Plus className="ml-2 h-4 w-4" />משימה חדשה</Button>} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>כותרת</TableHead>
                    <TableHead>אחראי</TableHead>
                    <TableHead>תאריך יעד</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </TableCell>
                      <TableCell>{t.assignee}</TableCell>
                      <TableCell className="text-muted-foreground">{t.dueDate}</TableCell>
                      <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-end gap-1">
                          <TaskFormDialog task={t} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                          <Button size="icon" variant="ghost" onClick={() => { store.deleteTask(t.id); toast.success("המשימה נמחקה"); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {projectTasks.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">אין משימות</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>דוחות</CardTitle>
              <ReportFormDialog projectId={projectId} trigger={<Button size="sm"><FileText className="ml-2 h-4 w-4" />דוח חדש</Button>} />
            </CardHeader>
            <CardContent className="space-y-3">
              {projectReports.map((r) => (
                <Card key={r.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{r.submittedBy}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                      <div className="flex gap-1">
                        <ReportFormDialog report={r} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                        <Button size="icon" variant="ghost" onClick={() => { store.deleteReport(r.id); toast.success("הדוח נמחק"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{r.text}</p>
                    {r.comment && (
                      <div className="mt-3 rounded-md bg-accent/40 p-3 text-sm">
                        <p className="mb-1 text-xs font-semibold text-accent-foreground">הערת הנהלה</p>
                        <p>{r.comment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {projectReports.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">אין דוחות</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
