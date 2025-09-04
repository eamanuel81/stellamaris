
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button, Dialog, DialogTrigger, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Badge, Skeleton } from "@/components/ui"
import { PlusCircle, Clock, User, Ship, DollarSign, Users, Hourglass, Check, CheckCheck, X, Ban, ChevronLeft, ChevronRight } from "lucide-react"
import { employees, tasks as initialTasks, assignments as initialAssignments, clients as initialClients } from "@/lib/data";
import type { Assignment, Task, Client, Employee, AssignmentStatus } from '@/lib/data';
import { AssignTaskDialog } from "@/components/assign-task-dialog"
import { AssignmentDetailDialog } from "@/components/assignment-detail-dialog"
import { cn } from "@/lib/utils"
import { useAssignments } from '@/hooks/use-assignments';
import { useTasks } from '@/hooks/use-tasks';
import { useClients } from '@/hooks/use-clients';
import { useEmployees } from '@/hooks/use-employees';

// Función regular para generar timeSlots
const generateTimeSlots = () => {
  const slots = []
  // from 6 AM to 1 AM next day
  for (let i = 6; i <= 24; i++) {
    slots.push(`${String(i % 24).padStart(2, '0')}:00`)
  }
  slots.push('01:00')
  return slots
};

// Optimizar búsquedas usando Map para O(1) en lugar de O(n)
const createLookupMaps = (tasks: Task[], employees: Employee[], clients: Client[]) => {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const employeeMap = new Map(employees.map(e => [e.id, e]));
  const clientMap = new Map(clients.map(c => [c.id, c]));
  return { taskMap, employeeMap, clientMap };
};

const getTaskById = (id: string, taskMap: Map<string, Task>) => taskMap.get(id);
const getEmployeeById = (id: string, employeeMap: Map<string, Employee>) => employeeMap.get(id);
const getClientById = (id: string, clientMap: Map<string, Client>) => clientMap.get(id);

const statusStyles: Record<AssignmentStatus, { icon: React.FC<{className?: string}>, classes: string, tooltipIcon: React.ReactNode, label: string }> = {
    pending: { icon: Hourglass, classes: "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200", tooltipIcon: <Hourglass className="h-4 w-4 shrink-0 text-amber-600" />, label: 'Pendiente' },
    accepted: { icon: Check, classes: "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200", tooltipIcon: <Check className="h-4 w-4 shrink-0 text-blue-600" />, label: 'Aceptada' },
    completed: { icon: CheckCheck, classes: "bg-green-100 border-green-400 text-green-800 hover:bg-green-200", tooltipIcon: <CheckCheck className="h-4 w-4 shrink-0 text-green-600" />, label: 'Completada' },
    rejected: { icon: Ban, classes: "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300", tooltipIcon: <Ban className="h-4 w-4 shrink-0 text-gray-600" />, label: 'Rechazada' },
    cancelled: { icon: X, classes: "bg-red-100 border-red-400 text-red-800 hover:bg-red-200", tooltipIcon: <X className="h-4 w-4 shrink-0 text-red-600" />, label: 'Cancelada' },
};

// Memoizar funciones de agrupación y procesamiento
const groupAssignmentsByTimeAndTask = (assignmentsToGroup: Assignment[]) => {
    return assignmentsToGroup.map(assignment => [assignment]);
};

