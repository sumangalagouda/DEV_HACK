import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, HardHat, AlertTriangle, BarChart3, Camera } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated, redirect to dashboard
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/dashboard");
        }
      });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-white">SafetyAI</span>
          </div>
          <Button onClick={() => navigate("/auth")} size="lg" className="bg-primary">
            Get Started
          </Button>
        </nav>

        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <HardHat className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-accent">AI-Powered Safety Monitoring</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Construction Site Risk &<br />
            <span className="text-primary">Safety Intelligence</span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Real-time PPE detection and safety compliance monitoring using advanced AI.
            Protect your workers, reduce risks, and ensure regulatory compliance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
            <Button onClick={() => navigate("/auth")} size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card/50 backdrop-blur-lg border border-border rounded-2xl p-8">
            <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              AI Vision Detection
            </h3>
            <p className="text-muted-foreground">
              Advanced AI analyzes CCTV feeds and images to detect missing helmets, safety vests,
              and unsafe behaviors in real-time.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-lg border border-border rounded-2xl p-8">
            <div className="p-3 bg-warning/10 rounded-xl w-fit mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Instant Alerts
            </h3>
            <p className="text-muted-foreground">
              Get immediate voice and dashboard notifications when safety violations are detected,
              enabling quick response and prevention.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-lg border border-border rounded-2xl p-8">
            <div className="p-3 bg-success/10 rounded-xl w-fit mb-4">
              <BarChart3 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Safety Analytics
            </h3>
            <p className="text-muted-foreground">
              Track compliance rates, identify risk zones, and generate comprehensive
              safety reports with actionable insights.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">99.2%</div>
            <div className="text-sm text-slate-400">Detection Accuracy</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-success mb-2">-65%</div>
            <div className="text-sm text-slate-400">Safety Incidents</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">&lt;2s</div>
            <div className="text-sm text-slate-400">Alert Response Time</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-20 bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Site Safety?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join leading construction companies using AI to protect their workforce
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" variant="secondary" className="text-lg px-8">
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
