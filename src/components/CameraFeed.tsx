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
    if (!previewImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCamera) {
      toast({
        title: "No camera selected",
        description: "Please select a camera location",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);

    try {
      console.log('Invoking detect-ppe function...');
      const { data, error } = await supabase.functions.invoke('detect-ppe', {
        body: {
          imageBase64: previewImage,
          cameraId: selectedCamera,
        },
      });

      // Log everything for debugging
      console.log('Edge Function response - error:', error);
      console.log('Edge Function response - data:', data);

      // Check if there's an error object
      if (error) {
        console.error('Edge Function error object:', error);
        const errorMsg = error.message || 'Failed to analyze image';
        
        // If error says non-2xx, the actual error might be in data
        if (errorMsg.includes('non-2xx') && data) {
          // Try to get error from response body
          if (data.error) {
            let detailedError = data.error;
            if (data.details) detailedError += ` - ${data.details}`;
            if (data.hint) detailedError += ` (Hint: ${data.hint})`;
            if (data.code) detailedError += ` [Code: ${data.code}]`;
            throw new Error(detailedError);
          }
        }
        
        throw new Error(errorMsg);
      }

      // Check if function returned an error in the response data
      if (data && !data.success && data.error) {
        let errorMsg = data.error;
        if (data.details) errorMsg += ` - ${data.details}`;
        if (data.hint) errorMsg += ` (Hint: ${data.hint})`;
        if (data.code) errorMsg += ` [Code: ${data.code}]`;
        if (data.stack) {
          console.error('Error stack trace:', data.stack);
        }
        throw new Error(errorMsg);
      }
      
      // If we got here but no data, something went wrong
      if (!data) {
        throw new Error('No response from Edge Function. Check if function is deployed and accessible.');
      }

      // Check if violations were found
      if (data?.hasViolations && data?.detection) {
        // Play voice alert for violations
        const violations = data.detection.violation_type || 'Safety violation detected';
        const utterance = new SpeechSynthesisUtterance(
          `Alert! Safety violation detected: ${violations}. Please address immediately.`
        );
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);

        toast({
          title: "Violation Detected!",
          description: violations,
          variant: "destructive",
        });
      } else {
        // No violations found or analysis completed
        const message = data?.message || "Image analysis completed. No violations detected.";
        toast({
          title: data?.hasViolations ? "Analysis Complete" : "All Clear!",
          description: message,
          className: data?.hasViolations ? "" : "bg-success text-success-foreground",
        });
      }

      onDetectionComplete();
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Detection error:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Try to extract error from response if available
      let errorMessage = error.message || "Failed to analyze image";
      let errorDetails = '';
      
      // If error has a response body, try to parse it
      if (error.context?.body) {
        try {
          const errorBody = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          if (errorBody.error) {
            errorMessage = errorBody.error;
            errorDetails = errorBody.details || '';
            if (errorBody.code) {
              errorMessage += ` [Code: ${errorBody.code}]`;
            }
          }
        } catch (e) {
          console.log('Could not parse error body');
        }
      }
      
      // Provide helpful error messages
      let helpfulMessage = errorMessage;
      if (errorDetails) {
        helpfulMessage += ` - ${errorDetails}`;
      }
      
      if (errorMessage.includes('Function not found') || errorMessage.includes('404')) {
        helpfulMessage = "Edge Function not deployed. Please deploy 'detect-ppe' function in Supabase.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        helpfulMessage = "Network error. Check your internet connection and Supabase project status.";
      } else if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        helpfulMessage = "Database permission error. Disable RLS or set SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets.";
      }
      
      toast({
        title: "Analysis failed",
        description: helpfulMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds so user can read it
      });
    } finally {
      setAnalyzing(false);
    }
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
              <Button onClick={() => fileInputRef.current?.click()}>
                Select Image
              </Button>
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
