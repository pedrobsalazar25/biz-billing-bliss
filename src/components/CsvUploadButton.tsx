import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CsvUploadButtonProps {
  onParsed: (rows: Record<string, string>[]) => Promise<void>;
  label?: string;
  sampleHeaders?: string[];
  sampleRow?: string[];
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export default function CsvUploadButton({ onParsed, label = "Upload CSV", sampleHeaders, sampleRow }: CsvUploadButtonProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toast.error("CSV is empty or invalid"); return; }
      await onParsed(rows);
      toast.success(`${rows.length} rows imported`);
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
    else toast.error("Please drop a .csv file");
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const downloadSample = () => {
    if (!sampleHeaders) return;
    const csv = [sampleHeaders.join(","), ...(sampleRow ? [sampleRow.join(",")] : [])].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => ref.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        ) : (
          <FileUp className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">
          {loading ? "Importing..." : "Drag & drop a CSV file here"}
        </p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
      </div>
      {sampleHeaders && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-2" onClick={(e) => { e.stopPropagation(); downloadSample(); }}>
          <Download className="h-3.5 w-3.5 mr-1" /> Download sample CSV
        </Button>
      )}
    </div>
  );
}
