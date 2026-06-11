import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListDoctors, getListDoctorsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDoctors() {
  const { data: doctors, isLoading } = useListDoctors({}, { query: { queryKey: getListDoctorsQueryKey({}) } });

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medical Staff</h1>
            <p className="text-muted-foreground">Doctor roster and availability status.</p>
          </div>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Doctor Roster</CardTitle>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Consultations Today</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors?.map((doc) => (
                    <TableRow key={doc.id} className="border-border">
                      <TableCell className="font-bold">{doc.name}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.specialization}</TableCell>
                      <TableCell>{doc.departmentName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          doc.status === 'available' ? 'border-green-500 text-green-500' :
                          doc.status === 'busy' ? 'border-amber-500 text-amber-500' :
                          doc.status === 'on_break' ? 'border-blue-500 text-blue-500' :
                          'border-muted text-muted-foreground'
                        }>
                          {doc.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{doc.consultationsToday}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/doctor/${doc.id}`}>
                          <Button variant="ghost" size="sm">View Dashboard</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {doctors?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No doctors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
