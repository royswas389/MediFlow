import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListDepartments, getListDepartmentsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2 } from "lucide-react";

export default function AdminDepartments() {
  const { data: departments, isLoading } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground">Manage hospital departments and monitor capacity.</p>
          </div>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Department Roster</CardTitle>
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
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Load</TableHead>
                    <TableHead className="text-right">Wait Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments?.map((dept) => (
                    <TableRow key={dept.id} className="border-border">
                      <TableCell className="font-medium text-muted-foreground">{dept.code}</TableCell>
                      <TableCell className="font-bold">{dept.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          dept.status === 'active' ? 'border-green-500 text-green-500' :
                          dept.status === 'busy' ? 'border-amber-500 text-amber-500' :
                          dept.status === 'overloaded' ? 'border-destructive text-destructive' :
                          'border-muted text-muted-foreground'
                        }>
                          {dept.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {dept.currentLoad} / {dept.capacity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {dept.avgWaitMinutes ? `${dept.avgWaitMinutes} min` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {departments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No departments found.
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
