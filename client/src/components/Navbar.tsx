import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Inicio", href: "#home" },
    { name: "Nuestros Glampings", href: "#campings" },
    { name: "Planes", href: "#planes" },
    { name: "Contacto", href: "#footer" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/90 backdrop-blur-md shadow-sm py-4"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/images/carupa-logo.png" 
            alt="Carupa Glamping" 
            className="h-16 w-16 object-cover rounded-full shadow-sm"
          />
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "font-sans text-sm font-medium uppercase tracking-widest hover:text-accent transition-colors",
                isScrolled ? "text-foreground" : "text-white"
              )}
            >
              {link.name}
            </a>
          ))}
          <Link href="/reservar">
            <button className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-full font-medium transition-colors cursor-pointer">
              Reservar
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={cn("h-6 w-6", isScrolled ? "text-foreground" : "text-white")} />
          ) : (
            <Menu className={cn("h-6 w-6", isScrolled ? "text-foreground" : "text-white")} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-t border-border p-4 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-foreground font-medium py-2 border-b border-border/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <Link href="/reservar">
            <button 
              className="bg-accent text-white w-full py-3 rounded-md font-medium cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Reservar Ahora
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}
