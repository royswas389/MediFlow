import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetHourlyFlow, useGetTriageBreakdown, getGetHourlyFlowQueryKey, getGetTriageBreakdownQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, yAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAnalytics() {
  const { data: hourlyFlow, isLoading: loadingFlow } = useGetHourlyFlow({ query: { queryKey: getGetHourlyFlowQueryKey() } });
  const { data: triageBreakdown, isLoading: loadingTriage } = useGetTriageBreakdown({ query: { queryKey: getGetTriageBreakdownQueryKey() } });

  const triageData = triageBreakdown ? [
    { name: 'Emergency', value: triageBreakdown.emergency, color: 'hsl(var(--destructive))' },
    { name: 'Urgent', value: triageBreakdown.urgent, color: '#f59e0b' },
    { name: 'Normal', value: triageBreakdown.normal, color: '#22c55e' },
  ] : [];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Historical data and flow analysis.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Hourly Patient Flow</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFlow ? <Skeleton className="w-full h-[300px]" /> : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyFlow || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle>Triage Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {loadingTriage ? <Skeleton className="w-[300px] h-[300px] rounded-full" /> : (
                <div className="h-[300px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={triageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {triageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold">{triageBreakdown?.total || 0}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-4">
                {triageData.map(t => (
                  <div key={t.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-sm font-medium">{t.name} ({t.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
