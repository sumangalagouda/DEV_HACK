import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Camera } from "lucide-react";
import { format } from "date-fns";

interface AlertCardProps {
  detection: {
    id: string;
    violation_type: string;
    confidence: number;
    image_url: string;
    severity: string;
    status: string;
    detected_at: string;
    cameras?: {
      name: string;
      location: string;
    };
  };
}

const AlertCard = ({ detection }: AlertCardProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative bg-slate-200">
        <img
          src={detection.image_url}
          alt="Detection"
          className="w-full h-full object-cover"
        />
        <Badge className={`absolute top-2 right-2 ${getSeverityColor(detection.severity)}`}>
          {detection.severity.toUpperCase()}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              {detection.violation_type}
            </h3>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                <span>{detection.cameras?.name || 'Unknown Camera'} - {detection.cameras?.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(detection.detected_at), 'PPp')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Confidence: {detection.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertCard;
