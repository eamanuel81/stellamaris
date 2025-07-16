
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
import { assignments as initialAssignments, employees, tasks as initialTasks, clients as initialClients, Assignment, AssignmentStatus, Task, Client } from "@/lib/data"
import { TodayTasksSheet } from "@/components/today-tasks-sheet"

const chartData = [
  { name: "Juan P.", hours: 45 },
  { name: "Maria G.", hours: 52 },
  { name: "Carlos R.", hours: 38 },
  { name: "Ana L.", hours: 60 },
]

const getTaskById = (id: string) => tasks.find(t => t.id === id)
const getEmployeeById = (id: string) => employees.find(e => e.id === id)

type StatusConfig = { text: string; variant: "default" | "secondary" | "destructive" | "outline" };

const statusMap: Record<AssignmentStatus, StatusConfig> = {
  completed: { text: "Terminado", variant: "default" },
  accepted: { text: "Aceptado", variant: "secondary" },
  pending: { text: "Pendiente", variant: "outline" },
  rejected: { text: "Rechazada", variant: "destructive" },
  cancelled: { text: "Cancelada", variant: "destructive" },
}

export default function DashboardPage() {
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);

  React.useEffect(() => {
        const loadData = () => {
             try {
                const savedAssignments = localStorage.getItem('assignments');
                if (savedAssignments) {
                    const parsedAssignments = JSON.parse(savedAssignments, (key, value) => {
                        if (key === 'startTime' || key === 'endTime') {
                            return new Date(value);
                        }
                        return value;
                    });
                    setAssignments(parsedAssignments);
                } else {
                    setAssignments(initialAssignments);
                }

                const savedTasks = localStorage.getItem('tasks');
                setTasks(savedTasks ? JSON.parse(savedTasks) : initialTasks);

                const savedClients = localStorage.getItem('clients');
                setClients(savedClients ? JSON.parse(savedClients) : initialClients);

            } catch (error) {
                console.error("Failed to load data from localStorage", error);
                setAssignments(initialAssignments);
                setTasks(initialTasks);
                setClients(initialClients);
            }
        };
        
        loadData();
        window.addEventListener('storage', loadData);
        return () => window.removeEventListener('storage', loadData);
  }, []);


  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAssignments = assignments.filter(a => {
      const assignmentDate = new Date(a.startTime);
      assignmentDate.setHours(0, 0, 0, 0);
      return assignmentDate.getTime() === today.getTime();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());


  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Un resumen de la actividad en Stella Maris.
            </p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
               <Button>
                <CalendarDays className="mr-2 h-4 w-4" />
                Tareas del Día
              </Button>
            </SheetTrigger>
            <TodayTasksSheet 
              assignments={todayAssignments}
              tasks={tasks}
              clients={clients}
              employees={employees}
            />
          </Sheet>
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
                +2% que la semana pasada
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
                4 en turno actualmente
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Trabajadas (Mes)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">195</div>
              <p className="text-xs text-muted-foreground">
                +15.2% que el mes pasado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+5</div>
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
                  {assignments.slice(0, 5).map((assignment) => {
                    const task = getTaskById(assignment.taskId);
                    const employee = getEmployeeById(assignment.employeeId);
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{task?.title}</TableCell>
                        <TableCell>{employee?.name}</TableCell>
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
