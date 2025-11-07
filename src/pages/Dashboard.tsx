import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { LogOut, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import CameraFeed from "@/components/CameraFeed";
import AlertCard from "@/components/AlertCard";
import SafetyScoreChart from "@/components/SafetyScoreChart";
import LiveDetectionStatus from "@/components/LiveDetectionStatus";
import { useToast } from "@/hooks/use-toast";

const BrandLogo = () => (
  <svg width="40" height="40" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="27" cy="27" r="25" fill="url(#paint0_radial)" stroke="hsl(var(--primary))" strokeWidth="2" />
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        // Fetch user profile to get assigned zones
        const { data: profile } = await supabase
          .from('profiles')
          .select('assigned_zones, full_name, role')
          .eq('id', session.user.id)
          .single();
        setUserProfile(profile);
      }
    });
    // Realtime subscription for new detections
    const channel = supabase
      .channel('detections-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'detections' },
        (payload) => {
          console.log('New detection:', payload);
          setRefreshKey(prev => prev + 1);

          // Voice alert - only if detection is from supervisor's assigned zones
          const detection = payload.new as any;
          
          // Check if this detection is from supervisor's assigned zone
          if (userProfile?.assigned_zones && userProfile.assigned_zones.length > 0) {
            // We need to check the camera zone - this will be filtered by RLS
            // But we can also check here for extra safety
            supabase
              .from('cameras')
              .select('zone')
              .eq('id', detection.camera_id)
              .single()
              .then(({ data: camera }) => {
                if (camera && userProfile.assigned_zones.includes(camera.zone)) {
                  const utterance = new SpeechSynthesisUtterance(
                    `New safety violation detected in ${camera.zone}: ${detection.violation_type}`
                  );
                  utterance.rate = 0.9;
                  window.speechSynthesis.speak(utterance);

                  toast({
                    title: "New Violation Alert!",
                    description: `${detection.violation_type} in ${camera.zone}`,
                    variant: "destructive",
                  });
                }
              });
          } else {
            // No zone restrictions - show all
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
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [navigate, toast, userProfile]);

  const { data: detections, refetch } = useQuery({
    queryKey: ['detections', refreshKey, userProfile?.assigned_zones],
    queryFn: async () => {
      let query = supabase
        .from('detections')
        .select(`*, cameras (name, location, zone)`)
        .neq('violation_type', '')
        .neq('violation_type', 'No violations detected - All Clear')
        .neq('violation_type', 'Person Detected - All PPE Requirements Met');
      
      // Note: Zone filtering is handled by RLS policies in the database
      // The RLS policy will automatically filter detections based on supervisor's assigned_zones
      
      const { data, error } = await query
        .order('detected_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching detections:', error);
        throw error;
      }
      console.log('Fetched detections:', data?.length || 0, 'for zones:', userProfile?.assigned_zones || 'all');
      return data;
    },
    enabled: !!user && !!userProfile,
    refetchInterval: 5000, // Refetch every 5 seconds to catch new detections
  });

  const { data: stats } = useQuery({
    queryKey: ['stats', userProfile?.assigned_zones],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // RLS will automatically filter by supervisor's assigned zones
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .neq('violation_type', '')
        .neq('violation_type', 'No violations detected - All Clear')
        .neq('violation_type', 'Person Detected - All PPE Requirements Met')
        .gte('detected_at', today.toISOString());
      if (error) throw error;
      const violationsToday = data?.length || 0;
      const safetyScore = Math.max(0, 100 - (violationsToday * 5));
      return {
        safetyScore,
        violationsToday,
        trend: -3, // Mock trend
      };
    },
    enabled: !!user && !!userProfile,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  const handleDetectionComplete = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/15 via-background to-secondary/5">
      <header className="sticky top-0 z-40 w-full border-b border-border/30 bg-white/80 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span className="font-brand-heading font-bold text-2xl text-primary tracking-tight">VigilantAI</span>
          </div>
          <Button variant="outline" size="lg" className="rounded-full font-brand-heading px-7" onClick={handleSignOut}>
            <LogOut className="h-5 w-5 mr-2" /> Sign Out
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-10 px-4 min-h-[88vh]">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
          {/* Left: Camera Feed & Violation Alerts */}
          <div className="xl:col-span-3 flex flex-col gap-12">
            {/* Live Detection Status - Shows real-time detections from Python worker */}
            <LiveDetectionStatus />
            
            <div className="card p-7">
              <h2 className="font-brand-heading text-2xl font-semibold mb-5 text-primary flex gap-2 items-center"><Shield className="h-6 w-6 text-primary/70"/> Manual Image Upload</h2>
              <CameraFeed onDetectionComplete={handleDetectionComplete} />
            </div>
            <div className="card p-7">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-brand-heading text-xl font-semibold">Recent Violations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {detections?.map((detection) => (
                  <AlertCard key={detection.id} detection={detection} />
                ))}
                {!detections?.length && (
                  <div className="col-span-2 text-center py-14 text-muted-foreground text-lg">
                    No violations detected yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right: Analytics & Stats */}
          <div className="xl:col-span-2 flex flex-col gap-12">
            <div className="card p-7">
              <h2 className="font-brand-heading text-2xl font-semibold mb-5 text-primary flex gap-2 items-center"><TrendingUp className="h-6 w-6 text-primary/80"/> Site Safety Analytics</h2>
              <SafetyScoreChart score={stats?.safetyScore || 100} trend={stats?.trend || 0} violationsToday={stats?.violationsToday || 0} />
            </div>
            {/* Add quick stats/future widgets here if needed */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
