import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit, 
  Search, 
  Tent, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Wallet, 
  Square, 
  CheckSquare, 
  Download,
  ExternalLink,
  MoreVertical,
  Filter,
  LogOut,
  EyeOff,
  Power,
  Sparkles,
  Heart,
  Film,
  Star,
  Sun,
  Moon,
  TreePine,
  Mountain,
  Flame,
  Gift,
  Tag,
  KeyRound,
  Shield,
  Camera,
  ImageIcon,
  Package,
  DollarSign,
  Bell,
  GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { campings, addons } from "@/lib/data";
import { cn } from "@/lib/utils";

type Reserva = {
  id: number;
  referencia: string;
  nombre: string;
  email?: string;
  telefono?: string;
  plan: string;
  camping: string;
  unidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  total: number;
  abono: number;
  saldo: number;
  estado: number;
  adicionales: string[] | null;
  created_at?: string;
  comprobante?: string;
};

export default function AdminDashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campingFilter, setCampingFilter] = useState("all");
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockData, setBlockData] = useState({ unidad: "all", fecha_inicio: "", fecha_fin: "" });
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let wasAuthenticated = false;

    fetch("/api/check-session.php", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (!data.logged_in) {
          setLocation("/admin/login");
        } else {
          setAuthChecked(true);
          wasAuthenticated = true;
        }
      })
      .catch(() => setLocation("/admin/login"));

    return () => {
<<<<<<< HEAD
      // Cleanup: no-op — never auto-logout on unmount
=======
      if (wasAuthenticated) {
        navigator.sendBeacon("/api/logout.php");
      }
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    };
  }, []);

  const [selectedReservas, setSelectedReservas] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calFilter, setCalFilter] = useState<"all" | "reserved" | "blocked" | "free">("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Fill previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday...
    
    for (let i = firstDayOfWeek; i > 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i + 1), isCurrentMonth: false });
    }
    
    // Fill current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    return days;
  };

  const [selectedDayReservas, setSelectedDayReservas] = useState<Reserva[]>([]);
  const [isDayReservasModalOpen, setIsDayReservasModalOpen] = useState(false);

  const getDayStatus = (date: Date) => {
    // Usar formato local para evitar desfases de zona horaria en la visualización
    // Forzamos la fecha a mediodía para que al convertir a ISO/String no cambie de día por el offset
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    const activeReservas = reservas.filter(r => {
      // Normalizar para comparación de solo fecha local
      // El servidor envía YYYY-MM-DD o YYYY-MM-DDT12:00:00
      const start = (r.fecha_inicio || "").substring(0, 10);
      const end = (r.fecha_fin || "").substring(0, 10);
      return dateStr >= start && dateStr < end && r.estado !== 3; // Not cancelled
    });

    if (activeReservas.length === 0) return { status: "free" as const, color: "bg-green-100 text-green-700", label: "Libre" };
    
    const isBlocked = activeReservas.some(r => r.plan === "BLOQUEO ADMIN");
    const count = activeReservas.length;
    const maxUnits = 6;

    if (isBlocked) return { status: "blocked" as const, color: "bg-red-100 text-red-700", label: `Bloqueado (${count})` };
    if (count >= maxUnits) return { status: "reserved" as const, color: "bg-orange-100 text-orange-700", label: "Lleno (6/6)" };
    
    return { status: "reserved" as const, color: "bg-yellow-100 text-yellow-700", label: `Reservado (${count}/${maxUnits})` };
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  
  // Plan Blocks state
  type PlanBlock = {
    id: string;
    planId: string;
    campingIds: number[];
    fechaInicio: string;
    fechaFin: string;
    createdAt: string;
  };
  type UnitBlock = {
    id: string;
    unitName: string;
    motivo: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    createdAt: string;
  };
  type PricingConfig = {
    tarifas: { entre_semana: number; viernes_domingo: number; especial: number };
    persona_adicional: number;
    max_adicionales: number;
    festivos: string[];
    fechas_especiales: string[];
  };
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    tarifas: { entre_semana: 290000, viernes_domingo: 320000, especial: 390000 },
    persona_adicional: 100000,
    max_adicionales: 4,
    festivos: [],
    fechas_especiales: []
  });
  const [pricingForm, setPricingForm] = useState({
    entre_semana: 290000,
    viernes_domingo: 320000,
    especial: 390000,
    persona_adicional: 100000,
    max_adicionales: 4,
    newFestivo: "",
    newFechaEspecial: ""
  });
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  const [unitBlocks, setUnitBlocks] = useState<UnitBlock[]>([]);
  const [isUnitBlockModalOpen, setIsUnitBlockModalOpen] = useState(false);
  const [unitBlockForm, setUnitBlockForm] = useState({ unitName: "", motivo: "", fechaInicio: "", fechaFin: "" });

  const BOOKING_STEPS = [
    { id: "plan", label: "Paso 1 – Plan" },
    { id: "dates", label: "Paso 2 – Fechas" },
    { id: "addons", label: "Paso 3 – Adicionales" },
    { id: "guest", label: "Paso 4 – Huésped" },
    { id: "payment", label: "Paso 5 – Pago" },
  ];
  const PASO_LABELS: Record<string, string> = { plan: "Plan", dates: "Fechas", addons: "Adicionales", guest: "Huésped", payment: "Pago" };

<<<<<<< HEAD
  type AuditEntry = {
    id: number;
    ts: string;
    action: string;
    entity: string;
    entity_id: string | null;
    description: string;
  };
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchAuditLog = async (entity = "all") => {
    setAuditLoading(true);
    try {
      const params = entity !== "all" ? `?entity=${entity}` : "";
      const res = await fetch(`/api/audit-log${params}`);
      const data = await res.json();
      setAuditLog(Array.isArray(data) ? data : []);
    } catch {}
    setAuditLoading(false);
  };

=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
  const [banners, setBanners] = useState<any[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [bannerForm, setBannerForm] = useState({ titulo: "", texto: "", imagen: "", pasos: ["plan"] as string[], bgColor: "#FEF3C7", textColor: "#92400E", activo: true, fontSize: 14, lineHeight: 1.6, letterSpacing: 0 });
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [bannerImageUploading, setBannerImageUploading] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
  const [bannerConverting, setBannerConverting] = useState(false);
  const [bannerFormError, setBannerFormError] = useState<string | null>(null);

  const [planBlocks, setPlanBlocks] = useState<PlanBlock[]>([]);
  const [isPlanBlockModalOpen, setIsPlanBlockModalOpen] = useState(false);
  const [planBlockForm, setPlanBlockForm] = useState({
    planId: "",
    campingIds: [] as number[],
    fechaInicio: "",
    fechaFin: ""
  });
  const [planBlockError, setPlanBlockError] = useState<string | null>(null);

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
    createdAt: string;
  };

  const [dynamicPlans, setDynamicPlans] = useState<DynamicPlan[]>([]);
  const [planDragIndex, setPlanDragIndex] = useState<number | null>(null);
  const [planDragOverIndex, setPlanDragOverIndex] = useState<number | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DynamicPlan | null>(null);
  const [planFormError, setPlanFormError] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    nombre: "",
    eslogan: "",
    descripcion: "",
    tipo: "normal" as "normal" | "temporada" | "preventa" | "addon" | "pasa_dia",
    icono: "Sparkles",
    color: "#8B5A2B",
    fechaInicio: "",
    fechaFin: "",
    preventa: false,
    desactivarOtros: false,
    precio: 0,
    campingIds: null as number[] | null,
    precios: { "entre_semana": 0, "viernes_domingo": 0, "especial": 0 } as Record<string, number>,
    incluye: [] as string[],
    newIncluye: ""
  });

  type AdminUser = { id: number; email: string; rol: string; created_at: string; };
  type AdminCamping = { id: number; typeId: number; name: string; isFamiliar: boolean; images: string[]; image: string; description: string; features: string[]; includes: string[]; rating: number; };
  type AdminAddonMedia = { type: "image" | "video"; url: string };
  type AdminAddon = { id: string; title: string; price: number; description: string; details: string[]; allowMultiple?: boolean; maxQuantity?: number; media?: AdminAddonMedia[]; };

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null);
  const [adminUserForm, setAdminUserForm] = useState({ email: "", password: "", rol: "admin" });
  const [adminUserFormError, setAdminUserFormError] = useState<string | null>(null);
  const [adminUserSaving, setAdminUserSaving] = useState(false);

<<<<<<< HEAD
  const fetchAdminUsers = () => fetch("/api/admin-users", { credentials: "include" }).then(r => r.json()).then(d => { if (Array.isArray(d)) setAdminUsers(d); }).catch(() => {});
=======
  const fetchAdminUsers = () => fetch("/api/admin-users").then(r => r.json()).then(d => { if (Array.isArray(d)) setAdminUsers(d); }).catch(() => {});
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9

  const handleSaveAdminUser = async () => {
    setAdminUserFormError(null);
    if (!adminUserForm.email) { setAdminUserFormError("El email es requerido"); return; }
    if (!editingAdminUser && !adminUserForm.password) { setAdminUserFormError("La contraseña es requerida"); return; }
    setAdminUserSaving(true);
    try {
      const url = editingAdminUser ? `/api/admin-users/${editingAdminUser.id}` : "/api/admin-users";
      const method = editingAdminUser ? "PUT" : "POST";
      const body: any = { email: adminUserForm.email, rol: adminUserForm.rol };
      if (adminUserForm.password) body.password = adminUserForm.password;
<<<<<<< HEAD
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
=======
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      const data = await res.json();
      if (!res.ok) { setAdminUserFormError(data.error || "Error al guardar"); return; }
      toast({ title: editingAdminUser ? "Credencial actualizada" : "Credencial creada" });
      setIsAdminUserModalOpen(false);
      fetchAdminUsers();
    } catch { setAdminUserFormError("Error de conexión"); }
    finally { setAdminUserSaving(false); }
  };

  const handleDeleteAdminUser = async (id: number) => {
    if (!confirm("¿Eliminar este usuario administrador?")) return;
<<<<<<< HEAD
    const res = await fetch(`/api/admin-users/${id}`, { method: "DELETE", credentials: "include" });
=======
    const res = await fetch(`/api/admin-users/${id}`, { method: "DELETE" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    const data = await res.json();
    if (res.ok) { toast({ title: "Usuario eliminado" }); fetchAdminUsers(); }
    else toast({ title: "Error", description: data.error, variant: "destructive" });
  };

  const [adminCampings, setAdminCampings] = useState<AdminCamping[]>([]);
  const [isCampingModalOpen, setIsCampingModalOpen] = useState(false);
  const [editingCamping, setEditingCamping] = useState<AdminCamping | null>(null);
  const [campingForm, setCampingForm] = useState({ name: "", description: "", features: [] as string[], includes: [] as string[], newFeature: "", newInclude: "" });
  const [campingSaving, setCampingSaving] = useState(false);
  const [isUploadingCampingImage, setIsUploadingCampingImage] = useState(false);
  const [campingUploadProgress, setCampingUploadProgress] = useState(0);
  const [campingConverting, setCampingConverting] = useState(false);

<<<<<<< HEAD
  const fetchAdminCampings = () => fetch("/api/campings", { credentials: "include" }).then(r => r.json()).then(d => { if (Array.isArray(d)) setAdminCampings(d); }).catch(() => {});
=======
  const fetchAdminCampings = () => fetch("/api/campings").then(r => r.json()).then(d => { if (Array.isArray(d)) setAdminCampings(d); }).catch(() => {});
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9

  const openCampingModal = (c: AdminCamping) => {
    setEditingCamping(c);
    setCampingForm({ name: c.name, description: c.description, features: [...c.features], includes: [...c.includes], newFeature: "", newInclude: "" });
    setIsCampingModalOpen(true);
  };

  const handleSaveCamping = async () => {
    if (!editingCamping) return;
    setCampingSaving(true);
    try {
      const res = await fetch(`/api/campings/${editingCamping.id}`, {
<<<<<<< HEAD
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
=======
        method: "PUT", headers: { "Content-Type": "application/json" },
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify({ name: campingForm.name, description: campingForm.description, features: campingForm.features, includes: campingForm.includes })
      });
      const data = await res.json();
      if (res.ok) { toast({ title: "Glamping actualizado" }); setIsCampingModalOpen(false); fetchAdminCampings(); }
      else toast({ title: "Error", description: data.error, variant: "destructive" });
    } catch { toast({ title: "Error de conexión", variant: "destructive" }); }
    finally { setCampingSaving(false); }
  };

  const handleCampingImageUpload = (campingId: number, file: File) => {
    const isVideo = file.type.startsWith("video/");
    setIsUploadingCampingImage(true);
    setCampingUploadProgress(0);
    setCampingConverting(false);
    const formData = new FormData();
    formData.append("image", file);
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        setCampingUploadProgress(pct);
        if (pct === 100 && isVideo) setCampingConverting(true);
      }
    });
    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({ title: isVideo ? "Video procesado y subido" : "Foto subida correctamente" });
          fetchAdminCampings();
          if (editingCamping?.id === campingId) setEditingCamping(data.camping);
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } catch { toast({ title: "Error al procesar respuesta", variant: "destructive" }); }
      finally {
        setIsUploadingCampingImage(false);
        setCampingUploadProgress(0);
        setCampingConverting(false);
      }
    });
    xhr.addEventListener("error", () => {
      toast({ title: "Error al subir archivo", variant: "destructive" });
      setIsUploadingCampingImage(false);
      setCampingUploadProgress(0);
      setCampingConverting(false);
    });
    xhr.withCredentials = true;
    xhr.open("POST", `/api/campings/${campingId}/image`);
    xhr.send(formData);
  };

  const handleDeleteCampingImage = async (campingId: number, imageUrl: string) => {
<<<<<<< HEAD
    const res = await fetch(`/api/campings/${campingId}/image`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ imageUrl }) });
