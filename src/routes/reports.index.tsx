import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, store, reportTypeLabel } from "@/lib/mock-data";
import { ReportStatusBadge } from "@/components/StatusBadges";
import { Download, Send, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/")({
  head: () => ({ meta: [{ title: "דוחות - מהיסוד" }] }),
  component: ReportsList,
});

function ReportsList() {
  const { reports, projects } = useStore();
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";
  const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">דוחות</h1>
        <p className="text-sm text-muted-foreground">דוחות אוטומטיים מיומני העבודה</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead><TableHead>סוג</TableHead><TableHead>פרויקט</TableHead>
                <TableHead>נוצר</TableHead><TableHead>נשלח</TableHead><TableHead>סטטוס</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link to="/reports/$reportId" params={{ reportId: r.id }} className="font-medium hover:underline">{r.date}</Link></TableCell>
                  <TableCell>{reportTypeLabel[r.type]}</TableCell>
                  <TableCell>{projectName(r.projectId)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.createdAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.sentAt?.slice(0, 10) ?? "—"}</TableCell>
                  <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild><Link to="/reports/$reportId" params={{ reportId: r.id }}><Download className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => toast.info("ייצוא Excel - בפיתוח")}><FileSpreadsheet className="h-4 w-4" /></Button>
                      {r.status !== "sent" && (
                        <Button size="icon" variant="ghost" onClick={() => { store.markReportSent(r.id); toast.success("הדוח סומן כנשלח"); }}><Send className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
