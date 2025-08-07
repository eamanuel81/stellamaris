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

export const WeekView = React.memo(({ 
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
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
    
    // Memoizar funciones de cálculo de posición dentro del componente
    const getTaskPosition = React.useCallback((startTime: Date) => {
        const startHour = 0;
        const hours = startTime.getHours() + startTime.getMinutes() / 60;
        return (hours - startHour) * 48;
    }, []);

    const getTaskHeight = React.useCallback((startTime: Date, endTime: Date) => {
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        return Math.max(24, (durationMinutes / 60) * 48 - 2);
    }, []);
    
    const weekDays = React.useMemo(() => 
        Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        }), [startOfWeek]
    );

    const timeSlots = React.useMemo(() => 
        Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`), []
    );
    
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
                                const dayAssignments = React.useMemo(() => 
                                    assignments.filter(a => {
                                        const assignmentDate = new Date(a.startTime);
                                        assignmentDate.setHours(0,0,0,0);
                                        const compareDate = new Date(day);
                                        compareDate.setHours(0,0,0,0);
                                        return assignmentDate.getTime() === compareDate.getTime();
                                    }), [assignments, day]
                                );
                                
                                const groupedForDay = React.useMemo(() => 
                                    groupAssignmentsByTimeAndTask(dayAssignments), [dayAssignments]
                                );
                                
                                const processedForDay = React.useMemo(() => 
                                    processOverlaps(groupedForDay), [groupedForDay]
                                );

                                return (
                                    <div key={day.toISOString()} className="relative border-r last:border-r-0">
                                        {timeSlots.map(time => (
                                            <div key={time} className="h-12 border-b border-dashed"></div>
                                        ))}
                                        {processedForDay.map((processed, index) => {
                                            const assignmentGroup = processed.group;
                                            const firstAssignment = assignmentGroup[0];
                                            const task = getTaskById(firstAssignment.taskId, taskMap);
                                            if (!task) return null;

                                            const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clientMap) : null;
                                            const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
                                            const assignedEmployees = assignmentGroup.flatMap(a => 
                                                a.employeeId.map(empId => getEmployeeById(empId, employeeMap)).filter(Boolean)
                                            ) as Employee[];
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
                                                        <TooltipDetail assignmentGroup={assignmentGroup} taskMap={taskMap} clientMap={clientMap} employeeMap={employeeMap} />
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
});

WeekView.displayName = 'WeekView';
