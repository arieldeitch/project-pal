import { Badge } from "@/components/ui/badge";
import { taskStatusLabel, projectStatusLabel, type TaskStatus, type ProjectStatus } from "@/lib/mock-data";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const cls =
    status === "done"
      ? "bg-success text-success-foreground"
      : status === "in_progress"
        ? "bg-info text-info-foreground"
        : "bg-muted text-muted-foreground";
  return <Badge className={cls}>{taskStatusLabel[status]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const cls =
    status === "completed"
      ? "bg-success text-success-foreground"
      : status === "active"
        ? "bg-info text-info-foreground"
        : status === "on_hold"
          ? "bg-warning text-warning-foreground"
          : "bg-muted text-muted-foreground";
  return <Badge className={cls}>{projectStatusLabel[status]}</Badge>;
}

export function SiteStatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <Badge className={status === "active" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
      {status === "active" ? "פעיל" : "לא פעיל"}
    </Badge>
  );
}
