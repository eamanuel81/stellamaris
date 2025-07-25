
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button, Dialog, DialogTrigger, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Badge } from "@/components/ui"
import { PlusCircle, Clock, User, Ship, DollarSign, Users, Hourglass, Check, CheckCheck, X, Ban } from "lucide-react"
import { employees, tasks as initialTasks, assignments as initialAssignments, clients as initialClients } from "@/lib/data";
import type { Assignment, Task, Client, Employee, AssignmentStatus } from '@/lib/data';
import { AssignTaskDialog } from "@/components/assign-task-dialog"
import { AssignmentDetailDialog } from "@/components/assignment-detail-dialog"
import { cn } from "@/lib/utils"
import { useAssignments } from '@/hooks/use-assignments';
import { useTasks } from '@/hooks/use-tasks';
import { useClients } from '@/hooks/use-clients';
import { useEmployees } from '@/hooks/use-employees';

const generateTimeSlots = () => {
  const slots = []
  // from 6 AM to 1 AM next day
  for (let i = 6; i <= 24; i++) {
    slots.push(`${String(i % 24).padStart(2, '0')}:00`)
  }
  slots.push('01:00')
  return slots
}

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id)
const getEmployeeById = (id: string, employees: Employee[]) => employees.find(e => e.id === id)
const getClientById = (id: string, clients: Client[]) => clients.find(c => c.id === id)

const statusStyles: Record<AssignmentStatus, { icon: React.FC<{className?: string}>, classes: string, tooltipIcon: React.ReactNode, label: string }> = {
    pending: { icon: Hourglass, classes: "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200", tooltipIcon: <Hourglass className="h-4 w-4 shrink-0 text-amber-600" />, label: 'Pendiente' },
    accepted: { icon: Check, classes: "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200", tooltipIcon: <Check className="h-4 w-4 shrink-0 text-blue-600" />, label: 'Aceptada' },
    completed: { icon: CheckCheck, classes: "bg-green-100 border-green-400 text-green-800 hover:bg-green-200", tooltipIcon: <CheckCheck className="h-4 w-4 shrink-0 text-green-600" />, label: 'Completada' },
    rejected: { icon: Ban, classes: "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300", tooltipIcon: <Ban className="h-4 w-4 shrink-0 text-gray-600" />, label: 'Rechazada' },
    cancelled: { icon: X, classes: "bg-red-100 border-red-400 text-red-800 hover:bg-red-200", tooltipIcon: <X className="h-4 w-4 shrink-0 text-red-600" />, label: 'Cancelada' },
};


