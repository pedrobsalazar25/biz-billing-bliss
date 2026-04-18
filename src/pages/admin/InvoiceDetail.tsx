import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Copy, Send, MessageCircle, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";

interface LineItemForm {
  description: string;
  quantity: string;
  unit_price: string;
  waived: boolean;
}

const emptyForm: LineItemForm = { description: "", quantity: "1", unit_price: "0", waived: false };

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LineItemForm>(emptyForm);

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["invoice-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (f: LineItemForm) => {
      const maxSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from("invoice_line_items").insert({
        invoice_id: id!,
        description: f.description,
        quantity: parseFloat(f.quantity) || 1,
        unit_price: parseFloat(f.unit_price) || 0,
        sort_order: maxSort,
        waived: f.waived,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-items", id] });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, f }: { itemId: string; f: LineItemForm }) => {
      const { error } = await supabase
        .from("invoice_line_items")
        .update({
          description: f.description,
          quantity: parseFloat(f.quantity) || 1,
          unit_price: parseFloat(f.unit_price) || 0,
          waived: f.waived,
        } as any)
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-items", id] });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("invoice_line_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-items", id] });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: (typeof items)[0]) => {
    setEditingId(item.id);
    setForm({
      description: item.description,
      quantity: String(item.quantity),
      unit_price: String(item.unit_price),
      waived: (item as any).waived ?? false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error(t("invoiceDetail", "descriptionRequired", lang));
      return;
    }
    if (editingId) {
      updateMutation.mutate({ itemId: editingId, f: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  if (invoiceLoading || itemsLoading) {
    return <p className="text-muted-foreground text-sm">{t("invoiceDetail", "loading", lang)}</p>;
  }

  if (!invoice) {
    return <p className="text-destructive">{t("invoiceDetail", "notFound", lang)}</p>;
  }

  const currencySymbol = invoice.currency === "EUR" ? "€" : "$";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold truncate">{invoice.invoice_number}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {(invoice.clients as any)?.name ?? t("invoiceDetail", "noClient", lang)} · {invoice.status}
            </p>
          </div>
        </div>
        {invoice.public_share_slug && (() => {
          const publicUrl = `${window.location.origin}/i/${invoice.public_share_slug}`;
          const clientName = (invoice.clients as any)?.name ?? "Client";
          const emailSubject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
          const emailBody = encodeURIComponent(`Hi ${clientName},\n\nPlease find your invoice here:\n${publicUrl}\n\nBest regards,\nPedro Barrios`);
          const waMsg = encodeURIComponent(`Hi ${clientName}, here is your invoice ${invoice.invoice_number}:\n${publicUrl}`);
          return (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
              <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate w-full sm:max-w-[300px] block min-w-0">
                {publicUrl}
              </code>
              <div className="grid grid-cols-4 sm:flex gap-1.5 w-full sm:w-auto">
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 min-w-0 px-2"
                  onClick={() => window.open(publicUrl, '_blank')}
                >
                  <Download className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">{t("invoiceDetail", "downloadPdf", lang)}</span>
                  <span className="sm:hidden text-xs ml-1 truncate">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-0 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success("Public link copied!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sm:hidden text-xs ml-1">Copy</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 min-w-0 px-2" asChild>
                  <a href={`mailto:?subject=${emailSubject}&body=${emailBody}`} target="_blank" rel="noopener noreferrer">
                    <Send className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="text-xs ml-1 sm:ml-0">Email</span>
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-8 min-w-0 px-2 text-green-600 border-green-600 hover:bg-green-50" asChild>
                  <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="text-xs ml-1 sm:ml-0 truncate">WA</span>
                  </a>
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{t("invoiceDetail", "lineItems", lang)}</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(v) => (v ? openAdd() : closeDialog())}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> {t("invoiceDetail", "addProduct", lang)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? t("invoiceDetail", "editProduct", lang) : t("invoiceDetail", "addProduct", lang)}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingId && products.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("invoiceDetail", "pickProduct", lang)}</Label>
                    <Select
                      onValueChange={(productId) => {
                        const product = products.find((p) => p.id === productId);
                        if (product) {
                          setForm({
                            ...form,
                            description: product.name + (product.description ? ` — ${product.description}` : ""),
                            unit_price: String(product.unit_price),
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("invoiceDetail", "selectProduct", lang)} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — €{Number(p.unit_price).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t("invoiceDetail", "description", lang)}</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t("invoiceDetail", "placeholder", lang)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("invoiceDetail", "quantity", lang)}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("invoiceDetail", "unitPrice", lang)} ({currencySymbol})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="waived"
                    checked={form.waived}
                    onCheckedChange={(checked) => setForm({ ...form, waived: !!checked })}
                  />
                  <Label htmlFor="waived" className="text-sm font-normal">
                    {t("invoiceDetail", "waive", lang)}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("invoiceDetail", "amount", lang)}: {currencySymbol}
                  {form.waived
                    ? `0.00 (${t("invoiceDetail", "waived", lang).toLowerCase()})`
                    : ((parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0)).toFixed(2)}
                </p>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? t("invoiceDetail", "saving", lang) : editingId ? t("invoiceDetail", "updateProduct", lang) : t("invoiceDetail", "addProduct", lang)}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              {t("invoiceDetail", "noItems", lang)}
            </p>
          ) : (
            <>
            <div className="space-y-2 md:hidden">
              {items.map((item) => (
                <div key={item.id} className={`border rounded-lg p-3 ${(item as any).waived ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.description}
                        {(item as any).waived && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{t("invoiceDetail", "waived", lang)}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(item.quantity)} × {currencySymbol}{Number(item.unit_price).toFixed(2)} = <span className="font-medium text-foreground">{currencySymbol}{Number(item.amount).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(t("invoiceDetail", "removeConfirm", lang))) deleteMutation.mutate(item.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
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
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className={(item as any).waived ? "opacity-60" : ""}>
                      <TableCell>
                        {item.description}
                        {(item as any).waived && (
                          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                            {t("invoiceDetail", "waived", lang)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                      <TableCell className="text-right">
                        {currencySymbol}{Number(item.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencySymbol}{Number(item.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(t("invoiceDetail", "removeConfirm", lang))) deleteMutation.mutate(item.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}

          {items.length > 0 && (
            <div className="mt-4 border-t pt-4 space-y-1 text-sm text-right">
              <p>{t("invoiceDetail", "subtotal", lang)}: {currencySymbol}{Number(invoice.subtotal).toFixed(2)}</p>
              <p>{t("invoiceDetail", "tax", lang)} ({Number(invoice.tax_rate)}%): {currencySymbol}{Number(invoice.tax_amount).toFixed(2)}</p>
              {Number(invoice.discount_amount) > 0 && (
                <p>{t("invoiceDetail", "discount", lang)}: -{currencySymbol}{Number(invoice.discount_amount).toFixed(2)}</p>
              )}
              <p className="font-bold text-base">
                {t("invoiceDetail", "total", lang)}: {currencySymbol}{Number(invoice.total).toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
