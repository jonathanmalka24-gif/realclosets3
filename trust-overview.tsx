import { useGetClosetReport, useListTrustActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, Activity, AlertCircle, Info, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function TrustOverview() {
  const { data: report, isLoading: isLoadingReport } = useGetClosetReport();
  const { data: activities, isLoading: isLoadingActivities } = useListTrustActivity();

  if (isLoadingReport || isLoadingActivities) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!report || !activities) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50 shadow-sm overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg">Community Trust</h3>
              <p className="text-sm text-muted-foreground">Marketplace Health Report</p>
            </div>
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-serif font-medium tracking-tight text-foreground">
              {report.trustScore}%
            </span>
            <span className="text-sm text-muted-foreground mb-1">overall authenticity score</span>
          </div>
          
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-4">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${report.trustScore}%` }}
            />
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Active Listings</span>
                <p className="text-2xl font-serif font-medium">{report.activeListings}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Verified</span>
                <p className="text-2xl font-serif font-medium text-primary flex items-center gap-1">
                  {report.verifiedListings}
                  <ShieldCheck className="w-4 h-4" />
                </p>
              </div>
            </div>

            {report.cooldownNotice && (
              <div className="flex items-start gap-3 p-3 bg-accent/20 border border-accent/30 rounded-xl">
                <Info className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-accent-foreground">{report.cooldownNotice}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                Strongest Signals
              </h4>
              <ul className="space-y-2">
                {report.strongestSignals.map((signal, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 mt-1.5 shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                System status: <span className="font-medium text-foreground">{report.closetRealism}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-sm">
        <CardHeader className="p-6 pb-2 border-b border-border/50">
          <CardTitle className="text-base font-serif font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            Live Authenticity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border/50 scrollbar-thin">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {activity.severity === "positive" ? (
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      ) : activity.severity === "warning" ? (
                        <ShieldAlert className="w-4 h-4 text-destructive" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt))} ago
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No recent activity.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
