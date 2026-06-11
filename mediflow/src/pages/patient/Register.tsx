import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRegisterPatient, useIssueToken, useListDepartments } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  gender: z.enum(["male", "female", "other"]),
  age: z.coerce.number().min(1).max(120),
  departmentId: z.coerce.number().min(1, "Select a department"),
});

export default function PatientRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: departments } = useListDepartments();
  const registerPatient = useRegisterPatient();
  const issueToken = useIssueToken();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      gender: "male",
      age: 30,
      departmentId: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // 1. Register Patient
    registerPatient.mutate(
      { data: { name: values.name, phone: values.phone, gender: values.gender as any, age: values.age } },
      {
        onSuccess: (patient) => {
          // 2. Issue Token for department
          issueToken.mutate(
            { data: { patientId: patient.id, departmentId: values.departmentId } },
            {
              onSuccess: (token) => {
                toast({ title: "Registration Successful", description: `Token ${token.tokenNumber} issued.` });
                setLocation(`/patient/queue/${token.id}`);
              },
              onError: () => toast({ title: "Error", description: "Failed to issue token.", variant: "destructive" })
            }
          );
        },
        onError: () => toast({ title: "Error", description: "Failed to register patient.", variant: "destructive" })
      }
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        </Link>
        
        <Card className="border-border shadow-lg bg-card/80 backdrop-blur">
          <CardHeader className="text-center pb-6 border-b border-border mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Walk-in Registration</CardTitle>
            <CardDescription>Register to get a queue token</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input placeholder="+1 234 567 8900" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department to Visit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {departments?.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full mt-6" size="lg" disabled={registerPatient.isPending || issueToken.isPending}>
                  {registerPatient.isPending || issueToken.isPending ? "Registering..." : "Get Token"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
