
"use client"
import React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  Activity,
  ClipboardList,
  Clock,
  DollarSign,
  Users,
  CalendarDays
} from "lucide-react"

import { AppLayout } from "@/components/app-layout"
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
  Button,
  Sheet,
  SheetTrigger,
} from "@/components/ui"
import { Assignment, AssignmentStatus, Task, Client, Employee } from "@/lib/data"
import { useAssignments } from '@/hooks/use-assignments';
import { useTasks } from '@/hooks/use-tasks';
import { useClients } from '@/hooks/use-clients';
import { useEmployees } from '@/hooks/use-employees';

const chartData = [
  { name: "Juan P.", hours: 45 },
  { name: "Maria G.", hours: 52 },
  { name: "Carlos R.", hours: 38 },
  { name: "Ana L.", hours: 60 },
]

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id)
const getEmployeeById = (id: string, employees: Employee[]) => employees.find(e => e.id === id)

type StatusConfig = { text: string; variant: "default" | "secondary" | "destructive" | "outline" };

const statusMap: Record<AssignmentStatus, StatusConfig> = {
  completed: { text: "Terminado", variant: "default" },
  accepted: { text: "Aceptado", variant: "secondary" },
  pending: { text: "Pendiente", variant: "outline" },
  rejected: { text: "Rechazada", variant: "destructive" },
  cancelled: { text: "Cancelada", variant: "destructive" },
}

export default function DashboardPage() {
  const { assignments } = useAssignments();
  const { tasks } = useTasks();
  const { clients } = useClients();
  const { employees } = useEmployees();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const assignmentsWithDates = assignments.map(a => ({
    ...a,
    startTime: new Date(a.startTime),
    endTime: new Date(a.endTime),
  }));

  const todayAssignments = assignmentsWithDates.filter(a => {
      const assignmentDate = new Date(a.startTime);
      assignmentDate.setHours(0, 0, 0, 0);
      return assignmentDate.getTime() === today.getTime();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const completedToday = todayAssignments.filter(a => a.status === 'completed').length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Un resumen de la actividad en Stella Maris.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tareas Totales (Hoy)
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAssignments.length}</div>
              <p className="text-xs text-muted-foreground">
                Tareas asignadas para hoy
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">
                Empleados registrados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                Clientes registrados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Tareas completadas hoy
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Horas por Empleado</CardTitle>
              <CardDescription>
                Horas trabajadas en la última semana.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={{ hours: { label: 'Horas', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                   <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Tareas Recientes</CardTitle>
              <CardDescription>
                Últimas tareas asignadas y su estado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsWithDates.slice(0, 5).map((assignment) => {
                    const task = getTaskById(assignment.taskId, tasks);
                    const employee = assignment.employeeId && assignment.employeeId.length > 0 
                      ? getEmployeeById(assignment.employeeId[0], employees) 
                      : null;
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{task?.title || 'Tarea no encontrada'}</TableCell>
                        <TableCell>{employee ? `${employee.name} ${employee.lastName}` : 'Sin asignar'}</TableCell>
                        <TableCell>
                           <Badge variant={statusMap[assignment.status]?.variant || 'outline'}>
                            {statusMap[assignment.status]?.text || 'Desconocido'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  )
}
