import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientCombobox from "@/components/ClientCombobox";
import type { Database } from "@/integrations/supabase/types";

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

export default function Invoices() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        user_id: user!.id,
        invoice_number: "",
        client_id: clientId || null,
        due_date: dueDate || null,
        tax_rate: parseFloat(taxRate) || 0,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(t("invoicesPage", "createInvoice", lang));
      setOpen(false);
      setClientId("");
      setDueDate("");
      setTaxRate("0");
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const update: any = { status };
      if (status === "paid") update.paid_at = new Date().toISOString();
      const { error } = await supabase.from("invoices").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusLabels: Record<string, () => string> = {
    draft: () => t("invoicesPage", "draft", lang),
    sent: () => t("invoicesPage", "sent", lang),
    paid: () => t("invoicesPage", "paid", lang),
    void: () => t("invoicesPage", "void", lang),
  };

  const statusColor: Record<string, string> = {
    draft: "secondary",
    sent: "default",
    paid: "default",
    void: "destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("invoicesPage", "title", lang)}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> {t("invoicesPage", "newInvoice", lang)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("invoicesPage", "createInvoice", lang)}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>{t("invoicesPage", "client", lang)}</Label>
                <ClientCombobox value={clientId} onValueChange={setClientId} />
              </div>
              <div className="space-y-2">
                <Label>{t("invoicesPage", "dueDate", lang)}</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("invoicesPage", "taxRate", lang)}</Label>
                <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("invoicesPage", "notes", lang)}</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("invoicesPage", "creating", lang) : t("invoicesPage", "createInvoice", lang)}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t("invoicesPage", "loading", lang)}</p>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t("invoicesPage", "noInvoices", lang)}</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Card key={inv.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {(inv.clients as any)?.name ?? t("invoicesPage", "noClient", lang)} · ${Number(inv.total).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={inv.status}
                    onValueChange={(val) =>
                      updateStatus.mutate({ id: inv.id, status: val as InvoiceStatus })
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t("invoicesPage", "draft", lang)}</SelectItem>
                      <SelectItem value="sent">{t("invoicesPage", "sent", lang)}</SelectItem>
                      <SelectItem value="paid">{t("invoicesPage", "paid", lang)}</SelectItem>
                      <SelectItem value="void">{t("invoicesPage", "void", lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t("invoicesPage", "deleteConfirm", lang))) deleteMutation.mutate(inv.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
