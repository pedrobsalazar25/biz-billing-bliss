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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientCombobox from "@/components/ClientCombobox";

export default function Estimates() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("estimates").insert({
        user_id: user!.id,
        estimate_number: "",
        client_id: clientId || null,
        valid_until: validUntil || null,
        tax_rate: parseFloat(taxRate) || 0,
        notes: notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      toast.success(lang === "es" ? "Cotización creada" : "Estimate created");
      setOpen(false);
      setClientId("");
      setValidUntil("");
      setTaxRate("0");
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estimates"] }),
    onError: (err: any) => toast.error(err.message),
  });

  const statusColor: Record<string, string> = {
    draft: "secondary",
    sent: "default",
    approved: "default",
    rejected: "destructive",
    converted: "outline",
  };

  const statusLabel = (s: string) => {
    const map: Record<string, Record<string, string>> = {
      draft: { es: "Borrador", en: "Draft" },
      sent: { es: "Enviada", en: "Sent" },
      approved: { es: "Aprobada", en: "Approved" },
      rejected: { es: "Rechazada", en: "Rejected" },
      converted: { es: "Convertida", en: "Converted" },
    };
    return map[s]?.[lang] || s;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang === "es" ? "Cotizaciones" : "Estimates"}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> {lang === "es" ? "Nueva Cotización" : "New Estimate"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{lang === "es" ? "Crear Cotización" : "Create Estimate"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("invoicesPage", "client", lang)}</Label>
                <ClientCombobox value={clientId} onValueChange={setClientId} />
              </div>
              <div className="space-y-2">
                <Label>{lang === "es" ? "Válida Hasta" : "Valid Until"}</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
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
                {createMutation.isPending ? (lang === "es" ? "Creando..." : "Creating...") : (lang === "es" ? "Crear Cotización" : "Create Estimate")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{lang === "es" ? "Cargando..." : "Loading..."}</p>
      ) : estimates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {lang === "es" ? "Aún no hay cotizaciones." : "No estimates yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {estimates.map((est: any) => (
            <Card key={est.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(`/admin/estimates/${est.id}`)}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium">{est.estimate_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {est.clients?.name ?? (lang === "es" ? "Sin cliente" : "No client")} · ${Number(est.total).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={statusColor[est.status] as any}>{statusLabel(est.status)}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm(lang === "es" ? "¿Eliminar esta cotización?" : "Delete this estimate?")) deleteMutation.mutate(est.id);
                  }}>
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
