
"use client"
import React from "react"
import { AppLayout } from "@/components/app-layout"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui"
import { assignments as initialAssignments, tasks as initialTasks, clients as initialClients, employees, Assignment, AssignmentStatus, Task, Client, Employee } from "@/lib/data"
import { Car, Clock, Hourglass, Check, CheckCheck, Ban, X, User, Ship, Package, CalendarDays, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const getTaskById = (id: string, tasks: Task[]) => tasks.find((t) => t.id === id)
const getClientById = (id: string, clients: Client[]) => clients.find(c => c.id === id);
const getEmployeeById = (id: string, employees: Employee[]) => employees.find(e => e.id === id);


type StatusConfig = {
    text: string;
    icon: React.ReactNode;
    classes: string;
}

const statusMap: Record<AssignmentStatus, StatusConfig> = {
  pending: { text: "Pendiente", icon: <Hourglass className="h-3 w-3" />, classes: "bg-amber-100 border-amber-400 text-amber-800" },
  accepted: { text: "Aceptada", icon: <Check className="h-3 w-3" />, classes: "bg-blue-100 border-blue-400 text-blue-800" },
  completed: { text: "Terminada", icon: <CheckCheck className="h-3 w-3" />, classes: "bg-green-100 border-green-400 text-green-800" },
  rejected: { text: "Rechazada", icon: <Ban className="h-3 w-3" />, classes: "bg-gray-200 border-gray-400 text-gray-700" },
  cancelled: { text: "Cancelada", icon: <X className="h-3 w-3" />, classes: "bg-red-100 border-red-400 text-red-800" },
};


export default function TodayTasksPage() {
    const [assignments, setAssignments] = React.useState<Assignment[]>([]);
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);

    const loadData = React.useCallback(() => {
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
    }, []);

    React.useEffect(() => {
        loadData();
        window.addEventListener('storage', loadData);
        return () => window.removeEventListener('storage', loadData);
    }, [loadData]);

    const updateAssignmentStatus = (assignmentId: string, newStatus: AssignmentStatus) => {
        const updatedAssignments = assignments.map(a =>
            a.id === assignmentId ? { ...a, status: newStatus } : a
        );
        setAssignments(updatedAssignments);
        try {
            localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
            window.dispatchEvent(new StorageEvent('storage', { key: 'assignments' }));
        } catch (e) {
            console.error("Failed to save assignments to localStorage", e);
        }
    }

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
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Tareas del Día
          </h1>
          <p className="text-muted-foreground">
            Todas las tareas asignadas para hoy, {today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        </header>

        {todayAssignments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {todayAssignments.map((assignment) => {
                const task = getTaskById(assignment.taskId, tasks);
                if (!task) return null;

                const employee = getEmployeeById(assignment.employeeId, employees);
                const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
                const currentStatus = statusMap[assignment.status] || statusMap.pending;
                
                return (
                <Card key={assignment.id} className="flex flex-col">
                    <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <CardTitle>{task.title}</CardTitle>
                        {task.requiresDriving && (
                        <Badge variant="outline" className="flex-shrink-0">
                            <Car className="mr-1 h-3 w-3" />
                            Conducir
                        </Badge>
                        )}
                    </div>
                    <CardDescription>{task.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <div className="text-sm text-muted-foreground space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {new Date(assignment.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(assignment.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Duración estimada: {task.duration} min</span>
                                </div>
                            </div>

                            {employee && (
                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                                            <AvatarFallback>{employee.name[0]}{employee.lastName[0]}</AvatarFallback>
                                        </Avatar>
                                        <span>Empleado: {employee.name} {employee.lastName}</span>
                                    </div>
                                </div>
                            )}
                        
                            {client && (
                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium text-foreground">Cliente: {client.firstName} {client.lastName}</span>
                                    </div>
                                    {boats.length > 0 && boats.map(boat => (
                                        <div key={boat.id} className="flex items-center gap-2 pl-6">
                                            <Ship className="h-4 w-4" />
                                            <span>{boat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {assignment.selectedExtras && assignment.selectedExtras.length > 0 && (
                                <div className="space-y-2 pt-4 border-t">
                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                        <Package className="h-4 w-4 shrink-0" />
                                        <span>Extras Solicitados:</span>
                                    </div>
                                    <ul className="list-disc pl-11 space-y-1">
                                        {assignment.selectedExtras.map(extra => {
                                            const extraDetails = task.extras?.find(e => e.id === extra.extraId);
                                            return (
                                                <li key={extra.extraId}>
                                                    {extra.quantity}x {extraDetails?.name || 'Extra desconocido'}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}
                    </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                    <Badge variant="outline" className={cn("font-normal", currentStatus.classes)}>
                            {currentStatus.icon}
                            <span className="ml-1.5">{currentStatus.text}</span>
                    </Badge>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Cambiar Estado
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={assignment.status === 'accepted'} onClick={() => updateAssignmentStatus(assignment.id, 'accepted')}>Marcar como Aceptada</DropdownMenuItem>
                            <DropdownMenuItem disabled={assignment.status === 'completed'} onClick={() => updateAssignmentStatus(assignment.id, 'completed')}>Marcar como Terminada</DropdownMenuItem>
                            <DropdownMenuItem disabled={assignment.status === 'pending'} onClick={() => updateAssignmentStatus(assignment.id, 'pending')}>Marcar como Pendiente</DropdownMenuItem>
                            <DropdownMenuItem disabled={assignment.status === 'rejected'} onClick={() => updateAssignmentStatus(assignment.id, 'rejected')}>Marcar como Rechazada</DropdownMenuItem>
                            <DropdownMenuItem disabled={assignment.status === 'cancelled'} onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}>Marcar como Cancelada</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                </Card>
                )
            })}
            </div>
        ) : (
             <Card className="flex items-center justify-center p-12">
                <div className="text-center text-muted-foreground">
                    <CalendarDays className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No hay tareas para hoy</h3>
                    <p className="mt-2 text-sm">Parece que es un día tranquilo. Puedes asignar nuevas tareas desde el calendario.</p>
                </div>
            </Card>
        )}
      </div>
    </AppLayout>
  )
}
