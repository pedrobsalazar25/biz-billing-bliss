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
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, Pencil, Receipt } from "lucide-react";

const CATEGORIES = [
  "office_supplies", "travel", "utilities", "rent", "software",
  "marketing", "insurance", "professional_services", "meals", "equipment", "other",
] as const;

type Expense = {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function Expenses() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [expenseDate, setExpenseDate] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("other");
    setExpenseDate("");
    setVendor("");
    setNotes("");
    setEditingId(null);
  };

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        description: description.trim(),
        amount: parseFloat(amount) || 0,
        category: category as any,
        expense_date: expenseDate || new Date().toISOString().slice(0, 10),
        vendor: vendor.trim() || null,
        notes: notes.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(editingId ? t("expenses", "expenseUpdated", lang) : t("expenses", "expenseCreated", lang));
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t("expenses", "expenseDeleted", lang));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setDescription(exp.description);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setExpenseDate(exp.expense_date);
    setVendor(exp.vendor || "");
    setNotes(exp.notes || "");
    setOpen(true);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("expenses", "title", lang)}</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> {t("expenses", "newExpense", lang)}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t("expenses", "editExpense", lang) : t("expenses", "newExpense", lang)}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>{t("expenses", "description", lang)}</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("expenses", "descriptionPlaceholder", lang)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("expenses", "amount", lang)}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("expenses", "date", lang)}</Label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("expenses", "category", lang)}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t("expenses", c, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("expenses", "vendor", lang)}</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("expenses", "notes", lang)}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? t("expenses", "saving", lang)
                  : editingId
                  ? t("expenses", "updateExpense", lang)
                  : t("expenses", "createExpense", lang)}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="py-4 px-4 flex items-center gap-3">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">{t("expenses", "totalExpenses", lang)}</p>
            <p className="text-xl font-bold">${totalExpenses.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t("expenses", "loading", lang)}</p>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("expenses", "noExpenses", lang)}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{exp.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.expense_date} {exp.vendor ? `· ${exp.vendor}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline">{t("expenses", exp.category, lang)}</Badge>
                  <span className="font-semibold">${Number(exp.amount).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(t("expenses", "deleteConfirm", lang)))
                        deleteMutation.mutate(exp.id);
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
