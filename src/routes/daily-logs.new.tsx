import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Plus, Trash2, Camera, X, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractorRow, EquipmentRow, PhotoCategory } from "@/lib/mock-data";
import { toast } from "sonner";
import { z } from "zod";
import { useProjects } from "@/hooks/useProjects";
import { useCreateDailyLog } from "@/hooks/useDailyLogs";
import { useSession } from "@/hooks/useAuth";
import { DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/daily-logs/new")({
  head: () => ({ meta: [{ title: "יומן חדש - מהיסוד" }] }),
  validateSearch: z.object({ projectId: z.string().optional() }),
  component: NewDailyLog,
});

const uid = () => Math.random().toString(36).slice(2, 10);

const PHOTO_CATEGORIES: PhotoCategory[] = ["התקדמות", "ביצוע", "איכות", "ליקוי", "חסם", "בקרה"];

const CATEGORY_COLORS: Record<PhotoCategory, string> = {
  "התקדמות": "bg-green-100 text-green-800",
  "ביצוע": "bg-blue-100 text-blue-800",
  "איכות": "bg-purple-100 text-purple-800",
  "ליקוי": "bg-red-100 text-red-800",
  "חסם": "bg-orange-100 text-orange-800",
  "בקרה": "bg-slate-100 text-slate-800",
};

interface UploadedPhoto {
  id: string;
  previewUrl: string;
  caption: string;
  category: PhotoCategory;
}

const DEMO_UPLOAD_SEEDS = [
  "https://picsum.photos/seed/upload-a1/400/300",
  "https://picsum.photos/seed/upload-b2/400/300",
  "https://picsum.photos/seed/upload-c3/400/300",
  "https://picsum.photos/seed/upload-d4/400/300",
  "https://picsum.photos/seed/upload-e5/400/300",
  "https://picsum.photos/seed/upload-f6/400/300",
  "https://picsum.photos/seed/upload-g7/400/300",
  "https://picsum.photos/seed/upload-h8/400/300",
  "https://picsum.photos/seed/upload-i9/400/300",
  "https://picsum.photos/seed/upload-j10/400/300",
];

