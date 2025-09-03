import React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui"
import { Clock, User, Ship, DollarSign, Users, Hourglass, Check, CheckCheck, X, Ban, PlusCircle } from "lucide-react"
import type { Assignment, Task, Client, Employee, AssignmentStatus } from '@/lib/data';
import { cn } from "@/lib/utils"

const statusStyles: Record<AssignmentStatus, { icon: React.FC<{className?: string}>, classes: string, tooltipIcon: React.ReactNode, label: string }> = {
    pending: { icon: Hourglass, classes: "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200", tooltipIcon: <Hourglass className="h-4 w-4 shrink-0 text-amber-600" />, label: 'Pendiente' },
    accepted: { icon: Check, classes: "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200", tooltipIcon: <Check className="h-4 w-4 shrink-0 text-blue-600" />, label: 'Aceptada' },
    completed: { icon: CheckCheck, classes: "bg-green-100 border-green-400 text-green-800 hover:bg-green-200", tooltipIcon: <CheckCheck className="h-4 w-4 shrink-0 text-green-600" />, label: 'Completada' },
    rejected: { icon: Ban, classes: "bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300", tooltipIcon: <Ban className="h-4 w-4 shrink-0 text-gray-600" />, label: 'Rechazada' },
    cancelled: { icon: X, classes: "bg-red-100 border-red-400 text-red-800 hover:bg-red-200", tooltipIcon: <X className="h-4 w-4 shrink-0 text-red-600" />, label: 'Cancelada' },
};

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

const getTaskById = (id: string, taskMap: Map<string, Task>) => taskMap.get(id);
const getEmployeeById = (id: string, employeeMap: Map<string, Employee>) => employeeMap.get(id);
const getClientById = (id: string, clientMap: Map<string, Client>) => clientMap.get(id);

// Función regular para agrupar asignaciones
const groupAssignmentsByTimeAndTask = (assignmentsToGroup: Assignment[]) => {
    return assignmentsToGroup.map(assignment => [assignment]);
};

// Función regular para procesar overlaps
const processOverlaps = (groupedAssignments: Assignment[][]) => {
     const assignmentsWithLayout = groupedAssignments.map(group => ({
        group,
        startTime: new Date(group[0].startTime),
        endTime: new Date(group[0].endTime),
    }));

    const layoutAssignments = assignmentsWithLayout.map(a => ({ ...a, overlaps: [] as any[], column: -1, totalColumns: 1 }));

    // Detect overlaps with more precision
    for (let i = 0; i < layoutAssignments.length; i++) {
        for (let j = i + 1; j < layoutAssignments.length; j++) {
            const a = layoutAssignments[i];
            const b = layoutAssignments[j];
            // Check if tasks overlap in time
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

export const DayView = React.memo(({ 
    assignments, 
    tasks, 
    clients, 
    employees, 
    onTaskClick,
    taskMap,
    clientMap,
    employeeMap
}: { 
    assignments: Assignment[], 
    tasks: Task[], 
    clients: Client[], 
    employees: Employee[], 
    onTaskClick: (assignmentGroup: Assignment[]) => void,
    taskMap: Map<string, Task>,
    clientMap: Map<string, Client>,
    employeeMap: Map<string, Employee>
}) => {
    // Memoizar timeSlots dentro del componente
    const timeSlots = React.useMemo(() => generateTimeSlots(), []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Memoizar funciones de cálculo de posición dentro del componente
    const getTaskPosition = React.useCallback((startTime: Date) => {
        const startHour = 6;
        const hours = new Date(startTime).getHours() + new Date(startTime).getMinutes() / 60;
        const topPosition = (hours - startHour) * 48;
        return Math.max(0, topPosition);
    }, []);

    const getTaskHeight = React.useCallback((startTime: Date, endTime: Date) => {
        const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 48;
        return Math.max(24, height - 2);
    }, []);

    const todayAssignments = React.useMemo(() => 
        assignments.filter(a => {
            const assignmentDate = new Date(a.startTime);
            assignmentDate.setHours(0, 0, 0, 0);
            return assignmentDate.getTime() === today.getTime();
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()), [assignments]
    );

    const groupedAssignments = React.useMemo(() => 
        groupAssignmentsByTimeAndTask(todayAssignments), [todayAssignments]
    );
    
    const processedAssignments = React.useMemo(() => 
        processOverlaps(groupedAssignments), [groupedAssignments]
    );

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
                            const task = getTaskById(firstAssignment.taskId, taskMap);
                            if (!task) return null;

                            const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clientMap) : null;
                            const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
                            const assignedEmployees = assignmentGroup.flatMap(a => 
                                a.employeeId.map(empId => getEmployeeById(empId, employeeMap)).filter(Boolean)
                            ) as Employee[];
                            const top = getTaskPosition(firstAssignment.startTime);
                            const height = getTaskHeight(firstAssignment.startTime, firstAssignment.endTime);

                            const width = Math.max(100 / processed.totalColumns, 40); // Mínimo 40% de ancho
                            const left = width * processed.column;
                            const statusInfo = statusStyles[firstAssignment.status] || statusStyles.pending;
                            const Icon = statusInfo.icon;
                            
                            return (
                                <Tooltip key={`${firstAssignment.id}-${index}`}>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => onTaskClick(assignmentGroup)}
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
                                                {(client || boats.length > 0) && (
                                                    <div className="text-xs opacity-80 flex items-center gap-1 ml-auto">
                                                        {client && (
                                                            <div className="flex items-center gap-1">
                                                                <User className="h-3 w-3 shrink-0" />
                                                                <span className="leading-tight truncate">{client.firstName} {client.lastName}</span>
                                                            </div>
                                                        )}
                                                        {boats.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Ship className="h-3 w-3 shrink-0" />
                                                                <span className="leading-tight truncate">{boats.map(b => b.name).join(', ')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" align="start">
                                        <TooltipDetail assignmentGroup={assignmentGroup} taskMap={taskMap} clientMap={clientMap} employeeMap={employeeMap} />
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
});

DayView.displayName = 'DayView';
