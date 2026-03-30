import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe } from "lucide-react";
import { useLanguage, t, getSlideText } from "@/hooks/useLanguage";

import slide1 from "@/assets/onboarding-1.jpeg";
import slide2 from "@/assets/onboarding-2.jpeg";
import slide3 from "@/assets/onboarding-3.jpeg";
import slide4 from "@/assets/onboarding-4.jpeg";

const images = [slide1, slide2, slide3, slide4];

export default function Index() {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const { lang, toggleLang } = useLanguage();
  const isLast = current === images.length - 1;
  const slide = getSlideText(current, lang);

  const goNext = () => setCurrent((c) => Math.min(c + 1, images.length - 1));
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
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-card/80 backdrop-blur px-3 py-1.5 text-xs font-medium text-foreground shadow-sm border border-border"
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === "es" ? "EN" : "ES"}
      </button>

      {/* Image */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[current]}
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
          {images.map((_, i) => (
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
              {t("onboarding", "start", lang)} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground"
              asChild
            >
              <Link to="/login">{t("onboarding", "skip", lang)}</Link>
            </Button>
            <Button className="flex-1 gap-2" size="lg" onClick={goNext}>
              {t("onboarding", "next", lang)} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
