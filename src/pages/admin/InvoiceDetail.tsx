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
import { ArrowLeft, Plus, Pencil, Trash2, Copy, Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
      toast.success("Product added");
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
      toast.success("Product updated");
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
      toast.success("Product removed");
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
      toast.error("Description is required");
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
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }

  if (!invoice) {
    return <p className="text-destructive">Invoice not found.</p>;
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
              {(invoice.clients as any)?.name ?? "No client"} · {invoice.status}
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-full sm:max-w-[300px] block">
                {publicUrl}
              </code>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    toast.success("Public link copied!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 shrink-0" asChild>
                  <a href={`mailto:?subject=${emailSubject}&body=${emailBody}`} target="_blank" rel="noopener noreferrer">
                    <Send className="h-3.5 w-3.5 mr-1" /> Email
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-7 shrink-0 text-green-600 border-green-600 hover:bg-green-50" asChild>
                  <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Products / Line Items</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(v) => (v ? openAdd() : closeDialog())}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingId && products.length > 0 && (
                  <div className="space-y-2">
                    <Label>Pick from saved products</Label>
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
                        <SelectValue placeholder="Select a product..." />
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
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Product or service name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price ({currencySymbol})</Label>
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
                    Waive this service (included at no charge)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount: {currencySymbol}
                  {form.waived
                    ? "0.00 (waived)"
                    : ((parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0)).toFixed(2)}
                </p>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No products yet. Click "Add Product" to get started.
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
                          <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Waived</span>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Remove this product?")) deleteMutation.mutate(item.id); }}>
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
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-24">Qty</TableHead>
                    <TableHead className="text-right w-32">Unit Price</TableHead>
                    <TableHead className="text-right w-32">Amount</TableHead>
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
                            Waived
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
                              if (confirm("Remove this product?")) deleteMutation.mutate(item.id);
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
          )}

          {items.length > 0 && (
            <div className="mt-4 border-t pt-4 space-y-1 text-sm text-right">
              <p>Subtotal: {currencySymbol}{Number(invoice.subtotal).toFixed(2)}</p>
              <p>Tax ({Number(invoice.tax_rate)}%): {currencySymbol}{Number(invoice.tax_amount).toFixed(2)}</p>
              {Number(invoice.discount_amount) > 0 && (
                <p>Discount: -{currencySymbol}{Number(invoice.discount_amount).toFixed(2)}</p>
              )}
              <p className="font-bold text-base">
                Total: {currencySymbol}{Number(invoice.total).toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