const processOverlaps = (groupedAssignments: Assignment[][]) => {
     const assignmentsWithLayout = groupedAssignments.map(group => ({
        group,
        startTime: new Date(group[0].startTime),
        endTime: new Date(group[0].endTime),
    }));

    const layoutAssignments = assignmentsWithLayout.map(a => ({ ...a, overlaps: [] as any[], column: -1, totalColumns: 1 }));

    // Detect overlaps
    for (let i = 0; i < layoutAssignments.length; i++) {
        for (let j = i + 1; j < layoutAssignments.length; j++) {
            const a = layoutAssignments[i];
            const b = layoutAssignments[j];
            if (a.startTime < b.endTime && a.endTime > b.startTime) {
                a.overlaps.push(b);
                b.overlaps.push(a);
            }
        }
    }
    
    layoutAssignments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    for (const assignment of layoutAssignments) {
        if (assignment.column === -1) {
            const placedInColumn = (colIndex: number) => {
                 const columns: any[][] = [[]];
                for(const other of layoutAssignments) {
                    if (other.column === colIndex) {
                        if (assignment.startTime < other.endTime && assignment.endTime > other.startTime) {
                            return true;
                        }
                    }
                }
                return false;
            }
            
            let col = 0;
            while(placedInColumn(col)) {
                col++;
            }
            assignment.column = col;
        }

        const allInvolved = [assignment, ...assignment.overlaps];
        const maxColumns = Math.max(...allInvolved.map(a => a.column)) + 1;
        for (const item of allInvolved) {
            item.totalColumns = Math.max(item.totalColumns, maxColumns);
        }
    }

    return layoutAssignments;
};

