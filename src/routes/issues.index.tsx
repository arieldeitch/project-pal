import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { IssueStatus, Severity, Issue } from "@/lib/mock-data";
import { IssueStatusBadge, SeverityBadge } from "@/components/StatusBadges";
import { MessageSquare, MapPin, Plus, Pencil, ChevronDown, ChevronUp, Send } from "lucide-react";
import { toast } from "sonner";
import { useIssues, useCreateIssue, useUpdateIssue, useAddIssueComment } from "@/hooks/useIssues";
import { useSession } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";

export const Route = createFileRoute("/issues/")({
  head: () => ({ meta: [{ title: "ליקויים - מהיסוד" }] }),
  component: IssuesPage,
});

function IssueComments({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const addComment = useAddIssueComment();
  const { session } = useSession();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    addComment.mutate(
      { issueId: issue.id, author: session?.user?.email ?? "מנהל", body: body.trim() },
      {
        onSuccess: () => { toast.success("ההערה נשמרה"); setBody(""); },
        onError: () => toast.error("שגיאה בשמירת ההערה"),
      },
    );
  }

  return (
    <div className="border-t pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {issue.comments.length} הערות
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {issue.comments.map((c) => (
            <div key={c.id} className="rounded bg-muted/50 px-2 py-1.5 text-xs">
              <span className="font-medium">{c.author}</span>
              <span className="mx-1 text-muted-foreground">·</span>
              <span className="text-muted-foreground">{c.date}</span>
              <p className="mt-0.5 text-foreground">{c.text}</p>
            </div>
          ))}
          <form onSubmit={handleSubmit} className="flex gap-1">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="הוסף הערה..."
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={addComment.isPending || !body.trim()}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function IssuesPage() {
  const { data: issues = [] } = useIssues();
  const { data: projects = [] } = useProjects();
  const updateIssue = useUpdateIssue();
  const [filter, setFilter] = useState<"all" | "open" | "critical">("all");

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";
  const filtered = issues.filter((i) => {
    if (filter === "open") return i.status !== "closed" && i.status !== "resolved";
    if (filter === "critical") return i.severity === "critical";
    return true;
  });

  const toggleResolve = (i: Issue) => {
    updateIssue.mutate(
      { id: i.id, data: { status: i.status === "resolved" ? "reopened" : "resolved" } },
      { onSuccess: () => toast.success("עודכן"), onError: () => toast.error("שגיאה בעדכון") }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ליקויים</h1>
          <p className="text-sm text-muted-foreground">פאנץ׳ ליסט וליקויי איכות</p>
        </div>
        <IssueDialog trigger={<Button><Plus className="ml-2 h-4 w-4" />ליקוי חדש</Button>} />
      </div>

      <div className="flex gap-2">
        {(["all", "open", "critical"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "הכל" : f === "open" ? "פתוחים" : "קריטיים"}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((i) => (
          <Card key={i.id}>
            <CardContent className="space-y-3 p-4">
              {i.photos[0] && <img src={i.photos[0].url} alt="" className="h-32 w-full rounded object-cover" />}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{i.title}</h3>
                <SeverityBadge severity={i.severity} />
              </div>
              <p className="text-sm text-muted-foreground">{i.description}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{projectName(i.projectId)}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{i.location}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{i.comments.length}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <IssueStatusBadge status={i.status} />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggleResolve(i)} disabled={updateIssue.isPending}>
                    {i.status === "resolved" ? "פתח מחדש" : "סמן כטופל"}
                  </Button>
                  <IssueDialog issue={i} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                </div>
              </div>
              <IssueComments issue={i} />
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-12 text-center text-muted-foreground">אין ליקויים</div>
        )}
      </div>
    </div>
  );
}

function IssueDialog({ trigger, issue }: { trigger: React.ReactNode; issue?: Issue }) {
  const { data: projects = [] } = useProjects();
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(issue?.projectId ?? projects[0]?.id ?? "");
  const [title, setTitle] = useState(issue?.title ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [location, setLocation] = useState(issue?.location ?? "");
  const [responsibleContractor, setResp] = useState(issue?.responsibleContractor ?? "");
  const [assignedTo, setAssigned] = useState(issue?.assignedTo ?? "");
  const [dueDate, setDueDate] = useState(issue?.dueDate ?? "");
  const [severity, setSeverity] = useState<Severity>(issue?.severity ?? "medium");
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "open");

  const submit = () => {
    if (!title.trim()) return toast.error("יש להזין כותרת");
    const data = { projectId, title, description, location, responsibleContractor, assignedTo, dueDate, severity, status };
    if (issue) {
      updateIssue.mutate(
        { id: issue.id, data },
        { onSuccess: () => { toast.success("עודכן"); setOpen(false); }, onError: () => toast.error("שגיאה") }
      );
    } else {
      createIssue.mutate(data, {
        onSuccess: () => { toast.success("נוצר"); setOpen(false); },
        onError: () => toast.error("שגיאה"),
      });
    }
  };

  const isPending = createIssue.isPending || updateIssue.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{issue ? "עריכת ליקוי" : "ליקוי חדש"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>פרויקט</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>כותרת</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>תיאור</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>מיקום</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div><Label>קבלן אחראי</Label><Input value={responsibleContractor} onChange={(e) => setResp(e.target.value)} /></div>
          <div><Label>אחראי טיפול</Label><Input value={assignedTo} onChange={(e) => setAssigned(e.target.value)} /></div>
          <div><Label>תאריך יעד</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div>
            <Label>חומרה</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">נמוך</SelectItem><SelectItem value="medium">בינוני</SelectItem>
                <SelectItem value="high">גבוה</SelectItem><SelectItem value="critical">קריטי</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">פתוח</SelectItem><SelectItem value="in_progress">בטיפול</SelectItem>
                <SelectItem value="resolved">טופל</SelectItem><SelectItem value="reopened">נפתח מחדש</SelectItem>
                <SelectItem value="closed">סגור</SelectItem>
              </SelectContent>
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
