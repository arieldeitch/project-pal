import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BlockerStatus, Severity, Blocker } from "@/lib/mock-data";
import { BlockerStatusBadge, SeverityBadge } from "@/components/StatusBadges";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useBlockers, useCreateBlocker, useUpdateBlocker } from "@/hooks/useBlockers";
import { useProjects } from "@/hooks/useProjects";

export const Route = createFileRoute("/blockers/")({
  head: () => ({ meta: [{ title: "חסמים - מהיסוד" }] }),
  component: BlockersPage,
});

function BlockersPage() {
  const { data: blockers = [] } = useBlockers();
  const { data: projects = [] } = useProjects();
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">חסמים</h1>
          <p className="text-sm text-muted-foreground">פריטים המעכבים את התקדמות הפרויקטים</p>
        </div>
        <BlockerDialog trigger={<Button><Plus className="ml-2 h-4 w-4" />חסם חדש</Button>} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פרויקט</TableHead><TableHead>כותרת</TableHead><TableHead>השפעה</TableHead>
                <TableHead>אחראי</TableHead><TableHead>יעד</TableHead><TableHead>עדיפות</TableHead>
                <TableHead>סטטוס</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockers.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{projectName(b.projectId)}</TableCell>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell className="text-muted-foreground">{b.impact}</TableCell>
                  <TableCell>{b.responsible}</TableCell>
                  <TableCell>{b.dueDate}</TableCell>
                  <TableCell><SeverityBadge severity={b.priority} /></TableCell>
                  <TableCell><BlockerStatusBadge status={b.status} /></TableCell>
                  <TableCell><BlockerDialog blocker={b} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} /></TableCell>
                </TableRow>
              ))}
              {blockers.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-6 text-center text-muted-foreground">אין חסמים</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BlockerDialog({ trigger, blocker }: { trigger: React.ReactNode; blocker?: Blocker }) {
  const { data: projects = [] } = useProjects();
  const createBlocker = useCreateBlocker();
  const updateBlocker = useUpdateBlocker();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(blocker?.projectId ?? projects[0]?.id ?? "");
  const [title, setTitle] = useState(blocker?.title ?? "");
  const [description, setDescription] = useState(blocker?.description ?? "");
  const [impact, setImpact] = useState(blocker?.impact ?? "");
  const [responsible, setResp] = useState(blocker?.responsible ?? "");
  const [dueDate, setDueDate] = useState(blocker?.dueDate ?? "");
  const [status, setStatus] = useState<BlockerStatus>(blocker?.status ?? "open");
  const [priority, setPriority] = useState<Severity>(blocker?.priority ?? "high");

  const submit = () => {
    if (!title.trim()) return toast.error("יש להזין כותרת");
    const data = { projectId, title, description, impact, responsible, dueDate, status, priority };
    if (blocker) {
      updateBlocker.mutate(
        { id: blocker.id, data },
        { onSuccess: () => { toast.success("עודכן"); setOpen(false); }, onError: () => toast.error("שגיאה") }
      );
    } else {
      createBlocker.mutate(data, {
        onSuccess: () => { toast.success("נוצר"); setOpen(false); },
        onError: () => toast.error("שגיאה"),
      });
    }
  };

  const isPending = createBlocker.isPending || updateBlocker.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{blocker ? "עריכת חסם" : "חסם חדש"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>פרויקט</Label>
            <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>כותרת</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>תיאור</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>השפעה</Label><Input value={impact} onChange={(e) => setImpact(e.target.value)} /></div>
          <div><Label>אחראי</Label><Input value={responsible} onChange={(e) => setResp(e.target.value)} /></div>
          <div><Label>תאריך יעד</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div>
            <Label>עדיפות</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Severity)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="low">נמוך</SelectItem><SelectItem value="medium">בינוני</SelectItem><SelectItem value="high">גבוה</SelectItem><SelectItem value="critical">קריטי</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BlockerStatus)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="open">פתוח</SelectItem><SelectItem value="in_progress">בטיפול</SelectItem><SelectItem value="resolved">נפתר</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          <Button onClick={submit} disabled={isPending}>{isPending ? "שומר..." : "שמירה"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
