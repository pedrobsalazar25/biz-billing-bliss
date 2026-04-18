import { Button } from "@/components/ui/button";
import { Copy, Download, Send, MessageCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface BusinessContact {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface ShareActionsProps {
  publicUrl: string;
  clientName: string;
  documentLabel: string; // e.g. "Invoice INV-001" or "Factura INV-001"
  pdfButtonLabel: string;
  fromName?: string;
  totalFormatted?: string; // e.g. "€660.00"
  business?: BusinessContact;
  lang?: "es" | "en";
  clientPhone?: string;
}

export function ShareActions({
  publicUrl,
  clientName,
  documentLabel,
  pdfButtonLabel,
  fromName = "Pedro Barrios",
  totalFormatted,
  business,
  lang = "en",
}: ShareActionsProps) {
  const senderName = business?.name || fromName;
  const isEs = lang === "es";

  const copyLabel = isEs ? "¡Enlace copiado!" : "Public link copied!";

  const buildEmailBody = () => {
    const lines: string[] = [];
    if (isEs) {
      lines.push(`Hola ${clientName},`);
      lines.push("");
      lines.push(
        `¡Espero que estés muy bien! Aquí tienes tu ${documentLabel} de ${senderName}${
          totalFormatted ? ` por un total de ${totalFormatted}` : ""
        }.`
      );
      lines.push("");
      lines.push("Puedes verla y descargarla aquí:");
      lines.push(`<${publicUrl}>`);
      lines.push("");
      lines.push("¡Gracias por tu confianza!");
    } else {
      lines.push(`Hi ${clientName},`);
      lines.push("");
      lines.push(
        `Hope you're doing well! Please find attached your ${documentLabel} from ${senderName}${
          totalFormatted ? ` for a total of ${totalFormatted}` : ""
        }.`
      );
      lines.push("");
      lines.push("You can view and download it here:");
      lines.push(`<${publicUrl}>`);
      lines.push("");
      lines.push("Thank you for your business!");
    }
    lines.push("");
    lines.push("---");
    lines.push(senderName);
    if (business?.email) lines.push(`${isEs ? "Correo" : "Email"}: ${business.email}`);
    if (business?.phone) lines.push(`${isEs ? "Teléfono" : "Phone"}: ${business.phone}`);
    if (business?.address) lines.push(business.address.replace(/\n/g, ", "));
    return lines.join("\n");
  };

  const buildWaMessage = () => {
    const lines: string[] = [];
    if (isEs) {
      lines.push(`Hola ${clientName} 👋`);
      lines.push("");
      lines.push(
        `¡Espero que estés muy bien! Aquí tienes tu ${documentLabel} de ${senderName}${
          totalFormatted ? ` por un total de *${totalFormatted}*` : ""
        }.`
      );
      lines.push("");
      lines.push("Ver y descargar:");
      lines.push(publicUrl);
      lines.push("");
      lines.push("¡Gracias por tu confianza!");
    } else {
      lines.push(`Hi ${clientName} 👋`);
      lines.push("");
      lines.push(
        `Hope you're doing well! Here is your ${documentLabel} from ${senderName}${
          totalFormatted ? ` for a total of *${totalFormatted}*` : ""
        }.`
      );
      lines.push("");
      lines.push("View & download:");
      lines.push(publicUrl);
      lines.push("");
      lines.push("Thank you for your business!");
    }
    lines.push("");
    lines.push("---");
    lines.push(senderName);
    if (business?.email) lines.push(`✉️ ${business.email}`);
    if (business?.phone) lines.push(`📞 ${business.phone}`);
    if (business?.address) lines.push(`📍 ${business.address.replace(/\n/g, ", ")}`);
    return lines.join("\n");
  };

  const emailSubject = encodeURIComponent(documentLabel);
  const emailBody = encodeURIComponent(buildEmailBody());
  const waMsg = encodeURIComponent(buildWaMessage());

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
          <span className="text-xs ml-1 sm:ml-0">{isEs ? "Ver" : "View"}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-0 px-2"
          onClick={() => {
            navigator.clipboard.writeText(publicUrl);
            toast.success(copyLabel);
          }}
        >
          <Copy className="h-3.5 w-3.5 sm:mr-0" />
          <span className="sm:hidden text-xs ml-1">{isEs ? "Copiar" : "Copy"}</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 min-w-0 px-2" asChild>
          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send className="h-3.5 w-3.5 sm:mr-1" />
            <span className="text-xs ml-1 sm:ml-0">{isEs ? "Correo" : "Email"}</span>
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
