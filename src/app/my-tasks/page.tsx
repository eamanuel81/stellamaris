
"use client"
import React from "react"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/components/auth-provider"
import { useAssignments } from "@/hooks/use-assignments"
import { useTasks } from "@/hooks/use-tasks"
import { useClients } from "@/hooks/use-clients"
import { useEmployees } from "@/hooks/use-employees"
import { supabase } from "@/lib/supabaseClient"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { Assignment, AssignmentStatus, Task, Client } from "@/lib/data"
import { Car, Check, ChevronDown, Clock, X, Ban, Hourglass, CheckCheck, User, Users, Ship, Package, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const getTaskById = (id: string, tasks: Task[]) => tasks.find((t) => t.id === id)
const getClientById = (id: string, clients: Client[]) => clients.find(c => c.id === id);

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

const TaskCard = ({ assignment, task, client, updateAssignmentStatus }: { assignment: Assignment, task: Task, client: Client | null, updateAssignmentStatus: (id: string, status: AssignmentStatus) => void }) => {
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
                                {new Date(assignment.startTime).toLocaleDateString('es-ES', { 
                                    weekday: 'short', 
                                    day: '2-digit', 
                                    month: '2-digit' 
                                })} - {new Date(assignment.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a {new Date(assignment.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Duración estimada: {task.duration} min</span>
                        </div>
                    </div>
                    
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
                            {client.responsibles && client.responsibles.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span className="font-medium text-foreground">Otros Responsables:</span>
                                    </div>
                                    {client.responsibles.map((responsible, index) => (
                                        <div key={responsible.id || index} className="pl-6 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 shrink-0" />
                                                <span className="text-sm truncate">{responsible.firstName} {responsible.lastName}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 pl-6">
                                                <span className="text-xs text-muted-foreground">DNI: {responsible.dni}</span>
                                                {responsible.phone && (
                                                    <span className="text-xs text-muted-foreground">({responsible.phone})</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {assignment.selectedExtras && assignment.selectedExtras.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span className="font-medium text-foreground">Extras:</span>
                            </div>
                            {assignment.selectedExtras.map((extra, index) => (
                                <div key={index} className="flex items-center gap-2 pl-6">
                                    <span>• {typeof extra === 'string' ? extra : `${extra.quantity}x ${extra.extraId}`}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6">
                <Badge className={cn("flex items-center gap-1", currentStatus.classes)}>
                    {currentStatus.icon}
                    {currentStatus.text}
                </Badge>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto min-w-[140px]">
                    Cambiar Estado
                            <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                        {Object.entries(statusMap).map(([key, config]) => (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => updateAssignmentStatus(assignment.id, key as AssignmentStatus)}
                                className="flex items-center gap-2"
                            >
                                {config.icon}
                                {config.text}
                            </DropdownMenuItem>
                        ))}
                </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    )
}

export default function MyTasksPage() {
    const { role, subrole } = useAuth();
    const { assignments, isLoading: assignmentsLoading, error: assignmentsError, updateAssignment } = useAssignments();
    const { tasks, isLoading: tasksLoading, error: tasksError } = useTasks();
    const { clients, isLoading: clientsLoading, error: clientsError } = useClients();
    const { employees, isLoading: employeesLoading, error: employeesError } = useEmployees();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<AssignmentStatus | "all">("all");
    const [sortOrder, setSortOrder] = React.useState<"oldest" | "newest">("oldest");
    const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);

    // Obtener el email del usuario actual
    React.useEffect(() => {
        const getUserEmail = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (user && !error && user.email) {
                    setCurrentUserEmail(user.email);
                    
                    // Verificar si el usuario existe en la tabla de empleados
                    const { data: employee, error: employeeError } = await supabase
                        .from('employees')
                        .select('*')
                        .eq('email', user.email)
                        .single();
                    
                    if (employeeError) {
                        // Employee not found, handle silently
                    } else {
                        // Employee found, handle silently
                    }
                }
            } catch (error) {
                // Handle error silently
            }
        };
        getUserEmail();
    }, []);

    // Filtrar asignaciones del empleado actual
    const myAssignments = React.useMemo(() => {
        if (!assignments || assignments.length === 0) {
            return [];
        }
        
        // Si es admin, mostrar todas las asignaciones
        if (role === 'admin' || subrole === 'admin') {
            return assignments;
        }
        
        // Para empleados, filtrar solo sus asignaciones
        if (!currentUserEmail) {
            return [];
        }
        
        // Encontrar el empleado actual basado en el email
        const currentEmployees = employees.filter(emp => emp.email === currentUserEmail);
        
        if (currentEmployees.length === 0) {
            // Intentar buscar por email parcial o similar
            const similarEmployee = employees.find(emp => 
                emp.email.toLowerCase().includes(currentUserEmail?.toLowerCase() || '') ||
                currentUserEmail?.toLowerCase().includes(emp.email.toLowerCase())
            );
            
            if (similarEmployee) {
                const filteredAssignments = assignments.filter(assignment => {
                    let employeeIds: string[] = [];
                    
                    if (Array.isArray(assignment.employeeId)) {
                        employeeIds = assignment.employeeId;
                    } else if (typeof assignment.employeeId === 'string') {
                        try {
                            employeeIds = JSON.parse(assignment.employeeId);
                        } catch {
                            employeeIds = [assignment.employeeId];
                        }
                    } else if (assignment.employeeId) {
                        employeeIds = [String(assignment.employeeId)];
                    }
                    
                    const hasEmployee = employeeIds.includes(similarEmployee.id);
                    return hasEmployee;
                });
                
                return filteredAssignments;
            }
            
            return [];
        }
        
        // Si hay múltiples empleados con el mismo email, usar el primero
        const currentEmployee = currentEmployees[0];
        
        // Filtrar asignaciones que incluyan al empleado actual
        const filteredAssignments = assignments.filter(assignment => {
            // Manejar diferentes tipos de datos que pueden llegar desde la BD
            let employeeIds: string[] = [];
            
            if (Array.isArray(assignment.employeeId)) {
                employeeIds = assignment.employeeId;
            } else if (typeof assignment.employeeId === 'string') {
                // Si es un string, intentar parsearlo como JSON
                try {
                    employeeIds = JSON.parse(assignment.employeeId);
                } catch {
                    // Si no es JSON válido, tratarlo como un array con un solo elemento
                    employeeIds = [assignment.employeeId];
                }
            } else if (assignment.employeeId) {
                // Si es otro tipo, convertirlo a string y crear array
                employeeIds = [String(assignment.employeeId)];
            }
            
            const hasEmployee = employeeIds.includes(currentEmployee.id);
            return hasEmployee;
        });
        
        return filteredAssignments;
    }, [assignments, role, subrole, currentUserEmail, employees]);

    const updateAssignmentStatus = async (assignmentId: string, newStatus: AssignmentStatus) => {
        
        try {
            // Buscar la asignación actual
            const currentAssignment = assignments.find(a => a.id === assignmentId);
            if (!currentAssignment) {
                console.error('Assignment not found:', assignmentId);
                return;
            }
            
            // Actualizar la asignación con el nuevo estado
            const updatedAssignment = { ...currentAssignment, status: newStatus };
            const result = await updateAssignment(updatedAssignment);
            
            if (result.error) {
                // Handle error silently
            } else {
                // Assignment updated successfully
            }
        } catch (error) {
            // Handle unexpected error silently
    }
  }
  
  const searchFilter = (assignment: Assignment) => {
      const task = getTaskById(assignment.taskId, tasks);
      const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
      if (!task) return false;

      const searchTermLower = searchTerm.toLowerCase();
      
      return (
          task.title.toLowerCase().includes(searchTermLower) ||
          (task.type && task.type.toLowerCase().includes(searchTermLower)) ||
          (client && `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTermLower)) ||
          (client && client.boats.some(boat => assignment.boatIds?.includes(boat.id) && boat.name.toLowerCase().includes(searchTermLower)))
      );
  };
  
    const activeAssignments = myAssignments
        .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
        .filter(searchFilter)
        .filter(a => statusFilter === 'all' || a.status === statusFilter)
        .sort((a, b) => {
            const dateA = new Date(a.startTime).getTime();
            const dateB = new Date(b.startTime).getTime();
            return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
        });
        
    const completedAssignments = myAssignments
        .filter(a => a.status === 'completed')
        .filter(searchFilter)
        .sort((a, b) => {
            const dateA = new Date(a.startTime).getTime();
            const dateB = new Date(b.startTime).getTime();
            return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
        });

  const filterableStatuses = Object.entries(statusMap).filter(
    ([key]) => key !== 'completed' && key !== 'cancelled'
  );

    const isLoading = assignmentsLoading || tasksLoading || clientsLoading || employeesLoading;
    const hasError = assignmentsError || tasksError || clientsError || employeesError;
    
        if (isLoading) {
        return (
            <AppLayout>
                <div className="flex h-screen w-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </AppLayout>
        );
    }

    if (hasError) {
        return (
            <AppLayout>
                <div className="flex flex-col gap-8">
                    <header>
                        <h1 className="font-headline text-3xl font-bold tracking-tight">
                            Mis Tareas
                        </h1>
                        <p className="text-muted-foreground">
                            Error al cargar las tareas. Inténtalo de nuevo.
                        </p>
                    </header>
                    <div className="text-center py-8">
                        <p className="text-red-500">
                            {assignmentsError || tasksError || clientsError}
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Mis Tareas
          </h1>
          <p className="text-muted-foreground">
            Aquí están las tareas que te han sido asignadas.
          </p>
        </header>



                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                                placeholder="Buscar tareas..."
                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
              />
            </div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AssignmentStatus | "all")}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                                {filterableStatuses.map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            {config.icon}
                                            {config.text}
                                        </div>
                                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
                        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "oldest" | "newest")}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oldest">Más antiguas primero</SelectItem>
                <SelectItem value="newest">Más recientes primero</SelectItem>
              </SelectContent>
            </Select>
        </div>

                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="active">
                                Activas ({activeAssignments.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed">
                                Completadas ({completedAssignments.length})
                            </TabsTrigger>
            </TabsList>
                        <TabsContent value="active" className="space-y-4">
                            {activeAssignments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay tareas activas.
                                </div>
                            ) : (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {activeAssignments.map((assignment) => {
                        const task = getTaskById(assignment.taskId, tasks);
                                        const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                                        
                        if (!task) return null;
                                        
                                        return (
                                            <TaskCard
                                                key={assignment.id}
                                                assignment={assignment}
                                                task={task}
                                                client={client || null}
                                                updateAssignmentStatus={updateAssignmentStatus}
                                            />
                                        );
                    })}
                </div>
                )}
            </TabsContent>
                        <TabsContent value="completed" className="space-y-4">
                            {completedAssignments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay tareas completadas.
                                </div>
                            ) : (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {completedAssignments.map((assignment) => {
                        const task = getTaskById(assignment.taskId, tasks);
                                        const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                                        
                        if (!task) return null;
                                        
                                        return (
                                            <TaskCard
                                                key={assignment.id}
                                                assignment={assignment}
                                                task={task}
                                                client={client || null}
                                                updateAssignmentStatus={updateAssignmentStatus}
                                            />
                                        );
                    })}
                </div>
                )}
            </TabsContent>
        </Tabs>
                </div>
      </div>
    </AppLayout>
  )
}
