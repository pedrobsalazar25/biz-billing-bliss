import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import slide1 from "@/assets/onboarding-1.jpeg";
import slide2 from "@/assets/onboarding-2.jpeg";
import slide3 from "@/assets/onboarding-3.jpeg";
import slide4 from "@/assets/onboarding-4.jpeg";

const slides = [
  {
    image: slide1,
    heading: "Crea Facturas en Segundos",
    description: "Facturas profesionales listas para enviar — sin necesidad de habilidades de diseño",
  },
  {
    image: slide2,
    heading: "Integración con WhatsApp",
    description: "Comparte facturas directamente con tus clientes a través de WhatsApp — instantáneo y personal",
  },
  {
    image: slide3,
    heading: "Controla tus Pagos Fácilmente",
    description: "Monitorea todas tus facturas y pagos en un solo panel de control",
  },
  {
    image: slide4,
    heading: "Completamente Gratis",
    description: "Comienza a facturar hoy sin necesidad de tarjeta de crédito",
  },
];

export default function Index() {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const isLast = current === slides.length - 1;
  const slide = slides[current];

  const goNext = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));
  const goPrev = () => setCurrent((c) => Math.max(c - 1, 0));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
    touchStart.current = null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Image */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={slide.image}
          alt={slide.heading}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 pb-8 pt-2 space-y-6 bg-background">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {slide.heading}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-accent"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        {isLast ? (
          <Button className="w-full gap-2" size="lg" asChild>
            <Link to="/login">
              Comenzar <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground"
              asChild
            >
              <Link to="/login">Saltar</Link>
            </Button>
            <Button
              className="flex-1 gap-2"
              size="lg"
              onClick={goNext}
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
