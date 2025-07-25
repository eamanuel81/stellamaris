
"use client"

import React from 'react';
import Image from "next/image"
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Separator,
    Badge,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Label,
} from "@/components/ui";
import { Assignment, Task, Client, Employee, AssignmentStatus } from "@/lib/data";
import { Clock, User, Ship, DollarSign, Edit, Users, Shield, Tag } from "lucide-react";
import { useAssignments } from '@/hooks/use-assignments';

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id);
const getClientById = (id: string, clients: Client[]) => clients.find(c => c.id === id);
const getEmployeeById = (id: string, employees: Employee[]) => employees.find(e => e.id === id);

const statusOptions: { value: AssignmentStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'completed', label: 'Terminada' },
    { value: 'rejected', label: 'Rechazada' },
    { value: 'cancelled', label: 'Cancelada' },
]

interface AssignmentDetailDialogProps {
    assignmentGroup: Assignment[];
    tasks: Task[];
    clients: Client[];
    employees: Employee[];
    onEdit: () => void;
    setOpen: (open: boolean) => void;
    onStatusChange: (newStatus: AssignmentStatus) => Promise<void>;
}

export const AssignmentDetailDialog = ({
    assignmentGroup,
    tasks,
    clients,
    employees,
    onEdit,
    setOpen,
    onStatusChange
}: AssignmentDetailDialogProps) => {
    const { updateAssignment, refetch } = useAssignments();
    if (!assignmentGroup || assignmentGroup.length === 0) return null;
    const firstAssignment = assignmentGroup[0];
    const [localStatus, setLocalStatus] = React.useState(firstAssignment.status);
    React.useEffect(() => {
        setLocalStatus(firstAssignment.status);
    }, [firstAssignment.status]);

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

    const handleStatusChange = async (newStatus: AssignmentStatus) => {
        setLocalStatus(newStatus);
        await onStatusChange(newStatus);
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{task?.title || "Detalle de la Tarea"}</DialogTitle>
                <DialogDescription>{task?.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                 <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                         <Tag className="h-4 w-4 shrink-0" />
                         <span>Estado</span>
                    </div>
                     <Select value={localStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />
                
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
                
                <div className="grid gap-2">
                    <h4 className="font-semibold text-sm">Personal Asignado</h4>
                     <div className="flex flex-wrap gap-2">
                        {assignedEmployees.map(emp => (
                            <Badge key={emp.id} variant="secondary">{emp.name} {emp.lastName}</Badge>
                        ))}
                    </div>
                </div>

                {client && (
                    <>
                        <Separator />
                        <div className="grid gap-2">
                            <h4 className="font-semibold text-sm">Cliente</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4 shrink-0" />
                                <span>{client.firstName} {client.lastName}</span>
                            </div>
                            {boats.length > 0 && (
                                <div className="pl-6 space-y-3">
                                    {boats.map(boat => (
                                        <div key={boat.id} className="mt-2">
                                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Ship className="h-4 w-4 shrink-0" />
                                                <span>{boat.name}</span>
                                            </div>
                                            {boat.photos && boat.photos.length > 0 && (
                                                <div className="mt-2 grid grid-cols-3 gap-2">
                                                    {boat.photos.map((photo, index) => (
                                                        <Image
                                                            key={index}
                                                            src={photo}
                                                            alt={`Foto de ${boat.name}`}
                                                            width={100}
                                                            height={75}
                                                            data-ai-hint="boat"
                                                            className="rounded-md object-cover aspect-[4/3]"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {client && client.responsibles && client.responsibles.length > 0 && (
                     <>
                        <Separator />
                        <div className="grid gap-2">
                            <h4 className="font-semibold text-sm">Otros Responsables</h4>
                            <div className="space-y-2">
                            {client.responsibles.map(resp => (
                                <div key={resp.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4 shrink-0" />
                                    <div>
                                        <span>{resp.firstName} {resp.lastName}</span>
                                        <span className="text-xs block">DNI: {resp.dni}</span>
                                        <span className="text-xs block">Cel: {resp.phone}</span>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    </>
                )}


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
                    <Button variant="outline" onClick={async () => { await refetch(); setOpen(false); }}>Cerrar</Button>
                    <Button onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}
