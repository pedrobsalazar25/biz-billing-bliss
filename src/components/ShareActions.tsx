import { Button } from "@/components/ui/button";
import { Copy, Download, Send, MessageCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface ShareActionsProps {
  publicUrl: string;
  clientName: string;
  documentLabel: string; // e.g. "Invoice INV-001"
  pdfButtonLabel: string;
  fromName?: string;
}

export function ShareActions({
  publicUrl,
  clientName,
  documentLabel,
  pdfButtonLabel,
  fromName = "Pedro Barrios",
}: ShareActionsProps) {
  const emailSubject = encodeURIComponent(documentLabel);
  const emailBody = encodeURIComponent(
    `Hi ${clientName},\n\nPlease find your document here:\n${publicUrl}\n\nBest regards,\n${fromName}`
  );
  const waMsg = encodeURIComponent(
    `Hi ${clientName}, here is your ${documentLabel}:\n${publicUrl}`
  );

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate w-full sm:max-w-[300px] block min-w-0">
        {publicUrl}
      </code>
      <div className="grid grid-cols-4 sm:flex gap-1.5 w-full sm:w-auto">
        <Button
          variant="default"
          size="sm"
          className="hidden sm:inline-flex h-8 min-w-0 px-2"
          onClick={() => window.open(publicUrl, "_blank")}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          <span>{pdfButtonLabel}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-0 px-2"
          onClick={() => window.open(publicUrl, "_blank")}
        >
          <Eye className="h-3.5 w-3.5 sm:mr-1" />
          <span className="text-xs ml-1 sm:ml-0">View</span>
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
          <Copy className="h-3.5 w-3.5 sm:mr-0" />
          <span className="sm:hidden text-xs ml-1">Copy</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 min-w-0 px-2" asChild>
          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send className="h-3.5 w-3.5 sm:mr-1" />
            <span className="text-xs ml-1 sm:ml-0">Email</span>
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-0 px-2 text-green-600 border-green-600 hover:bg-green-50"
          asChild
        >
          <a
            href={`https://wa.me/?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-3.5 w-3.5 sm:mr-1" />
            <span className="text-xs ml-1 sm:ml-0 truncate">WA</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
