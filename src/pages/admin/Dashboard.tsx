import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FileText, Users, DollarSign, CheckCircle2, Circle, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

function GettingStarted({
  hasProfile, hasClient, hasSentInvoice, lang,
}: {
  hasProfile: boolean; hasClient: boolean; hasSentInvoice: boolean; lang: "es" | "en";
}) {
  const steps = [
    { done: hasProfile, label: t("dashboard", "completeProfile", lang), link: "/admin/profile" },
    { done: hasClient, label: t("dashboard", "addClient", lang), link: "/admin/clients" },
    { done: hasSentInvoice, label: t("dashboard", "sendInvoice", lang), link: "/admin/invoices" },
  ];
  const allDone = steps.every((s) => s.done);
  if (allDone) return null;
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{t("dashboard", "gettingStarted", lang)}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {doneCount}/{steps.length} {t("dashboard", "complete", lang)}
          </span>
        </CardTitle>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        {steps.map((step) => (
          <Link
            key={step.label}
            to={step.link}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
              step.done ? "text-muted-foreground" : "hover:bg-primary/10 font-medium"
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            )}
            <span className={step.done ? "line-through" : ""}>{step.label}</span>
            {!step.done && <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(var(--muted-foreground))",
  sent: "hsl(var(--primary))",
  paid: "hsl(142 71% 45%)",
  void: "hsl(var(--destructive))",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const monthNames = lang === "es" ? MONTHS_ES : MONTHS_EN;

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["all-invoices-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["all-expenses-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["clientCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: hasProfile = false } = useQuery({
    queryKey: ["hasProfile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("business_profiles")
        .select("business_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!(data?.business_name);
    },
    enabled: !!user,
  });

  const recentInvoices = allInvoices.slice(0, 10);
  const hasSentInvoice = allInvoices.some((i) => i.status === "sent" || i.status === "paid");
  const totalPaid = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Monthly revenue & expenses for the last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: monthNames[d.getMonth()], revenue: 0, expenses: 0 });
    }
    allInvoices.forEach((inv) => {
      if (inv.status !== "paid") return;
      const m = inv.issue_date?.substring(0, 7);
      const entry = months.find((e) => e.key === m);
      if (entry) entry.revenue += Number(inv.total);
    });
    expenses.forEach((exp) => {
      const m = exp.expense_date?.substring(0, 7);
      const entry = months.find((e) => e.key === m);
      if (entry) entry.expenses += Number(exp.amount);
    });
    return months;
  }, [allInvoices, expenses, monthNames]);

  // Invoice status breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, sent: 0, paid: 0, void: 0 };
    allInvoices.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [allInvoices]);

  const statusColor: Record<string, string> = {
    draft: "secondary",
    sent: "default",
    paid: "default",
    void: "destructive",
  };

  const netProfit = totalPaid - totalExpenses;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("dashboard", "title", lang)}</h2>

      <GettingStarted
        hasProfile={hasProfile}
        hasClient={clientCount > 0}
        hasSentInvoice={hasSentInvoice}
        lang={lang}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard", "invoices", lang)}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard", "clients", lang)}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard", "paidTotal", lang)}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard", "netProfit", lang)}
            </CardTitle>
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              ${netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue vs Expenses Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard", "revenueVsExpenses", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`]}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name={t("dashboard", "revenue", lang)}
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name={t("dashboard", "expensesLabel", lang)}
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard", "invoiceStatus", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "hsl(var(--muted))"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {t("dashboard", "noInvoices", lang)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Line */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("dashboard", "revenueTrend", lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name={t("dashboard", "revenue", lang)}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("dashboard", "recentInvoices", lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("dashboard", "noInvoices", lang)}</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/admin/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {(inv.clients as any)?.name ?? t("dashboard", "noClient", lang)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${Number(inv.total).toFixed(2)}</span>
                    <Badge variant={statusColor[inv.status] as any}>{inv.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
