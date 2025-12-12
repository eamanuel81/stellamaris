
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
  Dialog,
  DialogTrigger
} from "@/components/ui"
import { useAssignments } from '@/hooks/use-assignments';
import { useTasks } from '@/hooks/use-tasks';
import { useClients } from '@/hooks/use-clients';
import { useEmployees } from '@/hooks/use-employees';
import { AssignTaskDialog } from "@/components/assign-task-dialog";
import { Car, Clock, Hourglass, Check, CheckCheck, Ban, X, User, Users, Ship, Package, CalendarDays, ChevronDown, Search, Calendar, Plus, Edit2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Assignment, Task, Client, Employee, AssignmentStatus } from '@/lib/data';

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
    const { assignments, updateAssignment, refetch, addAssignment } = useAssignments();
    const { tasks } = useTasks();
    const { clients } = useClients();
    const { employees } = useEmployees();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<AssignmentStatus | "all">("all");
    const [selectedDate, setSelectedDate] = React.useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    });
    const [isAssignTaskOpen, setIsAssignTaskOpen] = React.useState(false);
    const [editingAssignment, setEditingAssignment] = React.useState<Assignment | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);


    // Crear la fecha seleccionada en hora local para evitar problemas de zona horaria
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado
    selectedDateObj.setHours(0, 0, 0, 0);

    const assignmentsWithDates = assignments.map(a => ({
      ...a,
      startTime: new Date(a.startTime),
      endTime: new Date(a.endTime),
    }));

    const filteredAssignments = assignmentsWithDates.filter(a => {
        const assignmentDate = new Date(a.startTime);
        assignmentDate.setHours(0, 0, 0, 0);
        
        // Comparar solo las partes de fecha (año, mes, día) sin considerar la hora
        return assignmentDate.getFullYear() === selectedDateObj.getFullYear() &&
               assignmentDate.getMonth() === selectedDateObj.getMonth() &&
               assignmentDate.getDate() === selectedDateObj.getDate();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());


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
    
    const activeAssignments = filteredAssignments
        .filter(a => a.status !== 'completed')
        .filter(searchFilter)
        .filter(a => statusFilter === 'all' || a.status === statusFilter);
        
    const completedAssignments = filteredAssignments
        .filter(a => a.status === 'completed')
        .filter(searchFilter);

    const filterableStatuses = Object.entries(statusMap).filter(
      ([key]) => key !== 'completed'
    );

    const updateAssignmentStatus = async (assignmentId: string, newStatus: AssignmentStatus) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) return;
        await updateAssignment({ ...assignment, status: newStatus });
        await refetch();
    };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Tareas del Día
            </h1>
            <p className="text-muted-foreground">
              Todas las tareas asignadas para {selectedDateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.
            </p>
          </div>
          <Dialog open={isAssignTaskOpen} onOpenChange={setIsAssignTaskOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Asignar Tarea
              </Button>
            </DialogTrigger>
            <AssignTaskDialog
              key={isAssignTaskOpen ? `create-${selectedDate}` : 'closed'}
              setOpen={setIsAssignTaskOpen}
              assignmentToEdit={null}
              initialDate={selectedDate}
              onSave={async (assignmentData) => {
                // Asegurar que employeeId sea un array
                const assignmentToCreate = {
                  ...assignmentData,
                  employeeId: Array.isArray(assignmentData.employeeId) ? assignmentData.employeeId : [assignmentData.employeeId]
                };
                await addAssignment(assignmentToCreate);
                setIsAssignTaskOpen(false);
                await refetch();
              }}
            />
          </Dialog>
        </header>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tarea, cliente o embarcación..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-9"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AssignmentStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {filterableStatuses.map(([key, { text }]) => (
                  <SelectItem key={key} value={key}>{text}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>


        <Tabs defaultValue="assigned" className="w-full">
            <TabsList>
                <TabsTrigger value="assigned">Tareas Asignadas ({activeAssignments.length})</TabsTrigger>
                <TabsTrigger value="completed">Tareas Terminadas ({completedAssignments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="assigned" className="mt-4">
                {activeAssignments.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {activeAssignments.map((assignment) => {
                        const task = getTaskById(assignment.taskId, tasks);
                        if (!task) return null;

                        const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                        const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
                        const assignedEmployees = assignment.employeeId.map(empId => getEmployeeById(empId, employees)).filter(Boolean);
                        const employee = assignedEmployees.length > 0 ? assignedEmployees[0] : null; // Tomar el primer empleado para mostrar
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
                                            <div className="flex items-center gap-2 font-medium text-foreground">
                                                <Package className="h-4 w-4 shrink-0" />
                                                <span>Extras Solicitados:</span>
                                            </div>
                                            <ul className="list-disc pl-11 space-y-1">
                                                {assignment.selectedExtras.map(extra => {
                                                    const extraDetails = task.extras?.find(e => e.id === extra.extraId);
                                                    if (!extraDetails) return null;
                                                    return (
                                                        <li key={extra.extraId}>
                                                            {extra.quantity}x {extraDetails.name} - {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(extraDetails.price * extra.quantity)}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {assignment.observations && assignment.observations.trim().length > 0 && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                                <FileText className="h-5 w-5 shrink-0 text-blue-600" />
                                                <span>Observaciones:</span>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {assignment.observations}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6">
                            <Badge variant="outline" className={cn("flex items-center gap-1", currentStatus.classes)}>
                                    {currentStatus.icon}
                                    <span className="ml-1.5">{currentStatus.text}</span>
                            </Badge>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setEditingAssignment(assignment);
                                  setIsEditDialogOpen(true);
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                <Edit2 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-w-[140px]">
                                    Cambiar Estado
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem disabled={assignment.status === 'accepted'} onClick={() => updateAssignmentStatus(assignment.id, 'accepted')}>Marcar como Aceptada</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'completed'} onClick={() => updateAssignmentStatus(assignment.id, 'completed')}>Marcar como Terminada</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'pending'} onClick={() => updateAssignmentStatus(assignment.id, 'pending')}>Marcar como Pendiente</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'rejected'} onClick={() => updateAssignmentStatus(assignment.id, 'rejected')}>Marcar como Rechazada</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'cancelled'} onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}>Marcar como Cancelada</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            </CardFooter>
                        </Card>
                        )
                    })}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center p-12 col-span-full">
                        <div className="text-center text-muted-foreground">
                            <CalendarDays className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No hay tareas asignadas para esta fecha</h3>
                            <p className="mt-2 text-sm">Puedes asignar nuevas tareas desde el calendario o cambiar la fecha seleccionada.</p>
                        </div>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
                 {completedAssignments.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {completedAssignments.map((assignment) => {
                        const task = getTaskById(assignment.taskId, tasks);
                        if (!task) return null;

                        const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                        const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
                        const assignedEmployees = assignment.employeeId.map(empId => getEmployeeById(empId, employees)).filter(Boolean);
                        const employee = assignedEmployees.length > 0 ? assignedEmployees[0] : null; // Tomar el primer empleado para mostrar
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
                                            <div className="flex items-center gap-2 font-medium text-foreground">
                                                <Package className="h-4 w-4 shrink-0" />
                                                <span>Extras Solicitados:</span>
                                            </div>
                                            <ul className="list-disc pl-11 space-y-1">
                                                {assignment.selectedExtras.map(extra => {
                                                    const extraDetails = task.extras?.find(e => e.id === extra.extraId);
                                                    if (!extraDetails) return null;
                                                    return (
                                                        <li key={extra.extraId}>
                                                            {extra.quantity}x {extraDetails.name} - {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(extraDetails.price * extra.quantity)}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {assignment.observations && assignment.observations.trim().length > 0 && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                                <FileText className="h-5 w-5 shrink-0 text-blue-600" />
                                                <span>Observaciones:</span>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {assignment.observations}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6">
                            <Badge variant="outline" className={cn("flex items-center gap-1", currentStatus.classes)}>
                                    {currentStatus.icon}
                                    <span className="ml-1.5">{currentStatus.text}</span>
                            </Badge>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setEditingAssignment(assignment);
                                  setIsEditDialogOpen(true);
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                <Edit2 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-w-[140px]">
                                    Cambiar Estado
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem disabled={assignment.status === 'accepted'} onClick={() => updateAssignmentStatus(assignment.id, 'accepted')}>Marcar como Aceptada</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'completed'} onClick={() => updateAssignmentStatus(assignment.id, 'completed')}>Marcar como Terminada</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'pending'} onClick={() => updateAssignmentStatus(assignment.id, 'pending')}>Marcar como Pendiente</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'rejected'} onClick={() => updateAssignmentStatus(assignment.id, 'rejected')}>Marcar como Rechazada</DropdownMenuItem>
                                    <DropdownMenuItem disabled={assignment.status === 'cancelled'} onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}>Marcar como Cancelada</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            </CardFooter>
                        </Card>
                        )
                    })}
                    </div>
                ) : (
                    <Card className="flex items-center justify-center p-12 col-span-full">
                        <div className="text-center text-muted-foreground">
                            <CheckCheck className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No hay tareas terminadas para esta fecha</h3>
                            <p className="mt-2 text-sm">Las tareas completadas aparecerán aquí.</p>
                        </div>
                    </Card>
                )}
            </TabsContent>
        </Tabs>

        {/* Dialog para editar tarea */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <AssignTaskDialog
            key={editingAssignment ? `edit-${editingAssignment.id}` : 'edit-closed'}
            setOpen={setIsEditDialogOpen}
            assignmentToEdit={editingAssignment}
            initialDate={selectedDate}
            onSave={async (assignmentData) => {
              const assignmentToUpdate = {
                ...assignmentData,
                employeeId: Array.isArray(assignmentData.employeeId) ? assignmentData.employeeId : [assignmentData.employeeId]
              };
              await updateAssignment(assignmentToUpdate);
              setIsEditDialogOpen(false);
              setEditingAssignment(null);
              await refetch();
            }}
          />
        </Dialog>
      </div>
    </AppLayout>
  )
}
