import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { CampingsSection } from "@/components/CampingsSection";
import { PlansSection } from "@/components/PlansSection";
import { AddonsSection } from "@/components/AddonsSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent selection:text-white">
      <Navbar />
      <Hero />
      <PlansSection />
      <CampingsSection />
      <AddonsSection />
      <Footer />
    </div>
  );
}
