import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileText, Download, Send, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useDailyLog } from "@/hooks/useDailyLogs";
import { useProjects } from "@/hooks/useProjects";
import { useGenerateReport } from "@/hooks/useReports";

export const Route = createFileRoute("/daily-logs/$logId")({
  head: () => ({ meta: [{ title: "יומן - מהיסוד" }] }),
  component: DailyLogDetail,
  notFoundComponent: () => <div className="text-center text-muted-foreground">היומן לא נמצא</div>,
});

function DailyLogDetail() {
  const { logId } = Route.useParams();
  const { data: log, isLoading } = useDailyLog(logId);
  const { data: projects = [] } = useProjects();
  const generateReport = useGenerateReport();
  const navigate = useNavigate();

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">טוען...</div>;
  if (!log) throw notFound();

  const project = projects.find((p) => p.id === log.projectId);

  const generate = async () => {
    try {
      const report = await generateReport.mutateAsync({
        logId: log.id,
        projectId: log.projectId,
        date: log.date,
      });
      toast.success("דוח נוצר");
      navigate({ to: "/reports/$reportId", params: { reportId: report.id } });
    } catch {
      toast.error("שגיאה ביצירת הדוח");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost"><Link to="/daily-logs"><ArrowRight className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">יומן עבודה · {log.date}</h1>
            <p className="text-sm text-muted-foreground">{project?.name} · {project?.address}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline"><Pencil className="ml-2 h-4 w-4" />עריכה</Button>
          <Button onClick={generate} disabled={generateReport.isPending}>
            <FileText className="ml-2 h-4 w-4" />צור דוח
          </Button>
          <Button variant="outline" onClick={() => toast.info("ייצוא PDF - בפיתוח")}><Download className="ml-2 h-4 w-4" />PDF</Button>
          <Button variant="outline" onClick={() => toast.info("שליחה ללקוח — תכונה זו בפיתוח")}><Send className="ml-2 h-4 w-4" />שליחה ללקוח</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">תאריך</p><p className="mt-1 font-semibold">{log.date}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">שעות עבודה</p><p className="mt-1 font-semibold">{log.workHours}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">מזג אוויר</p><p className="mt-1 font-semibold">{log.weather}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">הוגש ע״י</p><p className="mt-1 font-semibold">{log.submittedBy}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>אירועים חריגים</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{log.exceptionalEvents}</p></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>קבלנים וכוח אדם</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>קבלן</TableHead><TableHead>מקצוע</TableHead><TableHead>עובדים</TableHead><TableHead>הערות</TableHead></TableRow></TableHeader>
            <TableBody>
              {log.contractors.map((c) => (
                <TableRow key={c.id}><TableCell>{c.contractor}</TableCell><TableCell>{c.trade}</TableCell><TableCell>{c.workers}</TableCell><TableCell className="text-muted-foreground">{c.notes}</TableCell></TableRow>
              ))}
              {log.contractors.length === 0 && <TableRow><TableCell colSpan={4} className="py-4 text-center text-muted-foreground">אין קבלנים</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ציוד</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>ציוד</TableHead><TableHead>כמות</TableHead><TableHead>הערות</TableHead></TableRow></TableHeader>
            <TableBody>
              {log.equipment.map((e) => (
                <TableRow key={e.id}><TableCell>{e.name}</TableCell><TableCell>{e.quantity}</TableCell><TableCell className="text-muted-foreground">{e.notes}</TableCell></TableRow>
              ))}
              {log.equipment.length === 0 && <TableRow><TableCell colSpan={3} className="py-4 text-center text-muted-foreground">אין ציוד</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>תיאור עבודה</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pr-5 text-sm">
            {log.workDescription.map((w, i) => <li key={i}>{w}</li>)}
          </ol>
          {log.workDescription.length === 0 && <p className="text-sm text-muted-foreground">אין תיאור עבודה</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>הערות קבלן</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{log.contractorNotes}</p></CardContent>
      </Card>

      {log.photos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>גלריית תמונות ({log.photos.length})</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {log.photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-lg border">
                <img src={p.url} alt={p.caption} className="h-48 w-full object-cover" />
                <div className="p-2">
                  <p className="text-sm font-medium">{p.caption || "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.area} {p.workItem && `· ${p.workItem}`}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
