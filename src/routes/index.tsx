import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FolderKanban, ListTodo, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/mock-data";
import { ProjectStatusBadge, TaskStatusBadge } from "@/components/StatusBadges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "דשבורד - מהיסוד PM" },
      { name: "description", content: "סקירה כללית של אתרים, פרויקטים ומשימות" },
    ],
  }),
  component: Dashboard,
});

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: any; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { sites, projects, tasks, reports } = useStore();
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const recentProjects = projects.slice(-5).reverse();
  const recentTasks = tasks.slice(-5).reverse();
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">דשבורד</h1>
        <p className="text-sm text-muted-foreground">סקירה כללית של הפעילות</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="סך אתרים" value={sites.length} icon={Building2} tone="bg-primary/10 text-primary" />
        <StatCard title="פרויקטים פעילים" value={activeProjects} icon={FolderKanban} tone="bg-info/10 text-info" />
        <StatCard title="משימות פתוחות" value={openTasks} icon={ListTodo} tone="bg-warning/10 text-warning" />
        <StatCard title="דוחות שהוגשו" value={reports.length} icon={FileText} tone="bg-success/10 text-success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>פרויקטים אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>אתר</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>{siteName(p.siteId)}</TableCell>
                    <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>משימות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>פרויקט</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{projectName(t.projectId)}</TableCell>
                    <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
