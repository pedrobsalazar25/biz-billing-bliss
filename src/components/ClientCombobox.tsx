import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Plus, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientComboboxProps {
  value: string;
  onValueChange: (id: string) => void;
}

export default function ClientCombobox({ value, onValueChange }: ClientComboboxProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const selectedClient = clients.find((c) => c.id === value);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .insert({ user_id: user!.id, name: newName, email: newEmail || null })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      onValueChange(data.id);
      setDialogOpen(false);
      setNewName("");
      setNewEmail("");
      toast.success(lang === "es" ? "Cliente creado" : "Client created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const placeholder = lang === "es" ? "Seleccionar cliente..." : "Select client...";
  const searchPlaceholder = lang === "es" ? "Buscar por nombre o email..." : "Search by name or email...";
  const addNewLabel = lang === "es" ? "Agregar Nuevo Cliente" : "Add New Client";
  const noResults = lang === "es" ? "Sin resultados" : "No results";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selectedClient ? selectedClient.name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 h-9 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">{noResults}</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
                  value === c.id && "bg-accent"
                )}
                onClick={() => {
                  onValueChange(c.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    value === c.id ? "opacity-100 text-primary" : "opacity-0"
                  )}
                />
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  {c.email && (
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-1">
            <button
              className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {addNewLabel}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addNewLabel}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>{lang === "es" ? "Nombre" : "Name"}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={lang === "es" ? "Nombre del cliente" : "Client name"}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? (lang === "es" ? "Creando..." : "Creating...")
                : addNewLabel}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
