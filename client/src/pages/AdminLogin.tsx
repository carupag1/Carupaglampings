import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: "Bienvenido", description: "Acceso concedido al panel admin" });
        setLocation("/admin");
      } else {
        toast({ title: "Error", description: data.error || "Credenciales inválidas", variant: "destructive" });
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast({ title: "Error", description: "No se pudo conectar con el servidor", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f2419 0%, #1b3a2d 60%, #2d5a42 100%)" }}>
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-0">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-full overflow-hidden border-4 border-accent/20 shadow-lg mb-2">
            <img src="/images/carupa-logo.png" alt="Carupa Glamping" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-serif">Admin Carupa Glamping</CardTitle>
          <CardDescription>Ingresa tus credenciales para gestionar el glamping</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input 
                  type="email" 
                  placeholder="admin@carupaglamping.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-14 rounded-2xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-14 rounded-2xl"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold" disabled={loading}>
              {loading ? "Verificando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
