import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Building2, MapPin, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSites, useCreateSite } from "@/hooks/useSites";
import { siteStatusLabel, siteTypeLabel } from "@/lib/mock-data";
import type { SiteStatus, SiteType } from "@/lib/mock-data";

export const Route = createFileRoute("/sites/")({
  component: SitesPage,
});

const statusColors: Record<SiteStatus, string> = {
  active: "bg-green-100 text-green-800",
  planning: "bg-blue-100 text-blue-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
};

function SitesPage() {
  const { data: sites, isLoading, error } = useSites();
  const createSite = useCreateSite();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    type: "residential" as SiteType,
    client: "",
    status: "active" as SiteStatus,
    startDate: "",
    targetDate: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createSite.mutate(
      {
        ...form,
        startDate: form.startDate || undefined,
        targetDate: form.targetDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success("האתר נוצר בהצלחה");
          setShowForm(false);
          setForm({ name: "", address: "", type: "residential", client: "", status: "active", startDate: "", targetDate: "" });
        },
        onError: () => toast.error("שגיאה ביצירת האתר"),
      },
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">טוען אתרים...</p>;
  if (error) return <p className="text-sm text-destructive">שגיאה בטעינת האתרים</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">אתרים</h1>
          <p className="text-sm text-muted-foreground">{sites?.length ?? 0} אתרים במערכת</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          אתר חדש
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">אתר חדש</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">שם האתר *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">כתובת</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">סוג</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as SiteType })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {(Object.keys(siteTypeLabel) as SiteType[]).map((t) => (
                  <option key={t} value={t}>{siteTypeLabel[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">סטטוס</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as SiteStatus })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {(Object.keys(siteStatusLabel) as SiteStatus[]).map((s) => (
                  <option key={s} value={s}>{siteStatusLabel[s]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">לקוח</label>
              <input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">תאריך התחלה</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">תאריך יעד</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                dir="ltr"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={createSite.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {createSite.isPending ? "שומר..." : "שמור"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!sites?.length ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">אין אתרים עדיין</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Link
              key={site.id}
              to="/sites/$siteId"
              params={{ siteId: site.id }}
              className="rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{site.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[site.status]}`}>
                  {siteStatusLabel[site.status]}
                </span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {site.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{site.address}</span>
                  </div>
                )}
                {site.client && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{site.client}</span>
                  </div>
                )}
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs">
                  {siteTypeLabel[site.type]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
