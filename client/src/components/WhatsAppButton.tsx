import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "573103272630";
  const message = encodeURIComponent("Hola, tengo un problema y necesito ayuda con mi reserva.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 flex items-center justify-center"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={32} />
    </a>
  );
}
