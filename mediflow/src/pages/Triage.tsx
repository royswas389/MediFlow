import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTriagePatient, useListPatients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  patientId: z.coerce.number().min(1, "Select a patient"),
  symptoms: z.string().min(10, "Please describe symptoms in detail"),
  vitalSigns: z.string().optional(),
});

export default function Triage() {
  const [result, setResult] = useState<any>(null);
  const { data: patients } = useListPatients();
  const triageMutation = useTriagePatient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: 0,
      symptoms: "",
      vitalSigns: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    triageMutation.mutate(
      { data: values },
      { onSuccess: (data) => setResult(data) }
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Home</Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Triage Assessment</h1>
            <p className="text-muted-foreground">Automated symptom analysis and priority scoring.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card border-border shadow-md h-fit">
            <CardHeader>
              <CardTitle>Enter Patient Data</CardTitle>
              <CardDescription>Provide symptoms to generate risk score</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {patients?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name} (ID: {p.id})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symptoms (Detailed)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="E.g. Severe chest pain radiating to left arm, shortness of breath, started 30 mins ago..." className="h-32" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vitalSigns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vital Signs (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="BP 140/90, HR 110, Temp 98.6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full mt-4" disabled={triageMutation.isPending}>
                    {triageMutation.isPending ? "Analyzing..." : "Run AI Triage"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div>
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="h-full"
                >
                  <Card className={cn(
                    "h-full border-2 overflow-hidden relative",
                    result.category === 'emergency' ? "border-destructive shadow-lg shadow-destructive/20 bg-destructive/5" :
                    result.category === 'urgent' ? "border-amber-500 shadow-lg shadow-amber-500/20 bg-amber-500/5" :
                    "border-green-500 shadow-lg shadow-green-500/20 bg-green-500/5"
                  )}>
                    {result.category === 'emergency' && (
                      <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground px-3 py-1 text-xs font-bold rounded-bl-lg flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> CRITICAL
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardDescription>AI RISK SCORE</CardDescription>
                      <div className={cn(
                        "text-7xl font-black font-mono tracking-tighter mt-2",
                        result.category === 'emergency' ? "text-destructive" :
                        result.category === 'urgent' ? "text-amber-500" :
                        "text-green-500"
                      )}>
                        {(result.riskScore * 100).toFixed(0)}
                      </div>
                      <h3 className={cn(
                        "text-2xl font-bold uppercase tracking-widest mt-2",
                        result.category === 'emergency' ? "text-destructive" :
                        result.category === 'urgent' ? "text-amber-500" :
                        "text-green-500"
                      )}>{result.category}</h3>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recommended Action</h4>
                        <p className="text-lg font-medium">{result.recommendedDepartment || "General Consultation"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">AI Reasoning</h4>
                        <p className="text-sm leading-relaxed">{result.reasoning}</p>
                      </div>
                      
                      <div className="pt-6">
                        <Button className="w-full" variant={result.category === 'emergency' ? 'destructive' : 'default'}>
                          Assign to {result.recommendedDepartment || "Queue"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            {!result && !triageMutation.isPending && (
              <div className="h-full border-2 border-dashed border-border rounded-xl flex items-center justify-center p-8 text-center text-muted-foreground bg-card/30">
                <div>
                  <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Awaiting patient data to generate risk score and department recommendation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
