import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";

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
    <>
      <input
        ref={ref}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={loading} onClick={() => ref.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> {loading ? "Importing..." : label}
        </Button>
        {sampleHeaders && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-2" onClick={downloadSample}>
            <Download className="h-3.5 w-3.5 mr-1" /> Sample
          </Button>
        )}
      </div>
    </>
  );
}
