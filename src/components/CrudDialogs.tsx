import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  store,
  type Site,
  type Project,
  type Task,
  type Report,
  type ProjectStatus,
  type TaskStatus,
} from "@/lib/mock-data";
import { toast } from "sonner";

function useDialogState() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

export function SiteFormDialog({ trigger, site }: { trigger: ReactNode; site?: Site }) {
  const { open, setOpen } = useDialogState();
  const [name, setName] = useState(site?.name ?? "");
  const [address, setAddress] = useState(site?.address ?? "");
  const [status, setStatus] = useState<Site["status"]>(site?.status ?? "active");

  const submit = () => {
    if (!name.trim()) return toast.error("יש להזין שם אתר");
    if (site) {
      store.updateSite(site.id, { name, address, status });
      toast.success("האתר עודכן");
    } else {
      store.addSite({ name, address, status });
      toast.success("האתר נוצר");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? "עריכת אתר" : "אתר חדש"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>שם אתר</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>כתובת</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Site["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="inactive">לא פעיל</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          <Button onClick={submit}>שמירה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectFormDialog({
  trigger,
  siteId,
  project,
}: {
  trigger: ReactNode;
  siteId?: string;
  project?: Project;
}) {
  const { open, setOpen } = useDialogState();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "planning");
  const [dueDate, setDueDate] = useState(project?.dueDate ?? "");

  const submit = () => {
    if (!name.trim()) return toast.error("יש להזין שם פרויקט");
    if (project) {
      store.updateProject(project.id, { name, description, status, dueDate });
      toast.success("הפרויקט עודכן");
    } else if (siteId) {
      store.addProject({ siteId, name, description, status, dueDate });
      toast.success("הפרויקט נוצר");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "עריכת פרויקט" : "פרויקט חדש"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>שם פרויקט</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>תיאור</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>סטטוס</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">תכנון</SelectItem>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="on_hold">מושהה</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך יעד</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          <Button onClick={submit}>שמירה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaskFormDialog({
  trigger,
  projectId,
  task,
}: {
  trigger: ReactNode;
  projectId?: string;
  task?: Task;
}) {
  const { open, setOpen } = useDialogState();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "open");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");

  const submit = () => {
    if (!title.trim()) return toast.error("יש להזין כותרת");
    if (task) {
      store.updateTask(task.id, { title, description, status, dueDate, assignee });
      toast.success("המשימה עודכנה");
    } else if (projectId) {
      store.addTask({ projectId, title, description, status, dueDate, assignee });
      toast.success("המשימה נוצרה");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>כותרת</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>תיאור</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>סטטוס</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">פתוח</SelectItem>
                  <SelectItem value="in_progress">בביצוע</SelectItem>
                  <SelectItem value="done">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך יעד</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>עובד אחראי</Label>
            <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          <Button onClick={submit}>שמירה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReportFormDialog({
  trigger,
  projectId,
  report,
}: {
  trigger: ReactNode;
  projectId?: string;
  report?: Report;
}) {
  const { open, setOpen } = useDialogState();
  const [date, setDate] = useState(report?.date ?? new Date().toISOString().slice(0, 10));
  const [submittedBy, setSubmittedBy] = useState(report?.submittedBy ?? "");
  const [text, setText] = useState(report?.text ?? "");
  const [comment, setComment] = useState(report?.comment ?? "");

  const submit = () => {
    if (!text.trim()) return toast.error("יש להזין תוכן דוח");
    if (report) {
      store.updateReport(report.id, { date, submittedBy, text, comment });
      toast.success("הדוח עודכן");
    } else if (projectId) {
      store.addReport({ projectId, date, submittedBy, text, comment });
      toast.success("הדוח הוגש");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{report ? "עריכת דוח" : "הגשת דוח"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>תאריך</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>הוגש ע״י</Label>
              <Input value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>תוכן הדוח</Label>
            <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <Label>הערת הנהלה</Label>
            <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          <Button onClick={submit}>שמירה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