// Memoizar TooltipDetail para evitar re-renders innecesarios
const TooltipDetail = React.memo(({ assignmentGroup, taskMap, clientMap, employeeMap }: { 
    assignmentGroup: Assignment[], 
    taskMap: Map<string, Task>, 
    clientMap: Map<string, Client>, 
    employeeMap: Map<string, Employee> 
}) => {
    if (!assignmentGroup || assignmentGroup.length === 0) return null;

    const firstAssignment = assignmentGroup[0];
    const task = getTaskById(firstAssignment.taskId, taskMap);
    const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clientMap) : null;
    const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
    const assignedEmployees = assignmentGroup.flatMap(a => 
        a.employeeId.map(empId => getEmployeeById(empId, employeeMap)).filter(Boolean)
    ) as Employee[];
    const statusInfo = statusStyles[firstAssignment.status] || statusStyles.pending;

    const calculateExtrasTotal = React.useMemo(() => {
        if (!task || !task.extras || !firstAssignment.selectedExtras) return 0;
        return firstAssignment.selectedExtras.reduce((total, selected) => {
            const extraDetails = task.extras!.find(e => e.id === selected.extraId);
            return total + (extraDetails?.price || 0) * selected.quantity;
        }, 0);
    }, [task, firstAssignment.selectedExtras]);

    return (
        <div className="space-y-2 p-2 text-sm">
            <div className="flex items-center gap-2">
                {statusInfo.tooltipIcon}
                <p className="font-bold">{task?.title}</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{new Date(firstAssignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(firstAssignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {client && (
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span>{client.firstName} {client.lastName}</span>
                </div>
            )}
            {client && client.responsibles && client.responsibles.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <PlusCircle className="h-4 w-4 shrink-0" />
                    <span>{client.responsibles.map(r => `${r.firstName} ${r.lastName}`).join(', ')}</span>
                </div>
            )}
            {boats.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Ship className="h-4 w-4 shrink-0" />
                    <span>{boats.map(b => b.name).join(', ')}</span>
                </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{assignedEmployees.length > 0 ? assignedEmployees.map(e => e.name).join(', ') : 'Sin asignar'}</span>
            </div>
            {calculateExtrasTotal > 0 && (
                 <div className="flex items-center gap-2 font-bold pt-1 border-t mt-2">
                    <DollarSign className="h-4 w-4 shrink-0 text-green-600" />
                    <span>Total Extras: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(calculateExtrasTotal)}</span>
                </div>
            )}
        </div>
    )
});

TooltipDetail.displayName = 'TooltipDetail';



// Componente de skeleton para carga progresiva
const ScheduleSkeleton = () => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
        </div>
        <div className="relative h-[600px] overflow-y-auto">
            <div className="grid">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[auto_1fr] items-start">
                        <div className="sticky top-0 -mt-2 text-right">
                            <Skeleton className="h-3 w-8 ml-auto mr-4" />
                        </div>
                        <div className="border-l border-border pl-4">
                            <div className="h-12 border-dashed border-b"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

import { DayView } from './day-view';
import { WeekView } from './week-view';

export default function SchedulePage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("week");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const { assignments, addAssignment, updateAssignment, deleteAssignment, refetch, isLoading: assignmentsLoading } = useAssignments();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { clients, isLoading: clientsLoading } = useClients();
  const { employees, isLoading: employeesLoading } = useEmployees();
  
  // Memoizar el procesamiento de assignments para evitar re-renders
  const assignmentsWithDates = React.useMemo(() => 
    assignments.map(a => ({
      ...a,
      startTime: new Date(a.startTime),
      endTime: new Date(a.endTime),
    })), [assignments]
  );

  // Memoizar los maps de lookup para optimizar búsquedas
  const { taskMap, employeeMap, clientMap } = React.useMemo(() => 
    createLookupMaps(tasks, employees, clients), [tasks, employees, clients]
  );
  
  const [selectedAssignmentGroup, setSelectedAssignmentGroup] = React.useState<Assignment[] | null>(null);

  // Memoizar las funciones de manejo para evitar re-renders
  const handleAssignTask = React.useCallback((newAssignments: Assignment[]) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
  }, []);

  const handleUpdateTask = React.useCallback((originalAssignments: Assignment[], newAssignmentData: Omit<Assignment, 'id' | 'employeeId'>, newEmployeeIds: string[]) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
    setSelectedAssignmentGroup(null);
  }, []);

  const handleDeleteAssignment = React.useCallback(async (assignmentsToDelete: Assignment[]) => {
    // Eliminar cada asignación del grupo
    for (const assignment of assignmentsToDelete) {
      await deleteAssignment(assignment.id);
    }
    await refetch();
    setSelectedAssignmentGroup(null);
  }, [deleteAssignment, refetch]);

  const handleTaskClick = React.useCallback((assignmentGroup: Assignment[]) => {
    setSelectedAssignmentGroup(assignmentGroup);
    setIsDetailOpen(true);
  }, []);

  const handleOpenEdit = React.useCallback(() => {
    setIsDetailOpen(false);
    setIsEditOpen(true);
  }, []);

  const handleCloseDialogs = React.useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDetailOpen(false);
    setSelectedAssignmentGroup(null);
  }, []);

  const handleTaskCreated = React.useCallback((newTask: Task) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
  }, []);

  const handleClientCreated = React.useCallback((newClient: Client) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
  }, []);

  const onDeleteInEdit = React.useCallback(async () => {
    if (selectedAssignmentGroup) {
      await handleDeleteAssignment(selectedAssignmentGroup);
    }
    handleCloseDialogs();
  }, [selectedAssignmentGroup, handleDeleteAssignment, handleCloseDialogs]);

  const handleStatusChange = React.useCallback((newStatus: AssignmentStatus) => {
    if (!selectedAssignmentGroup) return;

    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
    // Also update the selected group to reflect the change immediately in the dialog
    setSelectedAssignmentGroup(prev => prev ? prev.map(a => ({ ...a, status: newStatus })) : null);
  }, [selectedAssignmentGroup]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setSelectedDate(newDate);
  }

  const goToToday = () => {
    setSelectedDate(new Date());
  }

  // Verificar si todos los datos están cargando
  const isDataLoading = assignmentsLoading || tasksLoading || clientsLoading || employeesLoading;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Asignar Tareas
            </h1>
            <p className="text-muted-foreground">
              Calendario de Asignacion de Tareas a Empleados
            </p>
            <div className="mt-2">
              <p className="text-sm font-medium text-foreground">
                {activeTab === 'day' 
                  ? selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : `Semana del ${selectedDate.toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {activeTab === 'day' ? 'Ayer' : 'Semana Anterior'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="flex items-center gap-1"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="flex items-center gap-1"
            >
              {activeTab === 'day' ? 'Mañana' : 'Próxima Semana'}
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={open => open ? setIsCreateOpen(true) : handleCloseDialogs()}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedAssignmentGroup(null); setIsCreateOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Asignar Tarea
                </Button>
              </DialogTrigger>
              <AssignTaskDialog setOpen={setIsCreateOpen} assignmentToEdit={null} initialDate={undefined} onSave={async (assignmentData) => {
                  // Asegurar que employeeId sea un array
                  const assignmentToCreate = {
                      ...assignmentData,
                      employeeId: Array.isArray(assignmentData.employeeId) ? assignmentData.employeeId : [assignmentData.employeeId]
                  };
                  await addAssignment(assignmentToCreate);
                  await refetch();
                  // Cerrar el modal después del refresh
                  setTimeout(() => {
                      setIsCreateOpen(false);
                  }, 500);
              }} />
            </Dialog>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground">Referencias:</h4>
            {Object.values(statusStyles).map(({ icon: Icon, classes, label }) => (
                <div key={label} className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", classes.split(' ').find(c => c.startsWith('bg-')))}></div>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                </div>
            ))}
        </div>

        <Dialog open={isEditOpen} onOpenChange={open => open ? setIsEditOpen(true) : handleCloseDialogs()}>
            <AssignTaskDialog setOpen={setIsEditOpen} assignmentToEdit={selectedAssignmentGroup ? selectedAssignmentGroup[0] : null} initialDate={undefined} onDelete={onDeleteInEdit} onSave={async (assignmentData) => {
                // Asegurar que employeeId sea un array
                const assignmentToUpdate = {
                    ...assignmentData,
                    employeeId: Array.isArray(assignmentData.employeeId) ? assignmentData.employeeId : [assignmentData.employeeId]
                };
                await updateAssignment(assignmentToUpdate);
                await refetch();
                // Cerrar el modal después del refresh
                setTimeout(() => {
                    setIsEditOpen(false);
                }, 500);
            }} />
        </Dialog>

        <Dialog open={isDetailOpen} onOpenChange={open => open ? setIsDetailOpen(true) : handleCloseDialogs()}>
            {selectedAssignmentGroup && (
                <AssignmentDetailDialog
                    assignmentGroup={selectedAssignmentGroup}
                    tasks={tasks}
                    clients={clients}
                    employees={employees}
                    onEdit={handleOpenEdit}
                    setOpen={handleCloseDialogs}
                    onStatusChange={async (newStatus) => {
                      if (!selectedAssignmentGroup) return;
                      await updateAssignment({ ...selectedAssignmentGroup[0], status: newStatus });
                      await refetch();
                      // No cierres el modal automáticamente
                    }}
                />
            )}
            {!selectedAssignmentGroup && (
                <AssignmentDetailDialog
                    assignmentGroup={[]}
                    tasks={tasks}
                    clients={clients}
                    employees={employees}
                    onEdit={handleOpenEdit}
                    setOpen={handleCloseDialogs}
                    onStatusChange={async () => {}}
                />
            )}
        </Dialog>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-end">
                <TabsList>
                    <TabsTrigger value="day">Hoy</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="day" className="mt-4">
                {isDataLoading ? (
                    <ScheduleSkeleton />
                ) : (
                    <DayView 
                        assignments={assignmentsWithDates} 
                        tasks={tasks} 
                        clients={clients} 
                        employees={employees} 
                        onTaskClick={handleTaskClick}
                        taskMap={taskMap}
                        clientMap={clientMap}
                        employeeMap={employeeMap}
                        selectedDate={selectedDate}
                    />
                )}
            </TabsContent>
            <TabsContent value="week" className="mt-4">
                {isDataLoading ? (
                    <ScheduleSkeleton />
                ) : (
                    <WeekView 
                        assignments={assignmentsWithDates} 
                        tasks={tasks} 
                        clients={clients} 
                        employees={employees} 
                        onTaskClick={handleTaskClick}
                        taskMap={taskMap}
                        clientMap={clientMap}
                        employeeMap={employeeMap}
                        selectedDate={selectedDate}
                    />
                )}
            </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}

    
