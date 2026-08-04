import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { LucideIcon } from "lucide-react";

interface LegalPageLayoutProps {
  icon: LucideIcon;
  title: string;
  meta?: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ icon: Icon, title, meta, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative py-16 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <Icon className="w-4 h-4 text-[#FF2D55]" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
          {meta && <p className="text-white/80">{meta}</p>}
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            {children}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