const groupAssignmentsByTimeAndTask = (assignmentsToGroup: Assignment[]) => {
    const grouped = new Map<string, Assignment[]>();

    assignmentsToGroup.forEach(assignment => {
        const key = `${assignment.taskId}-${assignment.startTime.getTime()}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(assignment);
    });
    
    return Array.from(grouped.values());
}

const processOverlaps = (groupedAssignments: Assignment[][]) => {
     const assignmentsWithLayout = groupedAssignments.map(group => ({
        group,
        startTime: new Date(group[0].startTime),
        endTime: new Date(group[0].endTime),
    }));

    // For sorting and layout calculation, we need to handle overlaps.
    // We create a temporary structure to hold layout properties.
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
    
    // Sort by start time to process chronologically
    layoutAssignments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Assign columns
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

        // Expand totalColumns for all overlapping items
        const allInvolved = [assignment, ...assignment.overlaps];
        const maxColumns = Math.max(...allInvolved.map(a => a.column)) + 1;
        for (const item of allInvolved) {
            item.totalColumns = Math.max(item.totalColumns, maxColumns);
        }
    }

    return layoutAssignments;
};

const TooltipDetail = ({ assignmentGroup, tasks, clients, employees }: { assignmentGroup: Assignment[], tasks: Task[], clients: Client[], employees: Employee[] }) => {
    if (!assignmentGroup || assignmentGroup.length === 0) return null;

    const firstAssignment = assignmentGroup[0];
    const task = getTaskById(firstAssignment.taskId, tasks);
    const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clients) : null;
    const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
    const assignedEmployees = assignmentGroup.map(a => getEmployeeById(a.employeeId, employees)).filter(Boolean) as Employee[];
    const statusInfo = statusStyles[firstAssignment.status] || statusStyles.pending;

    const calculateExtrasTotal = () => {
        if (!task || !task.extras || !firstAssignment.selectedExtras) return 0;
        return firstAssignment.selectedExtras.reduce((total, selected) => {
            const extraDetails = task.extras!.find(e => e.id === selected.extraId);
            return total + (extraDetails?.price || 0) * selected.quantity;
        }, 0);
    };
    const extrasTotal = calculateExtrasTotal();

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
            {boats.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Ship className="h-4 w-4 shrink-0" />
                    <span>{boats.map(b => b.name).join(', ')}</span>
                </div>
            )}
            {assignedEmployees.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{assignedEmployees.map(e => e.name).join(', ')}</span>
                </div>
            )}
            {extrasTotal > 0 && (
                 <div className="flex items-center gap-2 font-bold pt-1 border-t mt-2">
                    <DollarSign className="h-4 w-4 shrink-0 text-green-600" />
                    <span>Total Extras: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(extrasTotal)}</span>
                </div>
            )}
        </div>
    )
}

const DayView = ({ assignments, tasks, clients, employees, onTaskClick }: { assignments: Assignment[], tasks: Task[], clients: Client[], employees: Employee[], onTaskClick: (assignmentGroup: Assignment[]) => void }) => {
    const timeSlots = generateTimeSlots()
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAssignments = assignments.filter(a => {
        const assignmentDate = new Date(a.startTime);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate.getTime() === today.getTime();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const groupedAssignments = groupAssignmentsByTimeAndTask(todayAssignments);
    const processedAssignments = processOverlaps(groupedAssignments);

    const getTaskPosition = (startTime: Date) => {
        const startHour = 6;
        const hours = new Date(startTime).getHours() + new Date(startTime).getMinutes() / 60;
        const topPosition = (hours - startHour) * 48; // 48px per hour (h-12)
        return Math.max(0, topPosition);
    }

    const getTaskHeight = (startTime: Date, endTime: Date) => {
        const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 48; // 48px per hour
        return Math.max(24, height - 2); // Subtract 2px for a small gap, min height 24px
    }

    return (
        <TooltipProvider>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Horario de Hoy</h3>
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="relative h-[600px] overflow-y-auto">
                    <div className="grid">
                        {timeSlots.map((time) => (
                            <div key={time} className="grid grid-cols-[auto_1fr] items-start">
                                <div className="sticky top-0 -mt-2 text-right">
                                    <span className="relative top-2 pr-4 text-xs text-muted-foreground">{time}</span>
                                </div>
                                <div className="border-l border-border pl-4">
                                    <div className="h-12 border-dashed border-b"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-0 left-[60px] right-0 bottom-0 pr-4">
                        {processedAssignments.map((processed, index) => {
                            const assignmentGroup = processed.group;
                            const firstAssignment = assignmentGroup[0];
                            const task = getTaskById(firstAssignment.taskId, tasks);
                            if (!task) return null;

                            const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clients) : null;
                            const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
                            const assignedEmployees = assignmentGroup.map(a => getEmployeeById(a.employeeId, employees)).filter(Boolean) as (typeof employees[0])[];
                            const top = getTaskPosition(firstAssignment.startTime);
                            const height = getTaskHeight(firstAssignment.startTime, firstAssignment.endTime);

                            const width = 100 / processed.totalColumns;
                            const left = width * processed.column;
                            const statusInfo = statusStyles[firstAssignment.status] || statusStyles.pending;
                            const Icon = statusInfo.icon;
                            
                            return (
                                <Tooltip key={`${firstAssignment.id}-${index}`}>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => onTaskClick(assignmentGroup)}
                                            className={cn(
                                                "absolute rounded-lg p-2 border cursor-pointer z-10 flex flex-col justify-start overflow-hidden",
                                                statusInfo.classes
                                            )}
                                            style={{ 
                                                top: `${top}px`, 
                                                height: `${height}px`,
                                                width: `calc(${width}% - 4px)`,
                                                left: `calc(${left}% + 2px)`
                                            }}
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Icon className="h-3 w-3 shrink-0" />
                                                    <p className="font-bold text-sm truncate">{task.title}</p>
                                                </div>
                                                <div className="text-xs opacity-80 pl-5 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <Users className="h-3 w-3 shrink-0" />
                                                        <p>{assignedEmployees.map(e => e.name).join(', ')}</p>
                                                    </div>
                                                    {client && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <User className="h-3 w-3 shrink-0" />
                                                            <p>{client.firstName} {client.lastName}</p>
                                                        </div>
                                                    )}
                                                    {boats.length > 0 && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Ship className="h-3 w-3 shrink-0" />
                                                            <p>{boats.map(b => b.name).join(', ')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="start">
                                        <TooltipDetail assignmentGroup={assignmentGroup} tasks={tasks} clients={clients} employees={employees} />
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

const WeekView = ({ assignments, tasks, clients, employees, onTaskClick }: { assignments: Assignment[], tasks: Task[], clients: Client[], employees: Employee[], onTaskClick: (assignmentGroup: Assignment[]) => void }) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const timeSlots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const getTaskPosition = (startTime: Date) => {
        const startHour = 0;
        const hours = startTime.getHours() + startTime.getMinutes() / 60;
        return (hours - startHour) * 48; // 48px per hour
    };

    const getTaskHeight = (startTime: Date, endTime: Date) => {
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        return Math.max(24, (durationMinutes / 60) * 48 - 2); // 48px per hour, -2 for gap, min height 24px
    };
    
    return (
        <TooltipProvider>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="grid grid-cols-[60px_1fr] sticky top-0 z-20 bg-card">
                    <div className="border-r border-b p-2"></div>
                    <div className="grid grid-cols-7 border-b">
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className="p-2 text-center border-r last:border-r-0">
                                <p className="font-semibold text-sm">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                <p className="text-xs text-muted-foreground">{day.toLocaleDateString('es-ES', { day: '2-digit' })}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative h-[600px] overflow-y-auto">
                    <div className="grid grid-cols-[60px_1fr]">
                        {/* Time column */}
                        <div className="relative">
                            {timeSlots.map(time => (
                                <div key={time} className="h-12 flex items-start justify-end pr-2 border-r">
                                    <span className="relative -top-2 text-xs text-muted-foreground">{time}</span>
                                </div>
                            ))}
                        </div>
                        {/* Days columns */}
                        <div className="grid grid-cols-7 relative">
                            {weekDays.map((day) => {
                                const dayAssignments = assignments.filter(a => {
                                    const assignmentDate = new Date(a.startTime);
                                    assignmentDate.setHours(0,0,0,0);
                                    const compareDate = new Date(day);
                                    compareDate.setHours(0,0,0,0);
                                    return assignmentDate.getTime() === compareDate.getTime();
                                });
                                
                                const groupedForDay = groupAssignmentsByTimeAndTask(dayAssignments);
                                const processedForDay = processOverlaps(groupedForDay);

                                return (
                                    <div key={day.toISOString()} className="relative border-r last:border-r-0">
                                        {timeSlots.map(time => (
                                            <div key={time} className="h-12 border-b border-dashed"></div>
                                        ))}
                                        {processedForDay.map((processed, index) => {
                                            const assignmentGroup = processed.group;
                                            const firstAssignment = assignmentGroup[0];
                                            const task = getTaskById(firstAssignment.taskId, tasks);
                                            if (!task) return null;

                                            const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clients) : null;
                                            const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
                                            const assignedEmployees = assignmentGroup.map(a => getEmployeeById(a.employeeId, employees)).filter(Boolean) as (typeof employees[0])[];
                                            const startTime = new Date(firstAssignment.startTime);
                                            const endTime = new Date(firstAssignment.endTime);

                                            const height = getTaskHeight(startTime, endTime);
                                            const top = getTaskPosition(startTime);
                                            const width = 100 / processed.totalColumns;
                                            const left = width * processed.column;
                                            const statusInfo = statusStyles[firstAssignment.status] || statusStyles.pending;
                                            const Icon = statusInfo.icon;


                                            return (
                                                <Tooltip key={`${firstAssignment.id}-${index}`}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() => onTaskClick(assignmentGroup)}
                                                            className={cn(
                                                                "absolute rounded-lg p-2 border cursor-pointer z-10 flex flex-col justify-start overflow-hidden",
                                                                statusInfo.classes
                                                            )}
                                                            style={{
                                                                top: `${top}px`,
                                                                height: `${height}px`,
                                                                width: `calc(${width}% - 4px)`,
                                                                left: `calc(${left}% + 2px)`,
                                                            }}
                                                        >
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Icon className="h-3 w-3 shrink-0" />
                                                                    <p className="font-bold text-sm truncate">{task.title}</p>
                                                                </div>
                                                                <div className="text-xs opacity-80 pl-5 space-y-0.5">
                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                        <Users className="h-3 w-3 shrink-0" />
                                                                        <p>{assignedEmployees.map(e => e.name).join(', ')}</p>
                                                                    </div>
                                                                    {client && (
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <User className="h-3 w-3 shrink-0" />
                                                                            <p>{client.firstName} {client.lastName}</p>
                                                                        </div>
                                                                    )}
                                                                    {boats.length > 0 && (
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <Ship className="h-3 w-3 shrink-0" />
                                                                            <p>{boats.map(b => b.name).join(', ')}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" align="start">
                                                        <TooltipDetail assignmentGroup={assignmentGroup} tasks={tasks} clients={clients} employees={employees} />
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })
                                    }
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

export default function SchedulePage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const { assignments } = useAssignments();
  const { tasks } = useTasks();
  const { clients } = useClients();
  const { employees } = useEmployees();
  const assignmentsWithDates = assignments.map(a => ({
    ...a,
    startTime: new Date(a.startTime),
    endTime: new Date(a.endTime),
  }));
  const [selectedAssignmentGroup, setSelectedAssignmentGroup] = React.useState<Assignment[] | null>(null);

  const handleAssignTask = (newAssignments: Assignment[]) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
  }

 const handleUpdateTask = (originalAssignments: Assignment[], newAssignmentData: Omit<Assignment, 'id' | 'employeeId'>, newEmployeeIds: string[]) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
    setSelectedAssignmentGroup(null);
}

  const handleDeleteAssignment = (assignmentsToDelete: Assignment[]) => {
      // This function is now handled by the hook, so we just update the state
      // The actual deletion will happen via the hook's mutation
      setSelectedAssignmentGroup(null);
  }

  const handleTaskClick = (assignmentGroup: Assignment[]) => {
    setSelectedAssignmentGroup(assignmentGroup);
    setIsDetailOpen(true);
  }

  const handleOpenEdit = () => {
    setIsDetailOpen(false);
    setIsEditOpen(true);
  }

  const handleCloseDialogs = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDetailOpen(false);
    setSelectedAssignmentGroup(null);
  }

  const handleTaskCreated = (newTask: Task) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
  }

  const handleClientCreated = (newClient: Client) => {
    // This function is now handled by the hook, so we just update the state
    // The actual saving/updating will happen via the hook's mutation
  }

  const onDeleteInEdit = () => {
    if (selectedAssignmentGroup) {
      handleDeleteAssignment(selectedAssignmentGroup);
    }
    handleCloseDialogs();
  }

  const handleStatusChange = (newStatus: AssignmentStatus) => {
      if (!selectedAssignmentGroup) return;

      // This function is now handled by the hook, so we just update the state
      // The actual saving/updating will happen via the hook's mutation
      // Also update the selected group to reflect the change immediately in the dialog
      setSelectedAssignmentGroup(prev => prev ? prev.map(a => ({ ...a, status: newStatus })) : null);
  }

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
          </div>
           <Dialog open={isCreateOpen} onOpenChange={open => open ? setIsCreateOpen(true) : handleCloseDialogs()}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedAssignmentGroup(null); setIsCreateOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Asignar Tarea
              </Button>
            </DialogTrigger>
            <AssignTaskDialog setOpen={setIsCreateOpen} assignmentToEdit={null} />
        </Dialog>
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
            <AssignTaskDialog setOpen={setIsEditOpen} assignmentToEdit={selectedAssignmentGroup ? selectedAssignmentGroup[0] : null} onDelete={onDeleteInEdit} />
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
                />
            )}
        </Dialog>
        
        <Tabs defaultValue="week" className="w-full">
            <div className="flex justify-end">
                <TabsList>
                    <TabsTrigger value="day">Hoy</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="day" className="mt-4">
                <DayView assignments={assignmentsWithDates} tasks={tasks} clients={clients} employees={employees} onTaskClick={handleTaskClick} />
            </TabsContent>
            <TabsContent value="week" className="mt-4">
                <WeekView assignments={assignmentsWithDates} tasks={tasks} clients={clients} employees={employees} onTaskClick={handleTaskClick} />
            </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}

    
