import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { lastLogDate } from "@/lib/mock-data";
import { ProjectStatusBadge } from "@/components/StatusBadges";
import { useProjects } from "@/hooks/useProjects";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useIssues } from "@/hooks/useIssues";
import { useBlockers } from "@/hooks/useBlockers";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "פרויקטים - מהיסוד" }] }),
  component: ProjectsList,
});

function ProjectsList() {
  const { data: projects = [] } = useProjects();
  const { data: dailyLogs = [] } = useDailyLogs();
  const { data: issues = [] } = useIssues();
  const { data: blockers = [] } = useBlockers();

  const openIssues = (pid: string) =>
    issues.filter((i) => i.projectId === pid && i.status !== "closed" && i.status !== "resolved").length;
  const openBlockers = (pid: string) =>
    blockers.filter((b) => b.projectId === pid && b.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">פרויקטים</h1>
        <p className="text-sm text-muted-foreground">סקירת כל פרויקטי הבנייה</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{projects.length} פרויקטים</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם הפרויקט</TableHead>
                <TableHead>כתובת</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>מנהל פרויקט</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>יומן אחרון</TableHead>
                <TableHead>ליקויים</TableHead>
                <TableHead>חסמים</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link to="/projects/$projectId" params={{ projectId: p.id }} className="font-medium hover:underline">{p.name}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.address}</TableCell>
                  <TableCell>{p.client}</TableCell>
                  <TableCell>{p.manager}</TableCell>
                  <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{lastLogDate(p.id, dailyLogs) ?? "—"}</TableCell>
                  <TableCell>{openIssues(p.id)}</TableCell>
                  <TableCell>{openBlockers(p.id)}</TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-6 text-center text-muted-foreground">אין פרויקטים</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
