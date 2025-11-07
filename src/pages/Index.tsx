import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, HardHat, AlertTriangle, BarChart3, Camera } from "lucide-react";

const FancyLogo = () => (
  <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="27" cy="27" r="26" fill="url(#paint0_radial)" stroke="hsl(var(--primary))" strokeWidth="2" />
    <path d="M27 39c5-4 9-7 9-13a9 9 0 10-18 0c0 6 4 9 9 13Z" fill="hsl(var(--primary))" stroke="hsl(var(--secondary))" strokeWidth="1.8"/>
    <circle cx="27" cy="26" r="4.2" fill="hsl(var(--secondary))" stroke="white" strokeWidth="1.5"/>
    <defs>
      <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="rotate(65 5 40) scale(31 38)" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f5dfff" />
        <stop offset="1" stopColor="#ebe6ff" />
      </radialGradient>
    </defs>
  </svg>
);

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-primary/15 via-white to-secondary/10">
      {/* Navigation + Hero */}
      <header className="w-full pb-16 pt-10">
        <nav className="flex justify-between items-center max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl shadow-lg p-2 bg-white"><FancyLogo /></div>
            <span className="font-brand-heading text-3xl tracking-tight text-primary font-bold">VigilantAI</span>
          </div>
          <Button size="lg" className="text-lg px-8 rounded-full" onClick={() => navigate("/auth")}>Get Started</Button>
        </nav>
      </header>
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto pt-10 text-center mb-24">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/20 mb-10 shadow-md">
          <HardHat className="h-6 w-6 text-accent" />
          <span className="text-base font-medium text-secondary">Next-Gen PPE & Site Intelligence</span>
        </div>
        <h1 className="font-brand-heading text-5xl md:text-7xl font-extrabold text-gradient bg-gradient-to-tr from-primary to-secondary bg-clip-text text-transparent mb-8 leading-tight">
          Smarter Construction <span className="text-accent">Safety</span><br /> Starts Here
        </h1>
        <p className="text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Real-time AI vision for live-site risk, PPE enforcement, and instant safety alerts. Protect workers, reduce risk, and automate compliance.
        </p>
        <div className="flex flex-col md:flex-row gap-5 justify-center mb-8">
          <Button size="xl" className="text-xl px-10 rounded-full shadow-lg font-semibold" onClick={() => navigate("/auth")}>Start Free</Button>
          <Button variant="outline" size="xl" className="text-xl px-10 rounded-full font-semibold border-2 border-primary/40" onClick={() => navigate("/auth")}>Request Demo</Button>
        </div>
      </div>
      {/* Features Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-4 mb-32">
        <div className="card p-8 flex flex-col items-center text-center border-0">
          <Camera className="h-12 w-12 text-primary mb-6" />
          <h3 className="font-brand-heading text-2xl font-semibold mb-2">Live CCTV Vision</h3>
          <p className="text-base text-muted-foreground">Connect real-time cameras and analyze safety compliance or risks with every frame.</p>
        </div>
        <div className="card p-8 flex flex-col items-center text-center border-0">
          <AlertTriangle className="h-12 w-12 text-accent mb-6" />
          <h3 className="font-brand-heading text-2xl font-semibold mb-2">Proactive Risk Alerts</h3>
          <p className="text-base text-muted-foreground">Instant notifications and voice alerts when PPE violations or dangers are detected—no operator lag.</p>
        </div>
        <div className="card p-8 flex flex-col items-center text-center border-0">
          <BarChart3 className="h-12 w-12 text-secondary mb-6" />
          <h3 className="font-brand-heading text-2xl font-semibold mb-2">Smart Site Analytics</h3>
          <p className="text-base text-muted-foreground">Dashboards with compliance trends, site incident rates, and actionable insights for supervisors.</p>
        </div>
      </div>
      {/* Stats Section */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center mb-32 px-4">
        <div className="card p-6">
          <div className="text-4xl font-brand-heading font-bold text-primary mb-1">99.8%</div>
          <div className="text-base text-muted-foreground">Detection Accuracy</div>
        </div>
        <div className="card p-6">
          <div className="text-4xl font-brand-heading font-bold text-success mb-1">-74%</div>
          <div className="text-base text-muted-foreground">Incidents After Adopting</div>
        </div>
        <div className="card p-6">
          <div className="text-4xl font-brand-heading font-bold text-accent mb-1">1.2s</div>
          <div className="text-base text-muted-foreground">Avg. Alert Response</div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="max-w-3xl mx-auto mb-24">
        <div className="rounded-3xl shadow-2xl px-10 py-14 bg-gradient-to-br from-primary/80 to-secondary/80 flex flex-col gap-8 text-center">
          <h2 className="font-brand-heading text-4xl font-bold text-white mb-2">Ready to Transform Your Site?</h2>
          <p className="text-xl text-white/90 mb-6">Join leading construction companies using VigilantAI for a safer, smarter, more compliant worksite.</p>
          <Button size="xl" variant="secondary" className="text-xl px-12 rounded-full font-semibold w-fit mx-auto" onClick={() => navigate("/auth")}>Get Started Today</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
