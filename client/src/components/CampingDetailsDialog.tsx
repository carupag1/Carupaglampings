
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Star, MapPin, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from "react";

interface CampingDetailsDialogProps {
  camping: {
    id: number;
    typeId: number;
    name: string;
    description: string;
    images: string[];
    features: string[];
    rating: number;
  };
  range?: { from: Date | undefined; to: Date | undefined };
  children: React.ReactNode;
}

export function CampingDetailsDialog({ camping, range, children }: CampingDetailsDialogProps) {
  const [, setLocation] = useLocation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const minPrice = 290000;

  const handleBookingClick = () => {
    const params = new URLSearchParams();
    params.set("campingId", camping.id.toString());
    if (range?.from) params.set("from", range.from.getTime().toString());
    if (range?.to) params.set("to", range.to.getTime().toString());
    setLocation(`/reservar?${params.toString()}`);
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-background border-none shadow-2xl rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative h-80 md:h-full overflow-hidden" ref={emblaRef}>
            <div className="flex h-full">
              {camping.images.map((src, index) => (
                <div className="flex-[0_0_100%] min-w-0 h-full relative" key={index}>
                  {/\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(src) ? (
                    <video
                      src={src}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img 
                      src={src} 
                      alt={`${camping.name} - ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            
            {camping.images.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-white/90 backdrop-blur text-primary border-none shadow-lg">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                {camping.rating}
              </Badge>
            </div>
          </div>
          
          <div className="p-8 flex flex-col h-full bg-stone-50/50">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-2">
                <MapPin className="w-3 h-3" /> Entre Carmen de Carupa y Ubaté, Cundinamarca
              </div>
              <DialogTitle className="text-3xl font-serif text-primary leading-tight">
                {camping.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm mt-4 leading-relaxed">
                {camping.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 flex-grow">
              <div>
                <h4 className="text-xs uppercase font-bold tracking-widest text-primary/40 mb-3">Características</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {camping.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-[13px] text-stone-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-stone-200 mt-auto">
                <Button 
                  onClick={handleBookingClick}
                  className="w-full bg-accent hover:bg-accent/90 text-white h-14 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent/20 border-none transition-all active:scale-95 group"
                >
                  Reservar Ahora
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
