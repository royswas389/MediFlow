import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetHospitalSummary, useGetDepartmentCongestion, useGetRecentActivity, getGetHospitalSummaryQueryKey, getGetDepartmentCongestionQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Activity, Users, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, ActivitySquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetHospitalSummary({ query: { queryKey: getGetHospitalSummaryQueryKey() } });
  const { data: congestion, isLoading: loadingCongestion } = useGetDepartmentCongestion({ query: { queryKey: getGetDepartmentCongestionQueryKey() } });
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({ limit: 10 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 10 }) } });

  const getSeverityColor = (level?: string) => {
    switch(level) {
      case 'critical': return 'bg-destructive text-destructive-foreground border-destructive';
      case 'high': return 'bg-amber-500 text-white border-amber-500';
      case 'moderate': return 'bg-blue-500 text-white border-blue-500';
      case 'low': return 'bg-green-500 text-white border-green-500';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSeverityBgColor = (level?: string) => {
    switch(level) {
      case 'critical': return 'bg-destructive/20 border-destructive/50';
      case 'high': return 'bg-amber-500/20 border-amber-500/50';
      case 'moderate': return 'bg-blue-500/20 border-blue-500/50';
      case 'low': return 'bg-green-500/20 border-green-500/50';
      default: return 'bg-card border-border';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Operations Center</h1>
            <p className="text-muted-foreground mt-1">Live hospital flow metrics and congestion monitoring.</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-xs font-medium text-secondary-foreground border border-border">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Updates (30s)
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Patients</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold">{summary?.activeTokens || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.totalPatientsToday || 0} total today
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Wait Time</CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold">{summary?.avgWaitMinutes || 0}<span className="text-xl text-muted-foreground ml-1">min</span></div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Across all departments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-destructive/10 border-destructive/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-destructive">Emergencies</CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? <Skeleton className="h-8 w-20 bg-destructive/20" /> : (
                <div className="text-3xl font-bold text-destructive">{summary?.emergencyCount || 0}</div>
              )}
              <p className="text-xs text-destructive/70 mt-1">
                Active high-priority cases
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Staff Available</CardTitle>
              <Activity className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold">{summary?.doctorsAvailable || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Doctors currently on duty
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Congestion Heatmap */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-primary" />
              Department Congestion Heatmap
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingCongestion ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              ) : congestion?.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  No department data available
                </div>
              ) : (
                congestion?.map((dept, idx) => (
                  <motion.div 
                    key={dept.departmentId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn("border shadow-sm transition-colors", getSeverityBgColor(dept.congestionLevel))}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{dept.departmentName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getSeverityColor(dept.congestionLevel)} variant="outline">
                                {dept.congestionLevel.toUpperCase()}
                              </Badge>
                              {dept.trend === 'increasing' && <ArrowUpRight className="w-4 h-4 text-destructive" />}
                              {dept.trend === 'decreasing' && <ArrowDownRight className="w-4 h-4 text-green-500" />}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{dept.waitMinutes}m</div>
                            <div className="text-xs text-muted-foreground">wait time</div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Queue Load</span>
                            <span className="font-medium">{dept.queueLength} / {dept.capacity} patients</span>
                          </div>
                          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2">
                            <div 
                              className={cn("h-2 rounded-full", getSeverityColor(dept.congestionLevel).split(' ')[0])} 
                              style={{ width: `${Math.min(100, (dept.queueLength / (dept.capacity || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Live Activity
            </h2>
            <Card className="border-border shadow-sm h-[400px] flex flex-col">
              <CardContent className="p-0 flex-1 overflow-auto">
                {loadingActivity ? (
                  <div className="p-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-2 h-2 rounded-full mt-2" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activity?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground p-8 text-center">
                    No recent activity
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {activity?.map((event, i) => (
                      <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            event.type === 'emergency' ? "bg-destructive" :
                            event.type === 'completed' ? "bg-green-500" :
                            event.type === 'triage' ? "bg-amber-500" :
                            "bg-primary"
                          )} />
                          <div>
                            <p className="text-sm font-medium">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(event.timestamp), 'HH:mm:ss')}</span>
                              {event.patientName && <span>• {event.patientName}</span>}
                              {event.departmentName && <span>• {event.departmentName}</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
