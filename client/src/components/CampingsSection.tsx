import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { campings as staticCampings } from "@/lib/data";
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import useEmblaCarousel from "embla-carousel-react";

function ModalCarousel({ images, name }: { images: string[]; name: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [current, setCurrent] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setCurrent(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setCurrent(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {images.map((src, i) => (
          <div key={i} className="flex-[0_0_100%] min-w-0">
            {/\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(src) ? (
              <video
                src={src}
                className="w-full h-64 md:h-80 object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={src}
                alt={`${name} - ${i + 1}`}
                className="w-full h-64 md:h-80 object-cover"
              />
            )}
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getDisplayImages(camping: any): string[] {
  const unsupported = [".heic", ".heif"];
  const all = (camping.images || [camping.image]).filter(
    (img: string) =>
      !img.includes("placeholder") &&
      !unsupported.some(ext => img.toLowerCase().endsWith(ext))
  );
  if (all.length === 0) return [camping.image || "/images/glamping-placeholder.svg"];
  return all;
}

function getCoverImage(camping: any): string {
  const unsupported = [".heic", ".heif"];
  if (camping.image && !camping.image.includes("placeholder") && !unsupported.some(ext => camping.image.toLowerCase().endsWith(ext))) {
    return camping.image;
  }
  const fallback = (camping.images || []).find(
    (img: string) => !img.includes("placeholder") && !unsupported.some(ext => img.toLowerCase().endsWith(ext))
  );
  return fallback || "/images/glamping-placeholder.svg";
}

export function CampingsSection() {
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [campings, setCampings] = useState(staticCampings as any[]);

  useEffect(() => {
    fetch("/api/campings")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setCampings(data); })
      .catch(() => {});
  }, []);

  const selectedCamping = campings.find((c) => c.id === selectedId);

  return (
    <section id="campings" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">
            Nuestros Espacios
          </span>
          <h2 className="text-4xl md:text-5xl font-serif mt-4 mb-6">
            Nuestros Glamping
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Toca cualquier domo para conocerlo y ver los planes disponibles.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {campings.map((camping, index) => (
            <motion.button
              key={camping.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              onClick={() => setSelectedId(camping.id)}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 aspect-[3/4] cursor-pointer focus:outline-none"
            >
              <img
                src={getCoverImage(camping)}
                alt={camping.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <p className="text-white font-serif text-lg leading-tight drop-shadow">
                  {camping.name}
                </p>
                {camping.isFamiliar && (
                  <span className="mt-1 inline-block text-[9px] bg-amber-400/90 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Familiar
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedCamping && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedId(null)}
            />

            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <ModalCarousel
                images={getDisplayImages(selectedCamping)}
                name={selectedCamping.name}
              />

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-serif text-primary">
                      {selectedCamping.name}
                    </h3>
                    {selectedCamping.isFamiliar && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Familiar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-400">
                    <MapPin className="w-3 h-3" />
                    Carmen de Carupa, Cundinamarca
                  </div>
                </div>

                <p className="text-sm text-stone-500 leading-relaxed">
                  {selectedCamping.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(selectedCamping.includes || []).slice(0, 4).map((inc: string) => (
                    <span
                      key={inc}
                      className="text-[11px] bg-stone-100 text-stone-600 px-2 py-1 rounded-full"
                    >
                      {inc}
                    </span>
                  ))}
                  {(selectedCamping.includes || []).length > 4 && (
                    <span className="text-[11px] text-stone-400 px-2 py-1">
                      +{selectedCamping.includes.length - 4} más...
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setSelectedId(null);
                    setLocation(`/planes?campingId=${selectedCamping.id}`);
                  }}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
                >
                  Ver Planes para {selectedCamping.name}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
