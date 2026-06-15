import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useProjects } from "@/hooks/useProjects";

export const Route = createFileRoute("/daily-logs/")({
  head: () => ({ meta: [{ title: "יומני עבודה - מהיסוד" }] }),
  component: DailyLogsList,
});

function DailyLogsList() {
  const { data: dailyLogs = [], isLoading } = useDailyLogs();
  const { data: projects = [] } = useProjects();

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">יומני עבודה</h1>
          <p className="text-sm text-muted-foreground">כל הדיווחים היומיים מהשטח</p>
        </div>
        <Button asChild><Link to="/daily-logs/new"><Plus className="ml-2 h-4 w-4" />יומן חדש</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{isLoading ? "טוען..." : `${dailyLogs.length} יומנים`}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>פרויקט</TableHead>
                <TableHead>שעות עבודה</TableHead>
                <TableHead>מזג אוויר</TableHead>
                <TableHead>הוגש ע״י</TableHead>
                <TableHead>קבלנים</TableHead>
                <TableHead>תמונות</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyLogs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link to="/daily-logs/$logId" params={{ logId: l.id }} className="font-medium hover:underline">{l.date}</Link>
                      {l.date === today && <Badge className="bg-success text-success-foreground">היום</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{projectName(l.projectId)}</TableCell>
                  <TableCell>{l.workHours}</TableCell>
                  <TableCell className="text-muted-foreground">{l.weather}</TableCell>
                  <TableCell>{l.submittedBy}</TableCell>
                  <TableCell>{l.contractors.length}</TableCell>
                  <TableCell>{l.photos.length}</TableCell>
                  <TableCell><Button size="sm" variant="outline" asChild><Link to="/daily-logs/$logId" params={{ logId: l.id }}>צפייה</Link></Button></TableCell>
                </TableRow>
              ))}
              {!isLoading && dailyLogs.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-6 text-center text-muted-foreground">אין יומנים</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
