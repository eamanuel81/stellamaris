
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui";
import { Assignment, Task, Client, AssignmentStatus } from "@/lib/data";
import { Clock, User, Ship, Package, ChevronDown, Check, Ban, Hourglass, CheckCheck } from "lucide-react";
import Image from "next/image";

interface MyTaskDetailDialogProps {
    assignment: Assignment;
    task: Task;
    client: Client | null;
    onStatusChange: (newStatus: AssignmentStatus) => void;
    setOpen: (open: boolean) => void;
}

export const MyTaskDetailDialog = ({
    assignment,
    task,
    client,
    onStatusChange,
    setOpen
}: MyTaskDetailDialogProps) => {

    if (!assignment || !task) return null;

    const boats = client && assignment.boatIds ? client.boats.filter(b => assignment.boatIds?.includes(b.id)) : [];
    
    const startTime = new Date(assignment.startTime);
    const endTime = new Date(assignment.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{task.title}</DialogTitle>
                <DialogDescription>{task.description}</DialogDescription>
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

                {assignment.selectedExtras && assignment.selectedExtras.length > 0 && (
                     <>
                        <Separator />
                        <div className="grid gap-2">
                            <h4 className="font-semibold text-sm">Extras Solicitados</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                {assignment.selectedExtras.map(extra => {
                                    const extraInfo = task?.extras?.find(e => e.id === extra.extraId);
                                    if (!extraInfo) return null;
                                    return (
                                        <li key={extra.extraId}>
                                            {extra.quantity}x {extraInfo.name}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </>
                )}
            </div>

            <DialogFooter className="sm:justify-between pt-4 border-t">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                        Cambiar Estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={assignment.status === 'accepted'} onClick={() => onStatusChange('accepted')}>
                            <Check className="mr-2 h-4 w-4" />
                            Aceptar Tarea
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={assignment.status === 'completed'} onClick={() => onStatusChange('completed')}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Marcar como Terminada
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange('rejected')}>
                             <Ban className="mr-2 h-4 w-4" />
                            Rechazar Tarea
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={assignment.status === 'pending'} onClick={() => onStatusChange('pending')}>
                             <Hourglass className="mr-2 h-4 w-4" />
                            Marcar como Pendiente
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
    )
}