=======
    const res = await fetch(`/api/campings/${campingId}/image`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl }) });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    if (res.ok) { toast({ title: "Foto eliminada" }); fetchAdminCampings(); if (editingCamping?.id === campingId) { setEditingCamping(prev => prev ? { ...prev, images: prev.images.filter(i => i !== imageUrl), image: prev.image === imageUrl ? prev.images.find(i => i !== imageUrl) || "" : prev.image } : null); } }
  };

  const handleSetCoverImage = async (campingId: number, imageUrl: string) => {
<<<<<<< HEAD
    const res = await fetch(`/api/campings/${campingId}/cover`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ imageUrl }) });
=======
    const res = await fetch(`/api/campings/${campingId}/cover`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl }) });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    if (res.ok) { toast({ title: "Foto de portada actualizada" }); fetchAdminCampings(); setEditingCamping(prev => prev ? { ...prev, image: imageUrl } : null); }
    else toast({ title: "Error al actualizar portada", variant: "destructive" });
  };

  const [adminAddons, setAdminAddons] = useState<AdminAddon[]>([]);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AdminAddon | null>(null);
  const [addonForm, setAddonForm] = useState({ title: "", price: 0, description: "", details: [] as string[], newDetail: "", allowMultiple: false, maxQuantity: 1 });
  const [addonMedia, setAddonMedia] = useState<AdminAddonMedia[]>([]);
  const [addonMediaUploading, setAddonMediaUploading] = useState(false);
  const [addonUploadProgress, setAddonUploadProgress] = useState(0);
  const [addonConverting, setAddonConverting] = useState(false);
  const [addonUploadHasVideo, setAddonUploadHasVideo] = useState(false);
  const [addonFormError, setAddonFormError] = useState<string | null>(null);
  const [addonSaving, setAddonSaving] = useState(false);

<<<<<<< HEAD
  const fetchAdminAddons = () => fetch("/api/addons", { credentials: "include" }).then(r => r.json()).then(d => { if (Array.isArray(d)) setAdminAddons(d); }).catch(() => {});

  const fetchBanners = async () => {
    try {
      const r = await fetch("/api/banners", { credentials: "include" });
=======
  const fetchAdminAddons = () => fetch("/api/addons").then(r => r.json()).then(d => { if (Array.isArray(d)) setAdminAddons(d); }).catch(() => {});

  const fetchBanners = async () => {
    try {
      const r = await fetch("/api/banners");
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      const data = await r.json();
      if (Array.isArray(data)) setBanners(data);
    } catch (e) { console.error("Error fetching banners:", e); }
  };

  const handleToggleBanner = async (id: string) => {
<<<<<<< HEAD
    await fetch(`/api/banners/${id}/toggle`, { method: "PATCH", credentials: "include" });
=======
    await fetch(`/api/banners/${id}/toggle`, { method: "PATCH" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    fetchBanners();
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("¿Eliminar este banner?")) return;
<<<<<<< HEAD
    await fetch(`/api/banners/${id}`, { method: "DELETE", credentials: "include" });
=======
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    fetchBanners();
    toast({ title: "Banner eliminado" });
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setBannerImageUploading(true);
    setBannerUploadProgress(0);
    setBannerConverting(false);
    const formData = new FormData();
    formData.append("image", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/banners/upload-image");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setBannerUploadProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.upload.onload = () => { if (isVideo) { setBannerUploadProgress(100); setBannerConverting(true); } };
    xhr.onload = () => {
      setBannerConverting(false);
      setBannerImageUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.url) { setBannerImagePreview(data.url); setBannerForm(p => ({ ...p, imagen: data.url })); }
      } catch (err) { console.error("Error parsing banner upload response", err); }
    };
    xhr.onerror = () => { setBannerImageUploading(false); setBannerConverting(false); };
    xhr.send(formData);
  };

  const handleSaveBanner = async () => {
    setBannerFormError(null);
    if (bannerForm.pasos.length === 0) { setBannerFormError("Selecciona al menos un paso"); return; }
    if (!bannerForm.titulo && !bannerForm.texto) { setBannerFormError("El banner necesita al menos un título o mensaje"); return; }
    const method = editingBanner ? "PUT" : "POST";
    const url = editingBanner ? `/api/banners/${editingBanner.id}` : "/api/banners";
<<<<<<< HEAD
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(bannerForm) });
=======
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(bannerForm) });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    const data = await r.json();
    if (data.success) {
      setIsBannerModalOpen(false);
      fetchBanners();
      toast({ title: editingBanner ? "Banner actualizado" : "Banner creado" });
    } else {
      setBannerFormError(data.error || "Error al guardar");
    }
  };

  const openAddonModal = (a?: AdminAddon) => {
    setEditingAddon(a || null);
    setAddonForm(a ? { title: a.title, price: a.price, description: a.description, details: [...a.details], newDetail: "", allowMultiple: a.allowMultiple ?? false, maxQuantity: a.maxQuantity ?? 1 } : { title: "", price: 0, description: "", details: [], newDetail: "", allowMultiple: false, maxQuantity: 1 });
    setAddonMedia(a?.media ? [...a.media] : []);
    setAddonFormError(null);
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async () => {
    setAddonFormError(null);
    if (!addonForm.title || addonForm.price <= 0) { setAddonFormError("Título y precio son requeridos"); return; }
    setAddonSaving(true);
    try {
      const url = editingAddon ? `/api/addons/${editingAddon.id}` : "/api/addons";
      const method = editingAddon ? "PUT" : "POST";
<<<<<<< HEAD
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ title: addonForm.title, price: addonForm.price, description: addonForm.description, details: addonForm.details, allowMultiple: addonForm.allowMultiple, maxQuantity: addonForm.allowMultiple ? addonForm.maxQuantity : 1, media: addonMedia }) });
=======
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: addonForm.title, price: addonForm.price, description: addonForm.description, details: addonForm.details, allowMultiple: addonForm.allowMultiple, maxQuantity: addonForm.allowMultiple ? addonForm.maxQuantity : 1, media: addonMedia }) });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      const data = await res.json();
      if (res.ok) { toast({ title: editingAddon ? "Adicional actualizado" : "Adicional creado" }); setIsAddonModalOpen(false); fetchAdminAddons(); }
      else setAddonFormError(data.error || "Error al guardar");
    } catch { setAddonFormError("Error de conexión"); }
    finally { setAddonSaving(false); }
  };

  const handleAddonMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !editingAddon) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    const hasVideo = files.some(f => f.type.startsWith("video/"));
    setAddonMediaUploading(true);
    setAddonUploadProgress(0);
    setAddonConverting(false);
    setAddonUploadHasVideo(hasVideo);
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        setAddonUploadProgress(pct);
        if (pct === 100 && hasVideo) setAddonConverting(true);
      }
    });
    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setAddonMedia(data.media);
          fetchAdminAddons();
          toast({ title: hasVideo ? "Video procesado y subido" : (files.length === 1 ? "Archivo subido" : `${files.length} archivos subidos`) });
        } else {
          toast({ title: "Error al subir", description: data.error, variant: "destructive" });
        }
      } catch { toast({ title: "Error al procesar respuesta", variant: "destructive" }); }
      finally {
        setAddonMediaUploading(false);
        setAddonUploadProgress(0);
        setAddonConverting(false);
        setAddonUploadHasVideo(false);
      }
    });
    xhr.addEventListener("error", () => {
      toast({ title: "Error de conexión", variant: "destructive" });
      setAddonMediaUploading(false);
      setAddonUploadProgress(0);
      setAddonConverting(false);
      setAddonUploadHasVideo(false);
    });
    xhr.withCredentials = true;
    xhr.open("POST", `/api/addons/${editingAddon.id}/media`);
    xhr.send(formData);
  };

  const handleAddonMediaDelete = async (url: string) => {
    if (!editingAddon) return;
<<<<<<< HEAD
    const res = await fetch(`/api/addons/${editingAddon.id}/media`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ url }) });
=======
    const res = await fetch(`/api/addons/${editingAddon.id}/media`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    const data = await res.json();
    if (res.ok) { setAddonMedia(data.media); fetchAdminAddons(); }
    else toast({ title: "Error al eliminar", variant: "destructive" });
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm("¿Eliminar este adicional?")) return;
<<<<<<< HEAD
    const res = await fetch(`/api/addons/${id}`, { method: "DELETE", credentials: "include" });
