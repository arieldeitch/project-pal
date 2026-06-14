import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, AlertTriangle, Ban, GitBranch, FolderKanban, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useStore, hasLogToday, lastLogDate } from "@/lib/mock-data";
import { ProjectStatusBadge, IssueStatusBadge, BlockerStatusBadge, SeverityBadge } from "@/components/StatusBadges";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "דשבורד תפעולי - מהיסוד" }] }),
  component: Dashboard,
});

function StatCard({ title, value, icon: Icon, tone, hint }: { title: string; value: number; icon: any; tone: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { projects, dailyLogs, issues, blockers, decisions } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = projects.filter((p) => p.status === "active");
  const logsToday = dailyLogs.filter((l) => l.date === today);
  const missingToday = activeProjects.filter((p) => !hasLogToday(p.id, dailyLogs));
  const openIssues = issues.filter((i) => i.status !== "resolved" && i.status !== "closed");
  const openBlockers = blockers.filter((b) => b.status !== "resolved");
  const pendingDecisions = decisions.filter((d) => d.status === "pending");
  const recentLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">דשבורד תפעולי</h1>
          <p className="text-sm text-muted-foreground">מה קורה היום בכל האתרים</p>
        </div>
        <Button asChild>
          <Link to="/daily-logs/new">➕ יומן חדש</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="פרויקטים פעילים" value={activeProjects.length} icon={FolderKanban} tone="bg-info/15 text-info" />
        <StatCard title="יומנים היום" value={logsToday.length} icon={ClipboardList} tone="bg-success/15 text-success" />
        <StatCard title="יומנים חסרים" value={missingToday.length} icon={FileWarning} tone="bg-destructive/15 text-destructive" hint="פרויקטים ללא יומן היום" />
        <StatCard title="ליקויים פתוחים" value={openIssues.length} icon={AlertTriangle} tone="bg-warning/15 text-warning" />
        <StatCard title="חסמים פתוחים" value={openBlockers.length} icon={Ban} tone="bg-destructive/15 text-destructive" />
        <StatCard title="החלטות ממתינות" value={pendingDecisions.length} icon={GitBranch} tone="bg-warning/15 text-warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>יומנים אחרונים</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פרויקט</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>הוגש ע״י</TableHead>
                  <TableHead>שעות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Link to="/daily-logs/$logId" params={{ logId: l.id }} className="font-medium hover:underline">
                        {projectName(l.projectId)}
                      </Link>
                    </TableCell>
                    <TableCell>{l.date}</TableCell>
                    <TableCell>{l.submittedBy}</TableCell>
                    <TableCell className="text-muted-foreground">{l.workHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>פרויקטים ללא יומן היום</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פרויקט</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>יומן אחרון</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingToday.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="font-medium hover:underline">{p.name}</Link>
                    </TableCell>
                    <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{lastLogDate(p.id, dailyLogs) ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {missingToday.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">כל הפרויקטים עדכניים 🎉</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>פריטים קריטיים פתוחים</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סוג</TableHead>
                <TableHead>פרויקט</TableHead>
                <TableHead>כותרת</TableHead>
                <TableHead>חומרה</TableHead>
                <TableHead>סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.filter((i) => i.severity === "critical" && i.status !== "closed").map((i) => (
                <TableRow key={i.id}>
                  <TableCell>ליקוי</TableCell>
                  <TableCell>{projectName(i.projectId)}</TableCell>
                  <TableCell className="font-medium">{i.title}</TableCell>
                  <TableCell><SeverityBadge severity={i.severity} /></TableCell>
                  <TableCell><IssueStatusBadge status={i.status} /></TableCell>
                </TableRow>
              ))}
              {blockers.filter((b) => b.priority === "critical" && b.status !== "resolved").map((b) => (
                <TableRow key={b.id}>
                  <TableCell>חסם</TableCell>
                  <TableCell>{projectName(b.projectId)}</TableCell>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell><SeverityBadge severity={b.priority} /></TableCell>
                  <TableCell><BlockerStatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
