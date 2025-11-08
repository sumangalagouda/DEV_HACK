import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CameraFeedProps {
  onDetectionComplete: () => void;
}

const CameraFeed = ({ onDetectionComplete }: CameraFeedProps) => {
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch user profile to get assigned zones
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('assigned_zones')
          .eq('id', session.user.id)
          .single();
        setUserProfile(profile);
      }
    });
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Enumerate media devices
  const refreshDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = list.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate devices:', e);
    }
  };

  useEffect(() => {
    refreshDevices();
    // Update device list when permissions change
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
    };
  }, []);

  const { data: cameras, error: camerasError, isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras', userProfile?.assigned_zones],
    queryFn: async () => {
      // RLS will automatically filter cameras by supervisor's assigned zones
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching cameras:', error);
        throw error;
      }
      console.log('Fetched cameras:', data?.length || 0, 'for zones:', userProfile?.assigned_zones || 'all');
      return data;
    },
    enabled: !!userProfile,
  });

  // Show error message if cameras query fails
  useEffect(() => {
    if (camerasError) {
      console.error('Cameras query error:', camerasError);
      toast({
        title: "Error loading cameras",
        description: camerasError instanceof Error ? camerasError.message : "Failed to load cameras. Check console for details.",
        variant: "destructive",
      });
    }
  }, [camerasError, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    // Delegate to analyzeImage which accepts a data URL
    if (!previewImage) {
      toast({ title: "No image selected", description: "Please upload or capture a frame first", variant: "destructive" });
      return;
    }
    await analyzeImage(previewImage);
  };

  // Reusable function to analyze an image dataURL (used for uploads and live capture)
  const analyzeImage = async (imageDataUrl: string) => {
    if (!imageDataUrl) return;
    if (!selectedCamera) {
      // We don't require a selectedCamera for analysis, but warn user if not set
      toast({ title: "No camera selected", description: "Results will be recorded without a camera association.", variant: "default" });
    }

    setAnalyzing(true);
    try {
      console.log('Invoking detect-ppe function...');
      const { data, error } = await supabase.functions.invoke('detect-ppe', {
        body: {
          imageBase64: imageDataUrl,
          cameraId: selectedCamera || null,
        },
      });

      console.log('Edge Function response - error:', error);
      console.log('Edge Function response - data:', data);

      if (error) throw new Error(error.message || 'Edge function error');
      if (!data) throw new Error('No response from Edge Function');

      if (data?.hasViolations && data?.detection) {
        const violations = data.detection.violation_type || 'Safety violation detected';
        const utterance = new SpeechSynthesisUtterance(`Alert! Safety violation detected: ${violations}. Please address immediately.`);
        utterance.rate = 0.9;
        try { window.speechSynthesis.speak(utterance); } catch (e) { console.warn('Speech failed', e); }

        toast({ title: 'Violation Detected!', description: violations, variant: 'destructive' });
      } else {
        const message = data?.message || 'Image analysis completed. No violations detected.';
        toast({ title: data?.hasViolations ? 'Analysis Complete' : 'All Clear!', description: message, className: data?.hasViolations ? '' : 'bg-success text-success-foreground' });
      }

      onDetectionComplete();
    } catch (err: any) {
      console.error('Analysis failed', err);
      toast({ title: 'Analysis failed', description: err.message || String(err), variant: 'destructive', duration: 10000 });
    } finally {
      setAnalyzing(false);
    }
  };

  const openCamera = async (deviceId?: string | null) => {
    try {
      const constraints: MediaStreamConstraints = { video: deviceId ? { deviceId: { exact: deviceId } } : { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          // Some browsers require play() to be called explicitly even after setting srcObject
          // Play after metadata is loaded to avoid blank/video not starting in some environments
          videoRef.current.onloadedmetadata = () => {
            try {
              videoRef.current?.play();
            } catch (e) {
              console.warn('Video play() failed:', e);
            }
          };
          // Attempt to play immediately as well (user gesture should allow this)
          try {
            await videoRef.current.play();
          } catch (e) {
            // If immediate play fails, onloadedmetadata handler should start playback
            console.warn('Immediate video play() failed, will wait for loadedmetadata:', e);
          }
        } catch (e) {
          console.error('Failed to attach stream to video element:', e);
        }
      }
      setIsCameraOpen(true);
    } catch (e: any) {
      console.error('Could not open camera:', e);
      // Map common getUserMedia error names to helpful messages
      let userMessage = 'Could not access camera. Check browser and OS camera permissions.';
      if (e && e.name) {
        switch (e.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            userMessage = 'Camera permission denied. Allow camera access in the browser prompt or site settings.';
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            userMessage = 'No camera found. Make sure a camera is connected and not being used by another application.';
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            userMessage = 'Camera already in use by another application or hardware issue. Close other apps and try again.';
            break;
          case 'OverconstrainedError':
            userMessage = 'No camera matches the requested constraints.';
            break;
          case 'SecurityError':
            userMessage = 'getUserMedia() is only allowed in secure contexts (HTTPS or localhost). Serve the app over HTTPS or use localhost.';
            break;
        }
      }
      // If overconstrained, try a fallback without deviceId (use default camera)
      if (e && (e.name === 'OverconstrainedError' || e.name === 'ConstraintNotSatisfiedError')) {
        console.warn('OverconstrainedError: retrying with default camera constraints');
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            try {
              await videoRef.current.play();
            } catch (err) {
              console.warn('Fallback play() failed:', err);
            }
          }
          setIsCameraOpen(true);
          setCameraError(null);
          // Refresh device list since permission may now be granted
          refreshDevices();
          return;
        } catch (fallbackErr) {
          console.error('Fallback getUserMedia failed:', fallbackErr);
          userMessage = 'No camera matches the requested constraints and fallback failed.';
        }
      }

      setCameraError(`${userMessage} ${e?.message || ''}`.trim());
      toast({ title: 'Camera error', description: userMessage, variant: 'destructive' });
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOpen(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    // Keep the camera open so user can capture multiple frames; set preview so they can inspect
    setPreviewImage(dataUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          PPE Detection Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Camera Location</label>
          {camerasLoading ? (
            <div className="text-sm text-muted-foreground">Loading cameras...</div>
          ) : camerasError ? (
            <div className="text-sm text-destructive">
              Error loading cameras. Check if you have cameras in your assigned zones.
            </div>
          ) : !cameras || cameras.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No cameras available. {userProfile?.assigned_zones && userProfile.assigned_zones.length > 0 
                ? `Make sure cameras exist in your assigned zones: ${userProfile.assigned_zones.join(', ')}`
                : 'Contact admin to assign cameras to your zones.'}
            </div>
          ) : (
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera..." />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    {camera.name} - {camera.location} {camera.zone ? `(${camera.zone})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8">
          {previewImage ? (
            <div className="space-y-4">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Different Image
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze for PPE'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image from CCTV or site inspection
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select Image
                </Button>
                <div className="flex items-center gap-2">
                  {devices && devices.length > 0 && (
                    <select
                      value={selectedDeviceId || ''}
                      onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                      className="border rounded px-2 py-1 text-sm"
                      aria-label="Select camera device"
                    >
                      <option value="">Default camera</option>
                      {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                      ))}
                    </select>
                  )}
                  <Button onClick={() => openCamera(selectedDeviceId)} variant="outline">
                    Open Webcam
                  </Button>
                </div>
              </div>

              {isCameraOpen && (
                <div className="mt-4 space-y-2">
                  {/* muted helps autoplay in some browsers */}
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover rounded-lg border" />
                  <div className="flex gap-2">
                    <Button onClick={captureFromCamera} className="flex-1">
                      Capture
                    </Button>
                    <Button onClick={closeCamera} variant="destructive" className="flex-1">
                      Close Camera
                    </Button>
                  </div>
                </div>
              )}

              {/* Show camera error if present and provide a retry action */}
              {cameraError && (
                <div className="mt-4 text-sm text-destructive space-y-2">
                  <div>{cameraError}</div>
                  <div className="flex gap-2">
                    <Button onClick={openCamera} variant="outline">Retry Camera</Button>
                    <Button onClick={() => { navigator.mediaDevices.getUserMedia({ video: true }).then(s => { s.getTracks().forEach(t => t.stop()); }).catch(()=>{}); }} variant="ghost">Reset Permission</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default CameraFeed;
