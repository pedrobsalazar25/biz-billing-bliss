import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { FileText, Users, DollarSign, CheckCircle2, Circle, ArrowRight } from "lucide-react";

function GettingStarted({
  hasProfile,
  hasClient,
  hasSentInvoice,
  lang,
}: {
  hasProfile: boolean;
  hasClient: boolean;
  hasSentInvoice: boolean;
  lang: "es" | "en";
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
              step.done
                ? "text-muted-foreground"
                : "hover:bg-primary/10 font-medium"
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

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(10);
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
        .select("business_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!(data?.business_name);
    },
    enabled: !!user,
  });

  const hasSentInvoice = invoices.some((i) => i.status === "sent" || i.status === "paid");

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total), 0);

  const statusColor: Record<string, string> = {
    draft: "secondary",
    sent: "default",
    paid: "default",
    void: "destructive",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("dashboard", "title", lang)}</h2>

      <GettingStarted
        hasProfile={hasProfile}
        hasClient={clientCount > 0}
        hasSentInvoice={hasSentInvoice}
        lang={lang}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard", "invoices", lang)}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/admin/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {(inv.clients as any)?.name ?? "No client"}
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
