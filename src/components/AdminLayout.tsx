import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FileText, Package, Building2, LogOut, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "dashboard", end: true },
  { to: "/admin/clients", icon: Users, labelKey: "clients" },
  { to: "/admin/products", icon: Package, labelKey: "products" },
  { to: "/admin/invoices", icon: FileText, labelKey: "invoices" },
  { to: "/admin/profile", icon: Building2, labelKey: "myBusiness" },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card p-4">
        <h1 className="text-lg font-bold mb-6 px-2">{t("admin", "admin", lang)}</h1>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {t("admin", item.labelKey, lang)}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={toggleLang} className="justify-start gap-2">
          <Globe className="h-4 w-4" /> {lang === "es" ? "English" : "Español"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start gap-2">
          <LogOut className="h-4 w-4" /> {t("admin", "signOut", lang)}
        </Button>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col flex-1">
        <header className="md:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <h1 className="text-lg font-bold">{t("admin", "admin", lang)}</h1>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "p-2 rounded-md",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
              </NavLink>
            ))}
            <button onClick={toggleLang} className="p-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
            </button>
            <button onClick={handleSignOut} className="p-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
