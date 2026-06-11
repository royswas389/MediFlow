import { useListAppointments, getListAppointmentsQueryKey, useBookAppointment } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Appointments() {
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: getListAppointmentsQueryKey({}) } });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2"><ArrowLeft className="w-4 h-4 mr-2" /> Home</Button>
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
              <p className="text-muted-foreground">Manage scheduled visits.</p>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Book Appointment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book New Appointment</DialogTitle>
              </DialogHeader>
              <div className="py-4 text-center text-muted-foreground">
                <p>Form implementation requires Patient, Doctor, and Department selection logic.</p>
                <p className="text-sm mt-2">(Simplified for this demo)</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((apt) => (
                    <TableRow key={apt.id} className="border-border">
                      <TableCell className="font-medium">
                        {format(new Date(apt.scheduledAt), 'MMM dd, yyyy - HH:mm')}
                      </TableCell>
                      <TableCell className="font-bold">{apt.patientName}</TableCell>
                      <TableCell className="text-muted-foreground">{apt.doctorName}</TableCell>
                      <TableCell>{apt.departmentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          apt.status === 'confirmed' ? 'border-green-500 text-green-500' :
                          apt.status === 'scheduled' ? 'border-blue-500 text-blue-500' :
                          apt.status === 'cancelled' ? 'border-destructive text-destructive' :
                          'border-muted text-muted-foreground'
                        }>
                          {apt.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {appointments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No appointments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
