import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailHeaderProps {
  backTo: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function DetailHeader({ backTo, title, subtitle, rightSlot }: DetailHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-start gap-2 sm:items-center sm:gap-3">
      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(backTo)}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{title}</h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </div>
  );
}
