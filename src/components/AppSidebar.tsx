import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  AlertTriangle,
  Ban,
  GitBranch,
  FileText,
  BarChart3,
  HardHat,
  Building2,
  CheckSquare,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthContext } from "@/lib/auth-context";
import { useSignOut } from "@/hooks/useAuth";
import { toast } from "sonner";

const items = [
  { title: "דשבורד", url: "/", icon: LayoutDashboard, exact: true },
  { title: "אתרים", url: "/sites", icon: Building2 },
  { title: "פרויקטים", url: "/projects", icon: FolderKanban },
  { title: "משימות", url: "/tasks", icon: CheckSquare },
  { title: "יומני עבודה", url: "/daily-logs", icon: ClipboardList },
  { title: "ליקויים", url: "/issues", icon: AlertTriangle },
  { title: "חסמים", url: "/blockers", icon: Ban },
  { title: "החלטות", url: "/decisions", icon: GitBranch },
  { title: "דוחות", url: "/reports", icon: FileText },
  { title: "דשבורד הנהלה", url: "/executive", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { session } = useAuthContext();
  const signOut = useSignOut();
  const router = useRouter();

  function handleSignOut() {
    signOut.mutate(undefined, {
      onSuccess: () => router.navigate({ to: "/login", replace: true }),
      onError: () => toast.error("שגיאה בהתנתקות"),
    });
  }

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">מהיסוד</span>
            <span className="text-xs text-sidebar-foreground/60">ניהול ביצוע פרויקטים</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ניווט</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2">
          {session?.user?.email && (
            <p className="mb-2 truncate text-xs text-sidebar-foreground/60">
              {session.user.email}
            </p>
          )}
          <button
            onClick={handleSignOut}
            disabled={signOut.isPending}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>התנתק</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
