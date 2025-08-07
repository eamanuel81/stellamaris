
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button, Dialog, DialogTrigger, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Badge } from "@/components/ui"
import { PlusCircle, Clock, User, Ship, DollarSign, Users, Hourglass, Check, CheckCheck, X, Ban } from "lucide-react"
import { Assignment, Task, Client, AssignmentStatus } from "@/lib/data"
import { MyTaskDetailDialog } from "@/components/my-task-detail-dialog"
import { cn } from "@/lib/utils"
import { useAssignments } from "@/hooks/use-assignments"
import { useTasks } from "@/hooks/use-tasks"
import { useClients } from "@/hooks/use-clients"
import { useEmployees } from "@/hooks/use-employees"
import { useAuth } from "@/hooks/use-auth-state"
import { supabase } from "@/lib/supabaseClient"

const generateTimeSlots = () => {
  const slots = []
  for (let i = 6; i <= 24; i++) {
    slots.push(`${String(i % 24).padStart(2, '0')}:00`)
  }
  slots.push('01:00')
  return slots
}

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id)
const getClientById = (id: string, clients: Client[]) => clients.find(c => c.id === id)

const statusStyles: Record<AssignmentStatus, { icon: React.FC<{className?: string}>, classes: string, tooltipIcon: React.ReactNode, label: string }> = {
    pending: { icon: Hourglass, classes: "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200", tooltipIcon: <Hourglass className="h-4 w-4 shrink-0 text-amber-600" />, label: 'Pendiente' },
    accepted: { icon: Check, classes: "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200", tooltipIcon: <Check className="h-4 w-4 shrink-0 text-blue-600" />, label: 'Aceptada' },
    completed: { icon: CheckCheck, classes: "bg-green-100 border-green-400 text-green-800 hover:bg-green-200", tooltipIcon: <CheckCheck className="h-4 w-4 shrink-0 text-green-600" />, label: 'Completada' },
    rejected: { icon: Ban, classes: "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300", tooltipIcon: <Ban className="h-4 w-4 shrink-0 text-gray-600" />, label: 'Rechazada' },
    cancelled: { icon: X, classes: "bg-red-100 border-red-400 text-red-800 hover:bg-red-200", tooltipIcon: <X className="h-4 w-4 shrink-0 text-red-600" />, label: 'Cancelada' },
};

