
"use client"

import React from "react"
import Link from "next/link"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from "@/components/ui"
import { Employee, Assignment, AssignmentStatus, tasks as allTasks } from "@/lib/data"
import { Calendar, CheckCheck, Check, Hourglass, X, Ban } from "lucide-react"

const statusMap: Record<AssignmentStatus, { text: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { text: 'Pendiente', icon: <Hourglass className="h-3 w-3" />, variant: 'outline' },
    accepted: { text: 'Aceptada', icon: <Check className="h-3 w-3" />, variant: 'secondary' },
    completed: { text: 'Terminada', icon: <CheckCheck className="h-3 w-3" />, variant: 'default' },
    rejected: { text: 'Rechazada', icon: <Ban className="h-3 w-3" />, variant: 'destructive' },
    cancelled: { text: 'Cancelada', icon: <X className="h-3 w-3" />, variant: 'destructive' },
};

const getTaskById = (taskId: string) => {
    // This is inefficient if allTasks is large, but for now it's fine.
    // In a real app, tasks would be loaded from an API or a more direct lookup.
    try {
        const savedTasks = localStorage.getItem('tasks');
        const tasks = savedTasks ? JSON.parse(savedTasks) : allTasks;
        return tasks.find((t: any) => t.id === taskId);
    } catch (e) {
        return allTasks.find(t => t.id === taskId);
    }
}

export const EmployeeTasksDialog = ({
    open,
    setOpen,
    employee,
    assignments,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    employee: Employee;
    assignments: Assignment[];
}) => {

    const sortedAssignments = [...assignments].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tareas Asignadas a {employee.name} {employee.lastName}</DialogTitle>
                    <DialogDescription>
                       Lista de tareas pasadas, presentes y futuras.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto pr-4">
                    {sortedAssignments.length > 0 ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tarea</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAssignments.map(assignment => {
                                    const task = getTaskById(assignment.taskId);
                                    const statusInfo = statusMap[assignment.status] || statusMap.pending;

                                    return (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">{task?.title || "Tarea no encontrada"}</TableCell>
                                            <TableCell>
                                                {new Date(assignment.startTime).toLocaleDateString('es-ES', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusInfo.variant}>
                                                    {statusInfo.icon}
                                                    <span className="ml-1.5">{statusInfo.text}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href="/schedule">
                                                    <Button variant="outline" size="sm">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        Ver en Calendario
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Este empleado no tiene tareas asignadas.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => setOpen(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
