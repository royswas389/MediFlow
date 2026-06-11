import { useParams, Link } from "wouter";
import { useGetToken, getGetTokenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Clock, Users, ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientQueue() {
  const { tokenId } = useParams();
  const id = tokenId ? parseInt(tokenId, 10) : 0;

  const { data: token, isLoading } = useGetToken(id, { query: { enabled: !!id, queryKey: getGetTokenQueryKey(id) } });

  if (!id) return <div>Invalid Token ID</div>;

  if (isLoading) return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Skeleton className="h-[400px] w-full max-w-md" />
    </div>
  );

  if (!token) return <div>Token not found</div>;

  const isCalled = token.status === 'called';
  const isInConsultation = token.status === 'in_consultation';
  const isCompleted = token.status === 'completed';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm"><Home className="w-4 h-4 mr-2" /> Home</Button>
          </Link>
        </div>

        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className={`border-2 overflow-hidden shadow-2xl ${
            isCalled ? 'border-primary shadow-primary/20' : 
            isInConsultation ? 'border-green-500 shadow-green-500/20' : 
            'border-border'
          }`}>
            <div className={`p-4 text-center ${
              isCalled ? 'bg-primary text-primary-foreground' : 
              isInConsultation ? 'bg-green-500 text-white' : 
              'bg-secondary/50'
            }`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-1">Your Token</h2>
              <div className="text-6xl font-black font-mono tracking-tighter">{token.tokenNumber}</div>
            </div>
            
            <CardContent className="p-8 space-y-8 bg-card">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">Patient Name</p>
                <p className="text-2xl font-bold">{token.patientName}</p>
                <p className="text-sm text-primary font-medium">{token.departmentName}</p>
              </div>

              {isCompleted ? (
                <div className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                  <h3 className="text-xl font-bold mb-2">Consultation Complete</h3>
                  <p className="text-sm opacity-80">Thank you for visiting MediFlow.</p>
                </div>
              ) : isInConsultation ? (
                <div className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                  <h3 className="text-xl font-bold mb-2">In Consultation</h3>
                  <p className="text-sm opacity-80">Please proceed to the doctor's cabin.</p>
                </div>
              ) : isCalled ? (
                <div className="text-center p-6 bg-primary/10 rounded-xl border border-primary/20 text-primary animate-pulse">
                  <h3 className="text-2xl font-bold mb-2">IT'S YOUR TURN</h3>
                  <p className="text-sm opacity-80">Please proceed to {token.departmentName}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-xl text-center border border-border">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Est. Wait</p>
                    <p className="text-2xl font-bold">{token.estimatedWaitMinutes}<span className="text-sm font-normal text-muted-foreground ml-1">min</span></p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl text-center border border-border">
                    <Users className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Queue Pos</p>
                    <p className="text-2xl font-bold">#{token.position}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {!isCompleted && !isInConsultation && !isCalled && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            This page automatically updates. Do not close it.
          </p>
        )}
      </div>
    </div>
  );
}