=======
    const res = await fetch(`/api/addons/${id}`, { method: "DELETE" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
    if (res.ok) { toast({ title: "Adicional eliminado" }); fetchAdminAddons(); }
    else toast({ title: "Error al eliminar", variant: "destructive" });
  };

  const iconOptions = [
    { id: "Sparkles", icon: Sparkles, name: "Estrellas" },
    { id: "Heart", icon: Heart, name: "Corazón" },
    { id: "Film", icon: Film, name: "Cine" },
    { id: "Star", icon: Star, name: "Estrella" },
    { id: "Sun", icon: Sun, name: "Sol" },
    { id: "Moon", icon: Moon, name: "Luna" },
    { id: "TreePine", icon: TreePine, name: "Árbol" },
    { id: "Mountain", icon: Mountain, name: "Montaña" },
    { id: "Flame", icon: Flame, name: "Fuego" },
    { id: "Gift", icon: Gift, name: "Regalo" },
    { id: "Tag", icon: Tag, name: "Etiqueta" }
  ];

  const getIconComponent = (iconId: string) => {
    const option = iconOptions.find(o => o.id === iconId);
    return option ? option.icon : Sparkles;
  };
  
  // Función para normalizar fechas al guardado y evitar desfases
  const normalizeDateForSave = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
  };

  const [editData, setEditData] = useState({ 
    referencia: "", 
    fecha_inicio: "", 
    fecha_fin: "", 
    unidad: "",
    nombre: "",
    email: "",
    telefono: "",
    plan: "",
    total: 0,
    abono: 0,
    estado: 0
  });

  const [isNewReservaModalOpen, setIsNewReservaModalOpen] = useState(false);
  const [newReservaData, setNewReservaData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    unidad: "Domo Gold",
    fecha_inicio: "",
    fecha_fin: "",
    plan: "",
    total: 0,
    abono: 0,
    estado: 2
  });

  useEffect(() => {
    if (newReservaData.fecha_inicio && newReservaData.fecha_fin && newReservaData.unidad && newReservaData.plan) {
      const camping = campings.find(c => c.name === newReservaData.unidad);
      
      if (camping) {
        const selectedDynPlan = dynamicPlans.find(p => p.nombre === newReservaData.plan);
        let price = 0;
        if (selectedDynPlan) {
          if (selectedDynPlan.precios?.entre_semana !== undefined) {
            const checkIn = new Date(newReservaData.fecha_inicio + 'T12:00:00');
            const dow = checkIn.getDay();
            const category = dow === 6 ? "especial" : (dow === 5 || dow === 0) ? "viernes_domingo" : "entre_semana";
            price = selectedDynPlan.precios[category] || 0;
          } else {
            price = selectedDynPlan.precios?.[camping.typeId.toString()] || 0;
          }
        }

        const start = new Date(newReservaData.fecha_inicio);
        const end = new Date(newReservaData.fecha_fin);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (nights > 0 && price > 0) {
          const calculatedTotal = price * nights;
          setNewReservaData(prev => ({ ...prev, total: calculatedTotal }));
        }
      }
    }
  }, [newReservaData.fecha_inicio, newReservaData.fecha_fin, newReservaData.unidad, newReservaData.plan, dynamicPlans]);

  useEffect(() => {
    fetchReservas();
    fetchPlanBlocks();
    fetchDynamicPlans();
<<<<<<< HEAD
    fetch("/api/pricing", { credentials: "include" })
=======
    fetch("/api/pricing")
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      .then(r => r.json())
      .then(data => {
        if (data && data.tarifas) {
          setPricingConfig(data);
          setPricingForm(prev => ({
            ...prev,
            entre_semana: data.tarifas.entre_semana,
            viernes_domingo: data.tarifas.viernes_domingo,
            especial: data.tarifas.especial,
            persona_adicional: data.persona_adicional,
            max_adicionales: data.max_adicionales
          }));
        }
      })
      .catch(err => console.error("Error fetching pricing:", err));
<<<<<<< HEAD
    fetch("/api/unit-blocks", { credentials: "include" })
=======
    fetch("/api/unit-blocks")
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUnitBlocks(data); })
      .catch(err => console.error("Error fetching unit blocks:", err));
    fetchAdminUsers();
    fetchAdminCampings();
    fetchAdminAddons();
    fetchBanners();
  }, []);
  
  const fetchPlanBlocks = async () => {
    try {
<<<<<<< HEAD
      const response = await fetch("/api/plan-blocks", { credentials: "include" });
=======
      const response = await fetch("/api/plan-blocks");
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      if (response.ok) {
        const data = await response.json();
        setPlanBlocks(data);
      }
    } catch (error) {
      console.error("Error fetching plan blocks:", error);
    }
  };

  const handleCreatePlanBlock = async () => {
    setPlanBlockError(null);
    
    if (!planBlockForm.planId || planBlockForm.campingIds.length === 0 || !planBlockForm.fechaInicio || !planBlockForm.fechaFin) {
      setPlanBlockError("Por favor complete todos los campos");
      return;
    }

    const normalizedForm = {
      ...planBlockForm,
      fechaInicio: planBlockForm.fechaInicio.includes('T') ? planBlockForm.fechaInicio : planBlockForm.fechaInicio + 'T12:00:00',
      fechaFin: planBlockForm.fechaFin.includes('T') ? planBlockForm.fechaFin : planBlockForm.fechaFin + 'T12:00:00'
    };

    try {
      const response = await fetch("/api/plan-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify(normalizedForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: "Bloqueo de plan creado correctamente" });
        setIsPlanBlockModalOpen(false);
        setPlanBlockForm({ planId: "", campingIds: [], fechaInicio: "", fechaFin: "" });
        fetchPlanBlocks();
      } else {
        setPlanBlockError(data.error || "Error al crear bloqueo");
      }
    } catch (error) {
      setPlanBlockError("Error de conexión");
    }
  };

  const handleDeletePlanBlock = async (id: string) => {
    try {
<<<<<<< HEAD
      const response = await fetch(`/api/plan-blocks/${id}`, { method: "DELETE", credentials: "include" });
=======
      const response = await fetch(`/api/plan-blocks/${id}`, { method: "DELETE" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: "Bloqueo eliminado" });
        fetchPlanBlocks();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const fetchUnitBlocks = async () => {
    try {
<<<<<<< HEAD
      const response = await fetch("/api/unit-blocks", { credentials: "include" });
=======
      const response = await fetch("/api/unit-blocks");
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      if (response.ok) {
        const data = await response.json();
        setUnitBlocks(data);
      }
    } catch (error) {
      console.error("Error fetching unit blocks:", error);
    }
  };

  const handleCreateUnitBlock = async () => {
    if (!unitBlockForm.unitName) {
      toast({ title: "Error", description: "Selecciona una unidad", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/unit-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify({
          unitName: unitBlockForm.unitName,
          motivo: unitBlockForm.motivo || "Inhabilitada",
          fechaInicio: unitBlockForm.fechaInicio || null,
          fechaFin: unitBlockForm.fechaFin || null
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Unidad inhabilitada correctamente" });
        setIsUnitBlockModalOpen(false);
        setUnitBlockForm({ unitName: "", motivo: "", fechaInicio: "", fechaFin: "" });
        fetchUnitBlocks();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const handleDeleteUnitBlock = async (id: string) => {
    try {
<<<<<<< HEAD
      const response = await fetch(`/api/unit-blocks/${id}`, { method: "DELETE", credentials: "include" });
=======
      const response = await fetch(`/api/unit-blocks/${id}`, { method: "DELETE" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Bloqueo de unidad eliminado" });
        fetchUnitBlocks();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const allUnits = campings.map(c => c.name);

  useEffect(() => {
    fetchUnitBlocks();
  }, []);

  const toggleCampingSelection = (typeId: number) => {
    setPlanBlockForm(prev => ({
      ...prev,
      campingIds: prev.campingIds.includes(typeId)
        ? prev.campingIds.filter(id => id !== typeId)
        : [...prev.campingIds, typeId]
    }));
  };

  const getCampingTypeName = (typeId: number) => {
    const typeMap: Record<number, string> = { 1: "Domo Gold", 2: "Domo Big Premium", 3: "Domo Natura Premium" };
    return typeMap[typeId] || `Tipo ${typeId}`;
  };

  const getPlanName = (planId: string) => {
    const plan = dynamicPlans.find(p => p.id === planId);
    return plan?.nombre || planId;
  };

  const fetchDynamicPlans = async () => {
    try {
<<<<<<< HEAD
      const response = await fetch("/api/plans", { credentials: "include" });
=======
      const response = await fetch("/api/plans");
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      if (response.ok) {
        const data = await response.json();
        setDynamicPlans(data);
      }
    } catch (error) {
      console.error("Error fetching dynamic plans:", error);
    }
  };

  const handlePlanDragStart = (index: number) => {
    setPlanDragIndex(index);
  };

  const handlePlanDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setPlanDragOverIndex(index);
  };

  const handlePlanDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (planDragIndex === null || planDragIndex === dropIndex) {
      setPlanDragIndex(null);
      setPlanDragOverIndex(null);
      return;
    }
    const reordered = [...dynamicPlans];
    const [moved] = reordered.splice(planDragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setDynamicPlans(reordered);
    setPlanDragIndex(null);
    setPlanDragOverIndex(null);
    try {
      await fetch("/api/plans/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify({ order: reordered.map(p => p.id) })
      });
    } catch (error) {
      console.error("Error saving plan order:", error);
      fetchDynamicPlans();
    }
  };

  const handlePlanDragEnd = () => {
    setPlanDragIndex(null);
    setPlanDragOverIndex(null);
  };

  const resetPlanForm = () => {
    setPlanForm({
      nombre: "",
      eslogan: "",
      descripcion: "",
      tipo: "normal",
      icono: "Sparkles",
      color: "#8B5A2B",
      fechaInicio: "",
      fechaFin: "",
      preventa: false,
      desactivarOtros: false,
      precio: 0,
      campingIds: null,
      precios: { "entre_semana": 0, "viernes_domingo": 0, "especial": 0 },
      incluye: [],
      newIncluye: ""
    });
    setEditingPlan(null);
    setPlanFormError(null);
  };

  const openEditPlan = (plan: DynamicPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      nombre: plan.nombre,
      eslogan: plan.eslogan,
      descripcion: plan.descripcion || "",
      tipo: plan.tipo,
      icono: plan.icono || "Sparkles",
      color: plan.color || "#8B5A2B",
      fechaInicio: plan.fechaInicio || "",
      fechaFin: plan.fechaFin || "",
      preventa: plan.preventa || false,
      desactivarOtros: false,
      precio: plan.precio || 0,
      campingIds: plan.campingIds || null,
      precios: plan.precios?.entre_semana !== undefined
        ? plan.precios
        : { "entre_semana": plan.precios?.["2"] || 0, "viernes_domingo": plan.precios?.["2"] || 0, "especial": plan.precios?.["2"] || 0 },
      incluye: plan.incluye || [],
      newIncluye: ""
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    setPlanFormError(null);
    
    if (!planForm.nombre || !planForm.eslogan || !planForm.tipo) {
      setPlanFormError("Por favor complete los campos obligatorios");
      return;
    }

    if (planForm.tipo === "addon" && !planForm.precio) {
      setPlanFormError("El plan addon requiere un precio adicional fijo");
      return;
    }

    if (planForm.tipo === "pasa_dia" && (!planForm.precios["entre_semana"] || !planForm.precios["viernes_domingo"] || !planForm.precios["especial"])) {
      setPlanFormError("El plan Pasa Día requiere precios para los tres tipos de día");
      return;
    }

    if (planForm.tipo === "temporada" && (!planForm.fechaInicio || !planForm.fechaFin)) {
      setPlanFormError("Los planes de temporada requieren fechas de inicio y fin");
      return;
    }

    try {
      const payload = {
        nombre: planForm.nombre,
        eslogan: planForm.eslogan,
        descripcion: planForm.descripcion,
        tipo: planForm.tipo,
        icono: planForm.icono,
        color: planForm.color,
        fechaInicio: planForm.tipo === "temporada" ? (planForm.fechaInicio.includes('T') ? planForm.fechaInicio : planForm.fechaInicio + 'T12:00:00') : null,
        fechaFin: planForm.tipo === "temporada" ? (planForm.fechaFin.includes('T') ? planForm.fechaFin : planForm.fechaFin + 'T12:00:00') : null,
        preventa: planForm.tipo === "preventa",
        precio: planForm.precio || 0,
        campingIds: planForm.campingIds,
        precios: planForm.precios,
        incluye: planForm.incluye,
        desactivarOtros: planForm.desactivarOtros
      };

      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
      const method = editingPlan ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: editingPlan ? "Plan actualizado correctamente" : "Plan creado correctamente" });
        setIsPlanModalOpen(false);
        resetPlanForm();
        fetchDynamicPlans();
      } else {
        setPlanFormError(data.error || "Error al guardar plan");
      }
    } catch (error) {
      setPlanFormError("Error de conexión");
    }
  };

  const handleTogglePlan = async (planId: string, desactivarOtros: boolean = false) => {
    try {
      const response = await fetch(`/api/plans/${planId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify({ desactivarOtros })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: `Plan ${data.plan.estado ? 'activado' : 'desactivado'}` });
        fetchDynamicPlans();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("¿Está seguro de eliminar este plan? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
<<<<<<< HEAD
      const response = await fetch(`/api/plans/${planId}`, { method: "DELETE", credentials: "include" });
=======
      const response = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: "Plan eliminado" });
        fetchDynamicPlans();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const addIncluye = () => {
    if (planForm.newIncluye.trim()) {
      setPlanForm(prev => ({
        ...prev,
        incluye: [...prev.incluye, prev.newIncluye.trim()],
        newIncluye: ""
      }));
    }
  };

  const removeIncluye = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      incluye: prev.incluye.filter((_, i) => i !== index)
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
  };

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/listar-reservas.php", {
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      // Comentar validación estricta de 403 para asegurar visibilidad en dev
      /*
      if (response.status === 403) {
        console.warn("Acceso denegado de la API");
        return;
      }
      */
      const data = await response.json();
      console.log("Datos recibidos de la API:", data);
      if (Array.isArray(data)) {
        setReservas(data);
      } else {
        setReservas([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ title: "Error", description: "No se pudieron cargar las reservas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleCreateManualReserva = async () => {
    try {
      const normalizedData = {
        ...newReservaData,
        fecha_inicio: newReservaData.fecha_inicio.substring(0, 10) + 'T12:00:00',
        fecha_fin: newReservaData.fecha_fin.substring(0, 10) + 'T12:00:00'
      };
      const response = await fetch("/api/crear-reserva-manual.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify(normalizedData)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Reserva manual creada" });
        setIsNewReservaModalOpen(false);
        fetchReservas();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const generateBookingReceipt = (reserva: Reserva) => {
    const addonIds = reserva.adicionales || [];
    const addonNames = addons.filter(a => addonIds.includes(a.id)).map(a => a.title);
    const extraHeight = addonNames.length > 0 ? 60 + addonNames.length * 28 : 0;
    const canvasHeight = 1000 + extraHeight;

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d")!;
    
    ctx.fillStyle = "#FDFCFB";
    ctx.fillRect(0, 0, 800, canvasHeight);
    
    ctx.fillStyle = "#5C4033";
    ctx.fillRect(0, 0, 800, 120);
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Carupa Glamping", 400, 70);
    ctx.font = "16px Arial";
    ctx.fillText("Confirmación de Reserva", 400, 100);
    
    ctx.fillStyle = "#5C4033";
    ctx.textAlign = "left";
    ctx.font = "bold 24px Georgia";
    ctx.fillText("Detalles de tu Reserva", 50, 180);
    
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(750, 200);
    ctx.stroke();
    
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return format(date, "dd 'de' MMMM yyyy", { locale: es });
      } catch {
        return dateStr;
      }
    };
    
    const details = [
      { label: "Referencia", value: reserva.referencia || "---" },
      { label: "Huésped", value: reserva.nombre || "---" },
      { label: "Plan", value: reserva.plan || "---" },
      { label: "Alojamiento", value: reserva.unidad || "---" },
      { label: "Check-in", value: formatDate(reserva.fecha_inicio) },
      { label: "Check-out", value: formatDate(reserva.fecha_fin) },
      { label: "Total", value: `$${(reserva.total || 0).toLocaleString()} COP` },
      { label: "Abono", value: `$${(reserva.abono || 0).toLocaleString()} COP` },
      { label: "Saldo pendiente", value: `$${(reserva.saldo || 0).toLocaleString()} COP` },
    ];
    
    let y = 250;
    ctx.font = "16px Arial";
    details.forEach(({ label, value }) => {
      ctx.fillStyle = "#6B7280";
      ctx.fillText(label + ":", 50, y);
      ctx.fillStyle = "#1F2937";
      ctx.font = "bold 16px Arial";
      ctx.fillText(value, 250, y);
      ctx.font = "16px Arial";
      y += 45;
    });

    if (addonNames.length > 0) {
      y += 10;
      ctx.strokeStyle = "#E5E7EB";
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(750, y);
      ctx.stroke();
      y += 30;
      ctx.fillStyle = "#5C4033";
      ctx.font = "bold 18px Georgia";
      ctx.fillText("Adicionales", 50, y);
      y += 25;
      ctx.font = "14px Arial";
      addonNames.forEach((name) => {
        ctx.fillStyle = "#C45C26";
        ctx.fillText("•", 60, y);
        ctx.fillStyle = "#1F2937";
        ctx.fillText(name, 80, y);
        y += 28;
      });
    }
    
    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(50, y + 20, 700, 120);
    ctx.fillStyle = "#5C4033";
    ctx.font = "bold 14px Arial";
    ctx.fillText("Check-in: 3:00 PM - 9:30 PM  |  Check-out: antes de 12:30 PM", 100, y + 60);
    ctx.fillStyle = "#6B7280";
    ctx.font = "12px Arial";
    ctx.fillText("El saldo pendiente se cancela al llegar a Carupa Glamping.", 100, y + 90);
    ctx.fillText("Presenta esta imagen al momento de tu llegada.", 100, y + 110);
    
    ctx.fillStyle = "#5C4033";
    ctx.font = "italic 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Entre Carmen de Carupa y Ubaté, Cundinamarca - Colombia", 400, canvasHeight - 50);
    ctx.fillText("WhatsApp: +57 310 327 2630", 400, canvasHeight - 30);
    
    const imageUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `reserva-carupa-${reserva.referencia}.png`;
    link.click();
    
    toast({ title: "Comprobante generado", description: "El comprobante se ha descargado correctamente." });
  };

  const handleAction = async (endpoint: string, payload: any) => {
    // Validación de fechas para el bloqueo
    if (endpoint === "bloquear-fecha.php") {
      if (!payload.fecha_inicio || !payload.fecha_fin) {
        toast({ title: "Error", description: "Por favor selecciona ambas fechas", variant: "destructive" });
        return;
      }
      
      // Normalizar fechas para comparación (solo YYYY-MM-DD)
      const start = payload.fecha_inicio;
      const end = payload.fecha_fin;
      
      if (start < today) {
        toast({ title: "Error", description: "No puedes bloquear fechas pasadas", variant: "destructive" });
        return;
      }
      
      if (end < start) {
        toast({ title: "Error", description: "La fecha de fin no puede ser anterior a la de inicio", variant: "destructive" });
        return;
      }
    }

    try {
      const normalizedPayload = {
        ...payload,
        fecha_inicio: (payload.fecha_inicio || "").substring(0, 10) + 'T12:00:00',
        fecha_fin: (payload.fecha_fin || "").substring(0, 10) + 'T12:00:00'
      };
      
      console.log("Enviando payload a", endpoint, normalizedPayload);
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify(normalizedPayload)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Operación realizada correctamente" });
        setIsModalOpen(false);
        setIsBlockModalOpen(false);
        fetchReservas();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedReservas.length === 0) return;
    
    const referencias = reservas
      .filter(r => selectedReservas.includes(r.id))
      .map(r => r.referencia);

    try {
      const response = await fetch("/api/bulk-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        body: JSON.stringify({ action, referencias })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: `${selectedReservas.length} registros procesados.` });
        setSelectedReservas([]);
        fetchReservas();
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al procesar acción masiva", variant: "destructive" });
    }
  };

  const getStatusBadge = (estado: number) => {
    switch (estado) {
      case 1: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 2: return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Abonado</Badge>;
      case 3: return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      case 4: return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completado</Badge>;
      default: return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const filteredReservas = reservas.filter(r => {
    const matchesText = r.nombre.toLowerCase().includes(filter.toLowerCase()) || 
                       r.referencia.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.estado.toString() === statusFilter;
    const matchesCamping = campingFilter === "all" || r.camping === campingFilter;
    // No filtrar por plan !== "BLOQUEO ADMIN" aquí si queremos que aparezcan en el conteo total o debug
    return matchesText && matchesStatus && matchesCamping;
  });

  const handleLogout = async () => {
    try {
<<<<<<< HEAD
      await fetch("/api/logout.php", { method: "POST", credentials: "include" });
=======
      await fetch("/api/logout.php", { method: "POST" });
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
      setLocation("/admin/login");
    } catch (error) {
      setLocation("/admin/login");
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              onClick={() => setViewMode("list")}
              className="rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" /> Lista
            </Button>
            <Button 
              variant={viewMode === "calendar" ? "default" : "outline"} 
              onClick={() => setViewMode("calendar")}
              className="rounded-xl"
            >
              <CalendarIcon className="w-4 h-4 mr-2" /> Calendario
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white border-accent text-accent hover:bg-accent hover:text-white" onClick={() => setIsBlockModalOpen(true)}>
              <Lock className="w-4 h-4 mr-2" /> Bloquear Fechas
            </Button>
            <Button variant="outline" className="bg-primary text-white hover:bg-primary/90" onClick={() => setIsNewReservaModalOpen(true)}>
              <CalendarIcon className="w-4 h-4 mr-2" /> Nueva Reserva
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}><ChevronLeft className="w-4 h-4 mr-2" /> Sitio Web</Button>
            <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Salir</Button>
          </div>
        </div>

        <Tabs defaultValue="reservas" className="w-full">
          {viewMode === "list" && (
            <TabsList className="flex flex-wrap gap-1 mb-8 bg-stone-100 rounded-xl p-1 h-auto">
              <TabsTrigger value="reservas" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Reservas</TabsTrigger>
              <TabsTrigger value="planes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Gestión Planes</TabsTrigger>
              <TabsTrigger value="bloqueos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Bloqueos Fechas</TabsTrigger>
              <TabsTrigger value="tarifas" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Tarifas</TabsTrigger>
              <TabsTrigger value="glampings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Glampings</TabsTrigger>
              <TabsTrigger value="adicionales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Adicionales</TabsTrigger>
              <TabsTrigger value="credenciales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Credenciales</TabsTrigger>
              <TabsTrigger value="banners" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">Banners</TabsTrigger>
<<<<<<< HEAD
              <TabsTrigger value="actividad" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs" onClick={() => fetchAuditLog(auditFilter)}>Actividad</TabsTrigger>
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
            </TabsList>
          )}

          {viewMode === "list" ? (
            <>
              <TabsContent value="reservas">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                <div className="flex flex-1 gap-4">
                  <div className="flex-1 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input 
                      placeholder="Buscar por cliente o referencia..." 
                      className="pl-10 rounded-xl"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="1">Pendiente</SelectItem>
                      <SelectItem value="2">Abonado</SelectItem>
                      <SelectItem value="3">Cancelado</SelectItem>
                      <SelectItem value="4">Completado</SelectItem>
                      <SelectItem value="5">Oculto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedReservas.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-xs font-bold px-2">{selectedReservas.length} seleccionados</span>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleBulkAction('delete')}>
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-700 hover:bg-stone-100" onClick={() => handleBulkAction('hide')}>
                      <EyeOff className="w-4 h-4 mr-1" /> Ocultar
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <button 
                          onClick={() => {
                            const visibleIds = filteredReservas.filter(r => r.plan !== "BLOQUEO ADMIN").map(r => r.id);
                            if (selectedReservas.length === visibleIds.length) {
                              setSelectedReservas([]);
                            } else {
                              setSelectedReservas(visibleIds);
                            }
                          }}
                        >
                          {selectedReservas.length > 0 ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4 text-stone-300" />}
                        </button>
                      </TableHead>
                      <TableHead className="font-bold">Referencia</TableHead>
                      <TableHead className="font-bold">Cliente</TableHead>
                      <TableHead className="font-bold">Creada el</TableHead>
                      <TableHead className="font-bold">Estancia</TableHead>
                      <TableHead className="font-bold">Unidad</TableHead>
                      <TableHead className="font-bold">Total / Saldo</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservas.filter(r => r.plan !== "BLOQUEO ADMIN" && r.estado !== 5).map((reserva) => (
                      <TableRow 
                        key={reserva.id} 
                        className={cn("hover:bg-stone-50/50 cursor-pointer", selectedReservas.includes(reserva.id) && "bg-stone-50")}
                        onClick={() => {
                          if (selectedReservas.includes(reserva.id)) {
                            setSelectedReservas(selectedReservas.filter(id => id !== reserva.id));
                          } else {
                            setSelectedReservas([...selectedReservas, reserva.id]);
                          }
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => {
                            if (selectedReservas.includes(reserva.id)) {
                              setSelectedReservas(selectedReservas.filter(id => id !== reserva.id));
                            } else {
                              setSelectedReservas([...selectedReservas, reserva.id]);
                            }
                          }}>
                            {selectedReservas.includes(reserva.id) ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4 text-stone-300" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold">{reserva.referencia}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-stone-900">{reserva.nombre}</span>
                            <span className="text-[10px] uppercase tracking-tighter text-stone-400">{reserva.plan}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-stone-500">
                            {reserva.created_at ? format(new Date(reserva.created_at), "dd/MM/yy HH:mm", { locale: es }) : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-stone-600">
                            {format(new Date(reserva.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(reserva.fecha_fin), "dd MMM", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tent className="w-4 h-4 text-accent" />
                            <span className="text-sm font-bold">{reserva.unidad}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">${reserva.total.toLocaleString()}</span>
                            <span className="text-[10px] text-red-500">Saldo: ${reserva.saldo.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(reserva.estado)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedReserva(reserva); setIsModalOpen(true); }}><MoreVertical className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planes">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-primary">Gestión de Planes</h2>
                <Button 
                  variant="outline" 
                  className="bg-accent text-white hover:bg-accent/90" 
                  onClick={() => { resetPlanForm(); setIsPlanModalOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Crear Nuevo Plan
                </Button>
              </div>

              <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
                <GripVertical className="w-3 h-3" /> Arrastra las filas para cambiar el orden en que se muestran los planes
              </p>
              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="font-bold">Plan</TableHead>
                      <TableHead className="font-bold">Tipo</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="font-bold">Precios</TableHead>
                      <TableHead className="font-bold">Fechas</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-stone-500">
                          No hay planes configurados. Crea el primero.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dynamicPlans.map((plan, index) => {
                        const IconComp = getIconComponent(plan.icono);
                        const isDragging = planDragIndex === index;
                        const isDragOver = planDragOverIndex === index && planDragIndex !== index;
                        return (
                          <TableRow
                            key={plan.id}
                            draggable
                            onDragStart={() => handlePlanDragStart(index)}
                            onDragOver={(e) => handlePlanDragOver(e, index)}
                            onDrop={(e) => handlePlanDrop(e, index)}
                            onDragEnd={handlePlanDragEnd}
                            className={cn(
                              "hover:bg-stone-50/50 transition-all",
                              isDragging && "opacity-40",
                              isDragOver && "border-t-2 border-accent bg-accent/5"
                            )}
                          >
                            <TableCell className="pr-0 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4 text-stone-300" />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                                  style={{ backgroundColor: `${plan.color}20` }}
                                >
                                  <IconComp className="w-5 h-5" style={{ color: plan.color }} />
                                </div>
                                <div>
                                  <p className="font-bold text-primary">{plan.nombre}</p>
                                  <p className="text-xs text-stone-500">{plan.eslogan}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-bold uppercase",
                                  plan.tipo === "normal" && "border-stone-300 text-stone-600",
                                  plan.tipo === "temporada" && "border-orange-300 bg-orange-50 text-orange-600",
                                  plan.tipo === "preventa" && "border-purple-300 bg-purple-50 text-purple-600"
                                )}
                              >
                                {plan.tipo === "preventa" && "🏷️ "}
                                {plan.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={plan.estado ? "default" : "secondary"}
                                className={cn(
                                  plan.estado ? "bg-green-500 hover:bg-green-600" : "bg-stone-300"
                                )}
                              >
                                {plan.estado ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                {plan.precios["entre_semana"] !== undefined ? (
                                  <>
                                    <div><span className="text-stone-400">Entre semana:</span> {formatPrice(plan.precios["entre_semana"])}</div>
                                    <div><span className="text-stone-400">Vie/Dom:</span> {formatPrice(plan.precios["viernes_domingo"])}</div>
                                    <div><span className="text-stone-400">Especial:</span> {formatPrice(plan.precios["especial"])}</div>
                                  </>
                                ) : (
                                  <>
                                    <div><span className="text-stone-400">Gold:</span> {formatPrice(plan.precios["1"])}</div>
                                    <div><span className="text-stone-400">Big:</span> {formatPrice(plan.precios["2"])}</div>
                                    <div><span className="text-stone-400">Natura:</span> {formatPrice(plan.precios["3"])}</div>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin ? (
                                <div className="text-xs">
                                  <div>{format(new Date(plan.fechaInicio), "dd MMM", { locale: es })}</div>
                                  <div className="text-stone-400">→</div>
                                  <div>{format(new Date(plan.fechaFin), "dd MMM yyyy", { locale: es })}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-stone-400">Sin límite</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-stone-600 hover:text-primary"
                                  onClick={() => openEditPlan(plan)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className={cn(
                                    plan.estado 
                                      ? "text-red-500 hover:text-red-700 hover:bg-red-50" 
                                      : "text-green-500 hover:text-green-700 hover:bg-green-50"
                                  )}
                                  onClick={() => handleTogglePlan(plan.id)}
                                >
                                  <Power className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bloqueos">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-primary">Fechas Bloqueadas (Admin)</h2>
                <Button variant="outline" className="bg-white border-accent text-accent hover:bg-accent hover:text-white" onClick={() => setIsBlockModalOpen(true)}>
                  <Lock className="w-4 h-4 mr-2" /> Nuevo Bloqueo
                </Button>
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="font-bold">Referencia</TableHead>
                      <TableHead className="font-bold">Unidad</TableHead>
                      <TableHead className="font-bold">Desde</TableHead>
                      <TableHead className="font-bold">Hasta</TableHead>
                      <TableHead className="font-bold">Creado el</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.filter(r => r.plan === "BLOQUEO ADMIN").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-stone-500">No hay bloqueos activos</TableCell>
                      </TableRow>
                    ) : (
                      reservas.filter(r => r.plan === "BLOQUEO ADMIN").map((bloqueo) => (
                        <TableRow key={bloqueo.id} className="hover:bg-stone-50/50">
                          <TableCell className="font-mono text-xs font-bold">{bloqueo.referencia}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Tent className="w-4 h-4 text-accent" />
                              <span className="text-sm font-bold">{bloqueo.unidad}</span>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(bloqueo.fecha_inicio), "dd MMM yyyy", { locale: es })}</TableCell>
                          <TableCell>{format(new Date(bloqueo.fecha_fin), "dd MMM yyyy", { locale: es })}</TableCell>
                          <TableCell className="text-xs text-stone-500">
                            {bloqueo.created_at ? format(new Date(bloqueo.created_at), "dd/MM/yy HH:mm", { locale: es }) : "Reciente"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("¿Está seguro de eliminar este bloqueo definitivamente?")) {
                                  handleAction("cancelar-reserva.php", { referencia: bloqueo.referencia });
                                }
                              }}
                            >
                              <Unlock className="w-4 h-4 mr-2" /> Desbloquear
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tarifas">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif text-primary">Configuración de Tarifas</h2>
                <Button
                  className="bg-accent hover:bg-accent/90 text-white rounded-xl"
                  disabled={isSavingPricing}
                  onClick={async () => {
                    setIsSavingPricing(true);
                    try {
                      const payload: PricingConfig = {
                        tarifas: {
                          entre_semana: pricingForm.entre_semana,
                          viernes_domingo: pricingForm.viernes_domingo,
                          especial: pricingForm.especial
                        },
                        persona_adicional: pricingForm.persona_adicional,
                        max_adicionales: pricingForm.max_adicionales,
                        festivos: pricingConfig.festivos,
                        fechas_especiales: pricingConfig.fechas_especiales
                      };
                      const res = await fetch("/api/pricing", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
                        credentials: "include",
=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
                        body: JSON.stringify(payload)
                      });
                      if (res.ok) {
                        setPricingConfig(payload);
                        toast({ title: "Tarifas guardadas", description: "La configuración de precios ha sido actualizada." });
                      } else {
                        toast({ title: "Error", description: "No se pudieron guardar las tarifas.", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Error de conexión", variant: "destructive" });
                    } finally {
                      setIsSavingPricing(false);
                    }
                  }}
                >
                  {isSavingPricing ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
                  <Label className="text-xs uppercase tracking-widest font-bold text-stone-500">Entre Semana</Label>
                  <p className="text-[11px] text-stone-400">Lunes a Jueves (sin festivos)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-sm">$</span>
                    <Input
                      type="number"
                      className="rounded-xl font-bold text-lg"
                      value={pricingForm.entre_semana}
                      onChange={(e) => setPricingForm(p => ({ ...p, entre_semana: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
                  <Label className="text-xs uppercase tracking-widest font-bold text-stone-500">Viernes o Domingo</Label>
                  <p className="text-[11px] text-stone-400">Sin festivos, sin domingo antes de lunes festivo</p>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-sm">$</span>
                    <Input
                      type="number"
                      className="rounded-xl font-bold text-lg"
                      value={pricingForm.viernes_domingo}
                      onChange={(e) => setPricingForm(p => ({ ...p, viernes_domingo: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="p-5 bg-accent/5 rounded-2xl border border-accent/20 space-y-3">
                  <Label className="text-xs uppercase tracking-widest font-bold text-accent">Sábado / Festivo</Label>
                  <p className="text-[11px] text-stone-400">Sábados, festivos, domingos antes de lunes festivo, Dic 24 y 31</p>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-sm">$</span>
                    <Input
                      type="number"
                      className="rounded-xl font-bold text-lg"
                      value={pricingForm.especial}
                      onChange={(e) => setPricingForm(p => ({ ...p, especial: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <Label className="text-xs uppercase tracking-widest font-bold text-stone-500">Persona adicional (Domo Familiar)</Label>
                  <p className="text-[11px] text-stone-400">Cargo por cada persona extra más allá de 2 personas base</p>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-sm">$</span>
                    <Input
                      type="number"
                      className="rounded-xl"
                      value={pricingForm.persona_adicional}
                      onChange={(e) => setPricingForm(p => ({ ...p, persona_adicional: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <Label className="text-xs uppercase tracking-widest font-bold text-stone-500">Máximo de personas adicionales</Label>
                  <p className="text-[11px] text-stone-400">Número máximo de personas extra permitidas en el Domo Familiar</p>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    className="rounded-xl"
                    value={pricingForm.max_adicionales}
                    onChange={(e) => setPricingForm(p => ({ ...p, max_adicionales: parseInt(e.target.value) || 4 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest font-bold text-stone-500">Días Festivos (YYYY-MM-DD)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="2026-01-01"
                      className="rounded-xl"
                      value={pricingForm.newFestivo}
                      onChange={(e) => setPricingForm(p => ({ ...p, newFestivo: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && pricingForm.newFestivo.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          setPricingConfig(p => ({ ...p, festivos: [...p.festivos, pricingForm.newFestivo].sort() }));
                          setPricingForm(p => ({ ...p, newFestivo: "" }));
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="rounded-xl shrink-0"
                      disabled={!pricingForm.newFestivo.match(/^\d{4}-\d{2}-\d{2}$/)}
                      onClick={() => {
                        setPricingConfig(p => ({ ...p, festivos: [...p.festivos, pricingForm.newFestivo].sort() }));
                        setPricingForm(p => ({ ...p, newFestivo: "" }));
                      }}
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {pricingConfig.festivos.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-stone-100 rounded-lg px-2 py-1 text-xs font-mono">
                        {f}
                        <button className="text-stone-400 hover:text-red-500 ml-1 font-bold" onClick={() => setPricingConfig(p => ({ ...p, festivos: p.festivos.filter((_, idx) => idx !== i) }))}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest font-bold text-stone-500">Fechas Especiales Anuales (MM-DD)</Label>
                  <p className="text-[11px] text-stone-400">Se repiten cada año. Ej: 12-24 = Nochebuena, 12-31 = Nochevieja</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="12-24"
                      className="rounded-xl"
                      value={pricingForm.newFechaEspecial}
                      onChange={(e) => setPricingForm(p => ({ ...p, newFechaEspecial: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && pricingForm.newFechaEspecial.match(/^\d{2}-\d{2}$/)) {
                          setPricingConfig(p => ({ ...p, fechas_especiales: [...p.fechas_especiales, pricingForm.newFechaEspecial].sort() }));
                          setPricingForm(p => ({ ...p, newFechaEspecial: "" }));
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="rounded-xl shrink-0"
                      disabled={!pricingForm.newFechaEspecial.match(/^\d{2}-\d{2}$/)}
                      onClick={() => {
                        setPricingConfig(p => ({ ...p, fechas_especiales: [...p.fechas_especiales, pricingForm.newFechaEspecial].sort() }));
                        setPricingForm(p => ({ ...p, newFechaEspecial: "" }));
                      }}
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pricingConfig.fechas_especiales.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-accent/10 rounded-lg px-2 py-1 text-xs font-mono text-accent">
                        {f}
                        <button className="text-accent/50 hover:text-red-500 ml-1 font-bold" onClick={() => setPricingConfig(p => ({ ...p, fechas_especiales: p.fechas_especiales.filter((_, idx) => idx !== i) }))}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════
              TAB: GLAMPINGS
          ══════════════════════════════════════════════════ */}
          <TabsContent value="glampings">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Tent className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-serif text-primary">Glampings</h2>
              </div>
              <p className="text-stone-500 text-sm">Edita el nombre, descripción y fotos de cada domo.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminCampings.map(c => (
                  <div key={c.id} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                        <img src={c.images?.[0] || c.image || "/images/glamping-placeholder.svg"} alt={c.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "/images/glamping-placeholder.svg"; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-800">{c.name}</p>
                        <p className="text-xs text-stone-400 line-clamp-2">{c.description}</p>
                        <p className="text-xs text-stone-400 mt-1">{c.images?.filter(i => !i.includes("placeholder")).length || 0} foto(s)</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-xl w-full" onClick={() => openCampingModal(c)}>
                      <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal: Edit Camping */}
            {isCampingModalOpen && editingCamping && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsCampingModalOpen(false); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="font-bold text-lg text-primary">Editar: {editingCamping.name}</h3>
                    <Button size="icon" variant="ghost" onClick={() => setIsCampingModalOpen(false)}><XCircle className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Nombre</label>
                      <input value={campingForm.name} onChange={e => setCampingForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    {/* Description */}
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Descripción</label>
                      <textarea value={campingForm.description} onChange={e => setCampingForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    </div>
                    {/* Features */}
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Características (resumen)</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {campingForm.features.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary rounded-lg px-2 py-1 text-xs">
                            {f} <button onClick={() => setCampingForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))} className="text-primary/50 hover:text-red-500 font-bold">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={campingForm.newFeature} onChange={e => setCampingForm(p => ({ ...p, newFeature: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && campingForm.newFeature.trim()) { setCampingForm(p => ({ ...p, features: [...p.features, p.newFeature.trim()], newFeature: "" })); }}} placeholder="Ej: Jacuzzi privado" className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { if (campingForm.newFeature.trim()) setCampingForm(p => ({ ...p, features: [...p.features, p.newFeature.trim()], newFeature: "" })); }}>+ Agregar</Button>
                      </div>
                    </div>
                    {/* Includes */}
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Incluye (detalle completo)</label>
                      <div className="space-y-1 mb-2">
                        {campingForm.includes.map((inc, i) => (
                          <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-1 text-xs">
                            <span className="flex-1">{inc}</span>
                            <button onClick={() => setCampingForm(p => ({ ...p, includes: p.includes.filter((_, idx) => idx !== i) }))} className="text-stone-400 hover:text-red-500 font-bold shrink-0">×</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={campingForm.newInclude} onChange={e => setCampingForm(p => ({ ...p, newInclude: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && campingForm.newInclude.trim()) { setCampingForm(p => ({ ...p, includes: [...p.includes, p.newInclude.trim()], newInclude: "" })); }}} placeholder="🛁 Jacuzzi climatizado" className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { if (campingForm.newInclude.trim()) setCampingForm(p => ({ ...p, includes: [...p.includes, p.newInclude.trim()], newInclude: "" })); }}>+ Agregar</Button>
                      </div>
                    </div>
                    {/* Images */}
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Fotos</label>
                      <p className="text-[11px] text-stone-400 mb-2">Pasa el cursor sobre una foto y toca ★ para elegirla como portada.</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {(editingCamping.images || []).filter(i => !i.includes("placeholder")).map((img, idx) => {
                          const isCover = editingCamping.image === img;
                          const isVideo = /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(img);
                          return (
                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-stone-100">
                              {isVideo ? (
                                <video src={img} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                              ) : (
                                <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                              )}
                              {isCover && (
                                <div className="absolute top-1 left-1 bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow" title="Portada actual">★</div>
                              )}
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isCover && (
                                  <button
                                    onClick={() => handleSetCoverImage(editingCamping.id, img)}
                                    className="bg-amber-400 hover:bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
                                    title="Usar como portada"
                                  >★</button>
                                )}
                                <button onClick={() => handleDeleteCampingImage(editingCamping.id, img)} className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">×</button>
                              </div>
                            </div>
                          );
                        })}
                        <label className={cn("aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors bg-stone-50", isUploadingCampingImage ? "border-accent bg-accent/5 cursor-not-allowed" : "border-stone-300 cursor-pointer hover:border-primary/50")}>
                          {campingConverting ? (
                            <>
                              <svg className="animate-spin w-5 h-5 text-accent mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              <span className="text-[10px] text-accent font-semibold">Convirtiendo...</span>
                            </>
                          ) : isUploadingCampingImage ? (
                            <>
                              <Camera className="w-5 h-5 text-accent mb-1" />
                              <span className="text-[10px] text-accent font-semibold">{campingUploadProgress}%</span>
                              <div className="w-8 bg-stone-200 rounded-full h-1 mt-1 overflow-hidden">
                                <div className="bg-accent h-1 rounded-full transition-all duration-200" style={{ width: `${campingUploadProgress}%` }} />
                              </div>
                            </>
                          ) : (
                            <>
                              <Camera className="w-5 h-5 text-stone-400 mb-1" />
                              <span className="text-[10px] text-stone-400">Subir foto/video</span>
                            </>
                          )}
                          <input type="file" accept="image/*,video/*" className="hidden" disabled={isUploadingCampingImage} onChange={e => { const f = e.target.files?.[0]; if (f) handleCampingImageUpload(editingCamping.id, f); e.target.value = ""; }} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-stone-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                    <Button variant="outline" className="rounded-xl" onClick={() => setIsCampingModalOpen(false)}>Cancelar</Button>
                    <Button className="rounded-xl bg-primary text-white" disabled={campingSaving} onClick={handleSaveCamping}>{campingSaving ? "Guardando..." : "Guardar cambios"}</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════
              TAB: ADICIONALES
          ══════════════════════════════════════════════════ */}
          <TabsContent value="adicionales">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-serif text-primary">Adicionales</h2>
                </div>
                <Button className="rounded-xl bg-primary text-white" onClick={() => openAddonModal()}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo adicional
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminAddons.map(a => (
                  <div key={a.id} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-stone-800">{a.title}</p>
                        <p className="text-xs text-stone-500 line-clamp-2">{a.description}</p>
                      </div>
                      <p className="text-sm font-bold text-primary shrink-0">${(a.price || 0).toLocaleString()}</p>
                    </div>
                    {a.details?.length > 0 && (
                      <ul className="text-[11px] text-stone-400 list-disc list-inside space-y-0.5">
                        {a.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => openAddonModal(a)}><Edit className="w-3 h-3 mr-1" /> Editar</Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-500 hover:bg-red-50" onClick={() => handleDeleteAddon(a.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
                {adminAddons.length === 0 && <p className="text-stone-400 text-sm col-span-2 text-center py-8">No hay adicionales. Crea el primero.</p>}
              </div>
            </div>

            {/* Modal: Add/Edit Addon */}
            {isAddonModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsAddonModalOpen(false); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-primary">{editingAddon ? "Editar adicional" : "Nuevo adicional"}</h3>
                    <Button size="icon" variant="ghost" onClick={() => setIsAddonModalOpen(false)}><XCircle className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Título</label>
                      <input value={addonForm.title} onChange={e => setAddonForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Decoración especial" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Precio (COP)</label>
                      <input type="number" value={addonForm.price} onChange={e => setAddonForm(p => ({ ...p, price: Number(e.target.value) }))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Descripción</label>
                      <textarea value={addonForm.description} onChange={e => setAddonForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Detalles</label>
                      <div className="space-y-1 mb-2">
                        {addonForm.details.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-1 text-xs">
                            <span className="flex-1">{d}</span>
                            <button onClick={() => setAddonForm(p => ({ ...p, details: p.details.filter((_, idx) => idx !== i) }))} className="text-stone-400 hover:text-red-500 font-bold">×</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={addonForm.newDetail} onChange={e => setAddonForm(p => ({ ...p, newDetail: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && addonForm.newDetail.trim()) { setAddonForm(p => ({ ...p, details: [...p.details, p.newDetail.trim()], newDetail: "" })); }}} placeholder="Detalle del adicional" className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { if (addonForm.newDetail.trim()) setAddonForm(p => ({ ...p, details: [...p.details, p.newDetail.trim()], newDetail: "" })); }}>+</Button>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Cantidad seleccionable</label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-primary">Permitir múltiples unidades</p>
                          <p className="text-[11px] text-stone-400">Ej: taxi por persona, cena por persona</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddonForm(p => ({ ...p, allowMultiple: !p.allowMultiple, maxQuantity: !p.allowMultiple ? 10 : 1 }))}
                          className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none", addonForm.allowMultiple ? "bg-accent" : "bg-stone-300")}
                        >
                          <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform", addonForm.allowMultiple ? "translate-x-5" : "translate-x-0")} />
                        </button>
                      </div>
                      {addonForm.allowMultiple && (
                        <div>
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Cantidad máxima</label>
                          <input
                            type="number"
                            min={2}
                            max={99}
                            value={addonForm.maxQuantity}
                            onChange={e => setAddonForm(p => ({ ...p, maxQuantity: Math.max(2, Number(e.target.value)) }))}
                            className="w-24 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      )}
                    </div>

                    {/* Sección de media — solo disponible al editar */}
                    {editingAddon ? (
                      <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Fotos y Videos</label>
                        <p className="text-[11px] text-stone-400 mb-3">Las fotos y videos se mostrarán al cliente cuando haga clic en este servicio.</p>
                        {addonMedia.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {addonMedia.map((m, i) => (
                              <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-black">
                                {m.type === "video" ? (
                                  <div className="w-full h-full flex items-center justify-center bg-stone-800">
                                    <Film className="w-6 h-6 text-white/70" />
                                  </div>
                                ) : (
                                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                                )}
                                <button
                                  onClick={() => handleAddonMediaDelete(m.url)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >×</button>
                                <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white rounded px-1 capitalize">{m.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="relative">
                          {!addonMediaUploading && (
                            <input type="file" accept="image/*,video/*" multiple onChange={handleAddonMediaUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          )}
                          <div className={cn("border-2 border-dashed rounded-xl p-4 text-center text-xs text-stone-500 transition-colors", addonMediaUploading ? "border-accent bg-accent/5" : "border-stone-300 hover:border-primary")}>
                            {addonConverting ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-accent">Convirtiendo video...</span>
                                </div>
                                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                                  <div className="bg-accent h-2 rounded-full animate-pulse" style={{ width: "100%" }} />
                                </div>
                                <div className="text-[10px] text-stone-400">Optimizando para web, puede tomar unos segundos</div>
                              </div>
                            ) : addonMediaUploading ? (
                              <div className="space-y-2">
                                <div className="text-xs font-semibold text-accent">Subiendo... {addonUploadProgress}%</div>
                                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                                  <div className="bg-accent h-2 rounded-full transition-all duration-200" style={{ width: `${addonUploadProgress}%` }} />
                                </div>
                                <div className="text-[10px] text-stone-400">No cierres esta ventana</div>
                              </div>
                            ) : (
                              <>
                                <Camera className="w-4 h-4 mx-auto mb-1 text-stone-400" />
                                <span>Subir fotos o videos</span>
                                <span className="block text-[10px] text-stone-400 mt-0.5">Puedes seleccionar varios a la vez</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-400 text-center border border-stone-200">
                        <Camera className="w-4 h-4 mx-auto mb-1 opacity-40" />
                        Guarda el adicional primero para subir fotos y videos
                      </div>
                    )}

                    {addonFormError && <p className="text-red-500 text-xs">{addonFormError}</p>}
                  </div>
                  <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
                    <Button variant="outline" className="rounded-xl" onClick={() => setIsAddonModalOpen(false)}>Cancelar</Button>
                    <Button className="rounded-xl bg-primary text-white" disabled={addonSaving} onClick={handleSaveAddon}>{addonSaving ? "Guardando..." : "Guardar"}</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════
              TAB: CREDENCIALES
          ══════════════════════════════════════════════════ */}
          <TabsContent value="credenciales">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-serif text-primary">Credenciales de Acceso</h2>
                </div>
                <Button className="rounded-xl bg-primary text-white" onClick={() => { setEditingAdminUser(null); setAdminUserForm({ email: "", password: "", rol: "admin" }); setAdminUserFormError(null); setIsAdminUserModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo acceso
                </Button>
              </div>
              <p className="text-stone-500 text-sm">Gestiona quién puede ingresar al panel administrativo.</p>

              <div className="space-y-3">
                {adminUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <KeyRound className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-800">{u.email}</p>
                        <p className="text-[11px] text-stone-400 capitalize">{u.rol}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => { setEditingAdminUser(u); setAdminUserForm({ email: u.email, password: "", rol: u.rol }); setAdminUserFormError(null); setIsAdminUserModalOpen(true); }}>
                        <Edit className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-500 hover:bg-red-50" onClick={() => handleDeleteAdminUser(u.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {adminUsers.length === 0 && <p className="text-stone-400 text-sm text-center py-8">Cargando usuarios...</p>}
              </div>
            </div>

            {/* Modal: Add/Edit Admin User */}
            {isAdminUserModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsAdminUserModalOpen(false); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-primary">{editingAdminUser ? "Editar acceso" : "Nuevo acceso"}</h3>
                    <Button size="icon" variant="ghost" onClick={() => setIsAdminUserModalOpen(false)}><XCircle className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Email</label>
                      <input type="email" value={adminUserForm.email} onChange={e => setAdminUserForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@example.com" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">{editingAdminUser ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}</label>
                      <input type="password" value={adminUserForm.password} onChange={e => setAdminUserForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    {adminUserFormError && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{adminUserFormError}</p>}
                  </div>
                  <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
                    <Button variant="outline" className="rounded-xl" onClick={() => setIsAdminUserModalOpen(false)}>Cancelar</Button>
                    <Button className="rounded-xl bg-primary text-white" disabled={adminUserSaving} onClick={handleSaveAdminUser}>{adminUserSaving ? "Guardando..." : "Guardar"}</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="banners">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-serif text-primary">Banners de Información</h2>
                </div>
                <Button className="rounded-xl bg-accent text-white hover:bg-accent/90" onClick={() => {
                  setEditingBanner(null);
                  setBannerForm({ titulo: "", texto: "", imagen: "", pasos: ["plan"], bgColor: "#FEF3C7", textColor: "#92400E", activo: true, fontSize: 14, lineHeight: 1.6, letterSpacing: 0 });
                  setBannerImagePreview(null);
                  setBannerFormError(null);
                  setIsBannerModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Banner
                </Button>
              </div>
              <p className="text-stone-500 text-sm">Muestra avisos, promociones o información especial en pasos específicos del proceso de reserva. El banner se adapta automáticamente si solo tiene texto, imagen o ambos.</p>

              <div className="space-y-4">
                {banners.length === 0 && (
                  <div className="text-center py-12 text-stone-400">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay banners creados aún.</p>
                    <p className="text-xs mt-1">Crea uno para mostrar información en la reserva.</p>
                  </div>
                )}
                {banners.map(banner => (
                  <div key={banner.id} className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                    {/* Preview del banner */}
                    <div
                      className="flex items-stretch min-h-[80px]"
                      style={{ background: banner.bgColor, color: banner.textColor }}
                    >
                      {/* Franja de color izquierda */}
                      <div className="w-1.5 shrink-0" style={{ background: banner.textColor, opacity: 0.25 }} />
                      {/* Contenido */}
                      <div className={cn("flex-1 py-4 px-4", banner.imagen ? "flex items-center gap-4" : "")}>
                        <div className="flex-1 min-w-0">
                          {banner.titulo && (
                            <p className="font-bold text-sm leading-snug">{banner.titulo}</p>
                          )}
                          {banner.texto && (
                            <p className={cn("whitespace-pre-wrap", banner.titulo ? "mt-1 opacity-90" : "")} style={{
                              fontSize: banner.fontSize ? `${banner.fontSize}px` : "14px",
                              lineHeight: banner.lineHeight ?? 1.6,
                              letterSpacing: banner.letterSpacing ? `${banner.letterSpacing}px` : "normal"
                            }}>{banner.texto}</p>
                          )}
                        </div>
                        {banner.imagen && (
                          <img
                            src={banner.imagen}
                            alt={banner.titulo || "Banner"}
                            className="shrink-0 h-16 w-24 object-cover rounded-xl shadow-sm"
                          />
                        )}
                      </div>
                    </div>
                    {/* Barra de controles */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-t border-stone-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleBanner(banner.id)}
                          className={cn("px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors", banner.activo ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-stone-100 text-stone-400 hover:bg-stone-200")}
                        >
                          {banner.activo ? "✓ Activo" : "Inactivo"}
                        </button>
                        {banner.pasos.map((p: string) => (
                          <span key={p} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                            {PASO_LABELS[p] || p}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 px-2.5" onClick={() => {
                          setEditingBanner(banner);
                          setBannerForm({ titulo: banner.titulo, texto: banner.texto, imagen: banner.imagen, pasos: banner.pasos, bgColor: banner.bgColor, textColor: banner.textColor, activo: banner.activo, fontSize: banner.fontSize ?? 14, lineHeight: banner.lineHeight ?? 1.6, letterSpacing: banner.letterSpacing ?? 0 });
                          setBannerImagePreview(banner.imagen || null);
                          setBannerFormError(null);
                          setIsBannerModalOpen(true);
                        }}>
                          <Edit className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => handleDeleteBanner(banner.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isBannerModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setIsBannerModalOpen(false); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="font-bold text-lg text-primary">{editingBanner ? "Editar Banner" : "Nuevo Banner"}</h3>
                    <Button size="icon" variant="ghost" onClick={() => setIsBannerModalOpen(false)}><XCircle className="w-5 h-5" /></Button>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">¿En qué paso(s) aparece? *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BOOKING_STEPS.map(s => (
                          <label key={s.id} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors">
                            <input type="checkbox" checked={bannerForm.pasos.includes(s.id)} onChange={e => {
                              setBannerForm(prev => ({
                                ...prev,
                                pasos: e.target.checked ? [...prev.pasos, s.id] : prev.pasos.filter(p => p !== s.id)
                              }));
                            }} className="rounded accent-amber-500" />
                            <span className="text-sm font-medium text-stone-700">{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Título (opcional)</label>
                      <input value={bannerForm.titulo} onChange={e => setBannerForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: ¡Semana Santa disponible!" className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Mensaje (opcional)</label>
                      <textarea value={bannerForm.texto} onChange={e => setBannerForm(p => ({ ...p, texto: e.target.value }))} placeholder="Ej: Reserva con anticipación, últimas unidades disponibles..." rows={5} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" style={{ resize: "vertical", fontFamily: "monospace" }} />
                      <p className="text-[10px] text-stone-400 mt-1">Los saltos de línea y espacios se verán exactamente igual en el banner.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Tipografía del mensaje</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-stone-500 font-semibold block">Tamaño ({bannerForm.fontSize}px)</label>
                          <input type="range" min={10} max={24} step={1} value={bannerForm.fontSize} onChange={e => setBannerForm(p => ({ ...p, fontSize: Number(e.target.value) }))} className="w-full accent-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-stone-500 font-semibold block">Interlineado ({bannerForm.lineHeight})</label>
                          <input type="range" min={1} max={3} step={0.1} value={bannerForm.lineHeight} onChange={e => setBannerForm(p => ({ ...p, lineHeight: Number(e.target.value) }))} className="w-full accent-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-stone-500 font-semibold block">Espaciado ({bannerForm.letterSpacing}px)</label>
                          <input type="range" min={-1} max={5} step={0.5} value={bannerForm.letterSpacing} onChange={e => setBannerForm(p => ({ ...p, letterSpacing: Number(e.target.value) }))} className="w-full accent-amber-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Imagen o Video (opcional)</label>
                      <div className="flex gap-3 items-start">
                        <div className="relative flex-1">
                          {!bannerImageUploading && <input type="file" accept="image/*,video/*" onChange={handleBannerImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />}
                          <div className={cn("border-2 border-dashed rounded-xl p-3 text-center text-xs text-stone-500 transition-colors", bannerImageUploading ? "border-accent bg-accent/5" : "border-stone-300 hover:border-accent")}>
                            {bannerConverting ? (
                              <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-3 h-3 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                <span className="text-accent font-semibold">Convirtiendo...</span>
                              </div>
                            ) : bannerImageUploading ? (
                              <div className="space-y-1">
                                <div className="text-accent font-semibold">Subiendo... {bannerUploadProgress}%</div>
                                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden"><div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${bannerUploadProgress}%` }} /></div>
                              </div>
                            ) : "Clic o arrastra para subir imagen o video"}
                          </div>
                        </div>
                        {bannerImagePreview && (
                          <div className="relative shrink-0">
                            <img src={bannerImagePreview} alt="" className="h-14 w-20 object-cover rounded-xl border border-stone-200" />
                            <button onClick={() => { setBannerImagePreview(null); setBannerForm(p => ({ ...p, imagen: "" })); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">×</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Color de fondo</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={bannerForm.bgColor} onChange={e => setBannerForm(p => ({ ...p, bgColor: e.target.value }))} className="w-10 h-10 rounded-xl border-2 border-stone-200 cursor-pointer p-0.5" />
                          <input value={bannerForm.bgColor} onChange={e => setBannerForm(p => ({ ...p, bgColor: e.target.value }))} className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Color de texto</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={bannerForm.textColor} onChange={e => setBannerForm(p => ({ ...p, textColor: e.target.value }))} className="w-10 h-10 rounded-xl border-2 border-stone-200 cursor-pointer p-0.5" />
                          <input value={bannerForm.textColor} onChange={e => setBannerForm(p => ({ ...p, textColor: e.target.value }))} className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none" />
                        </div>
                      </div>
                    </div>

                    {(bannerForm.titulo || bannerForm.texto || bannerForm.imagen) && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Vista previa</label>
                        <div className="rounded-2xl p-4 border border-stone-200" style={{ background: bannerForm.bgColor, color: bannerForm.textColor }}>
                          {bannerForm.titulo && <p className="font-bold text-sm mb-1">{bannerForm.titulo}</p>}
                          {bannerForm.texto && (
                            <p className="whitespace-pre-wrap" style={{
                              fontSize: `${bannerForm.fontSize}px`,
                              lineHeight: bannerForm.lineHeight,
                              letterSpacing: `${bannerForm.letterSpacing}px`
                            }}>{bannerForm.texto}</p>
                          )}
                          {bannerForm.imagen && <img src={bannerForm.imagen} alt="" className="mt-2 rounded-xl max-h-32 object-cover w-full" />}
                        </div>
                      </div>
                    )}

                    {bannerFormError && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{bannerFormError}</p>}
                  </div>
                  <div className="p-6 border-t border-stone-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                    <Button variant="outline" className="rounded-xl" onClick={() => setIsBannerModalOpen(false)}>Cancelar</Button>
                    <Button className="rounded-xl bg-accent hover:bg-accent/90" onClick={handleSaveBanner}>
                      {editingBanner ? "Guardar Cambios" : "Crear Banner"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

<<<<<<< HEAD
          <TabsContent value="actividad">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-stone-800">Registro de Actividad</h2>
                  <p className="text-sm text-stone-500 mt-1">Historial de cambios realizados en el panel de administración</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchAuditLog(auditFilter)}>
                  Actualizar
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {["all","camping","plan","addon","banner","pricing","plan-block","unit-block"].map(e => (
                  <button
                    key={e}
                    onClick={() => { setAuditFilter(e); fetchAuditLog(e); }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${auditFilter === e ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"}`}
                  >
                    {{ all: "Todo", camping: "Glampings", plan: "Planes", addon: "Adicionales", banner: "Banners", pricing: "Tarifas", "plan-block": "Bloqueos Plan", "unit-block": "Bloqueos Unidad" }[e] || e}
                  </button>
                ))}
              </div>

              {auditLoading ? (
                <div className="text-center py-12 text-stone-400 text-sm">Cargando...</div>
              ) : auditLog.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-stone-500 text-sm">No hay actividad registrada aún.</p>
                  <p className="text-stone-400 text-xs mt-1">Los cambios realizados desde ahora aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLog.map((entry) => {
                    const date = new Date(entry.ts);
                    const dateStr = date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
                    const timeStr = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
                    const actionColor: Record<string, string> = {
                      CREATE: "bg-green-100 text-green-700",
                      UPDATE: "bg-blue-100 text-blue-700",
                      DELETE: "bg-red-100 text-red-700",
                      UPLOAD: "bg-purple-100 text-purple-700",
                    };
                    const entityLabel: Record<string, string> = {
                      camping: "Glamping", plan: "Plan", addon: "Adicional",
                      banner: "Banner", pricing: "Tarifas", "plan-block": "Bloqueo Plan", "unit-block": "Bloqueo Unidad"
                    };
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${actionColor[entry.action] || "bg-stone-100 text-stone-600"}`}>
                          {entry.action}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-800 leading-snug">{entry.description}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            <span className="font-medium text-stone-500">{entityLabel[entry.entity] || entry.entity}</span>
                            {entry.entity_id && <span className="ml-1 opacity-60">#{entry.entity_id.substring(0, 12)}</span>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-stone-500">{dateStr}</p>
                          <p className="text-xs text-stone-400">{timeStr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

=======
>>>>>>> 55a329eb5d6673f38daa91668508787cfdc747b9
        </>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-bold capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <Select value={calFilter} onValueChange={(v: any) => setCalFilter(v)}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="free">Solo Libres</SelectItem>
                  <SelectItem value="reserved">Solo Reservados</SelectItem>
                  <SelectItem value="blocked">Solo Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-xl overflow-hidden border border-stone-200">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                <div key={day} className="bg-stone-50 p-2 text-center text-xs font-bold text-stone-500 uppercase">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map(({ date, isCurrentMonth }, idx) => {
                const status = getDayStatus(date);
                const isFiltered = calFilter === "all" || calFilter === status.status;
                
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "min-h-[100px] bg-white p-2 transition-all relative group cursor-pointer",
                      !isCurrentMonth && "bg-stone-50 opacity-50",
                      !isFiltered && "grayscale opacity-30"
                    )}
                    onClick={() => {
                      const checkDate = new Date(date);
                      checkDate.setHours(12, 0, 0, 0);
                      const y = checkDate.getFullYear();
                      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
                      const d = String(checkDate.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      
                      const dayReservas = reservas.filter(r => {
                        const start = (r.fecha_inicio || "").substring(0, 10);
                        const end = (r.fecha_fin || "").substring(0, 10);
                        // Usar comparación de strings que es segura para fechas YYYY-MM-DD
                        return dateStr >= start && dateStr < end && r.estado !== 3;
                      });
                      if (dayReservas.length > 0) {
                        setSelectedDayReservas(dayReservas);
                        setIsDayReservasModalOpen(true);
                      }
                    }}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      (() => {
                        const d1 = new Date(date);
                        d1.setHours(12,0,0,0);
                        const d2 = new Date();
                        d2.setHours(12,0,0,0);
                        return d1.getTime() === d2.getTime();
                      })() && "bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full"
                    )}>
                      {date.getDate()}
                    </span>
                    
                    <div className={cn(
                      "mt-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase truncate",
                      status.color
                    )}>
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-6 text-xs text-stone-500 justify-center border-t border-stone-100 pt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" /> Disponible
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" /> Reservado
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" /> Bloqueado
              </div>
            </div>
          </div>
        </div>
      )}
    </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Gestionar Reserva</DialogTitle>
            <DialogDescription>
              Referencia: <span className="font-mono font-bold text-primary">{selectedReserva?.referencia}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-3 py-4">
            {selectedReserva?.comprobante && (
              <button 
                onClick={() => {
                  setComprobanteUrl(selectedReserva.comprobante || null);
                  setIsComprobanteModalOpen(true);
                }}
                className="inline-flex items-center justify-start gap-3 h-12 rounded-xl px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors w-full"
              >
                <CheckCircle2 className="w-4 h-4" /> Ver Comprobante de Pago
              </button>
            )}
            {selectedReserva?.plan !== "BLOQUEO ADMIN" && (
              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12 rounded-xl bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                onClick={() => {
                  if (selectedReserva) {
                    generateBookingReceipt(selectedReserva);
                  }
                }}
              >
                <Download className="w-4 h-4" /> Generar Comprobante de Reserva
              </Button>
            )}
            <Button 
              variant="outline" 
              className="justify-start gap-3 h-12 rounded-xl"
              disabled={selectedReserva?.estado === 3 || selectedReserva?.estado === 4}
              onClick={() => {
                if (selectedReserva) {
                  setEditData({
                    referencia: selectedReserva.referencia,
                    fecha_inicio: selectedReserva.fecha_inicio,
                    fecha_fin: selectedReserva.fecha_fin,
                    unidad: selectedReserva.unidad,
                    nombre: selectedReserva.nombre,
                    email: selectedReserva.email || "",
                    telefono: selectedReserva.telefono || "",
                    plan: selectedReserva.plan,
                    total: selectedReserva.total,
                    abono: selectedReserva.abono,
                    estado: selectedReserva.estado
                  });
                  setIsEditModalOpen(true);
                  setIsModalOpen(false);
                }
              }}
            >
              <CalendarIcon className="w-4 h-4" /> Modificar Reserva (Fechas/Unidad)
            </Button>
            {selectedReserva?.estado === 1 && (
              <Button 
                className="justify-start gap-3 h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => handleAction("marcar-saldo-pagado.php", { referencia: selectedReserva.referencia })}
              >
                <Wallet className="w-4 h-4" /> Marcar Saldo Pagado
              </Button>
            )}
            {(selectedReserva?.estado === 1 || selectedReserva?.estado === 2) && (
              <>
                {selectedReserva?.plan !== "BLOQUEO ADMIN" && (
                  <Button 
                    className="justify-start gap-3 h-12 rounded-xl bg-green-600 hover:bg-green-700"
                    onClick={() => handleAction("marcar-completada.php", { referencia: selectedReserva.referencia })}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar como Completada
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  className="justify-start gap-3 h-12 rounded-xl"
                  onClick={() => {
                    if (confirm(`¿Está seguro de que desea eliminar este registro permanentemente?`)) {
                      handleAction("cancelar-reserva.php", { referencia: selectedReserva.referencia });
                    }
                  }}
                >
                  <XCircle className="w-4 h-4" /> {selectedReserva?.plan === "BLOQUEO ADMIN" ? "Eliminar Bloqueo" : "Cancelar Reserva"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Modificar Reserva</DialogTitle>
            <DialogDescription>
              Ajusta las fechas o cambia la unidad de la reserva <span className="font-mono font-bold">{editData.referencia}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Cliente</Label>
                <Input 
                  value={editData.nombre}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input 
                  value={editData.telefono}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, telefono: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Correo Electrónico</Label>
                <Input 
                  value={editData.email}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select onValueChange={(v) => setEditData({...editData, unidad: v})} value={editData.unidad}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Domo Gold">Domo Gold</SelectItem>
                    <SelectItem value="Domo Big Premium">Domo Big Premium</SelectItem>
                    <SelectItem value="Domo Natura Premium">Domo Natura Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select onValueChange={(v) => setEditData({...editData, plan: v})} value={editData.plan}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicPlans.map(plan => {
                      const isActive = plan.estado;
                      if (!isActive) return null;
                      
                      if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
                        const now = new Date();
                        now.setHours(12, 0, 0, 0);
                        const start = new Date(plan.fechaInicio + 'T12:00:00');
                        const end = new Date(plan.fechaFin + 'T12:00:00');
                        if (now < start || now > end) return null;
                      }
                      
                      return <SelectItem key={plan.id} value={plan.nombre}>{plan.nombre}</SelectItem>;
                    })}
                    <SelectItem value="BLOQUEO ADMIN">Bloqueo Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  value={editData.fecha_inicio ? editData.fecha_inicio.substring(0, 10) : ""}
                  onChange={(e) => {
                    // Si el usuario cambia la fecha manualmente en el input tipo date,
                    // aseguramos que mantenga el sufijo T12:00:00 para consistencia
                    const val = e.target.value;
                    setEditData({...editData, fecha_inicio: val ? (val.includes('T') ? val : val + 'T12:00:00') : ""});
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  value={editData.fecha_fin ? editData.fecha_fin.substring(0, 10) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditData({...editData, fecha_fin: val ? (val.includes('T') ? val : val + 'T12:00:00') : ""});
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total</Label>
                <Input 
                  type="number" 
                  value={editData.total}
                  className="rounded-xl font-bold"
                  onChange={(e) => setEditData({...editData, total: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Abono</Label>
                <Input 
                  type="number" 
                  value={editData.abono}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, abono: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select onValueChange={(v) => setEditData({...editData, estado: parseInt(v)})} value={editData.estado.toString()}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pendiente</SelectItem>
                    <SelectItem value="2">Abonado</SelectItem>
                    <SelectItem value="3">Cancelado</SelectItem>
                    <SelectItem value="4">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button 
                className="rounded-xl bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  const dataToSave = {
                    ...editData,
                    fecha_inicio: normalizeDateForSave(editData.fecha_inicio),
                    fecha_fin: normalizeDateForSave(editData.fecha_fin)
                  };
                  handleAction("actualizar-reserva.php", dataToSave);
                }}
              >
                Guardar Cambios
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Bloquear Fechas</DialogTitle>
            <DialogDescription>
              Las fechas bloqueadas no estarán disponibles para reserva en el sitio web.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Unidad a bloquear</Label>
              <Select onValueChange={(v) => setBlockData({...blockData, unidad: v})} defaultValue="all">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las unidades</SelectItem>
                  {campings.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input 
                  type="date" 
                  min={today}
                  className="rounded-xl" 
                  onChange={(e) => setBlockData(prev => ({...prev, fecha_inicio: e.target.value}))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input 
                  type="date" 
                  min={blockData.fecha_inicio || today}
                  className="rounded-xl" 
                  onChange={(e) => setBlockData(prev => ({...prev, fecha_fin: e.target.value}))} 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-accent hover:bg-accent/90"
              onClick={() => {
                const dataToSave = {
                  ...blockData,
                  fecha_inicio: normalizeDateForSave(blockData.fecha_inicio),
                  fecha_fin: normalizeDateForSave(blockData.fecha_fin)
                };
                handleAction("bloquear-fecha", dataToSave);
              }}
              disabled={!blockData.fecha_inicio || !blockData.fecha_fin}
            >
              Confirmar Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewReservaModalOpen} onOpenChange={setIsNewReservaModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Crear Nueva Reserva</DialogTitle>
            <DialogDescription>
              Ingresa los detalles para crear una reserva manual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Cliente</Label>
                <Input 
                  placeholder="Juan Perez" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input 
                  type="email" 
                  placeholder="juan@ejemplo.com" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input 
                  placeholder="300 123 4567" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, telefono: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select onValueChange={(v) => setNewReservaData({...newReservaData, unidad: v})} defaultValue="Domo Gold">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Domo Gold">Domo Gold</SelectItem>
                    <SelectItem value="Domo Big Premium">Domo Big Premium</SelectItem>
                    <SelectItem value="Domo Natura Premium">Domo Natura Premium</SelectItem>
                    <SelectItem value="Domo Familiar">Domo Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, fecha_inicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, fecha_fin: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select onValueChange={(v) => setNewReservaData({...newReservaData, plan: v})} value={newReservaData.plan}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicPlans.map(plan => {
                      const isActive = plan.estado;
                      if (!isActive) return null;
                      
                      if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
                        const now = new Date();
                        now.setHours(12, 0, 0, 0);
                        const start = new Date(plan.fechaInicio + 'T12:00:00');
                        const end = new Date(plan.fechaFin + 'T12:00:00');
                        if (now < start || now > end) return null;
                      }
                      
                      return <SelectItem key={plan.id} value={plan.nombre}>{plan.nombre}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total (Auto)</Label>
                <Input 
                  type="number" 
                  value={newReservaData.total}
                  className="rounded-xl bg-stone-50 font-bold"
                  onChange={(e) => setNewReservaData({...newReservaData, total: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Abono</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, abono: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado Inicial</Label>
              <Select onValueChange={(v) => setNewReservaData({...newReservaData, estado: parseInt(v)})} defaultValue="2">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Pendiente (Sin pago)</SelectItem>
                  <SelectItem value="2">Abonado (Confirmado)</SelectItem>
                  <SelectItem value="4">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewReservaModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-primary text-white hover:bg-primary/90"
              onClick={handleCreateManualReserva}
              disabled={!newReservaData.nombre || !newReservaData.fecha_inicio || !newReservaData.fecha_fin || !newReservaData.plan}
            >
              Crear Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDayReservasModalOpen} onOpenChange={setIsDayReservasModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Reservas del Día</DialogTitle>
            <DialogDescription>
              {selectedDayReservas.length > 0 && format(new Date(selectedDayReservas[0].fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedDayReservas.map((reserva) => (
              <div 
                key={reserva.id} 
                className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer group"
                onClick={() => {
                  setSelectedReserva(reserva);
                  setIsModalOpen(true);
                  setIsDayReservasModalOpen(false);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-primary">{reserva.nombre}</h4>
                    <p className="text-xs text-stone-500 font-mono">{reserva.referencia}</p>
                  </div>
                  {getStatusBadge(reserva.estado)}
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <Tent className="w-4 h-4 text-accent" />
                    <span className="font-medium">{reserva.unidad}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {reserva.plan}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDayReservasModalOpen(false)} className="rounded-xl w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isComprobanteModalOpen} onOpenChange={setIsComprobanteModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Comprobante de Pago</DialogTitle>
            <DialogDescription>
              Referencia: <span className="font-mono font-bold text-primary">{selectedReserva?.referencia}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {comprobanteUrl ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                  <img 
                    src={comprobanteUrl} 
                    alt="Comprobante de pago" 
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 rounded-xl"
                    onClick={() => window.open(comprobanteUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Abrir en nueva pestaña
                  </Button>
                  <a 
                    href={comprobanteUrl} 
                    download={`comprobante-${selectedReserva?.referencia}.png`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full rounded-xl">
                      <Download className="w-4 h-4 mr-2" /> Descargar Imagen
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-500">
                No hay comprobante disponible para esta reserva.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComprobanteModalOpen(false)} className="rounded-xl w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlanBlockModalOpen} onOpenChange={(open) => {
        setIsPlanBlockModalOpen(open);
        if (!open) {
          setPlanBlockError(null);
          setPlanBlockForm({ planId: "", campingIds: [], fechaInicio: "", fechaFin: "" });
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Bloquear Plan por Camping</DialogTitle>
            <DialogDescription>
              Bloquea un plan específico en uno o más campings durante un rango de fechas. Este plan no estará disponible para reserva durante ese período.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan a bloquear</Label>
              <Select onValueChange={(v) => setPlanBlockForm({...planBlockForm, planId: v})} value={planBlockForm.planId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Campings afectados</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { typeId: 1, name: "Domo Gold" },
                  { typeId: 2, name: "Domo Big Premium" },
                  { typeId: 3, name: "Domo Natura Premium" }
                ].map(camping => (
                  <button
                    key={camping.typeId}
                    type="button"
                    onClick={() => toggleCampingSelection(camping.typeId)}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2",
                      planBlockForm.campingIds.includes(camping.typeId)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    )}
                  >
                    {planBlockForm.campingIds.includes(camping.typeId) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {camping.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input 
                  type="date" 
                  min={today}
                  className="rounded-xl" 
                  value={planBlockForm.fechaInicio}
                  onChange={(e) => setPlanBlockForm({...planBlockForm, fechaInicio: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input 
                  type="date" 
                  min={planBlockForm.fechaInicio || today}
                  className="rounded-xl" 
                  value={planBlockForm.fechaFin}
                  onChange={(e) => setPlanBlockForm({...planBlockForm, fechaFin: e.target.value})} 
                />
              </div>
            </div>

            {planBlockError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {planBlockError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanBlockModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-accent hover:bg-accent/90"
              onClick={handleCreatePlanBlock}
              disabled={!planBlockForm.planId || planBlockForm.campingIds.length === 0 || !planBlockForm.fechaInicio || !planBlockForm.fechaFin}
            >
              Confirmar Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnitBlockModalOpen} onOpenChange={(open) => {
        setIsUnitBlockModalOpen(open);
        if (!open) setUnitBlockForm({ unitName: "", motivo: "", fechaInicio: "", fechaFin: "" });
      }}>
        <DialogContent className="sm:max-w-lg rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Inhabilitar Unidad de Camping</DialogTitle>
            <DialogDescription>
              Marca una unidad como no disponible. Si dejas las fechas vacías, se inhabilitará de forma indefinida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select onValueChange={(v) => setUnitBlockForm({...unitBlockForm, unitName: v})} value={unitBlockForm.unitName}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {allUnits.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input 
                placeholder="Ej: En mantenimiento, Fuera de servicio..." 
                className="rounded-xl"
                value={unitBlockForm.motivo}
                onChange={(e) => setUnitBlockForm({...unitBlockForm, motivo: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desde (opcional)</Label>
                <Input 
                  type="date" 
                  className="rounded-xl" 
                  value={unitBlockForm.fechaInicio}
                  onChange={(e) => setUnitBlockForm({...unitBlockForm, fechaInicio: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta (opcional)</Label>
                <Input 
                  type="date" 
                  min={unitBlockForm.fechaInicio || undefined}
                  className="rounded-xl" 
                  value={unitBlockForm.fechaFin}
                  onChange={(e) => setUnitBlockForm({...unitBlockForm, fechaFin: e.target.value})} 
                />
              </div>
            </div>

            <p className="text-xs text-stone-400 italic">Si no seleccionas fechas, la unidad quedará inhabilitada indefinidamente hasta que la habilites manualmente.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnitBlockModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCreateUnitBlock}
              disabled={!unitBlockForm.unitName}
            >
              Inhabilitar Unidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlanModalOpen} onOpenChange={(open) => {
        setIsPlanModalOpen(open);
        if (!open) resetPlanForm();
      }}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? "Modifica la información del plan." : "Configura un nuevo plan para ofrecer a tus clientes."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Nombre del plan *</Label>
                <Input 
                  className="rounded-xl" 
                  placeholder="Ej: Plan Romántico"
                  value={planForm.nombre}
                  onChange={(e) => setPlanForm({...planForm, nombre: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Eslogan *</Label>
                <Input 
                  className="rounded-xl" 
                  placeholder="Ej: La escapada perfecta para dos"
                  value={planForm.eslogan}
                  onChange={(e) => setPlanForm({...planForm, eslogan: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Descripción</Label>
              <Input 
                className="rounded-xl" 
                placeholder="Descripción breve del plan"
                value={planForm.descripcion}
                onChange={(e) => setPlanForm({...planForm, descripcion: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Tipo de plan *</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "normal", label: "Normal", desc: "Plan estándar con precio propio por noche" },
                  { id: "temporada", label: "Temporada", desc: "Plan con fechas específicas (máx 2 meses)" },
                  { id: "preventa", label: "Preventa", desc: "Plan con badge de preventa visible" },
                  { id: "addon", label: "Addon", desc: "Precio fijo adicional sobre tarifa base" },
                  { id: "pasa_dia", label: "Pasa Día", desc: "Visita de día sin alojamiento nocturno" }
                ].map(tipo => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setPlanForm({...planForm, tipo: tipo.id as any})}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 transition-all text-left flex-1 min-w-[120px]",
                      planForm.tipo === tipo.id
                        ? "border-accent bg-accent/10"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    )}
                  >
                    <p className={cn("font-bold text-sm", planForm.tipo === tipo.id ? "text-accent" : "text-stone-700")}>{tipo.label}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{tipo.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {planForm.tipo === "temporada" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-bold text-orange-600">Fecha inicio *</Label>
                  <Input 
                    type="date" 
                    className="rounded-xl" 
                    value={planForm.fechaInicio}
                    onChange={(e) => setPlanForm({...planForm, fechaInicio: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-bold text-orange-600">Fecha fin *</Label>
                  <Input 
                    type="date" 
                    min={planForm.fechaInicio}
                    className="rounded-xl" 
                    value={planForm.fechaFin}
                    onChange={(e) => setPlanForm({...planForm, fechaFin: e.target.value})} 
                  />
                </div>
                <p className="col-span-2 text-xs text-orange-600">Máximo 2 meses de duración</p>
              </div>
            )}

            {planForm.tipo === "addon" && (
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                <Label className="text-xs uppercase tracking-wider font-bold text-accent">Precio adicional fijo (COP) *</Label>
                <p className="text-[11px] text-stone-500">Este valor se suma a la tarifa base de alojamiento. Ej: $170.000</p>
                <Input 
                  type="number" 
                  className="rounded-xl" 
                  placeholder="170000"
                  value={planForm.precio || ""}
                  onChange={(e) => setPlanForm({...planForm, precio: parseInt(e.target.value) || 0})} 
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">
                Campings aplicables
              </Label>
              <p className="text-[11px] text-stone-400">Deja todos sin marcar para que aplique a todos los domos.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 1, name: "Domo Gold" },
                  { id: 2, name: "Domo Big Premium" },
                  { id: 3, name: "Domo Natura Premium" },
                  { id: 4, name: "Domo Familiar" },
                ].map(c => {
                  const isSelected = planForm.campingIds?.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const current = planForm.campingIds || [];
                        if (isSelected) {
                          const next = current.filter(id => id !== c.id);
                          setPlanForm({...planForm, campingIds: next.length === 0 ? null : next});
                        } else {
                          setPlanForm({...planForm, campingIds: [...current, c.id]});
                        }
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                        isSelected ? "border-accent bg-accent/10 text-accent" : "border-stone-200 bg-white hover:border-stone-300 text-stone-600"
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {planForm.campingIds && planForm.campingIds.length > 0 && (
                <p className="text-[11px] text-accent font-medium">
                  Aplica solo para: {planForm.campingIds.map(id => ({ 1: "Domo Gold", 2: "Domo Big Premium", 3: "Domo Natura Premium", 4: "Domo Familiar" }[id])).filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Ícono</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPlanForm({...planForm, icono: opt.id})}
                        className={cn(
                          "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all",
                          planForm.icono === opt.id
                            ? "border-accent bg-accent/10"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        )}
                        title={opt.name}
                      >
                        <Icon className={cn("w-5 h-5", planForm.icono === opt.id ? "text-accent" : "text-stone-500")} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Color</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={planForm.color}
                    onChange={(e) => setPlanForm({...planForm, color: e.target.value})}
                    className="w-10 h-10 rounded-xl border-2 border-stone-200 cursor-pointer"
                  />
                  <Input 
                    className="rounded-xl flex-1" 
                    value={planForm.color}
                    onChange={(e) => setPlanForm({...planForm, color: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Precios por tipo de día *</Label>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-[11px] text-stone-500 mb-1">
                Los precios aplican para todos los domos. Se elige el precio según el día de check-in.
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Entre semana (Lun–Jue)</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl" 
                    placeholder="290000"
                    value={planForm.precios["entre_semana"] || ""}
                    onChange={(e) => setPlanForm({...planForm, precios: {...planForm.precios, "entre_semana": parseInt(e.target.value) || 0}})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Viernes o Domingo</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl" 
                    placeholder="320000"
                    value={planForm.precios["viernes_domingo"] || ""}
                    onChange={(e) => setPlanForm({...planForm, precios: {...planForm.precios, "viernes_domingo": parseInt(e.target.value) || 0}})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Sábado / Festivo</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl" 
                    placeholder="390000"
                    value={planForm.precios["especial"] || ""}
                    onChange={(e) => setPlanForm({...planForm, precios: {...planForm.precios, "especial": parseInt(e.target.value) || 0}})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">¿Qué incluye?</Label>
              <div className="flex gap-2">
                <Input 
                  className="rounded-xl flex-1" 
                  placeholder="Ej: Bebida de bienvenida"
                  value={planForm.newIncluye}
                  onChange={(e) => setPlanForm({...planForm, newIncluye: e.target.value})}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIncluye())}
                />
                <Button type="button" variant="outline" className="rounded-xl" onClick={addIncluye}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {planForm.incluye.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {planForm.incluye.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                      {item}
                      <button type="button" onClick={() => removeIncluye(idx)} className="text-red-500 hover:text-red-700">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={planForm.desactivarOtros}
                  onChange={(e) => setPlanForm({...planForm, desactivarOtros: e.target.checked})}
                  className="w-5 h-5 rounded border-stone-300 text-accent focus:ring-accent"
                />
                <div>
                  <p className="font-bold text-sm text-stone-700">Desactivar otros planes</p>
                  <p className="text-xs text-stone-500">Al guardar, todos los demás planes se desactivarán y solo este quedará visible.</p>
                </div>
              </label>
            </div>

            {planFormError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {planFormError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-accent hover:bg-accent/90"
              onClick={handleSavePlan}
            >
              {editingPlan ? "Guardar Cambios" : "Crear Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
