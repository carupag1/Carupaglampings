import { motion } from "framer-motion";
import { useLocation } from "wouter";

export function Hero() {
  const [, setLocation] = useLocation();

  return (
    <section id="home" className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Hero background image */}
      <div className="absolute inset-0 z-0">
        <img src="/images/hero-bg.png" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,36,25,0.55) 0%, rgba(15,36,25,0.45) 60%, rgba(15,36,25,0.7) 100%)" }} />
      </div>

      <div className="relative z-10 h-full container mx-auto px-4 flex flex-col items-center justify-center text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <img 
            src="/images/carupa-logo.png" 
            alt="Carupa Glamping" 
            className="h-36 md:h-44 w-36 md:w-44 object-cover rounded-full border-4 border-white/20 shadow-2xl mx-auto"
          />
        </motion.div>

        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-serif italic font-light mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Carupa Glamping
        </motion.h1>

        <motion.p 
          className="text-lg md:text-xl font-sans max-w-2xl mb-10 text-white/90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Un refugio de lujo en la naturaleza para reconectar, descansar y vivir experiencias únicas en pareja.
        </motion.p>

        <motion.button 
          onClick={() => {
            const section = document.getElementById('campings');
            if (section) {
              section.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="group relative px-8 py-3 bg-transparent border border-white text-white rounded-full overflow-hidden transition-all hover:bg-white hover:text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <span className="relative z-10 font-medium tracking-wide uppercase">Ver nuestros glampings</span>
        </motion.button>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white to-transparent" />
      </motion.div>
    </section>
  );
}
