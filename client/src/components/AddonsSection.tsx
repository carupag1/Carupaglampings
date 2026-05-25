import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower2, Utensils, Bike, Target, Flame, Gift, Star, Sparkles, Music, Camera, Heart, X, ChevronLeft, ChevronRight, Play, ImageIcon } from "lucide-react";
import { addons as staticAddons } from "@/lib/data";

const addonIcons: Record<string, React.ReactNode> = {
  decoracion: <Flower2 className="w-8 h-8 text-accent" />,
  cena: <Utensils className="w-8 h-8 text-accent" />,
  cuatrimoto: <Bike className="w-8 h-8 text-accent" />,
  poligono: <Target className="w-8 h-8 text-accent" />,
  fogata: <Flame className="w-8 h-8 text-accent" />,
};

const fallbackIcons = [
  <Gift className="w-8 h-8 text-accent" />,
  <Star className="w-8 h-8 text-accent" />,
  <Sparkles className="w-8 h-8 text-accent" />,
  <Heart className="w-8 h-8 text-accent" />,
  <Music className="w-8 h-8 text-accent" />,
  <Camera className="w-8 h-8 text-accent" />,
];

type MediaItem = { type: "image" | "video"; url: string };
type Addon = {
  id: string;
  title: string;
  price: number;
  description: string;
  details?: string[];
  media?: MediaItem[];
};

function AddonModal({ addon, index, onClose }: { addon: Addon; index: number; onClose: () => void }) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const media = addon.media || [];
  const hasMedia = media.length > 0;

  const prev = () => setMediaIndex(i => (i - 1 + media.length) % media.length);
  const next = () => setMediaIndex(i => (i + 1) % media.length);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && media.length > 1) prev();
      if (e.key === "ArrowRight" && media.length > 1) next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [media.length]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22 }}
          className="bg-background rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {hasMedia && (
            <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
              {media[mediaIndex].type === "video" ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                  key={media[mediaIndex].url}
                >
                  <source src={media[mediaIndex].url} type="video/mp4" />
                  <source src={media[mediaIndex].url} type="video/webm" />
                  <source src={media[mediaIndex].url} type="video/ogg" />
                </video>
              ) : (
                <img
                  src={media[mediaIndex].url}
                  alt={addon.title}
                  className="w-full h-full object-cover"
                />
              )}
              {media.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((_, i) => (
                      <button key={i} onClick={() => setMediaIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === mediaIndex ? "bg-white scale-125" : "bg-white/50"}`} />
                    ))}
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {media[mediaIndex].type === "video" ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {mediaIndex + 1}/{media.length}
                  </div>
                </>
              )}
              <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-6">
            {!hasMedia && (
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="bg-secondary/40 p-3 rounded-2xl shrink-0">
                {addonIcons[addon.id.split("_")[0]] || fallbackIcons[index % fallbackIcons.length]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-serif font-semibold leading-tight">{addon.title}</h3>
                <p className="text-accent font-bold text-lg mt-0.5">${addon.price.toLocaleString()}</p>
              </div>
            </div>
            {addon.description && (
              <p className="text-muted-foreground text-sm mt-4 leading-relaxed">{addon.description}</p>
            )}
            {addon.details && addon.details.length > 0 && (
              <ul className="mt-4 space-y-2">
                {addon.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-accent mt-0.5 shrink-0">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
            {hasMedia && media.length > 1 && (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {media.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMediaIndex(i)}
                    className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === mediaIndex ? "border-accent" : "border-transparent opacity-60 hover:opacity-90"}`}
                  >
                    {m.type === "video" ? (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function AddonsSection() {
  const [addons, setAddons] = useState(staticAddons as Addon[]);
  const [selectedAddon, setSelectedAddon] = useState<{ addon: Addon; index: number } | null>(null);

  useEffect(() => {
    fetch("/api/addons")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setAddons(data); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 bg-background border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-muted-foreground uppercase tracking-widest text-sm font-medium">Complementa tu estadía</span>
          <h2 className="text-3xl md:text-4xl font-serif mt-2">Servicios Adicionales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {addons.map((addon, index) => {
            const hasMedia = addon.media && addon.media.length > 0;
            return (
              <motion.button
                key={addon.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedAddon({ addon, index })}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer w-full text-left group"
              >
                <div className="mb-4 bg-background p-4 rounded-full shadow-sm group-hover:shadow transition-shadow">
                  {addonIcons[addon.id.split("_")[0]] || fallbackIcons[index % fallbackIcons.length]}
                </div>
                <h3 className="text-xl font-serif font-medium mb-1">{addon.title}</h3>
                <p className="text-accent font-bold mb-3">${addon.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{addon.description}</p>
                {hasMedia && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent/80 font-medium">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Ver fotos/videos
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedAddon && (
        <AddonModal
          addon={selectedAddon.addon}
          index={selectedAddon.index}
          onClose={() => setSelectedAddon(null)}
        />
      )}
    </section>
  );
}
