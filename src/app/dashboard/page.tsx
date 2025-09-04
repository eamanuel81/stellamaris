"use client"
import React, { useMemo, useCallback } from "react"
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

// Mover funciones helper fuera del componente para evitar recrearlas
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

// Componente memoizado para las métricas
const MetricCard = React.memo(({ 
  title, 
  value, 
  description, 
  icon: Icon 
}: { 
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

// Componente memoizado para la tabla de tareas recientes
const RecentTasksTable = React.memo(({ 
  assignments, 
  tasks, 
  employees 
}: { 
  assignments: Assignment[];
  tasks: Task[];
  employees: Employee[];
}) => {
  // Ordenar asignaciones por fecha de inicio (más recientes primero)
  const recentAssignments = assignments
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tarea</TableHead>
          <TableHead>Empleado</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentAssignments.map((assignment) => {
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
  );
});

RecentTasksTable.displayName = 'RecentTasksTable';

export default function DashboardPage() {
  const { assignments } = useAssignments();
  const { tasks } = useTasks();
  const { clients } = useClients();
  const { employees } = useEmployees();

  // Memoizar la fecha de hoy para evitar recrearla constantemente
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Memoizar las asignaciones con fechas parseadas
  const assignmentsWithDates = useMemo(() => 
    assignments.map(a => ({
      ...a,
      startTime: new Date(a.startTime),
      endTime: new Date(a.endTime),
    })), [assignments]
  );

  // Memoizar las asignaciones de hoy
  const todayAssignments = useMemo(() => 
    assignmentsWithDates.filter(a => {
      const assignmentDate = new Date(a.startTime);
      assignmentDate.setHours(0, 0, 0, 0);
      return assignmentDate.getTime() === today.getTime();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [assignmentsWithDates, today]
  );

  // Memoizar las tareas completadas hoy
  const completedToday = useMemo(() => 
    todayAssignments.filter(a => a.status === 'completed').length,
    [todayAssignments]
  );

  // Memoizar el cálculo de horas por empleado
  const chartData = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const employeeHours: { [key: string]: number } = {};

    // Filtrar asignaciones de la última semana que estén completadas
    const recentAssignments = assignmentsWithDates.filter(a => {
      const assignmentDate = new Date(a.startTime);
      assignmentDate.setHours(0, 0, 0, 0);
      return assignmentDate >= oneWeekAgo && a.status === 'completed';
    });

    // Calcular horas por empleado
    recentAssignments.forEach(assignment => {
      if (assignment.employeeId && assignment.employeeId.length > 0) {
        const employeeId = assignment.employeeId[0];
        const startTime = new Date(assignment.startTime);
        const endTime = new Date(assignment.endTime);
        
        // Calcular diferencia en horas
        const hoursDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        if (!employeeHours[employeeId]) {
          employeeHours[employeeId] = 0;
        }
        employeeHours[employeeId] += hoursDiff;
      }
    });

    // Convertir a formato para el gráfico
    return employees
      .filter(employee => employeeHours[employee.id])
      .map(employee => ({
        name: `${employee.name} ${employee.lastName}`,
        hours: Math.round(employeeHours[employee.id] * 10) / 10 // Redondear a 1 decimal
      }))
      .sort((a, b) => b.hours - a.hours) // Ordenar por horas descendente
      .slice(0, 10); // Mostrar solo los top 10
  }, [assignmentsWithDates, employees]);

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
          <MetricCard
            title="Tareas Totales (Hoy)"
            value={todayAssignments.length}
            description="Tareas asignadas para hoy"
            icon={ClipboardList}
          />
          <MetricCard
            title="Empleados Activos"
            value={employees.length}
            description="Empleados registrados"
            icon={Users}
          />
          <MetricCard
            title="Clientes"
            value={clients.length}
            description="Clientes registrados"
            icon={Users}
          />
          <MetricCard
            title="Actividad Reciente"
            value={completedToday}
            description="Tareas completadas hoy"
            icon={Activity}
          />
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Horas por Empleado</CardTitle>
              <CardDescription>
                Horas trabajadas en la última semana (Tareas terminadas).
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {chartData.length > 0 ? (
                <ChartContainer config={{ hours: { label: 'Horas', color: 'hsl(var(--primary))' } }} className="h-[300px] w-full">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No hay datos de horas trabajadas en la última semana
                </div>
              )}
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
              <RecentTasksTable 
                assignments={assignmentsWithDates}
                tasks={tasks}
                employees={employees}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  )
}