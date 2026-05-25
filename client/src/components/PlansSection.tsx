import { motion } from "framer-motion";
import { Check, Sparkles, Heart, Film, Star, Sun, Moon, TreePine, Mountain, Flame, Gift, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { campings } from "@/lib/data";

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Film: <Film className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Sun: <Sun className="w-6 h-6" />,
  Moon: <Moon className="w-6 h-6" />,
  TreePine: <TreePine className="w-6 h-6" />,
  Mountain: <Mountain className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Tag: <Tag className="w-6 h-6" />,
};

const campingNames: Record<number, string> = {
  1: "Domo Gold",
  2: "Domo Big Premium",
  3: "Domo Natura Premium",
  4: "Domo Familiar",
};

export function PlansSection() {
  const [, setLocation] = useLocation();
  const { data: plans = [] } = useQuery<any[]>({
    queryKey: ["/api/plans/active"],
  });

  const formatPrice = (plan: any) => {
    if (plan.tipo === "addon") {
      return `+ $${(plan.precio || 0).toLocaleString()} COP`;
    }
    if (plan.tipo === "pasa_dia") {
      const min = plan.precios?.entre_semana || 0;
      const max = plan.precios?.especial || 0;
      if (min === max) return `$${min.toLocaleString()} COP`;
      return `Desde $${min.toLocaleString()} COP`;
    }
    const min = Math.min(...Object.values(plan.precios || { "0": 0 }).map(Number).filter(Boolean));
    return `Desde $${min.toLocaleString()} COP`;
  };

  const getPlanDescription = (plan: any) => {
    if (plan.tipo === "addon") return "Adicional al alojamiento · Aplica para cualquier domo";
    if (plan.tipo === "pasa_dia") {
      const names = (plan.campingIds || []).map((id: number) => campingNames[id]).filter(Boolean);
      return names.length > 0 ? `Solo en ${names.join(", ")}` : "Experiencia de día completo";
    }
    return plan.descripcion;
  };

  return (
    <section id="planes" className="py-24 bg-stone-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Experiencias Todo Incluido</span>
          <h2 className="text-4xl md:text-5xl font-serif mt-4 mb-6">Planes Opcionales</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Añade una experiencia especial a tu estadía. Todos nuestros domos ya incluyen alojamiento, desayuno, jacuzzi y más.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Card className="h-full border-none shadow-md bg-card flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div
                  className="absolute top-0 left-0 w-full h-2"
                  style={{ backgroundColor: plan.color || '#8B5A2B' }}
                />

                {plan.tipo === "pasa_dia" && (
                  <div className="absolute top-4 right-4 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                    PASA DÍA
                  </div>
                )}
                {plan.tipo === "addon" && (
                  <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                    PLAN
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-10">
                  <div
                    className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ color: plan.color || '#8B5A2B' }}
                  >
                    {iconMap[plan.icono] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <CardTitle className="font-serif text-2xl">{plan.nombre}</CardTitle>
                  <p className="text-sm text-muted-foreground italic mt-2">{plan.eslogan}</p>
                </CardHeader>

                <CardContent className="flex-grow pt-4">
                  <div className="space-y-3">
                    {plan.incluye?.slice(0, 6).map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                        <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.incluye?.length > 6 && (
                      <p className="text-xs text-muted-foreground text-center mt-2 italic">Y más detalles exclusivos...</p>
                    )}
                  </div>
                </CardContent>

                <div className="p-6 mt-auto">
                  <button
                    onClick={() => {
                      const firstCampingId = plan.campingIds?.[0];
                      if (firstCampingId) {
                        setLocation(`/reservar?planId=${plan.id}&campingId=${firstCampingId}`);
                      } else {
                        setLocation(`/reservar?planId=${plan.id}`);
                      }
                    }}
                    className="w-full py-3 border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-medium tracking-wide uppercase text-sm cursor-pointer"
                  >
                    Reservar este Plan
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
