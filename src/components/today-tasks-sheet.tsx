
"use client"

import React from "react"
import {
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Badge,
    Button
} from "@/components/ui"
import { Assignment, Task, Client, Employee, AssignmentStatus } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Car, Check, ChevronDown, Clock, X, Ban, Hourglass, CheckCheck, User, Ship, Package } from "lucide-react"

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

interface TodayTasksSheetProps {
    assignments: Assignment[];
    tasks: Task[];
    clients: Client[];
    employees: Employee[];
}

export const TodayTasksSheet = ({ assignments, tasks, clients, employees }: TodayTasksSheetProps) => {
    return (
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl">
            <SheetHeader>
                <SheetTitle>Tareas del Día</SheetTitle>
                <SheetDescription>
                    Resumen de todas las tareas programadas para hoy.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4 h-[calc(100vh-8rem)] overflow-y-auto">
                {assignments.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {assignments.map((assignment) => {
                            const task = getTaskById(assignment.taskId, tasks);
                            if (!task) return null;

                            const client = assignment.clientId ? getClientById(assignment.clientId, clients) : null;
                            const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
                            const employee = getEmployeeById(assignment.employeeId, employees);
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
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="text-sm text-muted-foreground space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {new Date(assignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(assignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                         <div className="space-y-2 border-t pt-4">
                                             {employee && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <span className="font-medium text-foreground">Asignado a: {employee.name} {employee.lastName}</span>
                                                </div>
                                             )}
                                            {client && (
                                                <div className="flex items-center gap-2 pl-6">
                                                    <User className="h-4 w-4 opacity-70" />
                                                    <span>Cliente: {client.firstName} {client.lastName}</span>
                                                </div>
                                            )}
                                            {boats.length > 0 && boats.map(boat => (
                                                <div key={boat.id} className="flex items-center gap-2 pl-12">
                                                    <Ship className="h-4 w-4 opacity-70" />
                                                    <span>{boat.name}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {assignment.selectedExtras && assignment.selectedExtras.length > 0 && (
                                            <div className="space-y-2 pt-4 border-t">
                                                <div className="flex items-center gap-2 font-medium text-foreground">
                                                    <Package className="h-4 w-4 shrink-0" />
                                                    <span>Extras Solicitados:</span>
                                                </div>
                                                <ul className="list-disc pl-11 space-y-1 text-sm text-muted-foreground">
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
                                    </CardContent>
                                    <CardFooter>
                                        <Badge variant="outline" className={cn("font-normal", currentStatus.classes)}>
                                            {currentStatus.icon}
                                            <span className="ml-1.5">{currentStatus.text}</span>
                                        </Badge>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <CalendarDays className="h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No hay tareas para hoy</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Parece que hoy es un día tranquilo. Puedes asignar nuevas tareas desde el calendario.
                        </p>
                    </div>
                )}
            </div>
        </SheetContent>
    );
};
