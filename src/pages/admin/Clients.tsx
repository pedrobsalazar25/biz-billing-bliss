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

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  company: string;
}

const emptyForm: ClientForm = { name: "", email: "", phone: "", company: "" };

export default function Clients() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase
          .from("clients")
          .update({ name: form.name, email: form.email, phone: form.phone, company: form.company })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editId ? t("clients", "clientUpdated", lang) : t("clients", "clientCreated", lang));
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success(t("clients", "clientDeleted", lang));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (client: any) => {
    setEditId(client.id);
    setForm({ name: client.name, email: client.email ?? "", phone: client.phone ?? "", company: client.company ?? "" });
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">{t("clients", "title", lang)}</h2>
        <div className="flex items-center gap-2">
          <CsvUploadButton
            label={t("clients", "uploadCsv", lang)}
            sampleHeaders={["name", "email", "phone", "company"]}
            sampleRow={["John Doe", "john@example.com", "+34 600 000 000", "Acme Corp"]}
            onParsed={async (rows) => {
              const payload = rows.map((r) => ({
                user_id: user!.id,
                name: r["name"] || r["Name"] || "",
                email: r["email"] || r["Email"] || null,
                phone: r["phone"] || r["Phone"] || null,
                company: r["company"] || r["Company"] || null,
              })).filter((c) => c.name);
              if (!payload.length) throw new Error("No valid rows found. Ensure CSV has a 'name' column.");
              const { error } = await supabase.from("clients").insert(payload);
              if (error) throw error;
              qc.invalidateQueries({ queryKey: ["clients"] });
            }}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> {t("clients", "addClient", lang)}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? t("clients", "editClient", lang) : t("clients", "newClient", lang)}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>{t("clients", "name", lang)} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("clients", "email", lang)}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("clients", "phone", lang)}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("clients", "company", lang)}</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t("clients", "saving", lang) : t("clients", "save", lang)}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t("clients", "loading", lang)}</p>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">{t("clients", "noClients", lang)}</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[c.company, c.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(t("clients", "deleteConfirm", lang))) deleteMutation.mutate(c.id);
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
