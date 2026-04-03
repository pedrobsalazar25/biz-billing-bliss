import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(35, 100%, 50%)",
  "hsl(20, 6%, 12%)",
  "hsl(12, 80%, 55%)",
  "hsl(45, 100%, 60%)",
  "hsl(150, 50%, 45%)",
  "hsl(200, 60%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(170, 50%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(60, 60%, 50%)",
];

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // YYYY-MM
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

export default function Reports() {
  const { lang } = useLanguage();

  const { data: invoices = [] } = useQuery({
    queryKey: ["all-invoices-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("total, status, issue_date, paid_at")
        .order("issue_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["all-expenses-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, expense_date, category")
        .order("expense_date");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = useMemo(
    () => invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0),
    [invoices]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );
  const profit = totalRevenue - totalExpenses;

  // Monthly bar chart data
  const monthlyData = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};

    invoices.forEach((inv) => {
      if (inv.status === "paid") {
        const mk = monthKey(inv.paid_at?.slice(0, 10) || inv.issue_date);
        if (!map[mk]) map[mk] = { revenue: 0, expenses: 0 };
        map[mk].revenue += Number(inv.total);
      }
    });

    expenses.forEach((exp) => {
      const mk = monthKey(exp.expense_date);
      if (!map[mk]) map[mk] = { revenue: 0, expenses: 0 };
      map[mk].expenses += Number(exp.amount);
    });

    return Object.keys(map)
      .sort()
      .slice(-12)
      .map((k) => ({
        month: monthLabel(k),
        [t("reports", "revenue", lang)]: parseFloat(map[k].revenue.toFixed(2)),
        [t("reports", "expenses", lang)]: parseFloat(map[k].expenses.toFixed(2)),
      }));
  }, [invoices, expenses, lang]);

  // Expense breakdown by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "other";
      map[cat] = (map[cat] || 0) + Number(e.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: t("expenses", name, lang), value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, lang]);

  // Invoice status breakdown
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((i) => {
      map[i.status] = (map[i.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: t("invoicesPage", name, lang),
      value,
    }));
  }, [invoices, lang]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("reports", "title", lang)}</h2>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("reports", "totalRevenue", lang)}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("reports", "totalExpenses", lang)}
            </CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("reports", "netProfit", lang)}
            </CardTitle>
            {profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit < 0 ? "text-destructive" : ""}`}>
              ${profit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly revenue vs expenses bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("reports", "monthlyOverview", lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {t("reports", "noData", lang)}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey={t("reports", "revenue", lang)}
                  fill="hsl(150, 50%, 45%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={t("reports", "expenses", lang)}
                  fill="hsl(0, 70%, 55%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom row: expense categories + invoice status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("reports", "expensesByCategory", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {t("reports", "noData", lang)}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("reports", "invoiceStatus", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {t("reports", "noData", lang)}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
