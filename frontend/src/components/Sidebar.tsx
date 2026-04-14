import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LayoutGrid, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/produtos", icon: Package, label: "Catálogo" },
  { to: "/categorias", icon: LayoutGrid, label: "Categorias" },
];

function isActiveLink(to: string, pathname: string): boolean {
  if (to === "/") return pathname === "/";
  if (to === "/produtos/novo") return pathname === "/produtos/novo";
  if (to === "/produtos") {
    return pathname.startsWith("/produtos") && pathname !== "/produtos/novo";
  }
  if (to === "/categorias") return pathname === "/categorias" || pathname.startsWith("/categorias/");
  return false;
}

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0 border-r bg-background">
      <div className="flex items-center gap-2 h-14 px-4 border-b shrink-0">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">E-Commerce Manager</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = isActiveLink(to, location.pathname);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground">Aparência</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
