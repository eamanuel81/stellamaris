
"use client"

import React from 'react';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Separator,
    Badge,
} from "@/components/ui";
import { Assignment, Task, Client, Employee } from "@/lib/data";
import { Clock, User, Ship, DollarSign, Edit, Users } from "lucide-react";

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id);
const getClientById = (id: string, clients: Client[]) => clients.find(c => c.id === id);
const getEmployeeById = (id: string, employees: Employee[]) => employees.find(e => e.id === id);

interface AssignmentDetailDialogProps {
    assignmentGroup: Assignment[];
    tasks: Task[];
    clients: Client[];
    employees: Employee[];
    onEdit: () => void;
    onDelete: () => void;
    setOpen: (open: boolean) => void;
}

export const AssignmentDetailDialog = ({
    assignmentGroup,
    tasks,
    clients,
    employees,
    onEdit,
    onDelete,
    setOpen
}: AssignmentDetailDialogProps) => {

    if (!assignmentGroup || assignmentGroup.length === 0) return null;

    const firstAssignment = assignmentGroup[0];
    const task = getTaskById(firstAssignment.taskId, tasks);
    const client = firstAssignment.clientId ? getClientById(firstAssignment.clientId, clients) : null;
    const boats = client && firstAssignment.boatIds ? client.boats.filter(b => firstAssignment.boatIds?.includes(b.id)) : [];
    const assignedEmployees = assignmentGroup.map(a => getEmployeeById(a.employeeId, employees)).filter(Boolean) as Employee[];

    const calculateExtrasTotal = () => {
        if (!task || !task.extras || !firstAssignment.selectedExtras) return 0;
        return firstAssignment.selectedExtras.reduce((total, selected) => {
            const extraDetails = task.extras!.find(e => e.id === selected.extraId);
            return total + (extraDetails?.price || 0) * selected.quantity;
        }, 0);
    };

    const extrasTotal = calculateExtrasTotal();
    const startTime = new Date(firstAssignment.startTime);
    const endTime = new Date(firstAssignment.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{task?.title || "Detalle de la Tarea"}</DialogTitle>
                <DialogDescription>{task?.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid gap-2">
                    <h4 className="font-semibold text-sm">Horario</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{startTime.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} de {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} a {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                     <div className="text-xs text-muted-foreground pl-6">
                        Duración: {duration} minutos
                    </div>
                </div>

                <Separator />
                
                {client && (
                    <>
                        <div className="grid gap-2">
                            <h4 className="font-semibold text-sm">Cliente</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4 shrink-0" />
                                <span>{client.firstName} {client.lastName}</span>
                            </div>
                            {boats.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                                    <Ship className="h-4 w-4 shrink-0" />
                                    <span>{boats.map(b => b.name).join(', ')}</span>
                                </div>
                            )}
                        </div>
                        <Separator />
                    </>
                )}

                <div className="grid gap-2">
                    <h4 className="font-semibold text-sm">Personal Asignado</h4>
                     <div className="flex flex-wrap gap-2">
                        {assignedEmployees.map(emp => (
                            <Badge key={emp.id} variant="secondary">{emp.name} {emp.lastName}</Badge>
                        ))}
                    </div>
                </div>

                {firstAssignment.selectedExtras && firstAssignment.selectedExtras.length > 0 && (
                     <>
                        <Separator />
                        <div className="grid gap-2">
                            <h4 className="font-semibold text-sm">Extras</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                {firstAssignment.selectedExtras.map(extra => {
                                    const extraInfo = task?.extras?.find(e => e.id === extra.extraId);
                                    if (!extraInfo) return null;
                                    return (
                                        <li key={extra.extraId}>
                                            {extra.quantity}x {extraInfo.name} - {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(extraInfo.price * extra.quantity)}
                                        </li>
                                    )
                                })}
                            </ul>
                            <div className="flex items-center gap-2 text-sm font-bold mt-2">
                                <DollarSign className="h-4 w-4 shrink-0 text-green-600" />
                                <span>Total Extras: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(extrasTotal)}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <DialogFooter className="justify-end pt-4 border-t">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
                    <Button onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}

    