function NewDailyLog() {
  const { data: projects = [] } = useProjects();
  const createLog = useCreateDailyLog();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { session } = useSession();

  const [projectId, setProjectId] = useState(search.projectId ?? projects[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [workHours, setWorkHours] = useState("07:00-15:00");
  const [weather, setWeather] = useState("חמים");
  const [submittedBy, setSubmittedBy] = useState(session?.user?.email ?? "");
  const [exceptionalEvents, setExceptionalEvents] = useState("אין");
  const [contractorNotes, setContractorNotes] = useState("אין");
  const [contractors, setContractors] = useState<ContractorRow[]>([
    { id: uid(), contractor: "", trade: "", workers: 1, notes: "" },
  ]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([
    { id: uid(), name: "", quantity: 1, notes: "" },
  ]);
  const [workDescription, setWorkDescription] = useState<string[]>([""]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>("ביצוע");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = () => {
    if (uploadedPhotos.length >= 10) {
      toast.error("הגעת למקסימום 10 תמונות");
      return;
    }
    if (DEMO_MODE) {
      const seed = DEMO_UPLOAD_SEEDS[uploadedPhotos.length % DEMO_UPLOAD_SEEDS.length];
      const newPhoto: UploadedPhoto = {
        id: uid(),
        previewUrl: seed,
        caption: "",
        category: selectedCategory,
      };
      setUploadedPhotos((prev) => [...prev, newPhoto]);
      toast.success("תמונה נוספה בהצלחה");
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handlePhotoUpload();
  };

  const removePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    setUploadedPhotos((prev) => prev.map((p) => p.id === id ? { ...p, caption } : p));
  };

  const submit = async () => {
    if (!projectId) return toast.error("יש לבחור פרויקט");
    if (!submittedBy.trim()) return toast.error("יש למלא מגיש");
    try {
      const log = await createLog.mutateAsync({
        projectId,
        date,
        workHours,
        weather,
        submittedBy,
        exceptionalEvents,
        contractorNotes,
        contractors: contractors
          .filter((c) => c.contractor.trim())
          .map(({ contractor, trade, workers, notes }) => ({ contractor, trade, workers, notes })),
        equipment: equipment
          .filter((e) => e.name.trim())
          .map(({ name, quantity, notes }) => ({ name, quantity, notes })),
        workDescription: workDescription.filter((w) => w.trim()),
      });
      toast.success("היומן נשמר");
      navigate({ to: "/daily-logs/$logId", params: { logId: log.id } });
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === "23505") {
        toast.error("כבר קיים יומן לתאריך זה בפרויקט זה");
      } else {
        toast.error("שגיאה בשמירת היומן");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">יומן עבודה חדש</h1>
        <p className="text-sm text-muted-foreground">דיווח יומי מהשטח</p>
      </div>

      <Card>
        <CardHeader><CardTitle>פרטי יום</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>פרויקט</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="בחר פרויקט" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>תאריך</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>שעות עבודה</Label><Input value={workHours} onChange={(e) => setWorkHours(e.target.value)} placeholder="07:00-15:00" /></div>
          <div><Label>מזג אוויר</Label><Input value={weather} onChange={(e) => setWeather(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>הוגש ע״י</Label><Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} placeholder="שם מנהל הפרויקט" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>אירועים חריגים</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={exceptionalEvents} onChange={(e) => setExceptionalEvents(e.target.value)} rows={2} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>קבלנים וכוח אדם</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setContractors([...contractors, { id: uid(), contractor: "", trade: "", workers: 1, notes: "" }])}><Plus className="ml-2 h-4 w-4" />הוסף</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {contractors.map((c, i) => (
            <div key={c.id} className="grid items-end gap-2 md:grid-cols-12">
              <div className="md:col-span-3"><Label>קבלן</Label><Input value={c.contractor} onChange={(e) => setContractors(contractors.map((x, j) => j === i ? { ...x, contractor: e.target.value } : x))} /></div>
              <div className="md:col-span-3"><Label>מקצוע</Label><Input value={c.trade} onChange={(e) => setContractors(contractors.map((x, j) => j === i ? { ...x, trade: e.target.value } : x))} placeholder='שלד / חשמל / צמ"ה' /></div>
              <div className="md:col-span-2"><Label>מס׳ עובדים</Label><Input type="number" value={c.workers} onChange={(e) => setContractors(contractors.map((x, j) => j === i ? { ...x, workers: +e.target.value } : x))} /></div>
              <div className="md:col-span-3"><Label>הערות</Label><Input value={c.notes} onChange={(e) => setContractors(contractors.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))} /></div>
              <Button size="icon" variant="ghost" onClick={() => setContractors(contractors.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ציוד</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEquipment([...equipment, { id: uid(), name: "", quantity: 1, notes: "" }])}><Plus className="ml-2 h-4 w-4" />הוסף</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipment.map((e, i) => (
            <div key={e.id} className="grid items-end gap-2 md:grid-cols-12">
              <div className="md:col-span-5"><Label>שם ציוד</Label><Input value={e.name} onChange={(ev) => setEquipment(equipment.map((x, j) => j === i ? { ...x, name: ev.target.value } : x))} placeholder="מיני מחפרון / בובקט / משאית מנוף" /></div>
              <div className="md:col-span-2"><Label>כמות</Label><Input type="number" value={e.quantity} onChange={(ev) => setEquipment(equipment.map((x, j) => j === i ? { ...x, quantity: +ev.target.value } : x))} /></div>
              <div className="md:col-span-4"><Label>הערות</Label><Input value={e.notes} onChange={(ev) => setEquipment(equipment.map((x, j) => j === i ? { ...x, notes: ev.target.value } : x))} /></div>
              <Button size="icon" variant="ghost" onClick={() => setEquipment(equipment.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>תיאור עבודה</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setWorkDescription([...workDescription, ""])}><Plus className="ml-2 h-4 w-4" />הוסף סעיף</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {workDescription.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
              <Input value={w} onChange={(e) => setWorkDescription(workDescription.map((x, j) => j === i ? e.target.value : x))} placeholder="לדוגמה: קשירת ברזל, יציקת בטון רזה" />
              <Button size="icon" variant="ghost" onClick={() => setWorkDescription(workDescription.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            תיעוד מצולם מהשטח
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            העלה תמונות מהעבודה שבוצעה היום, ליקויים, חסמים או אירועים חריגים.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">קטגוריה:</span>
            {PHOTO_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? CATEGORY_COLORS[cat] + " ring-2 ring-offset-1 ring-current"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
            onClick={handlePhotoUpload}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">העלאת תמונה</p>
              <p className="text-sm text-muted-foreground">לחץ לבחירת תמונה או גרור לכאן</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG · PNG · HEIC · עד 10 תמונות</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              className="hidden"
              multiple
              onChange={handlePhotoUpload}
            />
          </div>

          {uploadedPhotos.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">{uploadedPhotos.length} תמונות הועלו</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-lg border bg-card">
                    <img src={photo.previewUrl} alt="" className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <span className={`absolute left-1 top-1 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[photo.category]}`}>
                      {photo.category}
                    </span>
                    <div className="p-2">
                      <Input
                        value={photo.caption}
                        onChange={(e) => updateCaption(photo.id, e.target.value)}
                        placeholder="כיתוב (אופציונלי)"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>הערות קבלן</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={contractorNotes} onChange={(e) => setContractorNotes(e.target.value)} rows={2} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/daily-logs" })}>ביטול</Button>
        <Button onClick={submit} disabled={createLog.isPending}>
          {createLog.isPending ? "שומר..." : "שמור יומן"}
        </Button>
      </div>
    </div>
  );
}
