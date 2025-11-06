import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Shield, LogOut, AlertTriangle, TrendingUp } from "lucide-react";
import CameraFeed from "@/components/CameraFeed";
import AlertCard from "@/components/AlertCard";
import SafetyScoreChart from "@/components/SafetyScoreChart";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Set up realtime subscription for new detections
    const channel = supabase
      .channel('detections-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detections'
        },
        (payload) => {
          console.log('New detection:', payload);
          setRefreshKey(prev => prev + 1);
          
          // Play voice alert for realtime detections
          const detection = payload.new as any;
          const utterance = new SpeechSynthesisUtterance(
            `New safety violation detected: ${detection.violation_type}`
          );
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);

          toast({
            title: "New Violation Alert!",
            description: detection.violation_type,
            variant: "destructive",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, toast]);

  const { data: detections, refetch } = useQuery({
    queryKey: ['detections', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('detections')
        .select(`
          *,
          cameras (
            name,
            location
          )
        `)
        .order('detected_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .gte('detected_at', today.toISOString());
      
      if (error) throw error;

      const violationsToday = data.length;
      const safetyScore = Math.max(0, 100 - (violationsToday * 5));
      
      return {
        safetyScore,
        violationsToday,
        trend: -3, // Mock trend data
      };
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDetectionComplete = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Construction Safety AI</h1>
                <p className="text-sm text-muted-foreground">Real-time PPE Monitoring</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Camera Feed */}
          <div className="lg:col-span-2 space-y-6">
            <CameraFeed onDetectionComplete={handleDetectionComplete} />

            {/* Recent Alerts */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-semibold">Recent Violations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detections?.map((detection) => (
                  <AlertCard key={detection.id} detection={detection} />
                ))}
                {!detections?.length && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    No violations detected yet. Upload an image to start monitoring.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <SafetyScoreChart
              score={stats?.safetyScore || 100}
              trend={stats?.trend || 0}
              violationsToday={stats?.violationsToday || 0}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance Rate</p>
                    <p className="text-2xl font-bold">{stats?.safetyScore || 100}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
