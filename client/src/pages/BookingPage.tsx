
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Moon,
  Clock,
  CreditCard,
  ChevronLeft,
  User,
  Users,
  IdCard,
  Phone,
  Sparkles,
  Info,
  Tent,
  Mail,
  Upload,
  MessageCircle,
  QrCode,
  Building2,
  Copy,
  Check,
  Maximize2,
  X,
  Heart,
  Film,
  Star,
  Sun,
  TreePine,
  Mountain,
  Flame,
  Gift,
  Tag,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { campings, addons } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

type Step = "plan" | "camping" | "dates" | "addons" | "guest" | "payment";

type PricingConfig = {
  tarifas: { entre_semana: number; viernes_domingo: number; especial: number };
  persona_adicional: number;
  max_adicionales: number;
  festivos: string[];
  fechas_especiales: string[];
};

type Banner = {
  id: string;
  titulo: string;
  texto: string;
  imagen: string;
  pasos: string[];
  bgColor: string;
  textColor: string;
  activo: boolean;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
};

type DynamicPlan = {
  id: string;
  nombre: string;
  eslogan: string;
  descripcion: string;
  tipo: "normal" | "temporada" | "preventa" | "addon" | "pasa_dia";
  icono: string;
  color: string;
  estado: boolean;
  preventa: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
  precios: Record<string, number>;
  precio: number;
  campingIds: number[] | null;
  incluye: string[];
};

const iconMap: Record<string, LucideIcon> = {
  Sparkles, Heart, Film, Star, Sun, Moon, TreePine, Mountain, Flame, Gift, Tag
};
const getIconComponent = (id: string): LucideIcon => iconMap[id] || Sparkles;

const CAMPING_OPTIONS = [
  { id: 1, name: "Domo Gold", desc: "Vista a las montañas · 2 personas", isFamiliar: false, icon: <Sparkles className="w-5 h-5" /> },
  { id: 2, name: "Domo Big Premium", desc: "Vista al atardecer · 2 personas", isFamiliar: false, icon: <Tent className="w-5 h-5" /> },
  { id: 3, name: "Domo Natura Premium", desc: "Vista al bosque · 2 personas", isFamiliar: false, icon: <TreePine className="w-5 h-5" /> },
  { id: 4, name: "Domo Familiar", desc: "Vista al atardecer · hasta 6 personas", isFamiliar: true, icon: <Users className="w-5 h-5" /> },
];

