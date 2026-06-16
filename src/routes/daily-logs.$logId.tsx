import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText, Download, Send, Pencil, Camera, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDailyLog } from "@/hooks/useDailyLogs";
import { useProjects } from "@/hooks/useProjects";
import { useGenerateReport } from "@/hooks/useReports";
import { DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/daily-logs/$logId")({
  head: () => ({ meta: [{ title: "יומן - מהיסוד" }] }),
  component: DailyLogDetail,
  notFoundComponent: () => <div className="text-center text-muted-foreground">היומן לא נמצא</div>,
});

const DEMO_UPLOAD_SEEDS = [
  "https://picsum.photos/seed/log-upload-1/800/600",
  "https://picsum.photos/seed/log-upload-2/800/600",
  "https://picsum.photos/seed/log-upload-3/800/600",
];

interface QuickPhoto { id: string; url: string; caption: string; area: string }

function DailyLogDetail() {
  const { logId } = Route.useParams();
  const { data: log, isLoading } = useDailyLog(logId);
  const { data: projects = [] } = useProjects();
  const generateReport = useGenerateReport();
  const navigate = useNavigate();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [quickPhotos, setQuickPhotos] = useState<QuickPhoto[]>([]);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">טוען...</div>;
  if (!log) throw notFound();

  const project = projects.find((p) => p.id === log.projectId);
  const allPhotos = [...log.photos, ...quickPhotos];

  const handleQuickUpload = () => {
    if (allPhotos.length >= 10) { toast.error("הגעת למקסימום 10 תמונות"); return; }
    if (DEMO_MODE) {
      const seed = DEMO_UPLOAD_SEEDS[quickPhotos.length % DEMO_UPLOAD_SEEDS.length];
      setQuickPhotos((prev) => [...prev, { id: `qp-${Date.now()}`, url: seed, caption: "", area: "שטח" }]);
      toast.success("תמונה נוספה בהצלחה");
    }
  };

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            גלריית תמונות
            {allPhotos.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-normal text-muted-foreground">
                {allPhotos.length}
              </span>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleQuickUpload} className="gap-1.5">
            <Upload className="h-4 w-4" />
            העלאת תמונה
          </Button>
        </CardHeader>
        <CardContent>
          {allPhotos.length === 0 ? (
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10 py-14 text-center transition-colors hover:border-primary/40 hover:bg-muted/20"
              onClick={handleQuickUpload}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">אין תמונות ביומן זה</p>
                <p className="text-sm text-muted-foreground">לחץ להוספת תמונה מהשטח</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {allPhotos.map((p, idx) => (
                <div
                  key={p.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border bg-muted/20 transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30"
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img src={p.url} alt={p.caption} className="h-40 w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="p-2">
                    <p className="truncate text-sm font-medium">{p.caption || "ללא כיתוב"}</p>
                    <p className="truncate text-xs text-muted-foreground">{log.date} · {p.area}</p>
                  </div>
                </div>
              ))}
              {allPhotos.length < 10 && (
                <div
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 h-[8.5rem] text-center transition-colors hover:border-primary/40 hover:bg-muted/20"
                  onClick={handleQuickUpload}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">הוסף תמונה</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {lightboxIndex !== null && (
        <Dialog open onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
            <div className="relative flex flex-col">
              <button
                className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="h-4 w-4" />
              </button>
              {lightboxIndex > 0 && (
                <button
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  onClick={() => setLightboxIndex((i) => (i! > 0 ? i! - 1 : i))}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              {lightboxIndex < allPhotos.length - 1 && (
                <button
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  onClick={() => setLightboxIndex((i) => (i! < allPhotos.length - 1 ? i! + 1 : i))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <img
                src={allPhotos[lightboxIndex].url}
                alt={allPhotos[lightboxIndex].caption}
                className="max-h-[75vh] w-full object-contain"
              />
              <div className="p-4 text-white">
                <p className="font-semibold">{allPhotos[lightboxIndex].caption || "ללא כיתוב"}</p>
                <p className="text-sm text-white/60">{log.date} · {allPhotos[lightboxIndex].area}</p>
                <p className="mt-1 text-xs text-white/40">{lightboxIndex + 1} / {allPhotos.length}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
