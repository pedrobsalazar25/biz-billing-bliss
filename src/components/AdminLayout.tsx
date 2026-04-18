import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LayoutDashboard, Users, FileText, Package, Building2, LogOut, Globe, RefreshCw, Receipt, Moon, Sun, BarChart3, ClipboardList, Menu, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "dashboard", end: true },
  { to: "/admin/clients", icon: Users, labelKey: "clients" },
  { to: "/admin/products", icon: Package, labelKey: "products" },
  { to: "/admin/invoices", icon: FileText, labelKey: "invoices" },
  { to: "/admin/estimates", icon: ClipboardList, labelKey: "estimates" },
  { to: "/admin/recurring", icon: RefreshCw, labelKey: "recurring" },
  { to: "/admin/expenses", icon: Receipt, labelKey: "expenses" },
  { to: "/admin/reports", icon: BarChart3, labelKey: "reports" },
  { to: "/admin/profile", icon: Building2, labelKey: "myBusiness" },
];

const bottomTabItems = navItems.slice(0, 4); // Dashboard, Clients, Products, Invoices
const moreMenuItems = navItems.slice(4); // Estimates, Recurring, Expenses, Reports, Profile

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isMoreActive = moreMenuItems.some(item => 
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
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
        <Button variant="ghost" size="sm" onClick={toggleTheme} className="justify-start gap-2">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? (lang === "es" ? "Modo Claro" : "Light Mode") : (lang === "es" ? "Modo Oscuro" : "Dark Mode")}
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleLang} className="justify-start gap-2">
          <Globe className="h-4 w-4" /> {lang === "es" ? "English" : "Español"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start gap-2">
          <LogOut className="h-4 w-4" /> {t("admin", "signOut", lang)}
        </Button>
      </aside>

      {/* Mobile Sheet (More menu) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle>{t("admin", "admin", lang)}</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 p-3">
            {moreMenuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
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
          <div className="border-t border-border p-3 space-y-1">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? (lang === "es" ? "Modo Claro" : "Light Mode") : (lang === "es" ? "Modo Oscuro" : "Dark Mode")}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleLang} className="w-full justify-start gap-2">
              <Globe className="h-4 w-4" /> {lang === "es" ? "English" : "Español"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setMobileOpen(false); handleSignOut(); }} className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" /> {t("admin", "signOut", lang)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around h-16 safe-bottom">
        {bottomTabItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {t("admin", item.labelKey, lang)}
          </NavLink>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
            isMoreActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          {lang === "es" ? "Más" : "More"}
        </button>
      </nav>
    </div>
  );
}
