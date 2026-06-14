import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, store } from "@/lib/mock-data";
import { SiteFormDialog } from "@/components/CrudDialogs";
import { SiteStatusBadge } from "@/components/StatusBadges";
import { toast } from "sonner";

export const Route = createFileRoute("/sites")({
  head: () => ({
    meta: [
      { title: "אתרים - מהיסוד PM" },
      { name: "description", content: "ניהול אתרים ונכסים" },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  const { sites, projects } = useStore();
  const projectCount = (id: string) => projects.filter((p) => p.siteId === id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">אתרים</h1>
          <p className="text-sm text-muted-foreground">ניהול אתרים ונכסים</p>
        </div>
        <SiteFormDialog
          trigger={
            <Button><Plus className="ml-2 h-4 w-4" />אתר חדש</Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם אתר</TableHead>
                <TableHead>כתובת</TableHead>
                <TableHead>פרויקטים</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="text-left">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.address}</TableCell>
                  <TableCell>{projectCount(s.id)}</TableCell>
                  <TableCell><SiteStatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost">
                        <Link to="/sites/$siteId" params={{ siteId: s.id }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <SiteFormDialog
                        site={s}
                        trigger={
                          <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          store.deleteSite(s.id);
                          toast.success("האתר נמחק");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    אין אתרים. צור אתר ראשון.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
