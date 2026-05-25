import { MapPin, Instagram, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer id="footer" className="bg-[#0f2419] text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="text-center md:text-left">
            <img 
              src="/images/carupa-logo.png" 
              alt="Carupa Glamping" 
              className="h-24 w-24 object-cover rounded-full mx-auto md:mx-0 mb-6 border-2 border-white/20"
            />
            <p className="text-gray-400 max-w-sm mx-auto md:mx-0">
              Un espacio sagrado en la naturaleza para reconectar, descansar y celebrar la vida.
            </p>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl mb-6">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-accent" />
                <span>Entre Carmen de Carupa y Ubaté, Cundinamarca</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-accent" />
                <span>+57 310 327 2630</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-accent" />
                <span>reservas@carupaglamping.com</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl mb-6">Síguenos</h3>
            <a 
              href="https://www.instagram.com/carupaglamping/?hl=es" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-accent transition-colors text-lg"
            >
              <Instagram className="w-6 h-6" />
              <span>@carupaglamping</span>
            </a>
            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-2">Horario de Atención</p>
              <p className="text-gray-300">Todos los días: 8:00 AM - 10:30 PM</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <h3 className="font-serif text-xl text-white">¿Cómo llegar?</h3>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl" style={{ height: 220 }}>
            <iframe
              title="Carupa Glamping - Ubicación"
              src="https://maps.google.com/maps?q=5.2822521,-73.8831335&z=17&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-3 text-right">
            <a
              href="https://www.google.com/maps/place/Carupa+Glamping/@5.2820177,-73.88416,18z/data=!4m9!3m8!1s0x8e4049c34c9e9fd9:0x3ddd5950c723b33!5m2!4m1!1i2!8m2!3d5.2822521!4d-73.8831335!16s%2Fg%2F11jpw1h96j"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm font-medium"
            >
              <MapPin className="w-4 h-4" />
              Abrir en Google Maps
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500 space-y-2">
          <p>&copy; {new Date().getFullYear()} Carupa Glamping. Todos los derechos reservados.</p>
          <p>
            Diseñado y desarrollado por{" "}
            <a
              href="https://www.instagram.com/eber_vrg/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-accent transition-colors underline underline-offset-2"
            >
              Eber Vargas
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
