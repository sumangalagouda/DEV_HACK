import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LiveDetectionStatusProps {
  cameraId?: string;
}

const LiveDetectionStatus = ({ cameraId }: LiveDetectionStatusProps) => {
  const [isActive, setIsActive] = useState(false);
  const [latestDetection, setLatestDetection] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'monitoring' | 'violation'>('idle');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch user profile to get assigned zones
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('assigned_zones, full_name')
          .eq('id', session.user.id)
          .single();
        setUserProfile(profile);
      }
    });
  }, []);

  useEffect(() => {
    // Subscribe to real-time detections
    const channel = supabase
      .channel('live-detections')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detections',
          filter: cameraId ? `camera_id=eq.${cameraId}` : undefined,
        },
        (payload) => {
          console.log('New detection received:', payload);
          const detection = payload.new as any;
          setLatestDetection(detection);
          setIsActive(true);

          // Determine violation status robustly:
          // Prefer explicit boolean `has_violations` if available from the backend.
          // Otherwise, fall back to case-insensitive checks on the `violation_type` text
          // and treat common "all clear" / manual-review phrases as non-violations.
          const negPatterns = [
            'all clear',
            'all ppe requirements met',
            'all ppe',
            'no violations',
            'no violation',
            'manual review',
            'manual inspection',
            'all safety protocols followed'
          ];

          let isViolation: boolean;
          if (typeof detection.has_violations === 'boolean') {
            isViolation = detection.has_violations;
          } else {
            const vt = (detection.violation_type || '').toString().toLowerCase();
            if (!vt || vt.trim() === '') {
              isViolation = false;
            } else {
              const isNegative = negPatterns.some((p) => vt.includes(p));
              isViolation = !isNegative;
            }
          }

          console.debug('Live detection received:', { detection, isViolation });

          if (isViolation) {
            setStatus('violation');
            // Speak the violation aloud for immediate attention
            try {
              const speakText = `Alert! Safety violation detected: ${detection.violation_type || 'Unknown violation'}. Please respond.`;
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(speakText);
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
              }
            } catch (e) {
              console.error('Speech synthesis failed:', e);
            }
          } else {
            setStatus('monitoring');
          }
          
          // Reset to monitoring after 5 seconds if no new violations
          setTimeout(() => {
            if (status !== 'violation') {
              setStatus('monitoring');
            }
          }, 5000);
        }
      )
      .subscribe();

    // Also fetch the latest detection on mount
    // RLS will automatically filter by supervisor's assigned zones
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('detections')
        .select('*, cameras(name, location, zone)')
        .order('detected_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        setLatestDetection(data);
        setIsActive(true);
        const negPatterns = [
          'all clear',
          'all ppe requirements met',
          'all ppe',
          'no violations',
          'no violation',
          'manual review',
          'manual inspection',
          'all safety protocols followed'
        ];

        let isViolation: boolean;
        if (typeof data.has_violations === 'boolean') {
          isViolation = data.has_violations;
        } else {
          const vt = (data.violation_type || '').toString().toLowerCase();
          if (!vt || vt.trim() === '') {
            isViolation = false;
          } else {
            const isNegative = negPatterns.some((p) => vt.includes(p));
            isViolation = !isNegative;
          }
        }
        if (isViolation) {
          setStatus('violation');
        } else {
          setStatus('monitoring');
        }
      } else if (error) {
        console.error('Error fetching latest detection:', error);
      }
    };

    fetchLatest();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cameraId, status]);

  const getStatusColor = () => {
    switch (status) {
      case 'violation':
        return 'bg-destructive text-destructive-foreground';
      case 'monitoring':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'violation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'monitoring':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Radio className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'violation':
        return 'Violation Detected';
      case 'monitoring':
        return 'Monitoring Active';
      default:
        return 'Standby';
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
              <Activity className={`h-5 w-5 ${isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Live Detection Status</h3>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Real-time monitoring active' : 'Waiting for detections...'}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-2">{getStatusText()}</span>
          </Badge>
        </div>

        {latestDetection && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Latest Detection:</span>
              <span className="font-medium">
                {latestDetection.violation_type || 'All Clear'}
              </span>
            </div>
            {latestDetection.image_url && (
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={latestDetection.image_url}
                  alt="Latest detection"
                  className="w-full h-48 object-cover"
                />
                {latestDetection.violation_type && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive">Violation</Badge>
                  </div>
                )}
              </div>
            )}
            {latestDetection.cameras && (
              <div className="text-xs text-muted-foreground">
                📹 {latestDetection.cameras.name} - {latestDetection.cameras.location}
              </div>
            )}
          </div>
        )}

        {!latestDetection && (
          <div className="mt-4 text-center py-8 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No detections yet. Start monitoring to see live results.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveDetectionStatus;

