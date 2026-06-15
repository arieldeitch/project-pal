import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Download, Send, FileSpreadsheet, HardHat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportTypeLabel } from "@/lib/mock-data";
import { ReportStatusBadge } from "@/components/StatusBadges";
import { toast } from "sonner";
import { useReportDetail, useMarkReportSent } from "@/hooks/useReports";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({ meta: [{ title: "דוח - מהיסוד" }] }),
  component: ReportDetail,
  notFoundComponent: () => <div className="text-center text-muted-foreground">הדוח לא נמצא</div>,
});

function ReportDetail() {
  const { reportId } = Route.useParams();
  const { data, isLoading } = useReportDetail(reportId);
  const markSent = useMarkReportSent();

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">טוען...</div>;
  if (!data) throw notFound();

  const { report, log, project } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost"><Link to="/reports"><ArrowRight className="h-4 w-4" /></Link></Button>
          <ReportStatusBadge status={report.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("ייצוא PDF - בפיתוח")}><Download className="ml-2 h-4 w-4" />PDF</Button>
          <Button variant="outline" onClick={() => toast.info("ייצוא Excel - בפיתוח")}><FileSpreadsheet className="ml-2 h-4 w-4" />Excel</Button>
          {report.status !== "sent" && (
            <Button
              disabled={markSent.isPending}
              onClick={() =>
                markSent.mutate(report.id, {
                  onSuccess: () => toast.success("הדוח סומן כנשלח"),
                  onError: () => toast.error("שגיאה"),
                })
              }
            >
              <Send className="ml-2 h-4 w-4" />סמן כנשלח
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-sidebar p-6 text-sidebar-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><HardHat className="h-6 w-6" /></div>
            <div>
              <p className="text-lg font-bold">מהיסוד ניהול פרויקטים</p>
              <p className="text-xs opacity-70">דוח {reportTypeLabel[report.type]} · {report.date}</p>
            </div>
          </div>
          <div className="text-left text-xs opacity-80">
            <p>מספר דוח: #{report.id.slice(0, 6).toUpperCase()}</p>
            <p>נוצר: {report.createdAt.slice(0, 10)}</p>
          </div>
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div><p className="text-xs text-muted-foreground">פרויקט</p><p className="font-semibold">{project?.name}</p></div>
            <div><p className="text-xs text-muted-foreground">כתובת</p><p className="font-semibold">{project?.address}</p></div>
            <div><p className="text-xs text-muted-foreground">לקוח</p><p className="font-semibold">{project?.client}</p></div>
          </div>

          {log ? (
            <>
              <div className="grid gap-3 md:grid-cols-4 text-sm">
                <div><p className="text-xs text-muted-foreground">תאריך</p><p className="font-semibold">{log.date}</p></div>
                <div><p className="text-xs text-muted-foreground">שעות עבודה</p><p className="font-semibold">{log.workHours}</p></div>
                <div><p className="text-xs text-muted-foreground">מזג אוויר</p><p className="font-semibold">{log.weather}</p></div>
                <div><p className="text-xs text-muted-foreground">מגיש</p><p className="font-semibold">{log.submittedBy}</p></div>
              </div>

              <Section title="תיאור עבודה">
                <ol className="list-decimal space-y-1 pr-5 text-sm">
                  {log.workDescription.map((w, i) => <li key={i}>{w}</li>)}
                </ol>
              </Section>

              <Section title="קבלנים וכוח אדם">
                <Table>
                  <TableHeader><TableRow><TableHead>קבלן</TableHead><TableHead>מקצוע</TableHead><TableHead>עובדים</TableHead><TableHead>הערות</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {log.contractors.map((c) => (
                      <TableRow key={c.id}><TableCell>{c.contractor}</TableCell><TableCell>{c.trade}</TableCell><TableCell>{c.workers}</TableCell><TableCell>{c.notes}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Section>

              <Section title="ציוד">
                <ul className="space-y-1 text-sm">
                  {log.equipment.map((e) => <li key={e.id}>• {e.name} ({e.quantity}) {e.notes && `– ${e.notes}`}</li>)}
                </ul>
              </Section>

              <Section title="אירועים חריגים"><p className="text-sm">{log.exceptionalEvents}</p></Section>
              <Section title="הערות קבלן"><p className="text-sm">{log.contractorNotes}</p></Section>

              {log.photos.length > 0 && (
                <Section title={`תיעוד צילומי (${log.photos.length})`}>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {log.photos.map((p) => (
                      <div key={p.id} className="overflow-hidden rounded border">
                        <img src={p.url} alt={p.caption} className="h-40 w-full object-cover" />
                        <div className="p-2 text-xs"><p className="font-medium">{p.caption}</p><p className="text-muted-foreground">{p.area}</p></div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground">היומן המקושר לא נמצא</p>
          )}

          <div className="border-t pt-4 text-center text-xs text-muted-foreground">
            דוח זה נוצר אוטומטית ע״י מערכת מהיסוד · {new Date().toLocaleDateString("he-IL")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 border-b pb-1 font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