export default function BookingPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initCampingId = searchParams.get("campingId");
  const initPlanId = searchParams.get("planId");

  const [step, setStep] = useState<Step>(() => {
    if (initCampingId && initPlanId) return "dates";
    return "plan";
  });

  const [selectedCampingId, setSelectedCampingId] = useState<number | null>(
    initCampingId ? parseInt(initCampingId) : null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initPlanId || null);
  const [planStepInitialized, setPlanStepInitialized] = useState(false);
  const [isFamiliarMode, setIsFamiliarMode] = useState(() => {
    if (!initCampingId) return false;
    const c = campings.find(c => c.id === parseInt(initCampingId));
    return c?.isFamiliar || false;
  });
  const [extraPersons, setExtraPersons] = useState(0);

  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    return {
      from: fromStr ? new Date(parseInt(fromStr)) : undefined,
      to: toStr ? new Date(parseInt(toStr)) : undefined,
    };
  });
  const [arrivalTime, setArrivalTime] = useState("3:00 PM");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [showPolicies, setShowPolicies] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [whatsappRedirectUrl, setWhatsappRedirectUrl] = useState<string | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<{ from: Date, to: Date }[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [dynamicPlans, setDynamicPlans] = useState<DynamicPlan[]>([]);
  const [dynamicCampings, setDynamicCampings] = useState(campings);
  const [dynamicAddons, setDynamicAddons] = useState(addons);
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/plans/active")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDynamicPlans(data); })
      .catch(err => console.error("Error fetching plans:", err));

    fetch("/api/pricing")
      .then(res => res.json())
      .then(data => { if (data && data.tarifas) setPricingConfig(data); })
      .catch(err => console.error("Error fetching pricing:", err));

    fetch("/api/campings")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setDynamicCampings(data); })
      .catch(() => {});

    fetch("/api/addons")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setDynamicAddons(data); })
      .catch(() => {});

    fetch("/api/banners/active")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setActiveBanners(data); })
      .catch(() => {});
  }, []);

  // When coming from planId with no campingId: after plans load, auto-select first camping
  useEffect(() => {
    if (initPlanId && !initCampingId && !planStepInitialized && dynamicPlans.length > 0) {
      const plan = dynamicPlans.find(p => p.id === initPlanId);
      if (plan && plan.campingIds && plan.campingIds.length >= 1) {
        setSelectedCampingId(plan.campingIds[0]);
        const c = dynamicCampings.find(c => c.id === plan.campingIds![0]);
        if (c) setIsFamiliarMode(c.isFamiliar);
        setStep("dates");
      }
      setPlanStepInitialized(true);
    }
  }, [dynamicPlans, dynamicCampings, initPlanId, initCampingId, planStepInitialized]);

  // Load bookings when camping selected
  useEffect(() => {
    if (selectedCampingId) {
      const c = dynamicCampings.find(c => c.id === selectedCampingId);
      const names = (c?.name === "Domo Big Premium" || c?.name === "Domo Familiar")
        ? ["Domo Big Premium", "Domo Familiar"] : [c?.name || ""];
      const param = encodeURIComponent(names.join(","));
      fetch(`/api/get-ocupacion.php?unidades=${param}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setConfirmedBookings(data.map((b: any) => ({
              from: new Date(b.fecha_inicio.includes('T') ? b.fecha_inicio : b.fecha_inicio + 'T12:00:00'),
              to: new Date(b.fecha_fin.includes('T') ? b.fecha_fin : b.fecha_fin + 'T12:00:00')
            })));
          }
        })
        .catch(err => console.error("Error fetching occupation:", err));
    }
  }, [selectedCampingId]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getDateCategory = (date: Date): "entre_semana" | "viernes_domingo" | "especial" => {
    if (!pricingConfig) return "entre_semana";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const mmdd = `${mm}-${dd}`;
    if (pricingConfig.fechas_especiales.includes(mmdd)) return "especial";
    if (pricingConfig.festivos.includes(dateStr)) return "especial";
    const dow = date.getDay();
    if (dow === 6) return "especial";
    if (dow === 0) {
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const nextStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-${String(next.getDate()).padStart(2,"0")}`;
      if (pricingConfig.festivos.includes(nextStr)) return "especial";
      return "viernes_domingo";
    }
    if (dow === 5) return "viernes_domingo";
    return "entre_semana";
  };

  const dateCategoryLabel: Record<string, string> = {
    entre_semana: "Entre semana",
    viernes_domingo: "Viernes o Domingo",
    especial: "Sábado / Festivo"
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minLeadTime = new Date(today); minLeadTime.setDate(today.getDate() + 2);
    if (date < minLeadTime) return true;
    const isOccupied = confirmedBookings.some(booking => {
      const bFrom = new Date(booking.from); bFrom.setHours(12, 0, 0, 0);
      const bTo = new Date(booking.to); bTo.setHours(12, 0, 0, 0);
      const checkDate = new Date(date); checkDate.setHours(12, 0, 0, 0);
      return checkDate >= bFrom && checkDate < bTo;
    });
    return isOccupied;
  };

  // ── Plans for selected camping ────────────────────────────────────────────

  const selectedCamping = useMemo(() => dynamicCampings.find(c => c.id === selectedCampingId), [selectedCampingId, dynamicCampings]);

  const plansForCamping = useMemo(() => {
    if (!selectedCampingId) return dynamicPlans;
    return dynamicPlans.filter(p => !p.campingIds || p.campingIds.includes(selectedCampingId));
  }, [dynamicPlans, selectedCampingId]);

  // Campings available for selected plan (when coming from planId)
  const campingsForPlan = useMemo(() => {
    if (!selectedPlanId) return CAMPING_OPTIONS;
    const plan = dynamicPlans.find(p => p.id === selectedPlanId);
    if (!plan || !plan.campingIds) return CAMPING_OPTIONS;
    return CAMPING_OPTIONS.filter(c => plan.campingIds!.includes(c.id));
  }, [selectedPlanId, dynamicPlans]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId || selectedPlanId === "none") return null;
    return dynamicPlans.find(p => p.id === selectedPlanId) || null;
  }, [selectedPlanId, dynamicPlans]);

  // ── Pricing ──────────────────────────────────────────────────────────────

  const isPasaDia = selectedPlan?.tipo === "pasa_dia";
  const nights = isPasaDia ? 0 : 1;
  const days = isPasaDia ? 1 : 2;

  const dateCategory = useMemo(() => {
    if (!range.from || !pricingConfig) return "entre_semana" as const;
    return getDateCategory(range.from);
  }, [range.from, pricingConfig]);

  const totalBase = useMemo(() => {
    if (!selectedCampingId) return 0;
    if (!pricingConfig) return 0;
    const base = pricingConfig.tarifas[dateCategory] || 290000;
    if (!selectedPlan) return base * nights;
    if (selectedPlan.tipo === "pasa_dia") {
      return (selectedPlan.precios as any)[dateCategory] || 0;
    }
    if (selectedPlan.tipo === "addon") {
      return base * nights + (selectedPlan.precio || 0);
    }
    // normal/temporada/preventa – plan has its own date-based prices
    return (selectedPlan.precios as any)[dateCategory] || 0;
  }, [selectedCampingId, selectedPlan, pricingConfig, dateCategory, nights]);

  const addonsTotal = dynamicAddons.filter(a => selectedAddons.includes(a.id)).reduce((acc, curr) => {
    const qty = (curr as any).allowMultiple ? (addonQuantities[curr.id] || 1) : 1;
    return acc + curr.price * qty;
  }, 0);
  const extraPersonsTotal = isFamiliarMode ? extraPersons * (pricingConfig?.persona_adicional || 100000) : 0;
  const total = totalBase + addonsTotal + extraPersonsTotal;
  const deposit = Math.round(total * 0.5);

  // ── Validation ───────────────────────────────────────────────────────────

  const isStepValid = useMemo(() => {
    switch (step) {
      case "plan": return selectedPlanId !== null && selectedPlanId !== "none";
      case "camping": return !!selectedCampingId;
      case "dates": return !!range.from && !!range.to;
      case "addons": return true;
      case "guest": return !!(fullName && email && idNumber && phone);
      case "payment": return false;
    }
  }, [step, selectedCampingId, selectedPlanId, range, fullName, email, idNumber, phone]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleNext = () => {
    if (!isStepValid) {
      toast({ title: "Atención", description: "Completa la selección actual para continuar.", variant: "destructive" });
      return;
    }
    if (step === "plan") {
      const plan = dynamicPlans.find(p => p.id === selectedPlanId);
      if (plan && plan.campingIds && plan.campingIds.length >= 1) {
        setSelectedCampingId(plan.campingIds[0]);
        const c = dynamicCampings.find(c => c.id === plan.campingIds![0]);
        if (c) setIsFamiliarMode(c.isFamiliar);
      } else if (!initCampingId) {
        toast({
          title: "Plan sin glamping asignado",
          description: "Este plan aún no tiene un glamping asignado. Por favor selecciona el plan desde la página de un glamping.",
          variant: "destructive"
        });
        return;
      }
      setStep("dates");
      return;
    }
    if (step === "dates") { setStep("addons"); return; }
    if (step === "addons") { setStep("guest"); return; }
    if (step === "guest") { handleBookingPreCheck(); return; }
  };

  const handleBack = () => {
    if (step === "plan") { setLocation("/"); return; }
    if (step === "dates") { setStep("plan"); return; }
    if (step === "addons") { setStep("dates"); return; }
    if (step === "guest") { setStep("addons"); return; }
    if (step === "payment") { setStep("guest"); return; }
    setLocation("/");
  };

  // ── Addon toggle ─────────────────────────────────────────────────────────

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
    setAddonQuantities(prev => ({ ...prev, [addonId]: prev[addonId] || 1 }));
  };

  const handleAddonQty = (addonId: string, delta: number, maxQty: number) => {
    setAddonQuantities(prev => {
      const current = prev[addonId] || 0;
      const newQty = Math.max(0, Math.min(maxQty, current + delta));
      setSelectedAddons(sa =>
        newQty > 0 && !sa.includes(addonId) ? [...sa, addonId] :
        newQty === 0 ? sa.filter(id => id !== addonId) : sa
      );
      return { ...prev, [addonId]: newQty };
    });
  };

  // ── Bank info ────────────────────────────────────────────────────────────

  const paymentMethods = [
    { id: "nequi", label: "Nequi", value: "3103272630", logo: "/images/nequi-logo.png", accentColor: "#7B2D8B", bgColor: "#ffffff", logoBg: "#ffffff", border: "1.5px solid #e5e7eb" },
    { id: "daviplata", label: "Daviplata", value: "3103272630", logo: "/images/daviplata-logo.png", accentColor: "#C8102E", bgColor: "#ffffff", logoBg: "#E3001B", border: "none" },
    { id: "llave", label: "Llave Daviplata", value: "@Davi3103272630", logo: "/images/daviplata-logo.png", accentColor: "#C8102E", bgColor: "#ffffff", logoBg: "#E3001B", border: "none" },
  ];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado", description: "Información copiada al portapapeles" });
  };

  // ── Receipt upload ───────────────────────────────────────────────────────

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "El archivo es muy grande. Máximo 5MB.", variant: "destructive" });
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── Booking image ────────────────────────────────────────────────────────

  const generateBookingImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const activeAddonNames = dynamicAddons.filter(a => selectedAddons.includes(a.id)).map(a => {
        const qty = (a as any).allowMultiple ? (addonQuantities[a.id] || 1) : 1;
        return qty > 1 ? `${a.title} ×${qty}` : a.title;
      });
      const addonsBlockH = activeAddonNames.length > 0 ? 60 + activeAddonNames.length * 28 : 0;
      const W = 800;

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";

      const drawVoucher = (logo: HTMLImageElement | null) => {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = 980 + addonsBlockH;
        const ctx = canvas.getContext("2d")!;

        // ── Background ──────────────────────────────────────────────────────
        ctx.fillStyle = "#F5F2EB";
        ctx.fillRect(0, 0, W, canvas.height);

        // ── Header ──────────────────────────────────────────────────────────
        const hdrH = 160;
        ctx.fillStyle = "#0f2419";
        ctx.fillRect(0, 0, W, hdrH);
        // gold accent bar
        ctx.fillStyle = "#C9A84C";
        ctx.fillRect(0, hdrH - 4, W, 4);

        // logo circle (left)
        if (logo) {
          const lSize = 90;
          const lx = 40, ly = (hdrH - lSize) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(lx + lSize / 2, ly + lSize / 2, lSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logo, lx, ly, lSize, lSize);
          ctx.restore();
          // gold border
          ctx.strokeStyle = "#C9A84C";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(lx + lSize / 2, ly + lSize / 2, lSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        // title text (centered)
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "bold 42px Georgia, serif";
        ctx.fillText("Carupa Glamping", W / 2 + (logo ? 25 : 0), 62);
        ctx.fillStyle = "#C9A84C";
        ctx.font = "bold 13px Arial, sans-serif";
        ctx.letterSpacing = "5px";
        ctx.fillText("CONFIRMACIÓN DE RESERVA", W / 2 + (logo ? 25 : 0), 96);
        ctx.letterSpacing = "0px";
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = "11px Arial, sans-serif";
        ctx.fillText("Carmen de Carupa · Cundinamarca, Colombia", W / 2 + (logo ? 25 : 0), 118);
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "10px Arial, sans-serif";
        ctx.fillText("reservas@carupaglamping.com  ·  +57 310 327 2630", W / 2 + (logo ? 25 : 0), 138);

        // ── Reference badge ─────────────────────────────────────────────────
        ctx.textAlign = "center";
        const badgeW = 300, badgeH = 44;
        const bx = (W - badgeW) / 2, by = hdrH + 18;
        ctx.fillStyle = "#0f2419";
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 22);
        ctx.fill();
        ctx.strokeStyle = "#C9A84C";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 22);
        ctx.stroke();
        ctx.fillStyle = "#C9A84C";
        ctx.font = "bold 15px Georgia, serif";
        ctx.fillText(`Referencia: ${bookingRef || "---"}`, W / 2, by + 28);

        // ── Section: Detalles ────────────────────────────────────────────────
        let y = hdrH + 84;
        ctx.textAlign = "left";
        ctx.fillStyle = "#0f2419";
        ctx.font = "bold 18px Georgia, serif";
        ctx.fillText("Detalles de la Reserva", 50, y);
        ctx.strokeStyle = "#C9A84C";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(50, y + 8);
        ctx.lineTo(W - 50, y + 8);
        ctx.stroke();
        y += 28;

        const alojamientoLabel = isFamiliarMode
          ? `Domo Familiar (${2 + extraPersons} pers.)`
          : (selectedCamping?.name || "---");
        const planLabel = selectedPlan ? selectedPlan.nombre : "Solo Alojamiento";
        const checkInDate = range.from ? format(range.from, "EEEE dd 'de' MMMM yyyy", { locale: es }) : "---";
        const checkOutDate = range.to ? format(range.to, "EEEE dd 'de' MMMM yyyy", { locale: es }) : "---";

        const details = [
          { label: "Huésped", value: fullName },
          { label: "Cédula / ID", value: idNumber },
          { label: "Teléfono", value: phone },
          { label: "Email", value: email },
          { label: "Plan", value: planLabel },
          { label: "Alojamiento", value: alojamientoLabel },
          { label: "Check-in", value: checkInDate },
          { label: "Check-out", value: checkOutDate },
          { label: "Total reserva", value: `$${total.toLocaleString()} COP` },
          { label: "Anticipo (50%)", value: `$${deposit.toLocaleString()} COP` },
          { label: "Saldo al llegar", value: `$${(total - deposit).toLocaleString()} COP` },
        ];

        details.forEach(({ label, value }, i) => {
          ctx.fillStyle = i % 2 === 0 ? "#FFFFFF" : "#EDE9DF";
          ctx.beginPath();
          ctx.roundRect(50, y - 16, W - 100, 36, 5);
          ctx.fill();
          ctx.fillStyle = "#5C6470";
          ctx.font = "12px Arial, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(label + ":", 66, y + 5);
          ctx.fillStyle = "#0f2419";
          ctx.font = "bold 13px Arial, sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(value, W - 66, y + 5);
          y += 40;
        });
        ctx.textAlign = "left";

        // ── Adicionales ─────────────────────────────────────────────────────
        if (activeAddonNames.length > 0) {
          y += 14;
          ctx.fillStyle = "#0f2419";
          ctx.font = "bold 16px Georgia, serif";
          ctx.fillText("Adicionales", 50, y);
          ctx.strokeStyle = "#C9A84C";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(50, y + 8);
          ctx.lineTo(W - 50, y + 8);
          ctx.stroke();
          y += 26;
          ctx.font = "13px Arial, sans-serif";
          activeAddonNames.forEach(name => {
            ctx.fillStyle = "#C9A84C";
            ctx.fillText("▸", 58, y);
            ctx.fillStyle = "#374151";
            ctx.fillText(name, 80, y);
            y += 28;
          });
        }

        // ── Info box ────────────────────────────────────────────────────────
        y += 20;
        ctx.fillStyle = "#E3EDE5";
        ctx.strokeStyle = "#0f2419";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(50, y, W - 100, 96, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#0f2419";
        ctx.font = "bold 13px Arial, sans-serif";
        ctx.fillText("🕒  Check-in: 3:00 PM – 9:30 PM   |   Check-out: antes de 12:30 PM", 70, y + 28);
        ctx.fillStyle = "#2C5134";
        ctx.font = "12px Arial, sans-serif";
        ctx.fillText("El saldo pendiente se abona al momento de llegar a Carupa Glamping.", 70, y + 52);
        ctx.fillText("Presenta este comprobante al momento de tu llegada.", 70, y + 72);
        y += 116;

        // ── Footer ──────────────────────────────────────────────────────────
        ctx.fillStyle = "#0f2419";
        ctx.fillRect(0, y, W, 64);
        ctx.fillStyle = "#C9A84C";
        ctx.font = "bold 14px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("Carupa Glamping  ·  WhatsApp: +57 310 327 2630", W / 2, y + 26);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "11px Arial, sans-serif";
        ctx.fillText("@carupaglamping  ·  reservas@carupaglamping.com", W / 2, y + 46);

        resolve(canvas.toDataURL("image/png"));
      };

      logoImg.onload = () => drawVoucher(logoImg);
      logoImg.onerror = () => drawVoucher(null);
      logoImg.src = "/images/carupa-logo.png";
    });
  };

  // ── Booking pre-check / submit ────────────────────────────────────────────

  const handleBookingPreCheck = () => {
    if (!selectedCampingId || !range.from || !range.to || !fullName || !idNumber || !phone || !email) {
      toast({ title: "Datos incompletos", description: "Por favor completa todos los campos requeridos.", variant: "destructive" });
      return;
    }
    setShowPolicies(true);
  };

  const handleBooking = async () => {
    if (!acceptedPolicies) {
      toast({ title: "Atención", description: "Debes aceptar las políticas para continuar.", variant: "destructive" });
      return;
    }
    setShowPolicies(false);
    setIsBooking(true);
    try {
      const response = await fetch("/api/crear-reserva.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan?.nombre || "Solo Alojamiento",
          camping: isFamiliarMode ? "Domo Familiar" : (selectedCamping?.name || ""),
          unidad: isFamiliarMode ? "Domo Familiar" : (selectedCamping?.name || ""),
          fecha_inicio: range.from ? format(range.from, "yyyy-MM-dd") : "",
          fecha_fin: range.to ? format(range.to, "yyyy-MM-dd") : "",
          adicionales: [
            ...dynamicAddons
              .filter(a => selectedAddons.includes(a.id))
              .map(a => {
                const qty = (a as any).allowMultiple ? (addonQuantities[a.id] || 1) : 1;
                return qty > 1 ? `${a.title} ×${qty}` : a.title;
              }),
            ...(isFamiliarMode && extraPersons > 0 ? [`${extraPersons} persona(s) adicional(es)`] : [])
          ],
          total: total,
          nombre: fullName,
          telefono: phone,
          email: email
        })
      });
      const data = await response.json();
      if (data.success) {
        setBookingRef(data.referencia);
        setStep("payment");
      } else {
        throw new Error(data.error || "Error al crear reserva");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsBooking(false);
    }
  };

  const handlePaymentComplete = async () => {
    if (!receiptFile) {
      toast({ title: "Error", description: "Por favor sube el comprobante de pago.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      formData.append("referencia", bookingRef || "");
      formData.append("total", deposit.toString());
      const response = await fetch("/api/confirmar-pago", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        const bookingImageUrl = await generateBookingImage();
        const link = document.createElement("a");
        link.href = bookingImageUrl;
        link.download = `reserva-carupa-${bookingRef}.png`;
        link.click();
        // Also download the reglamento as a separate file
        setTimeout(() => {
          const regLink = document.createElement("a");
          regLink.href = "/images/reglamento-carupa.jpeg";
          regLink.download = "reglamento-carupa-glamping.jpeg";
          regLink.click();
        }, 600);
        const alojamientoLabel = isFamiliarMode
          ? `Domo Familiar (${2 + extraPersons} personas)`
          : (selectedCamping?.name || "---");
        const whatsappMessage = encodeURIComponent(
          `¡Hola! Acabo de realizar mi reserva en Carupa Glamping.\n\n` +
          `Referencia: ${bookingRef}\n` +
          `Nombre: ${fullName}\n` +
          `Plan: ${selectedPlan?.nombre || "Solo Alojamiento"}\n` +
          `Alojamiento: ${alojamientoLabel}\n` +
          `Fechas: ${range.from ? format(range.from, "dd/MM/yyyy") : ""} - ${range.to ? format(range.to, "dd/MM/yyyy") : ""}\n` +
          `Anticipo: $${deposit.toLocaleString()} COP\n\n` +
          `Adjunto mi comprobante de pago y confirmación de reserva.`
        );
        setWhatsappRedirectUrl(`https://wa.me/573103272630?text=${whatsappMessage}`);
        setShowSuccess(true);
      } else {
        throw new Error(data.error || "Error al confirmar pago");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Step labels ───────────────────────────────────────────────────────────

  const stepOrder: Step[] = ["plan", "dates", "addons", "guest", "payment"];

  const stepLabels: Record<Step, string> = {
    plan: "Elige tu Plan",
    camping: "Elige tu Domo",
    dates: isPasaDia ? "Elige el Día" : "Fechas y Llegada",
    addons: "Adicionales",
    guest: "Tus Datos",
    payment: "Finalizar Pago",
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif text-primary mb-4">¡Reserva Confirmada!</h1>
          <p className="text-stone-500 mb-6">Hemos recibido tu pago. Por favor envíanos tu comprobante por WhatsApp para completar el proceso.</p>
          {whatsappRedirectUrl && (
            <a href={whatsappRedirectUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-widest mb-4 transition-colors">
              <MessageCircle className="w-5 h-5" /> Enviar a WhatsApp
            </a>
          )}
          <Button onClick={() => setLocation("/")} variant="outline" className="w-full h-14 rounded-2xl border-primary text-primary font-bold uppercase tracking-widest">
            Volver al inicio
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-8 md:py-16 px-4 relative">

      {/* Policies Modal */}
      {showPolicies && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col">
            <div className="p-8 border-b border-stone-100 bg-stone-50/50">
              <h2 className="text-2xl font-serif text-primary">Requisitos y Políticas de Reserva</h2>
              <p className="text-sm text-stone-500 mt-1">Por favor lee atentamente antes de proceder al pago.</p>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl">
                <h3 className="text-lg font-bold text-accent flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" /> Información Importante
                </h3>
                <p className="text-primary font-medium leading-relaxed text-base">
                  Carupa Glamping es un espacio diseñado exclusivamente para <span className="underline decoration-accent decoration-2">parejas</span>. Para garantizar la tranquilidad y la experiencia de conexión, <span className="font-bold">no se permite el ingreso de mascotas ni niños</span>.
                </p>
              </div>
              <div className="space-y-6 text-stone-600 text-sm leading-relaxed text-justify">
                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">1. Reservas y Pagos</h4>
                  <p>1.1 La reserva se confirma con un anticipo del 50%. El saldo restante se cancela al llegar o al momento del check-out.</p>
                  <p>1.2 <strong>Cambio de fecha:</strong> Se permite un cambio de fecha con mínimo 9 días de anticipación y según disponibilidad. No hay reembolsos.</p>
                  <p>1.3 No se aceptan cambios ni devoluciones si se solicitan el día anterior o el mismo día de la reserva.</p>
                  <p>1.4 Bonos y promociones no tienen reembolso ni cambios. La reserva puede transferirse a otra persona con aviso previo y validación.</p>
                  <p>1.5 La no presentación implica pérdida total del anticipo, sin reembolso ni reprogramación.</p>
                  <p>1.6 Cambios por calamidad solo aplican por fallecimiento de familiares directos con soporte. No hay reembolso.</p>
                  <p>1.7 <strong>Pagos con datáfono o link de pago:</strong> tienen un recargo del 8% sobre el valor total. Pagos por Nequi, Daviplata o Transfiya no generan cobros adicionales.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">2. Check-in y Check-out</h4>
                  <p>2.1 Check-in: De 3:00 p.m. a 9:30 p.m. el día de la reserva.</p>
                  <p>2.2 Check-out: Hasta las 12:30 p.m. del día siguiente. Puede usar las áreas comunes hasta las 2:00 p.m.</p>
                  <p>2.3 Llegadas fuera del horario establecido no tienen reembolso, cambios ni reasignación.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">3. Responsabilidades</h4>
                  <p>3.1 Carupa Glamping no se hace responsable por errores del huésped al momento de reservar.</p>
                  <p>3.2 No se realizan reembolsos por malentendidos claramente especificados en la información del plan.</p>
                  <p>3.3 No hay reembolsos por condiciones climáticas, cortes de luz o situaciones externas.</p>
                  <p>3.4 Paros, derrumbes o cierres de vías permiten cambio de fecha sin costo, sujeto a disponibilidad.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">4. Normas del Establecimiento</h4>
                  <p>4.1 No se permite el ingreso de alimentos sin previa autorización. Costo por descorche: $50.000 COP.</p>
                  <p>4.2 Está prohibido fumar dentro del domo. Cargo de $120.000 COP por desinfección.</p>
                  <p>4.3 No se permiten velas ni inciensos dentro del domo.</p>
                  <p>4.4 Jacuzzi: tiempo máximo 2 horas, horario 3:00-10:00 p.m. Segundo uso: $80.000 COP.</p>
                  <p>4.5 Mantener volumen moderado y respetar la tranquilidad del entorno.</p>
                </section>
                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">5. Seguridad</h4>
                  <p>• Cámaras de seguridad en áreas comunes. Grabaciones confidenciales.</p>
                  <p>• Los daños a la propiedad deberán ser pagados por el huésped.</p>
                  <p>• No se toleran agresiones. Comportamiento violento = expulsión inmediata.</p>
                </section>
              </div>
            </div>
            <div className="p-8 border-t border-stone-100 bg-stone-50/30 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-stone-200">
                <Checkbox id="accept-policies" checked={acceptedPolicies}
                  onCheckedChange={(checked) => setAcceptedPolicies(checked as boolean)} className="mt-1" />
                <Label htmlFor="accept-policies" className="text-sm text-stone-600 cursor-pointer leading-tight">
                  He leído y acepto los requisitos y políticas, incluyendo que es un espacio <span className="font-bold text-primary">solo para parejas adultos, sin niños ni mascotas</span>.
                </Label>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowPolicies(false)} className="flex-1 h-14 rounded-2xl border-stone-200 text-stone-500 font-bold uppercase tracking-widest">Cancelar</Button>
                <Button onClick={handleBooking} disabled={!acceptedPolicies || isBooking}
                  className="flex-[2] h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest shadow-lg disabled:opacity-50">
                  {isBooking ? "Procesando..." : "Continuar al Pago"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-stone-400 hover:text-accent mb-8 transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-widest">Regresar</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
              <h1 className="text-4xl font-serif text-primary mb-2">Tu Experiencia Carupa Glamping</h1>
              <p className="text-stone-500 mb-8">Personaliza cada detalle de tu refugio en la naturaleza.</p>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
                {(["plan", "dates", "addons", "guest"] as Step[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-2 shrink-0">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      stepOrder.indexOf(step) > i ? "bg-accent text-white" :
                      step === s ? "bg-accent text-white ring-4 ring-accent/20" :
                      "bg-stone-100 text-stone-400"
                    )}>
                      {stepOrder.indexOf(step) > i ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider hidden sm:block",
                      step === s ? "text-accent" : stepOrder.indexOf(step) > i ? "text-stone-400" : "text-stone-300"
                    )}>{stepLabels[s]}</span>
                    {i < 3 && <div className={cn("w-6 h-0.5 shrink-0", stepOrder.indexOf(step) > i ? "bg-accent/40" : "bg-stone-100")} />}
                  </div>
                ))}
              </div>

              {activeBanners.filter(b => b.pasos.includes(step)).length > 0 && (
                <div className="space-y-3 mb-2">
                  {activeBanners.filter(b => b.pasos.includes(step)).map(banner => (
                    <div key={banner.id} className="rounded-2xl p-4" style={{ background: banner.bgColor, color: banner.textColor }}>
                      {banner.titulo && <p className="font-bold text-sm mb-1">{banner.titulo}</p>}
                      {banner.texto && (
                        <p className="whitespace-pre-wrap" style={{
                          fontSize: banner.fontSize ? `${banner.fontSize}px` : "14px",
                          lineHeight: banner.lineHeight ? banner.lineHeight : 1.6,
                          letterSpacing: banner.letterSpacing ? `${banner.letterSpacing}px` : "normal"
                        }}>{banner.texto}</p>
                      )}
                      {banner.imagen && <img src={banner.imagen} alt={banner.titulo || "Información"} className="mt-3 w-full rounded-xl object-cover max-h-52" />}
                    </div>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* ── Step: Pick Plan ────────────────────────────────────── */}
                {step === "plan" && (
                  <motion.section key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><Sparkles className="w-4 h-4" /></div>
                      <h2 className="text-xl font-serif">Elige tu Plan</h2>
                    </div>

                    <div className="space-y-3">
                      {/* Dynamic plans */}
                      {plansForCamping.map((plan) => {
                        const IconComp = getIconComponent(plan.icono);
                        const isSelected = selectedPlanId === plan.id;
                        return (
                          <div key={plan.id}>
                            <button
                              onClick={() => setSelectedPlanId(plan.id)}
                              className={cn(
                                "w-full text-left p-5 rounded-3xl border transition-all",
                                isSelected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-stone-100 bg-stone-50/30 hover:bg-white"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${plan.color}20` }}>
                                  <IconComp className="w-4 h-4" style={{ color: plan.color }} />
                                </div>
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-stone-800">{plan.nombre}</h3>
                                    {plan.tipo === "pasa_dia" && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Pasa Día</span>}
                                    {plan.preventa && <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase">Preventa</span>}
                                  </div>
                                  <p className="text-[11px] text-stone-500 mt-0.5">{plan.eslogan}</p>
                                </div>
                              </div>
                            </button>
                            <AnimatePresence>
                              {isSelected && plan.incluye && plan.incluye.length > 0 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="px-5 pb-4 pt-2 bg-accent/5 rounded-b-2xl -mt-2 border border-t-0 border-accent/20">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Este plan incluye:</p>
                                    <div className="grid grid-cols-2 gap-1">
                                      {plan.incluye.map((f, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-stone-600">
                                          <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                                          {f}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                    {selectedPlanId === null && <p className="text-xs text-red-500 italic">Selecciona un plan para continuar</p>}
                  </motion.section>
                )}

                {/* ── Step: Dates ────────────────────────────────────────── */}
                {step === "dates" && (
                  <motion.section key="dates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><CalendarIcon className="w-4 h-4" /></div>
                      <h2 className="text-xl font-serif">{isPasaDia ? "Elige el Día del Pasa Día" : "Fechas y Llegada"}</h2>
                    </div>

                    {isPasaDia && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-stone-600 flex items-start gap-2">
                        <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Pasa Día: <strong>9:00 am – 6:00 pm</strong>. Check-in y check-out el mismo día.</span>
                      </div>
                    )}

                    {!isPasaDia && (
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-2 text-sm text-stone-500">
                        <Info className="w-4 h-4 text-accent" />
                        <span>Check-in: 3:00 PM - 9:30 PM | Check-out: 12:30 PM del día siguiente</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                          {isPasaDia ? "Día de visita" : "Fecha de check-in"}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-normal border-stone-100 bg-stone-50/50 rounded-2xl hover:bg-white transition-all", !range.from && "text-stone-400")}>
                              <CalendarIcon className="mr-3 h-5 w-5 text-accent" />
                              {range.from ? (
                                isPasaDia
                                  ? <span>Día: {format(range.from, "dd MMM yyyy", { locale: es })}</span>
                                  : <span>Llegada: {format(range.from, "dd MMM", { locale: es })} (2 Días / 1 Noche)</span>
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none" align="start">
                            <Calendar
                              initialFocus
                              mode="single"
                              selected={range.from}
                              onSelect={(d: any) => {
                                if (d) {
                                  if (isPasaDia) {
                                    setRange({ from: d, to: d });
                                  } else {
                                    const to = new Date(d);
                                    to.setDate(d.getDate() + 1);
                                    setRange({ from: d, to });
                                  }
                                }
                              }}
                              disabled={isDateDisabled}
                              locale={es}
                              className="p-4"
                            />
                          </PopoverContent>
                        </Popover>
                        {!range.from && <p className="text-xs text-red-500 italic">Selecciona la fecha para continuar</p>}
                        {range.from && pricingConfig && (
                          <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-xl border border-accent/20">
                            <CalendarIcon className="w-4 h-4 text-accent" />
                            <div>
                              <p className="text-xs font-bold text-accent uppercase tracking-wider">{dateCategoryLabel[dateCategory]}</p>
                              <p className="text-xs text-stone-500">
                                {selectedPlan?.tipo === "pasa_dia"
                                  ? `Precio del día: $${((selectedPlan.precios as any)[dateCategory] || 0).toLocaleString()} COP`
                                  : `Tarifa base: $${(pricingConfig.tarifas[dateCategory] || 0).toLocaleString()} COP / noche`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isPasaDia && (
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">Hora de llegada</Label>
                          <RadioGroup value={arrivalTime} onValueChange={setArrivalTime} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"].map((time) => (
                              <Label key={time} className={cn("flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all",
                                arrivalTime === time ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-stone-100 bg-stone-50/30 hover:bg-white")}>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value={time} id={time} className="sr-only" />
                                  <Clock className={cn("w-3 h-3", arrivalTime === time ? "text-accent" : "text-stone-300")} />
                                  <span className="text-xs font-medium">{time}</span>
                                </div>
                                {arrivalTime === time && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                              </Label>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    {/* Extra persons for Domo Familiar */}
                    {isFamiliarMode && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                        <Label className="text-xs uppercase tracking-widest font-bold text-stone-500 block">
                          Personas adicionales
                          <span className="ml-2 font-normal text-stone-400 normal-case">+${(pricingConfig?.persona_adicional || 100000).toLocaleString()} por persona</span>
                        </Label>
                        <div className="flex items-center gap-5">
                          <button onClick={() => setExtraPersons(Math.max(0, extraPersons - 1))}
                            className="w-10 h-10 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-accent hover:text-accent transition-all font-bold text-lg">−</button>
                          <span className="text-3xl font-bold w-8 text-center tabular-nums">{extraPersons}</span>
                          <button onClick={() => setExtraPersons(Math.min(pricingConfig?.max_adicionales || 4, extraPersons + 1))}
                            className="w-10 h-10 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-accent hover:text-accent transition-all font-bold text-lg">+</button>
                          <span className="text-sm text-stone-500">extra (máx. {pricingConfig?.max_adicionales || 4})</span>
                        </div>
                        <p className="text-xs text-stone-500 italic">Total de personas: <strong>{2 + extraPersons}</strong></p>
                      </div>
                    )}

                    <button onClick={handleBack} className="flex items-center gap-1 text-xs text-stone-400 hover:text-accent transition-colors mt-2">
                      <ChevronLeft className="w-4 h-4" /> Cambiar plan
                    </button>
                  </motion.section>
                )}

                {/* ── Step: Addons ───────────────────────────────────────── */}
                {step === "addons" && (
                  <motion.section key="addons" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><Gift className="w-4 h-4" /></div>
                      <h2 className="text-xl font-serif">Adicionales (Opcional)</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {dynamicAddons.map((addon) => {
                        const addonExt = addon as any;
                        const isSelected = selectedAddons.includes(addon.id);
                        const qty = addonExt.allowMultiple ? (addonQuantities[addon.id] || 0) : (isSelected ? 1 : 0);
                        return (
                          <div key={addon.id} className={cn("flex flex-col p-5 rounded-3xl border transition-all",
                            isSelected ? "border-accent bg-accent/5" : "border-stone-100 bg-stone-50/30 hover:bg-white")}>
                            <div className="flex items-center gap-4">
                              {addonExt.allowMultiple ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleAddonQty(addon.id, -1, addonExt.maxQuantity || 10)}
                                    disabled={qty === 0}
                                    className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 disabled:opacity-30 text-sm font-bold leading-none"
                                  >−</button>
                                  <span className={cn("w-6 text-center text-sm font-bold", qty > 0 ? "text-accent" : "text-stone-300")}>{qty}</span>
                                  <button
                                    onClick={() => handleAddonQty(addon.id, 1, addonExt.maxQuantity || 10)}
                                    disabled={qty >= (addonExt.maxQuantity || 10)}
                                    className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/20 disabled:opacity-30 text-sm font-bold leading-none"
                                  >+</button>
                                </div>
                              ) : (
                                <Checkbox checked={isSelected} onCheckedChange={() => handleAddonToggle(addon.id)} className="rounded-full border-stone-200" />
                              )}
                              <div className={cn("flex-grow", !addonExt.allowMultiple && "cursor-pointer")} onClick={() => !addonExt.allowMultiple && handleAddonToggle(addon.id)}>
                                <h3 className="text-sm font-bold">{addon.title}</h3>
                                <p className="text-[10px] text-stone-500">{addon.description}</p>
                                {addonExt.allowMultiple && (
                                  <p className="text-[9px] text-stone-400 mt-0.5">c/u · máx. {addonExt.maxQuantity || 10}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-stone-400">${addon.price.toLocaleString()}</span>
                                {addonExt.allowMultiple && qty > 1 && (
                                  <p className="text-[10px] font-bold text-accent">${(addon.price * qty).toLocaleString()}</p>
                                )}
                              </div>
                            </div>
                            {addon.details && (
                              <div className="mt-4 pt-4 border-t border-stone-100">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-widest font-bold text-accent hover:text-accent hover:bg-accent/10 px-0">
                                      <Info className="w-3 h-3 mr-1.5" /> Ver detalles
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-stone-100">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">¿Qué incluye?</h4>
                                    <ul className="space-y-2">
                                      {addon.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-[11px] text-stone-600">
                                          <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                                          {detail}
                                        </li>
                                      ))}
                                    </ul>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={handleBack} className="flex items-center gap-1 text-xs text-stone-400 hover:text-accent transition-colors mt-2">
                      <ChevronLeft className="w-4 h-4" /> Volver a fechas
                    </button>
                  </motion.section>
                )}

                {/* ── Step: Guest info ───────────────────────────────────── */}
                {step === "guest" && (
                  <motion.section key="guest" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"><User className="w-4 h-4" /></div>
                      <h2 className="text-xl font-serif">Información del Huésped</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3"><Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">Nombre Completo</Label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" /><Input placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all" /></div></div>
                      <div className="space-y-3"><Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">Correo Electrónico</Label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" /><Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all" /></div></div>
                      <div className="space-y-3"><Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">Cédula / ID</Label><div className="relative"><IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" /><Input placeholder="Número de ID" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all" /></div></div>
                      <div className="space-y-3"><Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">WhatsApp</Label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" /><Input placeholder="+57 300 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all" /></div></div>
                    </div>
                    <button onClick={handleBack} className="flex items-center gap-1 text-xs text-stone-400 hover:text-accent transition-colors mt-2">
                      <ChevronLeft className="w-4 h-4" /> Volver a adicionales
                    </button>
                  </motion.section>
                )}

                {/* ── Step: Payment ──────────────────────────────────────── */}
                {step === "payment" && (
                  <motion.section key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 py-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <h2 className="text-3xl font-serif">Finalizar Reserva</h2>
                      <p className="text-stone-500 max-w-sm">Para confirmar tu estancia, realiza el pago del anticipo de <span className="font-bold text-primary">${deposit.toLocaleString()} COP</span></p>
                      <p className="text-xs text-stone-400 font-mono bg-stone-50 px-4 py-2 rounded-xl">REFERENCIA: {bookingRef}</p>
                    </div>

                    {/* ── Business info ──────────────────────────────── */}
                    <div className="bg-primary/5 border border-primary/15 rounded-3xl p-5 max-w-md mx-auto text-center space-y-1">
                      <p className="font-bold text-primary text-lg">Carupa Glamping ✨</p>
                      <p className="text-sm text-stone-600">Titular: <span className="font-semibold">Robinson Galvis</span></p>
                      <p className="text-xs text-stone-400">RNT (Registro Nacional de Turismo) <span className="font-semibold text-stone-500">87112</span></p>
                    </div>

                    {/* ── Transfer methods ───────────────────────────── */}
                    <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 max-w-md mx-auto space-y-4">
                      <h3 className="font-bold text-primary text-center text-lg mb-2">📲 Transferencia Bancaria</h3>
                      {paymentMethods.map(({ id, label, value, logo, accentColor, logoBg, border }) => (
                        <div key={id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div
                              className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                              style={{ background: logoBg, border, width: 72, height: 44 }}
                            >
                              <img src={logo} alt={label} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: accentColor }}>{label}</p>
                              <p className="text-base font-bold text-stone-800">{value}</p>
                            </div>
                          </div>
                          <button onClick={() => copyToClipboard(value, id)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors shrink-0">
                            {copiedField === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-stone-400" />}
                          </button>
                        </div>
                      ))}
                      <div className="bg-accent/10 p-4 rounded-2xl border border-accent/20 text-center">
                        <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Monto a transferir (anticipo 50%)</p>
                        <p className="text-3xl font-bold text-primary">${deposit.toLocaleString()} COP</p>
                      </div>
                      <p className="text-[10px] text-stone-400 text-center italic">Transfiere a cualquiera de los métodos y sube el comprobante abajo.</p>
                    </div>

                    {/* ── Link / Financing methods ───────────────────── */}
                    <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 max-w-md mx-auto space-y-4">
                      <h3 className="font-bold text-primary text-center text-lg mb-2">🔗 Pago con Enlace / Financiamiento</h3>
                      <p className="text-[11px] text-stone-400 text-center -mt-2">Si prefieres pagar con tarjeta, PSE o cuotas, solicítalo por WhatsApp.</p>

                      {/* Bold card */}
                      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl shrink-0 flex items-center justify-center bg-[#1A1A2E] overflow-hidden" style={{ width: 72, height: 44 }}>
                            <span className="text-white font-extrabold text-lg tracking-tight">bold.</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#6C47FF]">Tarjeta / PSE</p>
                            <p className="text-sm font-semibold text-stone-700">Link de pago Bold</p>
                            <p className="text-[10px] text-stone-400">Recargo del 8% sobre el total</p>
                          </div>
                        </div>
                        <a
                          href={(() => {
                            const alojamiento = isFamiliarMode ? `Domo Familiar (${2 + extraPersons} personas)` : (selectedCamping?.name || "---");
                            const msg = encodeURIComponent(
                              `¡Hola! 🌿 Quiero pagar mi reserva en Carupa Glamping con Tarjeta o PSE (Bold).\n\n` +
                              `📋 Datos de mi reserva:\n` +
                              `🔖 Referencia: ${bookingRef}\n` +
                              `👤 Nombre: ${fullName}\n` +
                              `🏕️ Domo: ${alojamiento}\n` +
                              `📅 Fechas: ${range.from ? format(range.from, "dd/MM/yyyy") : ""} – ${range.to ? format(range.to, "dd/MM/yyyy") : ""}\n` +
                              `💰 Anticipo (50%): $${deposit.toLocaleString()} COP\n\n` +
                              `¿Podrían enviarme el link de pago Bold? 🙏`
                            );
                            return `https://wa.me/573103272630?text=${msg}`;
                          })()}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#6C47FF] hover:bg-[#5835e0] text-white text-sm font-bold transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" /> Solicitar enlace Bold por WhatsApp
                        </a>
                      </div>

                      {/* Addi card */}
                      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl shrink-0 flex items-center justify-center bg-[#FF4F17] overflow-hidden" style={{ width: 72, height: 44 }}>
                            <span className="text-white font-extrabold text-lg tracking-tight">addi</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#FF4F17]">Cupo Addi</p>
                            <p className="text-sm font-semibold text-stone-700">Financiamiento total</p>
                            <p className="text-[10px] text-stone-400">Paga la totalidad en cuotas</p>
                          </div>
                        </div>
                        <a
                          href={(() => {
                            const alojamiento = isFamiliarMode ? `Domo Familiar (${2 + extraPersons} personas)` : (selectedCamping?.name || "---");
                            const msg = encodeURIComponent(
                              `¡Hola! 🌿 Quiero financiar mi reserva en Carupa Glamping con Cupo Addi.\n\n` +
                              `📋 Datos de mi reserva:\n` +
                              `🔖 Referencia: ${bookingRef}\n` +
                              `👤 Nombre: ${fullName}\n` +
                              `🏕️ Domo: ${alojamiento}\n` +
                              `📅 Fechas: ${range.from ? format(range.from, "dd/MM/yyyy") : ""} – ${range.to ? format(range.to, "dd/MM/yyyy") : ""}\n` +
                              `💰 Total de la reserva: $${total.toLocaleString()} COP\n\n` +
                              `¿Pueden ayudarme con el proceso de financiamiento con Addi? 🙏`
                            );
                            return `https://wa.me/573103272630?text=${msg}`;
                          })()}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FF4F17] hover:bg-[#e04012] text-white text-sm font-bold transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" /> Aplicar con Addi por WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* ── Receipt upload ─────────────────────────────── */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 max-w-md mx-auto space-y-4">
                      <h3 className="font-bold text-primary flex items-center gap-2"><Upload className="w-5 h-5" /> Subir Comprobante de Pago</h3>
                      <p className="text-xs text-stone-500">Si pagaste por transferencia, sube la captura de tu transacción para confirmar.</p>
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={cn("border-2 border-dashed rounded-2xl p-8 text-center transition-all",
                          receiptPreview ? "border-green-400 bg-green-50" : "border-stone-300 hover:border-accent")}>
                          {receiptPreview ? (
                            <div className="space-y-3">
                              <img src={receiptPreview} alt="Comprobante" className="max-h-40 mx-auto rounded-lg shadow-md" />
                              <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Comprobante cargado</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-10 h-10 text-stone-300 mx-auto" />
                              <p className="text-sm text-stone-500">Arrastra o haz clic para subir</p>
                              <p className="text-[10px] text-stone-400">PNG, JPG hasta 5MB</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button onClick={handlePaymentComplete} disabled={!receiptFile || isUploading}
                        className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50">
                        {isUploading ? "Procesando..." : (
                          <span className="flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" /> Confirmar y Enviar a WhatsApp</span>
                        )}
                      </Button>
                      <p className="text-[10px] text-stone-400 text-center italic">Al confirmar, serás redirigido a WhatsApp para enviar la confirmación.</p>
                    </div>
                    <button onClick={handleBack} className="flex items-center justify-center gap-1 text-xs text-stone-400 hover:text-accent transition-colors mt-2 mx-auto">
                      <ChevronLeft className="w-4 h-4" /> Volver
                    </button>
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Sidebar summary ──────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 overflow-hidden relative">
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2"><Info className="w-5 h-5 text-accent" /> Resumen de Reserva</h3>
                <div className="space-y-4">
                  {selectedCamping ? (
                    <div>
                      <p className="text-xs text-accent font-bold uppercase tracking-wider">{isFamiliarMode ? `Domo Familiar · ${2 + extraPersons} personas` : selectedCamping.name}</p>
                    </div>
                  ) : <span className="text-xs text-white/30 italic">Domo no seleccionado</span>}

                  {selectedPlanId && selectedPlanId !== "none" && selectedPlan ? (
                    <div className="flex justify-between text-sm text-white/70">
                      <span className="italic">{selectedPlan.nombre}</span>
                      {selectedPlan.tipo === "addon" && <span className="font-bold text-white">+${(selectedPlan.precio || 0).toLocaleString()}</span>}
                    </div>
                  ) : selectedPlanId === "none" ? (
                    <span className="text-xs text-white/50 italic">Solo Alojamiento</span>
                  ) : null}

                  {range.from && pricingConfig && (
                    <div className="text-xs text-white/60">
                      <p className="text-accent font-bold uppercase tracking-wider text-[10px]">{dateCategoryLabel[dateCategory]}</p>
                      {!isPasaDia && <p>Tarifa: ${(pricingConfig.tarifas[dateCategory] || 0).toLocaleString()} / noche</p>}
                    </div>
                  )}

                  {dynamicAddons.filter(a => selectedAddons.includes(a.id)).length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-white/10">
                      {dynamicAddons.filter(a => selectedAddons.includes(a.id)).map(a => {
                        const qty = (a as any).allowMultiple ? (addonQuantities[a.id] || 1) : 1;
                        return (
                          <div key={a.id} className="flex justify-between text-[11px] text-white/50">
                            <span>{qty > 1 ? `${a.title} ×${qty}` : a.title}</span>
                            <span>+${(a.price * qty).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isFamiliarMode && extraPersons > 0 && (
                    <div className="flex justify-between text-[11px] text-white/50 pt-2 border-t border-white/10">
                      <span>{extraPersons} persona(s) adicional(es)</span>
                      <span>+${extraPersonsTotal.toLocaleString()}</span>
                    </div>
                  )}

                  {range.from && (
                    <div className="pt-2 border-t border-white/10 text-[11px] text-white/50">
                      {isPasaDia
                        ? <span>Día: {format(range.from, "dd MMM yyyy", { locale: es })}</span>
                        : range.to && <span>Del {format(range.from, "dd MMM", { locale: es })} al {format(range.to, "dd MMM", { locale: es })}</span>}
                    </div>
                  )}

                  {fullName && <div className="pt-2 border-t border-white/10 text-[11px] text-white/50"><span>Huésped: {fullName}</span></div>}

                  <div className="pt-6 border-t border-white/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm uppercase tracking-widest font-bold">Total</span>
                      <span className="text-3xl font-serif font-bold text-accent">{total > 0 ? `$${total.toLocaleString()}` : "—"}</span>
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">Anticipo (50%)</span>
                        <span className="text-xl font-bold">${deposit.toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] text-white/40 leading-relaxed">El saldo de <b>${(total - deposit).toLocaleString()}</b> se cancela al llegar.</p>
                    </div>
                  )}

                  {step !== "payment" && (
                    <Button onClick={handleNext} disabled={!isStepValid}
                      className={cn("w-full h-14 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold uppercase tracking-[0.2em] transition-all active:scale-95 group",
                        !isStepValid && "opacity-50 cursor-not-allowed")}>
                      <span className="flex items-center justify-center gap-2">
                        Continuar
                        <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
