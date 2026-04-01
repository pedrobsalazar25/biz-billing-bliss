import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, t } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import CsvUploadButton from "@/components/CsvUploadButton";

interface ProductForm {
  name: string;
  description: string;
  unit_price: string;
}

const emptyForm: ProductForm = { name: "", description: "", unit_price: "0" };

export default function Products() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products = [], isLoading } = useQuery({
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

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        name: form.name,
        description: form.description || null,
        unit_price: parseFloat(form.unit_price) || 0,
      };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(editingId ? t("products", "productUpdated", lang) : t("products", "productCreated", lang));
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("products", "productDeleted", lang));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      unit_price: String(product.unit_price),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">{t("products", "title", lang)}</h2>
        <div className="flex items-center gap-2">
          <CsvUploadButton
            label={t("products", "uploadCsv", lang)}
            sampleHeaders={["name", "description", "unit_price"]}
            sampleRow={["Web Design", "Full website design service", "500"]}
            onParsed={async (rows) => {
              const payload = rows.map((r) => ({
                user_id: user!.id,
                name: r["name"] || r["Name"] || "",
                description: r["description"] || r["Description"] || null,
                unit_price: parseFloat(r["unit_price"] || r["Unit Price"] || r["price"] || "0") || 0,
              })).filter((p) => p.name);
              if (!payload.length) throw new Error("No valid rows found. Ensure CSV has a 'name' column.");
              const { error } = await supabase.from("products").insert(payload);
              if (error) throw error;
              qc.invalidateQueries({ queryKey: ["products"] });
            }}
          />
          <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> {t("products", "newProduct", lang)}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? t("products", "editProduct", lang) : t("products", "newProduct", lang)}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                upsertMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>{t("products", "name", lang)}</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products", "description", lang)}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("products", "unitPrice", lang)}</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? t("products", "saving", lang) : editingId ? t("products", "updateProduct", lang) : t("products", "createProduct", lang)}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("products", "loading", lang)}</p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t("products", "noProducts", lang)}</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.description || t("products", "noDescription", lang)} · ${Number(p.unit_price).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(t("products", "deleteConfirm", lang))) deleteMutation.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