const processOverlaps = (assignmentsToLayout: Assignment[]) => {
     const assignmentsWithLayout = assignmentsToLayout.map(assignment => ({
        assignment,
        startTime: new Date(assignment.startTime),
        endTime: new Date(assignment.endTime),
    }));

    const layoutAssignments = assignmentsWithLayout.map(a => ({ ...a, overlaps: [] as any[], column: -1, totalColumns: 1 }));

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

const TooltipDetail = ({ assignment, tasks, clients }: { assignment: Assignment, tasks: Task[], clients: Client[] }) => {
    if (!assignment) return null;

    const task = getTaskById(assignment.taskId, tasks);
    const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
    const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
    const statusInfo = statusStyles[assignment.status] || statusStyles.pending;
    
    return (
        <div className="space-y-2 p-2 text-sm">
            <div className="flex items-center gap-2">
                {statusInfo.tooltipIcon}
                <p className="font-bold">{task?.title}</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{new Date(assignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(assignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
        </div>
    )
}

const DayView = ({ assignments, tasks, clients, onTaskClick }: { assignments: Assignment[], tasks: Task[], clients: Client[], onTaskClick: (assignment: Assignment) => void }) => {
    const timeSlots = generateTimeSlots()
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAssignments = assignments.filter(a => {
        const assignmentDate = new Date(a.startTime);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate.getTime() === today.getTime();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const processedAssignments = processOverlaps(todayAssignments);

    const getTaskPosition = (startTime: Date) => {
        const startHour = 6;
        const hours = new Date(startTime).getHours() + new Date(startTime).getMinutes() / 60;
        const topPosition = (hours - startHour) * 48;
        return Math.max(0, topPosition);
    }

    const getTaskHeight = (startTime: Date, endTime: Date) => {
        const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 48;
        return Math.max(24, height - 2);
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
                            const { assignment } = processed;
                            const task = getTaskById(assignment.taskId, tasks);
                            if (!task) return null;

                            const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                            const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
                            
                            const top = getTaskPosition(assignment.startTime);
                            const height = getTaskHeight(assignment.startTime, assignment.endTime);

                            const width = Math.max(100 / processed.totalColumns, 90); // Mínimo 90% de ancho
                            const left = width * processed.column;
                            const statusInfo = statusStyles[assignment.status] || statusStyles.pending;
                            const Icon = statusInfo.icon;
                            
                            return (
                                <Tooltip key={`${assignment.id}-${index}`}>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => onTaskClick(assignment)}
                                                                                         className={cn(
                                                 "absolute rounded-lg p-4 border cursor-pointer z-10 flex flex-col justify-start",
                                                 statusInfo.classes
                                             )}
                                             style={{ 
                                                 top: `${top}px`, 
                                                 height: `${height}px`,
                                                 width: `calc(${width}% - 4px)`,
                                                 left: `calc(${left}% + 2px)`
                                             }}
                                        >
                                            <div className="flex items-start gap-1.5">
                                                <Icon className="h-3 w-3 shrink-0 mt-0.5" />
                                                <p className="font-bold text-sm leading-tight break-words min-w-0 flex-1">{task.title}</p>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="start">
                                        <TooltipDetail assignment={assignment} tasks={tasks} clients={clients} />
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

const WeekView = ({ assignments, tasks, clients, onTaskClick }: { assignments: Assignment[], tasks: Task[], clients: Client[], onTaskClick: (assignment: Assignment) => void }) => {
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
                        <div className="relative">
                            {timeSlots.map(time => (
                                <div key={time} className="h-12 flex items-start justify-end pr-2 border-r">
                                    <span className="relative -top-2 text-xs text-muted-foreground">{time}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 relative">
                            {weekDays.map((day) => {
                                const dayAssignments = assignments.filter(a => {
                                    const assignmentDate = new Date(a.startTime);
                                    assignmentDate.setHours(0,0,0,0);
                                    const compareDate = new Date(day);
                                    compareDate.setHours(0,0,0,0);
                                    return assignmentDate.getTime() === compareDate.getTime();
                                });
                                
                                const processedForDay = processOverlaps(dayAssignments);

                                return (
                                    <div key={day.toISOString()} className="relative border-r last:border-r-0">
                                        {timeSlots.map(time => (
                                            <div key={time} className="h-12 border-b border-dashed"></div>
                                        ))}
                                        {processedForDay.map((processed, index) => {
                                            const { assignment } = processed;
                                            const task = getTaskById(assignment.taskId, tasks);
                                            if (!task) return null;

                                            const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                                            const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
                                            const startTime = new Date(assignment.startTime);
                                            const endTime = new Date(assignment.endTime);

                                            const height = getTaskHeight(startTime, endTime);
                                            const top = getTaskPosition(startTime);
                                            const width = Math.max(100 / processed.totalColumns, 90); // Mínimo 90% de ancho
                                            const left = width * processed.column;
                                            const statusInfo = statusStyles[assignment.status] || statusStyles.pending;
                                            const Icon = statusInfo.icon;


                                            return (
                                                <Tooltip key={`${assignment.id}-${index}`}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() => onTaskClick(assignment)}
                                                                                                                         className={cn(
                                                                 "absolute rounded-lg p-4 border cursor-pointer z-10 flex flex-col justify-start",
                                                                 statusInfo.classes
                                                             )}
                                                            style={{
                                                                top: `${top}px`,
                                                                height: `${height}px`,
                                                                width: `calc(${width}% - 4px)`,
                                                                left: `calc(${left}% + 2px)`,
                                                            }}
                                                        >
                                                             <div className="flex items-start gap-1.5">
                                                                                                                                 <Icon className="h-3 w-3 shrink-0 mt-0.5" />
                                                                 <p className="font-bold text-sm leading-tight break-words min-w-0 flex-1">{task.title}</p>
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" align="start">
                                                        <TooltipDetail assignment={assignment} tasks={tasks} clients={clients} />
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

export default function MyCalendarPage() {
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = React.useState<any>(null);

  // Usar hooks de la base de datos
  const { assignments, updateAssignment, isLoading: assignmentsLoading } = useAssignments();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { clients, isLoading: clientsLoading } = useClients();
  const { employees, isLoading: employeesLoading } = useEmployees();

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
          
          if (!employeeError && employee) {
            setCurrentEmployee(employee);
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
    if (!assignments || assignments.length === 0 || !currentEmployee) return [];
    
    return assignments.filter(assignment => {
      if (!assignment.employeeId || !Array.isArray(assignment.employeeId)) return false;
      return assignment.employeeId.includes(currentEmployee.id);
    });
  }, [assignments, currentEmployee]);

  const handleTaskClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailOpen(true);
  }

  const handleCloseDialogs = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
       setSelectedAssignment(null);
    }, 200);
  }

  const handleStatusChange = async (newStatus: AssignmentStatus) => {
    if (!selectedAssignment) return;
    
    try {
      const updatedAssignment = { ...selectedAssignment, status: newStatus };
      const result = await updateAssignment(updatedAssignment);
      
      if (result.error) {
        console.error('Error updating assignment status:', result.error);
      } else {
        setSelectedAssignment(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
    }
  }

  // Mostrar loading si los datos están cargando
  if (assignmentsLoading || tasksLoading || clientsLoading || employeesLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight">
                Mi Calendario
              </h1>
              <p className="text-muted-foreground">
                Vista de calendario de tus tareas asignadas.
              </p>
            </div>
          </header>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando calendario...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Mi Calendario
            </h1>
            <p className="text-muted-foreground">
              Vista de calendario de tus tareas asignadas.
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground">Referencias:</h4>
            {Object.values(statusStyles).map(({ classes, label }) => (
                <div key={label} className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", classes.split(' ').find(c => c.startsWith('bg-')))}></div>
                    <span>{label}</span>
                </div>
            ))}
        </div>

        <Dialog open={isDetailOpen} onOpenChange={open => open ? setIsDetailOpen(true) : handleCloseDialogs()}>
            {selectedAssignment && (
                <MyTaskDetailDialog
                    assignment={selectedAssignment}
                    task={getTaskById(selectedAssignment.taskId, tasks)!}
                    client={selectedAssignment.clientId ? getClientById(selectedAssignment.clientId, clients) || null : null}
                    onStatusChange={handleStatusChange}
                    setOpen={setIsDetailOpen}
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
                <DayView assignments={myAssignments} tasks={tasks} clients={clients} onTaskClick={handleTaskClick} />
            </TabsContent>
            <TabsContent value="week" className="mt-4">
                <WeekView assignments={myAssignments} tasks={tasks} clients={clients} onTaskClick={handleTaskClick} />
            </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}
