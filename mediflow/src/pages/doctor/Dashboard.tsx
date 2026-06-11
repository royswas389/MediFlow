import { useParams, Link } from "wouter";
import { useGetDoctor, useGetDoctorQueue, useUpdateToken, getGetDoctorQueryKey, getGetDoctorQueueQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, Clock, ArrowRight, Play, CheckCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function DoctorDashboard() {
  const { id } = useParams();
  const doctorId = id ? parseInt(id, 10) : 0;
  const { toast } = useToast();

  const { data: doctor, isLoading: loadingDoc } = useGetDoctor(doctorId, { query: { enabled: !!doctorId, queryKey: getGetDoctorQueryKey(doctorId) } });
  const { data: queue, isLoading: loadingQueue, refetch: refetchQueue } = useGetDoctorQueue(doctorId, { query: { enabled: !!doctorId, queryKey: getGetDoctorQueueQueryKey(doctorId) } });
  
  const updateToken = useUpdateToken();

  const handleUpdateStatus = (tokenId: number, status: 'called' | 'in_consultation' | 'completed') => {
    updateToken.mutate(
      { id: tokenId, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Status updated to ${status.replace('_', ' ')}` });
          refetchQueue();
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const getTriageColor = (category?: string | null) => {
    if (category === 'emergency') return 'bg-destructive/10 text-destructive border-destructive/20';
    if (category === 'urgent') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-green-500/10 text-green-500 border-green-500/20';
  };

  if (!id) return <div>Invalid ID</div>;

  const currentPatient = queue?.find(q => q.status === 'in_consultation' || q.status === 'called');
  const waitingPatients = queue?.filter(q => q.status === 'waiting') || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 border-b border-border bg-card/50 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          {loadingDoc ? <Skeleton className="h-6 w-48" /> : (
            <div>
              <h1 className="font-bold text-lg">{doctor?.name}</h1>
              <p className="text-xs text-muted-foreground">{doctor?.specialization} • {doctor?.departmentName}</p>
            </div>
          )}
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {doctor?.status.toUpperCase() || 'UNKNOWN'}
        </Badge>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Consultation */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Current Consultation</h2>
          {loadingQueue ? <Skeleton className="h-[200px] w-full" /> : currentPatient ? (
            <Card className="border-primary/50 bg-primary/5 shadow-lg shadow-primary/5">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge className="mb-2 bg-primary text-primary-foreground">{currentPatient.tokenNumber}</Badge>
                    <h3 className="text-3xl font-bold">{currentPatient.patientName}</h3>
                  </div>
                  <Badge className={cn("text-lg py-1 px-3", getTriageColor(currentPatient.triageCategory))}>
                    {currentPatient.triageCategory?.toUpperCase() || 'NORMAL'}
                  </Badge>
                </div>
                
                <div className="flex gap-4 mt-8">
                  {currentPatient.status === 'called' && (
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus(currentPatient.id, 'in_consultation')}>
                      <Play className="w-5 h-5 mr-2" /> Start Consultation
                    </Button>
                  )}
                  {currentPatient.status === 'in_consultation' && (
                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(currentPatient.id, 'completed')}>
                      <CheckCircle className="w-5 h-5 mr-2" /> Complete Consultation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border border-dashed bg-transparent">
              <CardContent className="p-12 text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No active consultation.</p>
                <p className="text-sm">Call the next patient from the queue to begin.</p>
                {waitingPatients.length > 0 && (
                  <Button className="mt-6" onClick={() => handleUpdateStatus(waitingPatients[0].id, 'called')}>
                    Call Next Patient ({waitingPatients[0].tokenNumber})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Queue */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-semibold">Waiting Queue</h2>
            <span className="text-sm text-muted-foreground">{waitingPatients.length} patients</span>
          </div>
          
          <div className="space-y-3">
            {loadingQueue ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : waitingPatients.length === 0 ? (
              <div className="p-8 text-center border border-border border-dashed rounded-lg text-muted-foreground">
                Queue is empty
              </div>
            ) : (
              waitingPatients.map((patient, index) => (
                <Card key={patient.id} className={cn("border-border", index === 0 && !currentPatient ? "border-primary/50" : "")}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-primary">{patient.tokenNumber}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4", getTriageColor(patient.triageCategory))}>
                          {patient.triageCategory?.toUpperCase() || 'NORMAL'}
                        </Badge>
                      </div>
                      <p className="font-medium">{patient.patientName}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" /> Est: {patient.estimatedWaitMinutes} min
                      </p>
                    </div>
                    {index === 0 && !currentPatient && (
                      <Button size="sm" onClick={() => handleUpdateStatus(patient.id, 'called')}>
                        Call <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
