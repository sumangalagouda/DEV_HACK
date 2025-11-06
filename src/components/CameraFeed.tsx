import { useState, useRef } from "react";
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

  const { data: cameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

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
      const { data, error } = await supabase.functions.invoke('detect-ppe', {
        body: {
          imageBase64: previewImage,
          cameraId: selectedCamera,
        },
      });

      if (error) throw error;

      // Play voice alert
      const violations = data.detection.violation_type;
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

      onDetectionComplete();
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Detection error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive",
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
          <Select value={selectedCamera} onValueChange={setSelectedCamera}>
            <SelectTrigger>
              <SelectValue placeholder="Select camera..." />
            </SelectTrigger>
            <SelectContent>
              {cameras?.map((camera) => (
                <SelectItem key={camera.id} value={camera.id}>
                  {camera.name} - {camera.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
