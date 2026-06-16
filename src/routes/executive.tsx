import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasLogToday, severityLabel, blockerStatusLabel, issueStatusLabel } from "@/lib/mock-data";
import { ProjectStatusBadge, SeverityBadge, BlockerStatusBadge, IssueStatusBadge, DecisionStatusBadge, ReportStatusBadge } from "@/components/StatusBadges";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FolderKanban, ClipboardList, FileWarning, AlertTriangle, AlertOctagon, Ban, GitBranch, Send, Camera } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useIssues } from "@/hooks/useIssues";
import { useBlockers } from "@/hooks/useBlockers";
import { useDecisions } from "@/hooks/useDecisions";
import { useReports } from "@/hooks/useReports";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_PHOTOS } from "@/lib/demo-data";

export const Route = createFileRoute("/executive")({
  head: () => ({ meta: [{ title: "דשבורד הנהלה - מהיסוד" }] }),
  component: Executive,
});

const PALETTE = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function Stat({ title, value, icon: Icon, tone }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div><p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}

function Executive() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: dailyLogs = [], isLoading: loadingLogs } = useDailyLogs();
  const { data: issues = [] } = useIssues();
  const { data: blockers = [] } = useBlockers();
  const { data: decisions = [] } = useDecisions();
  const { data: reports = [] } = useReports();

  if (loadingProjects || loadingLogs) return <div className="py-16 text-center text-muted-foreground">טוען נתונים...</div>;

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();

  const active = projects.filter((p) => p.status === "active");
  const logsToday = dailyLogs.filter((l) => l.date === today);
  const missingToday = active.filter((p) => !hasLogToday(p.id, dailyLogs));
  const openIssues = issues.filter((i) => i.status !== "closed" && i.status !== "resolved");
  const criticalIssues = issues.filter((i) => i.severity === "critical" && i.status !== "closed");
  const openBlockers = blockers.filter((b) => b.status !== "resolved");
  const pendingDecisions = decisions.filter((d) => d.status === "pending");
  const reportsThisWeek = reports.filter((r) => r.sentAt && r.sentAt.slice(0, 10) >= weekAgo);

  const issueByStatus = (Object.keys(issueStatusLabel) as Array<keyof typeof issueStatusLabel>).map((s) => ({
    name: issueStatusLabel[s], value: issues.filter((i) => i.status === s).length,
  }));
  const blockerByPriority = (["low", "medium", "high", "critical"] as const).map((p) => ({
    name: severityLabel[p], value: blockers.filter((b) => b.priority === p).length,
  }));
  const logsByProject = projects.map((p) => ({ name: p.name.slice(0, 12), value: dailyLogs.filter((l) => l.projectId === p.id).length }));

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">דשבורד הנהלה</h1>
        <p className="text-sm text-muted-foreground">שקיפות מלאה על מצב הביצוע בשטח</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Stat title="פרויקטים פעילים" value={active.length} icon={FolderKanban} tone="bg-info/15 text-info" />
        <Stat title="יומנים היום" value={logsToday.length} icon={ClipboardList} tone="bg-success/15 text-success" />
        <Stat title="יומנים חסרים" value={missingToday.length} icon={FileWarning} tone="bg-destructive/15 text-destructive" />
        <Stat title="ליקויים פתוחים" value={openIssues.length} icon={AlertTriangle} tone="bg-warning/15 text-warning" />
        <Stat title="ליקויים קריטיים" value={criticalIssues.length} icon={AlertOctagon} tone="bg-destructive/15 text-destructive" />
        <Stat title="חסמים פתוחים" value={openBlockers.length} icon={Ban} tone="bg-destructive/15 text-destructive" />
        <Stat title="החלטות ממתינות" value={pendingDecisions.length} icon={GitBranch} tone="bg-warning/15 text-warning" />
        <Stat title="דוחות נשלחו השבוע" value={reportsThisWeek.length} icon={Send} tone="bg-success/15 text-success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>ליקויים לפי סטטוס</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={issueByStatus} dataKey="value" nameKey="name" outerRadius={80} label>
                  {issueByStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>חסמים לפי עדיפות</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={blockerByPriority}>
                <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="value" fill={PALETTE[3]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>יומנים לפי פרויקט</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={logsByProject}>
                <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="value" fill={PALETTE[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>פרויקטים ללא יומן היום</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>פרויקט</TableHead><TableHead>מנהל</TableHead><TableHead>סטטוס</TableHead></TableRow></TableHeader>
              <TableBody>
                {missingToday.map((p) => (
                  <TableRow key={p.id}><TableCell><Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">{p.name}</Link></TableCell><TableCell>{p.manager}</TableCell><TableCell><ProjectStatusBadge status={p.status} /></TableCell></TableRow>
                ))}
                {missingToday.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">הכל מעודכן</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ליקויים קריטיים פתוחים</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>פרויקט</TableHead><TableHead>כותרת</TableHead><TableHead>סטטוס</TableHead></TableRow></TableHeader>
              <TableBody>
                {criticalIssues.map((i) => (
                  <TableRow key={i.id}><TableCell>{projectName(i.projectId)}</TableCell><TableCell className="font-medium">{i.title}</TableCell><TableCell><IssueStatusBadge status={i.status} /></TableCell></TableRow>
                ))}
                {criticalIssues.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">אין</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>חסמים פתוחים</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>פרויקט</TableHead><TableHead>כותרת</TableHead><TableHead>עדיפות</TableHead><TableHead>סטטוס</TableHead></TableRow></TableHeader>
              <TableBody>
                {openBlockers.map((b) => (
                  <TableRow key={b.id}><TableCell>{projectName(b.projectId)}</TableCell><TableCell className="font-medium">{b.title}</TableCell><TableCell><SeverityBadge severity={b.priority} /></TableCell><TableCell><BlockerStatusBadge status={b.status} /></TableCell></TableRow>
                ))}
                {openBlockers.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">אין</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>החלטות ממתינות</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>פרויקט</TableHead><TableHead>נושא</TableHead><TableHead>החלטה ע״י</TableHead><TableHead>סטטוס</TableHead></TableRow></TableHeader>
              <TableBody>
                {pendingDecisions.map((d) => (
                  <TableRow key={d.id}><TableCell>{projectName(d.projectId)}</TableCell><TableCell className="font-medium">{d.title}</TableCell><TableCell>{d.owner}</TableCell><TableCell><DecisionStatusBadge status={d.status} /></TableCell></TableRow>
                ))}
                {pendingDecisions.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">אין</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>דוחות אחרונים</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>תאריך</TableHead><TableHead>פרויקט</TableHead><TableHead>סטטוס</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...reports].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((r) => (
                <TableRow key={r.id}><TableCell><Link to="/reports/$reportId" params={{ reportId: r.id }} className="hover:underline">{r.date}</Link></TableCell><TableCell>{projectName(r.projectId)}</TableCell><TableCell><ReportStatusBadge status={r.status} /></TableCell></TableRow>
              ))}
              {reports.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">אין דוחות</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {DEMO_MODE && (() => {
        const latest = [...DEMO_PHOTOS]
          .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
          .slice(0, 4);
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
                תמונות אחרונות מהשטח
              </CardTitle>
              <span className="text-xs text-muted-foreground">עדכון חי מהשטח</span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {latest.map((photo) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-lg border">
                    <img src={photo.fileUrl} alt={photo.caption} className="h-36 w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2">
                      <p className="text-xs font-medium text-white leading-tight">{photo.caption}</p>
                      <p className="mt-0.5 text-xs text-white/70">{projectName(photo.projectId)}</p>
                    </div>
                    <span className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-xs font-medium ${
                      photo.category === "ליקוי" ? "bg-red-500/90 text-white" :
                      photo.category === "חסם" ? "bg-orange-500/90 text-white" :
                      photo.category === "התקדמות" ? "bg-green-500/90 text-white" :
                      photo.category === "איכות" ? "bg-purple-500/90 text-white" :
                      "bg-blue-500/90 text-white"
                    }`}>{photo.category}</span>
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground">{photo.uploadedAt.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
