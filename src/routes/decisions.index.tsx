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
import { useStore, store, type DecisionStatus } from "@/lib/mock-data";
import { DecisionStatusBadge } from "@/components/StatusBadges";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/decisions/")({
  head: () => ({ meta: [{ title: "החלטות - מהיסוד" }] }),
  component: DecisionsPage,
});

function DecisionsPage() {
  const { decisions, projects } = useStore();
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">החלטות</h1>
          <p className="text-sm text-muted-foreground">החלטות הנהלה שנדרשות להתקדמות</p>
        </div>
        <DecisionDialog trigger={<Button><Plus className="ml-2 h-4 w-4" />החלטה חדשה</Button>} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פרויקט</TableHead><TableHead>נושא</TableHead>
                <TableHead>נדרש ע״י</TableHead><TableHead>בעל החלטה</TableHead>
                <TableHead>יעד</TableHead><TableHead>סטטוס</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decisions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{projectName(d.projectId)}</TableCell>
                  <TableCell><div className="font-medium">{d.title}</div><div className="text-xs text-muted-foreground">{d.description}</div></TableCell>
                  <TableCell>{d.requestedBy}</TableCell>
                  <TableCell>{d.owner}</TableCell>
                  <TableCell>{d.dueDate}</TableCell>
                  <TableCell><DecisionStatusBadge status={d.status} /></TableCell>
                  <TableCell><DecisionDialog decision={d} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionDialog({ trigger, decision }: { trigger: React.ReactNode; decision?: ReturnType<typeof useStore>["decisions"][number] }) {
  const { projects } = useStore();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(decision?.projectId ?? projects[0]?.id ?? "");
  const [title, setTitle] = useState(decision?.title ?? "");
  const [description, setDescription] = useState(decision?.description ?? "");
  const [requestedBy, setRq] = useState(decision?.requestedBy ?? "");
  const [owner, setOwner] = useState(decision?.owner ?? "");
  const [dueDate, setDueDate] = useState(decision?.dueDate ?? "");
  const [status, setStatus] = useState<DecisionStatus>(decision?.status ?? "pending");

  const submit = () => {
    if (!title.trim()) return toast.error("יש להזין נושא");
    if (decision) { store.updateDecision(decision.id, { projectId, title, description, requestedBy, owner, dueDate, status }); toast.success("עודכן"); }
    else { store.addDecision({ projectId, title, description, requestedBy, owner, dueDate, status }); toast.success("נוצר"); }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{decision ? "עריכת החלטה" : "החלטה חדשה"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>פרויקט</Label>
            <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>נושא</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>תיאור</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>נדרש ע״י</Label><Input value={requestedBy} onChange={(e) => setRq(e.target.value)} /></div>
          <div><Label>בעל החלטה</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          <div><Label>תאריך יעד</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DecisionStatus)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">ממתין</SelectItem><SelectItem value="approved">אושר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem><SelectItem value="deferred">נדחה לאחר זמן</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button><Button onClick={submit}>שמירה</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
