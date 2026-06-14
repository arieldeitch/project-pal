import { createFileRoute } from "@tanstack/react-router";
import { Building2, FolderKanban, ListTodo, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, projectStatusLabel, taskStatusLabel } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/executive")({
  head: () => ({
    meta: [
      { title: "דשבורד הנהלה - מהיסוד PM" },
      { name: "description", content: "סקירת הנהלה - אתרים, פרויקטים ומשימות" },
    ],
  }),
  component: Executive,
});

const projectColors = ["#6366f1", "#22c55e", "#f59e0b", "#94a3b8"];
const taskColors = ["#94a3b8", "#3b82f6", "#22c55e"];

function Executive() {
  const { sites, projects, tasks, reports } = useStore();
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  const projectsByStatus = (["planning", "active", "on_hold", "completed"] as const).map((s) => ({
    name: projectStatusLabel[s],
    value: projects.filter((p) => p.status === s).length,
  }));
  const tasksByStatus = (["open", "in_progress", "done"] as const).map((s) => ({
    name: taskStatusLabel[s],
    value: tasks.filter((t) => t.status === s).length,
  }));
  const recentReports = [...reports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">דשבורד הנהלה</h1>
          <p className="text-sm text-muted-foreground">סקירה ארגונית</p>
        </div>
        <Button variant="outline" onClick={() => toast.info("ייצוא ל-Excel יתווסף בקרוב")}>
          <Download className="ml-2 h-4 w-4" />ייצוא ל-Excel
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div><p className="text-sm text-muted-foreground">אתרים</p><p className="mt-1 text-3xl font-bold">{sites.length}</p></div>
            <Building2 className="h-10 w-10 text-primary/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div><p className="text-sm text-muted-foreground">פרויקטים</p><p className="mt-1 text-3xl font-bold">{projects.length}</p></div>
            <FolderKanban className="h-10 w-10 text-info/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div><p className="text-sm text-muted-foreground">משימות</p><p className="mt-1 text-3xl font-bold">{tasks.length}</p></div>
            <ListTodo className="h-10 w-10 text-warning/40" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>פרויקטים לפי סטטוס</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectsByStatus}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {projectsByStatus.map((_, i) => <Cell key={i} fill={projectColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>משימות לפי סטטוס</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tasksByStatus}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {tasksByStatus.map((_, i) => <Cell key={i} fill={taskColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>דוחות אחרונים</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>פרויקט</TableHead>
                <TableHead>מגיש</TableHead>
                <TableHead>תוכן</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-medium">{projectName(r.projectId)}</TableCell>
                  <TableCell>{r.submittedBy}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">{r.text}</TableCell>
                </TableRow>
              ))}
              {recentReports.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">אין דוחות</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
