import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";

interface LineItemForm {
  description: string;
  quantity: string;
  unit_price: string;
}

const emptyForm: LineItemForm = { description: "", quantity: "1", unit_price: "0" };

export default function EstimateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LineItemForm>(emptyForm);

  const { data: estimate, isLoading: estimateLoading } = useQuery({
    queryKey: ["estimate", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("*, clients(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["estimate-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (f: LineItemForm) => {
      const maxSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from("estimate_line_items").insert({
        estimate_id: id!,
        description: f.description,
        quantity: parseFloat(f.quantity) || 1,
        unit_price: parseFloat(f.unit_price) || 0,
        sort_order: maxSort,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimate-items", id] });
      qc.invalidateQueries({ queryKey: ["estimate", id] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, f }: { itemId: string; f: LineItemForm }) => {
      const { error } = await supabase
        .from("estimate_line_items")
        .update({
          description: f.description,
          quantity: parseFloat(f.quantity) || 1,
          unit_price: parseFloat(f.unit_price) || 0,
        } as any)
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimate-items", id] });
      qc.invalidateQueries({ queryKey: ["estimate", id] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("estimate_line_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimate-items", id] });
      qc.invalidateQueries({ queryKey: ["estimate", id] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("estimates").update({ status } as any).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimate", id] });
      qc.invalidateQueries({ queryKey: ["estimates"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async () => {
      // Create invoice from estimate
      const { data: invoice, error: invError } = await supabase.from("invoices").insert({
        user_id: user!.id,
        invoice_number: "",
        business_profile_id: (estimate as any)?.business_profile_id || null,
        client_id: (estimate as any)?.client_id || null,
        tax_rate: Number((estimate as any)?.tax_rate) || 0,
        discount_amount: Number((estimate as any)?.discount_amount) || 0,
        currency: (estimate as any)?.currency || "USD",
        notes: (estimate as any)?.notes || null,
        terms: (estimate as any)?.terms || null,
      }).select("id").single();
      if (invError) throw invError;

      // Copy line items
      if (items.length > 0) {
        const lineItems = items.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          sort_order: item.sort_order,
        }));
        const { error: liError } = await supabase.from("invoice_line_items").insert(lineItems as any);
        if (liError) throw liError;
      }

      // Mark estimate as converted
      const { error: estError } = await supabase.from("estimates")
        .update({ status: "converted", converted_invoice_id: invoice.id } as any)
        .eq("id", id!);
      if (estError) throw estError;

      return invoice.id;
    },
    onSuccess: (invoiceId) => {
      qc.invalidateQueries({ queryKey: ["estimate", id] });
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(lang === "es" ? "Cotización convertida a factura" : "Estimate converted to invoice");
      navigate(`/admin/invoices/${invoiceId}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };
  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ description: item.description, quantity: String(item.quantity), unit_price: String(item.unit_price) });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error(t("invoiceDetail", "descriptionRequired", lang)); return; }
    editingId ? updateMutation.mutate({ itemId: editingId, f: form }) : addMutation.mutate(form);
  };

  if (estimateLoading || itemsLoading) return <p className="text-muted-foreground text-sm">{lang === "es" ? "Cargando..." : "Loading..."}</p>;
  if (!estimate) return <p className="text-destructive">{lang === "es" ? "Cotización no encontrada." : "Estimate not found."}</p>;

  const currencySymbol = (estimate as any).currency === "EUR" ? "€" : "$";
  const isPending = addMutation.isPending || updateMutation.isPending;
  const isConverted = (estimate as any).status === "converted";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/estimates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold truncate">{(estimate as any).estimate_number}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {(estimate as any).clients?.name ?? (lang === "es" ? "Sin cliente" : "No client")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isConverted && (
              <Select value={(estimate as any).status} onValueChange={(v) => updateStatusMutation.mutate(v)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{lang === "es" ? "Borrador" : "Draft"}</SelectItem>
                  <SelectItem value="sent">{lang === "es" ? "Enviada" : "Sent"}</SelectItem>
                  <SelectItem value="approved">{lang === "es" ? "Aprobada" : "Approved"}</SelectItem>
                  <SelectItem value="rejected">{lang === "es" ? "Rechazada" : "Rejected"}</SelectItem>
                </SelectContent>
              </Select>
            )}
            {isConverted && <Badge variant="outline">{lang === "es" ? "Convertida" : "Converted"}</Badge>}
          </div>
        </div>

        {!isConverted && (estimate as any).status === "approved" && (
          <Button onClick={() => convertToInvoiceMutation.mutate()} disabled={convertToInvoiceMutation.isPending} className="w-fit">
            <FileText className="h-4 w-4 mr-1" />
            {convertToInvoiceMutation.isPending
              ? (lang === "es" ? "Convirtiendo..." : "Converting...")
              : (lang === "es" ? "Convertir a Factura" : "Convert to Invoice")}
          </Button>
        )}

        {isConverted && (estimate as any).converted_invoice_id && (
          <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate(`/admin/invoices/${(estimate as any).converted_invoice_id}`)}>
            <FileText className="h-4 w-4 mr-1" /> {lang === "es" ? "Ver Factura" : "View Invoice"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{t("invoiceDetail", "lineItems", lang)}</CardTitle>
          {!isConverted && (
            <Dialog open={dialogOpen} onOpenChange={(v) => (v ? openAdd() : closeDialog())}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t("invoiceDetail", "addProduct", lang)}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? t("invoiceDetail", "editProduct", lang) : t("invoiceDetail", "addProduct", lang)}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!editingId && products.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t("invoiceDetail", "pickProduct", lang)}</Label>
                      <Select onValueChange={(productId) => {
                        const product = products.find((p) => p.id === productId);
                        if (product) setForm({ ...form, description: product.name + (product.description ? ` — ${product.description}` : ""), unit_price: String(product.unit_price) });
                      }}>
                        <SelectTrigger><SelectValue placeholder={t("invoiceDetail", "selectProduct", lang)} /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {currencySymbol}{Number(p.unit_price).toFixed(2)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{t("invoiceDetail", "description", lang)}</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("invoiceDetail", "quantity", lang)}</Label>
                      <Input type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("invoiceDetail", "unitPrice", lang)} ({currencySymbol})</Label>
                      <Input type="number" step="0.01" min="0" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("invoiceDetail", "amount", lang)}: {currencySymbol}{((parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0)).toFixed(2)}
                  </p>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? t("invoiceDetail", "saving", lang) : editingId ? t("invoiceDetail", "updateProduct", lang) : t("invoiceDetail", "addProduct", lang)}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">{t("invoiceDetail", "noItems", lang)}</p>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Number(item.quantity)} × {currencySymbol}{Number(item.unit_price).toFixed(2)} = <span className="font-medium text-foreground">{currencySymbol}{Number(item.amount).toFixed(2)}</span>
                        </p>
                      </div>
                      {!isConverted && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(t("invoiceDetail", "removeConfirm", lang))) deleteMutation.mutate(item.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoiceDetail", "description", lang)}</TableHead>
                      <TableHead className="text-right w-24">{t("invoiceDetail", "quantity", lang)}</TableHead>
                      <TableHead className="text-right w-32">{t("invoiceDetail", "unitPrice", lang)}</TableHead>
                      <TableHead className="text-right w-32">{t("invoiceDetail", "amount", lang)}</TableHead>
                      {!isConverted && <TableHead className="w-20" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                        <TableCell className="text-right">{currencySymbol}{Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">{currencySymbol}{Number(item.amount).toFixed(2)}</TableCell>
                        {!isConverted && (
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => { if (confirm(t("invoiceDetail", "removeConfirm", lang))) deleteMutation.mutate(item.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>{t("invoiceDetail", "subtotal", lang)}</span><span>{currencySymbol}{Number((estimate as any).subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>{t("invoiceDetail", "tax", lang)} ({Number((estimate as any).tax_rate)}%)</span><span>{currencySymbol}{Number((estimate as any).tax_amount).toFixed(2)}</span></div>
          {Number((estimate as any).discount_amount) > 0 && (
            <div className="flex justify-between text-destructive"><span>{t("invoiceDetail", "discount", lang)}</span><span>-{currencySymbol}{Number((estimate as any).discount_amount).toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t"><span>{t("invoiceDetail", "total", lang)}</span><span>{currencySymbol}{Number((estimate as any).total).toFixed(2)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
