import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportTypeLabel, reportStatusLabel } from "@/lib/mock-data";
import { ReportStatusBadge } from "@/components/StatusBadges";
import { Download, Send, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useReports, useMarkReportSent } from "@/hooks/useReports";
import { useProjects } from "@/hooks/useProjects";
import { useDailyLogs } from "@/hooks/useDailyLogs";
import { downloadCsv } from "@/lib/csv-export";

export const Route = createFileRoute("/reports/")({
  head: () => ({ meta: [{ title: "דוחות - מהיסוד" }] }),
  component: ReportsList,
});

const REPORT_HEADERS = ["תאריך", "סוג", "פרויקט", "סטטוס", "נוצר", "נשלח"];

function ReportsList() {
  const { data: reports = [] } = useReports();
  const { data: projects = [] } = useProjects();
  const { data: dailyLogs = [] } = useDailyLogs();
  const markSent = useMarkReportSent();

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";
  const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));

  function exportAllReports() {
    if (!sorted.length) { toast.info("אין דוחות לייצוא"); return; }
    const rows = sorted.map((r) => [
      r.date,
      reportTypeLabel[r.type],
      projectName(r.projectId),
      reportStatusLabel[r.status],
      r.createdAt.slice(0, 10),
      r.sentAt?.slice(0, 10) ?? "",
    ]);
    downloadCsv("mehayesod-reports.csv", REPORT_HEADERS, rows);
    toast.success("הדוחות יוצאו ל-CSV");
  }

  function exportDailyLog(reportId: string, reportDate: string, projectId: string) {
    const report = reports.find((r) => r.id === reportId);
    if (!report?.dailyLogId) {
      toast.info("אין יומן עבודה מקושר לדוח זה");
      return;
    }
    const log = dailyLogs.find((l) => l.id === report.dailyLogId);
    if (!log) {
      toast.info("יומן העבודה לא נטען עדיין");
      return;
    }
    const pName = projectName(projectId);
    const headers = ["תאריך", "פרויקט", "שעות עבודה", "מזג אוויר", "הוגש ע״י", "אירועים חריגים", "הערות קבלן", "תיאור עבודה"];
    const rows = [[
      log.date,
      pName,
      log.workHours,
      log.weather,
      log.submittedBy,
      log.exceptionalEvents,
      log.contractorNotes,
      log.workDescription.join(" | "),
    ]];
    // Add contractor rows as separate section
    if (log.contractors.length) {
      rows.push([]); // blank separator
      rows.push(["--- קבלנים ---"] as unknown as unknown[]);
      const contractorHeaders = ["קבלן", "ענף", "עובדים", "הערות"];
      rows.push(contractorHeaders as unknown[]);
      log.contractors.forEach((c) => rows.push([c.contractor, c.trade, c.workers, c.notes]));
    }
    if (log.equipment.length) {
      rows.push([]);
      rows.push(["--- ציוד ---"] as unknown as unknown[]);
      rows.push(["שם", "כמות", "הערות"] as unknown[]);
      log.equipment.forEach((e) => rows.push([e.name, e.quantity, e.notes]));
    }
    downloadCsv(`report-${reportDate}-${pName}.csv`, headers, rows);
    toast.success("יומן העבודה יוצא ל-CSV (פתח ב-Excel)");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">דוחות</h1>
          <p className="text-sm text-muted-foreground">דוחות אוטומטיים מיומני העבודה</p>
        </div>
        <Button onClick={exportAllReports} variant="outline" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          ייצוא כל הדוחות
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>פרויקט</TableHead>
                <TableHead>נוצר</TableHead>
                <TableHead>נשלח</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to="/reports/$reportId" params={{ reportId: r.id }} className="font-medium hover:underline">
                      {r.date}
                    </Link>
                  </TableCell>
                  <TableCell>{reportTypeLabel[r.type]}</TableCell>
                  <TableCell>{projectName(r.projectId)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.createdAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.sentAt?.slice(0, 10) ?? "—"}</TableCell>
                  <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild>
                        <Link to="/reports/$reportId" params={{ reportId: r.id }}>
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="ייצוא ל-Excel (CSV)"
                        onClick={() => exportDailyLog(r.id, r.date, r.projectId)}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      {r.status !== "sent" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={markSent.isPending}
                          onClick={() =>
                            markSent.mutate(r.id, {
                              onSuccess: () => toast.success("הדוח סומן כנשלח"),
                              onError: () => toast.error("שגיאה"),
                            })
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">אין דוחות</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
