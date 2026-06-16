import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, AlertTriangle, Ban, GitBranch, FileText, Plus, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasLogToday, lastLogDate } from "@/lib/mock-data";
import {
  ProjectStatusBadge,
  IssueStatusBadge,
  SeverityBadge,
  BlockerStatusBadge,
  DecisionStatusBadge,
  ReportStatusBadge,
} from "@/components/StatusBadges";
import { useProject } from "@/hooks/useProjects";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useIssues } from "@/hooks/useIssues";
import { useBlockers } from "@/hooks/useBlockers";
import { useDecisions } from "@/hooks/useDecisions";
import { useReports } from "@/hooks/useReports";
import { DEMO_MODE } from "@/lib/demo-mode";
import { DEMO_PHOTOS } from "@/lib/demo-data";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({ meta: [{ title: "פרויקט - מהיסוד" }] }),
  component: ProjectDetail,
  notFoundComponent: () => <div className="text-center text-muted-foreground">הפרויקט לא נמצא</div>,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading } = useProject(projectId);
  const { data: dailyLogs = [] } = useDailyLogs({ projectId });
  const { data: issues = [] } = useIssues({ projectId });
  const { data: blockers = [] } = useBlockers({ projectId });
  const { data: decisions = [] } = useDecisions({ projectId });
  const { data: reports = [] } = useReports({ projectId });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">טוען...</div>;
  if (!project) throw notFound();

  const pLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
  const latestLog = pLogs[0];
  const openBlockers = blockers.filter((b) => b.status !== "resolved");
  const openIssues = issues.filter((i) => i.status !== "closed" && i.status !== "resolved");
  const pendingDec = decisions.filter((d) => d.status === "pending");
  const missing = !hasLogToday(projectId, dailyLogs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost">
            <Link to="/projects"><ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.address} · {project.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          <Button asChild>
            <Link to="/daily-logs/new" search={{ projectId } as never}>➕ יומן חדש</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">מנהל פרויקט</p><p className="mt-1 font-semibold">{project.manager}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">תאריך התחלה</p><p className="mt-1 font-semibold">{project.startDate}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">תאריך יעד</p><p className="mt-1 font-semibold">{project.targetDate}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">יומן אחרון</p><p className="mt-1 font-semibold">{lastLogDate(projectId, dailyLogs) ?? "—"}</p></CardContent></Card>
      </div>

      {missing && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">אין יומן עבודה לתאריך היום</p>
              <p className="text-sm text-muted-foreground">יש להגיש יומן ביצוע יומי לפרויקט.</p>
            </div>
            <Button className="ms-auto" asChild><Link to="/daily-logs/new" search={{ projectId } as never}>הגש יומן</Link></Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="logs"><ClipboardList className="ml-2 h-4 w-4" />יומנים ({pLogs.length})</TabsTrigger>
          <TabsTrigger value="issues"><AlertTriangle className="ml-2 h-4 w-4" />ליקויים ({issues.length})</TabsTrigger>
          <TabsTrigger value="blockers"><Ban className="ml-2 h-4 w-4" />חסמים ({blockers.length})</TabsTrigger>
          <TabsTrigger value="decisions"><GitBranch className="ml-2 h-4 w-4" />החלטות ({decisions.length})</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="ml-2 h-4 w-4" />דוחות ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {latestLog ? (
            <Card>
              <CardHeader><CardTitle>יומן אחרון · {latestLog.date}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div><span className="text-muted-foreground">שעות:</span> {latestLog.workHours}</div>
                  <div><span className="text-muted-foreground">מזג אוויר:</span> {latestLog.weather}</div>
                  <div><span className="text-muted-foreground">הוגש ע״י:</span> {latestLog.submittedBy}</div>
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">תיאור עבודה</p>
                  <ol className="list-decimal space-y-1 pr-5 text-sm">
                    {latestLog.workDescription.map((w, i) => <li key={i}>{w}</li>)}
                  </ol>
                </div>
                {latestLog.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {latestLog.photos.slice(0, 3).map((p) => (
                      <img key={p.id} src={p.url} alt={p.caption} className="h-24 w-full rounded object-cover" />
                    ))}
                  </div>
                )}
                <Button variant="outline" asChild size="sm"><Link to="/daily-logs/$logId" params={{ logId: latestLog.id }}>צפייה ביומן המלא</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-6 text-center text-muted-foreground">לא הוגשו יומנים לפרויקט</CardContent></Card>
          )}

          {DEMO_MODE && (() => {
            const projectPhotos = DEMO_PHOTOS.filter((p) => p.projectId === projectId)
              .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
              .slice(0, 6);
            return projectPhotos.length > 0 ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    תמונות אחרונות מהאתר
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/daily-logs">כל התמונות</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {projectPhotos.map((photo) => (
                      <div key={photo.id} className="group relative overflow-hidden rounded-lg border">
                        <img src={photo.fileUrl} alt={photo.caption} className="h-28 w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="p-2 text-xs font-medium text-white leading-tight">{photo.caption}</p>
                        </div>
                        <span className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-xs font-medium ${
                          photo.category === "ליקוי" ? "bg-red-500 text-white" :
                          photo.category === "חסם" ? "bg-orange-500 text-white" :
                          photo.category === "התקדמות" ? "bg-green-500 text-white" :
                          "bg-blue-500 text-white"
                        }`}>{photo.category}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">חסמים פתוחים</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {openBlockers.length === 0 ? <p className="text-sm text-muted-foreground">אין</p> :
                  openBlockers.map((b) => (
                    <div key={b.id} className="flex items-start justify-between gap-2 rounded border p-2 text-sm">
                      <span>{b.title}</span>
                      <SeverityBadge severity={b.priority} />
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">החלטות ממתינות</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pendingDec.length === 0 ? <p className="text-sm text-muted-foreground">אין</p> :
                  pendingDec.map((d) => (
                    <div key={d.id} className="rounded border p-2 text-sm">
                      <div className="font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">החלטה ע״י {d.owner}</div>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">ליקויים פתוחים</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {openIssues.length === 0 ? <p className="text-sm text-muted-foreground">אין</p> :
                  openIssues.slice(0, 5).map((i) => (
                    <div key={i.id} className="flex items-start justify-between gap-2 rounded border p-2 text-sm">
                      <span>{i.title}</span>
                      <SeverityBadge severity={i.severity} />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>יומני עבודה</CardTitle>
              <Button size="sm" asChild><Link to="/daily-logs/new" search={{ projectId } as never}><Plus className="ml-2 h-4 w-4" />יומן חדש</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead><TableHead>שעות</TableHead><TableHead>מזג אוויר</TableHead>
                    <TableHead>הוגש ע״י</TableHead><TableHead>אירועים חריגים</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pLogs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell><Link to="/daily-logs/$logId" params={{ logId: l.id }} className="font-medium hover:underline">{l.date}</Link></TableCell>
                      <TableCell>{l.workHours}</TableCell>
                      <TableCell className="text-muted-foreground">{l.weather}</TableCell>
                      <TableCell>{l.submittedBy}</TableCell>
                      <TableCell className="text-muted-foreground">{l.exceptionalEvents}</TableCell>
                    </TableRow>
                  ))}
                  {pLogs.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">אין יומנים</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <SimpleList rows={issues.map((i) => ({
            id: i.id, title: i.title, sub: `${i.location} · ${i.responsibleContractor}`,
            right: <div className="flex gap-1"><SeverityBadge severity={i.severity} /><IssueStatusBadge status={i.status} /></div>
          }))} empty="אין ליקויים" />
        </TabsContent>

        <TabsContent value="blockers">
          <SimpleList rows={blockers.map((b) => ({
            id: b.id, title: b.title, sub: b.impact,
            right: <div className="flex gap-1"><SeverityBadge severity={b.priority} /><BlockerStatusBadge status={b.status} /></div>
          }))} empty="אין חסמים" />
        </TabsContent>

        <TabsContent value="decisions">
          <SimpleList rows={decisions.map((d) => ({
            id: d.id, title: d.title, sub: `נדרש: ${d.requestedBy} · החלטה: ${d.owner}`,
            right: <DecisionStatusBadge status={d.status} />
          }))} empty="אין החלטות" />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>תאריך</TableHead><TableHead>סוג</TableHead><TableHead>סטטוס</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                      <TableCell><Button size="sm" variant="outline" asChild><Link to="/reports/$reportId" params={{ reportId: r.id }}>צפייה</Link></Button></TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">אין דוחות</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SimpleList({ rows, empty }: { rows: { id: string; title: string; sub: string; right: React.ReactNode }[]; empty: string }) {
  if (rows.length === 0) return <Card><CardContent className="p-6 text-center text-muted-foreground">{empty}</CardContent></Card>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-muted-foreground">{r.sub}</div>
            </div>
            {r.right}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
