import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Building2, MapPin, User, Calendar, FolderKanban } from "lucide-react";
import { useSite } from "@/hooks/useSites";
import { useProjects } from "@/hooks/useProjects";
import { siteStatusLabel, siteTypeLabel, projectStatusLabel } from "@/lib/mock-data";
import type { SiteStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/sites/$siteId")({
  head: () => ({ meta: [{ title: "אתר - מהיסוד" }] }),
  component: SiteDetailPage,
  notFoundComponent: () => <div className="text-center text-muted-foreground">האתר לא נמצא</div>,
});

const statusColors: Record<SiteStatus, string> = {
  active: "bg-green-100 text-green-800",
  planning: "bg-blue-100 text-blue-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
};

function SiteDetailPage() {
  const { siteId } = Route.useParams();
  const { data: site, isLoading, error } = useSite(siteId);
  const { data: allProjects } = useProjects();

  if (isLoading) return <p className="text-sm text-muted-foreground">טוען אתר...</p>;
  if (error || !site) throw notFound();

  const siteProjects = allProjects?.filter((p) => p.siteId === siteId) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/sites" className="text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{site.name}</h1>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[site.status]}`}>
            {siteStatusLabel[site.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">פרטי אתר</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-muted-foreground">סוג</dt>
                <dd className="font-medium">{siteTypeLabel[site.type]}</dd>
              </div>
            </div>
            {site.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">כתובת</dt>
                  <dd className="font-medium">{site.address}</dd>
                </div>
              </div>
            )}
            {site.client && (
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">לקוח</dt>
                  <dd className="font-medium">{site.client}</dd>
                </div>
              </div>
            )}
            {(site.startDate || site.targetDate) && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">לוח זמנים</dt>
                  <dd className="font-medium">
                    {site.startDate ?? "—"} → {site.targetDate ?? "—"}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">פרויקטים באתר</h2>
            <span className="text-xs text-muted-foreground">{siteProjects.length} פרויקטים</span>
          </div>
          {!siteProjects.length ? (
            <p className="text-sm text-muted-foreground">אין פרויקטים משויכים לאתר זה</p>
          ) : (
            <ul className="space-y-2">
              {siteProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {projectStatusLabel[p.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
