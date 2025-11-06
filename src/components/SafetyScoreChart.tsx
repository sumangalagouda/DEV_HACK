import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";

interface SafetyScoreChartProps {
  score: number;
  trend: number;
  violationsToday: number;
}

const SafetyScoreChart = ({ score, trend, violationsToday }: SafetyScoreChartProps) => {
  const getScoreColor = () => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = () => {
    if (score >= 90) return "bg-success";
    if (score >= 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Safety Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor()}`}>
            {score}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            out of 100
          </p>
        </div>

        <Progress value={score} className={getProgressColor()} />

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {violationsToday}
              </div>
              <p className="text-xs text-muted-foreground">
                Violations Today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <span className="text-2xl font-bold text-foreground">
                  {Math.abs(trend)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                vs. Last Week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-semibold ${getScoreColor()}`}>
              {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Attention'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyScoreChart;
