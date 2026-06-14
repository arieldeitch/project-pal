import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Plus, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, store } from "@/lib/mock-data";
import { ProjectFormDialog, SiteFormDialog } from "@/components/CrudDialogs";
import { ProjectStatusBadge, SiteStatusBadge } from "@/components/StatusBadges";
import { toast } from "sonner";

export const Route = createFileRoute("/sites/$siteId")({
  head: () => ({ meta: [{ title: "אתר - מהיסוד PM" }] }),
  component: SiteDetail,
  notFoundComponent: () => <div className="text-center text-muted-foreground">האתר לא נמצא</div>,
});

function SiteDetail() {
  const { siteId } = Route.useParams();
  const { sites, projects } = useStore();
  const site = sites.find((s) => s.id === siteId);
  if (!site) throw notFound();
  const siteProjects = projects.filter((p) => p.siteId === siteId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost">
            <Link to="/sites"><ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-sm text-muted-foreground">{site.address}</p>
          </div>
        </div>
        <SiteFormDialog site={site} trigger={<Button variant="outline"><Pencil className="ml-2 h-4 w-4" />עריכה</Button>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>פרטי האתר</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">שם</span><span className="font-medium">{site.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">כתובת</span><span className="font-medium">{site.address}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">סטטוס</span><SiteStatusBadge status={site.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">סך פרויקטים</span><span className="font-medium">{siteProjects.length}</span></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>פרויקטים</CardTitle>
            <ProjectFormDialog
              siteId={site.id}
              trigger={<Button size="sm"><Plus className="ml-2 h-4 w-4" />פרויקט חדש</Button>}
            />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תאריך יעד</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteProjects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{p.dueDate || "—"}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-end gap-1">
                        <ProjectFormDialog project={p} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                        <Button size="icon" variant="ghost" onClick={() => { store.deleteProject(p.id); toast.success("הפרויקט נמחק"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {siteProjects.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">אין פרויקטים</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
