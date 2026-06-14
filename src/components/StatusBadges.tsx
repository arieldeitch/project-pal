import { Badge } from "@/components/ui/badge";
import {
  projectStatusLabel,
  issueStatusLabel,
  severityLabel,
  blockerStatusLabel,
  decisionStatusLabel,
  reportStatusLabel,
  type ProjectStatus,
  type IssueStatus,
  type Severity,
  type BlockerStatus,
  type DecisionStatus,
  type ReportStatus,
} from "@/lib/mock-data";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const cls = {
    completed: "bg-success text-success-foreground",
    active: "bg-info text-info-foreground",
    on_hold: "bg-warning text-warning-foreground",
    planning: "bg-muted text-muted-foreground",
  }[status];
  return <Badge className={cls}>{projectStatusLabel[status]}</Badge>;
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const cls = {
    open: "bg-destructive text-destructive-foreground",
    in_progress: "bg-warning text-warning-foreground",
    resolved: "bg-success text-success-foreground",
    reopened: "bg-destructive text-destructive-foreground",
    closed: "bg-muted text-muted-foreground",
  }[status];
  return <Badge className={cls}>{issueStatusLabel[status]}</Badge>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-info text-info-foreground",
    high: "bg-warning text-warning-foreground",
    critical: "bg-destructive text-destructive-foreground",
  }[severity];
  return <Badge className={cls}>{severityLabel[severity]}</Badge>;
}

export function BlockerStatusBadge({ status }: { status: BlockerStatus }) {
  const cls = {
    open: "bg-destructive text-destructive-foreground",
    in_progress: "bg-warning text-warning-foreground",
    resolved: "bg-success text-success-foreground",
  }[status];
  return <Badge className={cls}>{blockerStatusLabel[status]}</Badge>;
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const cls = {
    pending: "bg-warning text-warning-foreground",
    approved: "bg-success text-success-foreground",
    rejected: "bg-destructive text-destructive-foreground",
    deferred: "bg-muted text-muted-foreground",
  }[status];
  return <Badge className={cls}>{decisionStatusLabel[status]}</Badge>;
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const cls = {
    draft: "bg-muted text-muted-foreground",
    ready: "bg-info text-info-foreground",
    sent: "bg-success text-success-foreground",
  }[status];
  return <Badge className={cls}>{reportStatusLabel[status]}</Badge>;
}
