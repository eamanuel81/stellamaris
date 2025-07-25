
"use client"

import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Checkbox,
  DropdownMenuItem
} from "@/components/ui"
import { PlusCircle, Car, ChevronDown, Trash2 } from "lucide-react"
import { Task, Assignment, Client, TaskExtra, AssignmentStatus } from "@/lib/data"
import { cn } from "@/lib/utils"
import { TaskDialog } from "@/components/task-dialog"
import { ClientDialog } from "@/components/client-dialog"
import { useAssignments } from '@/hooks/use-assignments';
import { useEmployees } from '@/hooks/use-employees';
import { useTasks } from '@/hooks/use-tasks';
import { useClients } from '@/hooks/use-clients';

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id)

const statusOptions: { value: AssignmentStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'completed', label: 'Terminada' },
    { value: 'rejected', label: 'Rechazada' },
    { value: 'cancelled', label: 'Cancelada' },
]

export const AssignTaskDialog = ({ setOpen, assignmentToEdit, onDelete, onSave }: { setOpen: (open: boolean) => void; assignmentToEdit?: Assignment | null; onDelete?: () => void; onSave?: (assignmentData: any) => Promise<void>; }) => {
    const isEditMode = !!assignmentToEdit;
    const { assignments, addAssignment, updateAssignment, deleteAssignment } = useAssignments();
    const { employees } = useEmployees();
    const { tasks } = useTasks();
    const { clients, refetch: refetchClients } = useClients();

    // Definir getEmployeeById usando los empleados reales:
    const getEmployeeById = (id: string) => employees.find(e => e.id === id);
    // Definir getClientById usando los clientes reales:
    const getClientById = (id: string) => clients.find(c => c.id === id);

    const firstAssignment = isEditMode ? assignmentToEdit : null;

    const [selectedTaskId, setSelectedTaskId] = React.useState<string>(firstAssignment?.taskId || "");
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>(isEditMode && assignmentToEdit?.employeeId ? assignmentToEdit.employeeId : []);
    const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(firstAssignment?.clientId);
    const [selectedBoatIds, setSelectedBoatIds] = React.useState<string[]>(firstAssignment?.boatIds || []);
    const [selectedExtras, setSelectedExtras] = React.useState<{ extraId: string, quantity: number }[]>(firstAssignment?.selectedExtras || []);
    const [status, setStatus] = React.useState<AssignmentStatus>(firstAssignment?.status || 'pending');
    const [startTime, setStartTime] = React.useState(firstAssignment? new Date(firstAssignment.startTime).toTimeString().substring(0,5) : "09:00");
    const [endTime, setEndTime] = React.useState(firstAssignment? new Date(firstAssignment.endTime).toTimeString().substring(0,5) : "10:00");
    const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
    const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
    const [isEndTimeManual, setIsEndTimeManual] = React.useState(false);
    const [timeConflictWarning, setTimeConflictWarning] = React.useState<string>('');
    
    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    const [date, setDate] = React.useState(firstAssignment ? formatDateForInput(firstAssignment.startTime) : formatDateForInput(new Date()));

    const selectedTask = getTaskById(selectedTaskId, tasks);

    React.useEffect(() => {
        if (isEditMode && assignmentToEdit) {
            setSelectedTaskId(assignmentToEdit.taskId);
            setSelectedEmployees(assignmentToEdit.employeeId || []);
            setSelectedClientId(assignmentToEdit.clientId);
            setSelectedBoatIds(assignmentToEdit.boatIds || []);
            setSelectedExtras(assignmentToEdit.selectedExtras || []);
            setStartTime(new Date(assignmentToEdit.startTime).toTimeString().substring(0,5));
            setEndTime(new Date(assignmentToEdit.endTime).toTimeString().substring(0,5));
            setDate(formatDateForInput(new Date(assignmentToEdit.startTime)));
            setStatus(assignmentToEdit.status);
            setIsEndTimeManual(false); // Reset on edit
        } else {
             // Reset form for new assignment
            setSelectedTaskId("");
            setSelectedEmployees([]);
            setSelectedClientId(undefined);
            setSelectedBoatIds([]);
            setSelectedExtras([]);
            setStartTime("09:00");
            const initialTask = getTaskById("", tasks);
            if (initialTask) {
                const duration = initialTask.duration;
                const newEndTime = new Date(new Date().setHours(9,0) + duration * 60000);
                setEndTime(newEndTime.toTimeString().substring(0,5));
            } else {
                setEndTime("10:00");
            }
            setDate(formatDateForInput(new Date()));
            setStatus('pending');
            setIsEndTimeManual(false);
        }
    }, [assignmentToEdit, isEditMode, tasks]);

     React.useEffect(() => {
        if (!isEndTimeManual && selectedTask && startTime && date) {
            const taskDuration = selectedTask.duration;
            
            const startDate = new Date(`${date}T${startTime}`);
            if (isNaN(startDate.getTime())) return;
            
            const endDate = new Date(startDate.getTime() + taskDuration * 60000);

            const endHour = String(endDate.getHours()).padStart(2, '0');
            const endMinute = String(endDate.getMinutes()).padStart(2, '0');
            
            setEndTime(`${endHour}:${endMinute}`);
        }
    }, [selectedTask, startTime, date, isEndTimeManual]);

    const handleTaskSelectChange = (taskId: string) => {
        setSelectedTaskId(taskId);
        setSelectedEmployees([]); 
        setSelectedExtras([]); 
    };

    const handleEmployeeSelect = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const handleSelectAllEmployees = () => {
        // Si todos están seleccionados, deseleccionar todos
        if (selectedEmployees.length === qualifiedEmployees.length) {
            setSelectedEmployees([]);
        } else {
            // Si no todos están seleccionados, seleccionar todos
            setSelectedEmployees(qualifiedEmployees.map(emp => emp.id));
        }
    };

    const handleClientSelectChange = (clientId: string) => {
        setSelectedClientId(clientId === "none" ? undefined : clientId);
        setSelectedBoatIds([]); 
    };

    const handleBoatSelect = (boatId: string) => {
        setSelectedBoatIds(prev =>
            prev.includes(boatId)
                ? prev.filter(id => id !== boatId)
                : [...prev, boatId]
        );
    }

    const handleExtraQuantityChange = (extraId: string, quantityStr: string) => {
        const quantity = Number(quantityStr);
        if (isNaN(quantity) || quantity < 0) return;

        setSelectedExtras(prev => {
            const existing = prev.find(e => e.extraId === extraId);
            if (existing) {
                if (quantity === 0) {
                    return prev.filter(e => e.extraId !== extraId);
                }
                return prev.map(e => e.extraId === extraId ? { ...e, quantity } : e);
            } else if (quantity > 0) {
                return [...prev, { extraId, quantity }];
            }
            return prev;
        });
    }

    const totalExtrasCost = React.useMemo(() => {
        if (!selectedTask || !selectedTask.extras) return 0;
        return selectedExtras.reduce((total, selected) => {
            const extraDetails = selectedTask.extras?.find(e => e.id === selected.extraId);
            if (!extraDetails) return total;
            return total + (extraDetails.price * selected.quantity);
        }, 0);
    }, [selectedExtras, selectedTask]);
    
    // Verificar conflictos en tiempo real
    const checkRealTimeConflicts = () => {
        if (selectedEmployees.length === 0 || !startTime || !endTime || !date) {
            setTimeConflictWarning('');
            return;
        }
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const assignmentDate = new Date(date + 'T00:00:00');
        const startDate = new Date(assignmentDate.getTime());
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(assignmentDate.getTime());
        endDate.setHours(endHour, endMinute, 0, 0);
        
        const conflicts: string[] = [];
        
        for (const employeeId of selectedEmployees) {
            const { hasConflict, conflictingAssignments } = checkTimeConflicts(employeeId, startDate, endDate, isEditMode && assignmentToEdit ? assignmentToEdit.id : undefined);
            if (hasConflict) {
                const employee = getEmployeeById(employeeId);
                const conflictDetails = conflictingAssignments.map(a => {
                    const task = getTaskById(a.taskId, tasks);
                    const assignmentDate = new Date(a.startTime);
                    return `${task?.title || 'Tarea'} (${assignmentDate.toLocaleDateString()} ${assignmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(a.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                }).join(', ');
                conflicts.push(`${employee?.name} ${employee?.lastName}: ${conflictDetails}`);
            }
        }
        
        if (conflicts.length > 0) {
            setTimeConflictWarning(`⚠️ Conflictos detectados:\n${conflicts.join('\n')}`);
        } else {
            setTimeConflictWarning('');
        }
    };
    
    // Verificar conflictos cuando cambien los horarios o empleados
    React.useEffect(() => {
        checkRealTimeConflicts();
    }, [selectedEmployees, startTime, endTime, date, assignments]);
    
    // Función para validar conflictos de horarios
    const checkTimeConflicts = (employeeId: string, startDate: Date, endDate: Date, excludeAssignmentId?: string): { hasConflict: boolean; conflictingAssignments: Assignment[] } => {
        const conflictingAssignments = assignments.filter(assignment => {
            // Excluir la asignación actual si estamos editando
            if (excludeAssignmentId && assignment.id === excludeAssignmentId) {
                return false;
            }
            
            // Solo verificar asignaciones del mismo empleado
            if (!assignment.employeeId.includes(employeeId)) {
                return false;
            }
            
            // Verificar que las tareas sean del mismo día
            const assignmentStart = new Date(assignment.startTime);
            const assignmentEnd = new Date(assignment.endTime);
            
            // Comparar solo las fechas (sin considerar la hora)
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const assignmentStartOnly = new Date(assignmentStart.getFullYear(), assignmentStart.getMonth(), assignmentStart.getDate());
            
            // Si no es el mismo día, no hay conflicto
            if (startDateOnly.getTime() !== assignmentStartOnly.getTime()) {
                return false;
            }
            
            // Si es el mismo día, verificar si hay solapamiento de horarios
            // Hay conflicto si:
            // 1. La nueva tarea empieza durante una tarea existente
            // 2. La nueva tarea termina durante una tarea existente
            // 3. La nueva tarea contiene completamente una tarea existente
            return (
                (startDate >= assignmentStart && startDate < assignmentEnd) ||
                (endDate > assignmentStart && endDate <= assignmentEnd) ||
                (startDate <= assignmentStart && endDate >= assignmentEnd)
            );
        });
        
        return {
            hasConflict: conflictingAssignments.length > 0,
            conflictingAssignments
        };
    };
    
    const handleSubmit = async () => {
        if (!selectedTaskId) {
            alert("Por favor seleccione una tarea.");
            return;
        }
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const assignmentDate = new Date(date + 'T00:00:00');
        const startDate = new Date(assignmentDate.getTime());
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(assignmentDate.getTime());
        endDate.setHours(endHour, endMinute, 0, 0);
        

        
        if (isEditMode && assignmentToEdit) {
            // Editar una sola asignación
            const assignmentData = {
                id: assignmentToEdit.id,
                taskId: selectedTaskId,
                employeeId: selectedEmployees.slice(), // Usar los empleados seleccionados actualmente
                startTime: startDate,
                endTime: endDate,
                clientId: selectedClientId,
                boatIds: selectedBoatIds,
                selectedExtras: selectedExtras.filter(e => e.quantity > 0),
                status: status
            };
            
            // Validar conflictos para edición
            if (selectedEmployees && selectedEmployees.length > 0) {
                // Verificar conflictos para cada empleado seleccionado actualmente
                for (const employeeId of selectedEmployees) {
                    const { hasConflict, conflictingAssignments } = checkTimeConflicts(employeeId, startDate, endDate, assignmentToEdit.id);
                    if (hasConflict) {
                        const employee = getEmployeeById(employeeId);
                        const conflictDetails = conflictingAssignments.map(a => {
                            const task = getTaskById(a.taskId, tasks);
                            const assignmentDate = new Date(a.startTime);
                            return `• ${task?.title || 'Tarea'} (${assignmentDate.toLocaleDateString()} ${assignmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(a.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                        }).join('\n');
                        
                        alert(`El empleado ${employee?.name} ${employee?.lastName} tiene un conflicto de horario con las siguientes asignaciones:\n\n${conflictDetails}\n\nNo se puede guardar la edición.`);
                        return;
                    }
                }
            }
            

            if (onSave) {
                await onSave(assignmentData);
            } else {
                await updateAssignment(assignmentData);
                setOpen(false);
            }
        } else if (selectedEmployees.length === 0) {
            // Permitir asignaciones sin empleado (no incluir employeeId)
            const assignmentData: any = {
                taskId: selectedTaskId,
                startTime: startDate,
                endTime: endDate,
                clientId: selectedClientId,
                boatIds: selectedBoatIds,
                selectedExtras: selectedExtras.filter(e => e.quantity > 0),
                status: status
            };

            if (onSave) {
                await onSave(assignmentData);
            } else {
                await addAssignment(assignmentData);
                setOpen(false);
            }
        } else {
            // Crear una sola asignación con múltiples empleados
            // Verificar conflictos para todos los empleados seleccionados
            for (const employeeId of selectedEmployees) {
                const { hasConflict, conflictingAssignments } = checkTimeConflicts(employeeId, startDate, endDate, undefined);
                if (hasConflict) {
                    const employee = getEmployeeById(employeeId);
                    const conflictDetails = conflictingAssignments.map(a => {
                        const task = getTaskById(a.taskId, tasks);
                        const assignmentDate = new Date(a.startTime);
                        return `• ${task?.title || 'Tarea'} (${assignmentDate.toLocaleDateString()} ${assignmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(a.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                    }).join('\n');
                    
                    alert(`El empleado ${employee?.name} ${employee?.lastName} tiene un conflicto de horario con las siguientes asignaciones:\n\n${conflictDetails}\n\nNo se puede asignar esta tarea.`);
                    return; // Salir si hay un conflicto
                }
            }
            
            // Si no hay conflictos, crear una sola asignación con todos los empleados
            const assignmentData = {
                taskId: selectedTaskId,
                employeeId: selectedEmployees.slice(), // Crear una copia del array para evitar referencias
                startTime: startDate,
                endTime: endDate,
                clientId: selectedClientId,
                boatIds: selectedBoatIds,
                selectedExtras: selectedExtras.filter(e => e.quantity > 0),
                status: status
            };

            if (onSave) {
                await onSave(assignmentData);
            } else {
                const result = await addAssignment(assignmentData);
                if (result.data && !result.error) {
                    // Esperar un poco para que se complete el refresh
                    setTimeout(() => {
                        setOpen(false);
                    }, 500);
                }
            }
        }
    };

    const handleTaskCreated = (newTask: Task) => {
        // onTaskCreated(newTask); // This was removed from props
        setSelectedTaskId(newTask.id); 
        setIsCreateTaskOpen(false); 
    }

    const handleClientCreated = async (newClient: Client) => {
        await refetchClients();
        setSelectedClientId(newClient.id); 
        setIsCreateClientOpen(false); 
    }

    const qualifiedEmployees = selectedTask?.qualifiedEmployeeIds && selectedTask.qualifiedEmployeeIds.length > 0
        ? employees.filter(emp => selectedTask.qualifiedEmployeeIds!.includes(emp.id))
        : employees;
    
    const selectedClient = selectedClientId ? getClientById(selectedClientId) : null;
    const hasExtras = selectedTask && selectedTask.extras && selectedTask.extras.length > 0;

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{isEditMode ? 'Editar Tarea Asignada' : 'Asignar una nueva tarea'}</DialogTitle>
                <DialogDescription>
                    {isEditMode ? 'Modifique los detalles de la asignación.' : 'Seleccione la tarea, el empleado y el horario.'}
                </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className={cn("grid w-full", hasExtras ? "grid-cols-2" : "grid-cols-1")}>
                    <TabsTrigger value="general">General</TabsTrigger>
                    {hasExtras && <TabsTrigger value="extras">Extras</TabsTrigger>}
                </TabsList>
                <TabsContent value="general">
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task">Tarea</Label>
                            <div className="flex gap-2">
                                <Select value={selectedTaskId} onValueChange={handleTaskSelectChange}>
                                    <SelectTrigger id="task">
                                        <SelectValue placeholder="Seleccione una tarea" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tasks.map(task => (
                                            <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon">
                                                        <PlusCircle className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>Crear nueva tarea</TooltipContent>
                                        </Tooltip>
                                     </TooltipProvider>
                                    <TaskDialog
                                        open={isCreateTaskOpen}
                                        setOpen={setIsCreateTaskOpen}
                                        onTaskSave={handleTaskCreated}
                                        taskToEdit={null}
                                    />
                                </Dialog>
                            </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>Cliente (Opcional)</Label>
                            <div className="flex gap-2">
                                <Select value={selectedClientId} onValueChange={handleClientSelectChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguno</SelectItem>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.firstName} {client.lastName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon">
                                                        <PlusCircle className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>Crear nuevo cliente</TooltipContent>
                                        </Tooltip>
                                     </TooltipProvider>
                                    <ClientDialog
                                        open={isCreateClientOpen}
                                        setOpen={setIsCreateClientOpen}
                                        onSave={handleClientCreated}
                                        clientToEdit={null}
                                    />
                                </Dialog>
                            </div>
                        </div>
                        
                         {selectedClient && (
                            <div className="grid gap-2">
                                <Label>Embarcacion(es)</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex justify-between items-center font-normal">
                                            <span className="truncate">
                                                {selectedBoatIds.length === 0 && "Seleccione embarcaciones"}
                                                {selectedBoatIds.length === 1 && selectedClient.boats.find(b => b.id === selectedBoatIds[0])?.name}
                                                {selectedBoatIds.length > 1 && `${selectedBoatIds.length} embarcaciones seleccionadas`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                        <DropdownMenuLabel>Embarcaciones de {selectedClient.firstName}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {selectedClient.boats.map(boat => (
                                            <DropdownMenuCheckboxItem
                                                key={boat.id}
                                                checked={selectedBoatIds.includes(boat.id)}
                                                onSelect={(e) => e.preventDefault()}
                                                onCheckedChange={() => handleBoatSelect(boat.id)}
                                            >
                                                {boat.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        <div className="grid gap-2">
                          <Label>Empleado(s)</Label>
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="flex justify-between items-center font-normal" disabled={!selectedTaskId}>
                                        <span className="truncate">
                                            {selectedEmployees.length === 0 && "Seleccione empleados"}
                                            {selectedEmployees.length === 1 && getEmployeeById(selectedEmployees[0])?.name + ' ' + getEmployeeById(selectedEmployees[0])?.lastName}
                                            {selectedEmployees.length > 1 && `${selectedEmployees.length} empleados seleccionados`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                     {qualifiedEmployees.length > 0 ? (
                                        <>
                                            <DropdownMenuCheckboxItem
                                                checked={selectedEmployees.length === qualifiedEmployees.length && qualifiedEmployees.length > 0}
                                                onSelect={(e) => e.preventDefault()}
                                                onCheckedChange={handleSelectAllEmployees}
                                            >
                                                {selectedEmployees.length === qualifiedEmployees.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    ) : (
                                        <DropdownMenuItem disabled>No hay empleados cualificados para esta tarea.</DropdownMenuItem>
                                    )}
                                     {qualifiedEmployees.length > 0 ? qualifiedEmployees.map(emp => (
                                        <DropdownMenuCheckboxItem
                                            key={emp.id}
                                            checked={selectedEmployees.includes(emp.id)}
                                            onSelect={(e) => e.preventDefault()}
                                            onCheckedChange={() => handleEmployeeSelect(emp.id)}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>{emp.name} {emp.lastName}</span>
                                                {emp.canDrive && <Car className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </DropdownMenuCheckboxItem>
                                    )) : (
                                        <DropdownMenuItem disabled>No hay empleados cualificados para esta tarea.</DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedEmployees.map(id => {
                                    const emp = getEmployeeById(id);
                                    return emp ? <Badge key={id} variant="secondary">{emp.name} {emp.lastName}</Badge> : null;
                                })}
                            </div>
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Hora de Inicio</Label>
                                <Input id="startTime" type="time" value={startTime} onChange={e => {setStartTime(e.target.value); setIsEndTimeManual(false);}} disabled={!selectedTaskId} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">Hora de Fin (auto)</Label>
                                <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!isEndTimeManual} />
                            </div>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="manualEndTime" 
                                checked={isEndTimeManual} 
                                onCheckedChange={(checked) => setIsEndTimeManual(Boolean(checked))}
                                disabled={!selectedTaskId}
                            />
                            <Label htmlFor="manualEndTime" className="text-sm font-normal text-muted-foreground">
                                Editar hora de fin manualmente
                            </Label>
                        </div>
                        
                        {/* Advertencia de conflictos de horario */}
                        {timeConflictWarning && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800 whitespace-pre-line">
                                    {timeConflictWarning}
                                </p>
                            </div>
                        )}
                        
                        <div className="grid gap-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={status} onValueChange={(value: AssignmentStatus) => setStatus(value)}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Seleccione un estado" />
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
                    </div>
                </TabsContent>
                {hasExtras && (
                    <TabsContent value="extras">
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="space-y-4">
                                {selectedTask.extras!.map((extra: TaskExtra) => {
                                    const currentQuantity = selectedExtras.find(se => se.extraId === extra.id)?.quantity || 0;
                                    const subtotal = (extra.price || 0) * currentQuantity;
                                    return (
                                        <div key={extra.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                                            <div>
                                                <Label htmlFor={`extra-${extra.id}`}>{extra.name}</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(extra.price || 0)} c/u
                                                </p>
                                            </div>
                                            <Input
                                                id={`extra-${extra.id}`}
                                                type="number"
                                                min="0"
                                                value={currentQuantity}
                                                onChange={(e) => handleExtraQuantityChange(extra.id, e.target.value)}
                                                className="w-24"
                                                placeholder="0"
                                            />
                                            <div className="w-28 text-right font-medium">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(subtotal)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                             {totalExtrasCost > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between items-center font-bold text-lg">
                                        <span>Total de Extras:</span>
                                        <span>
                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalExtrasCost)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <DialogFooter className="sm:justify-between pt-4 border-t">
                 {isEditMode && onDelete && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la asignación de esta tarea.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
                 {!isEditMode && <div></div>}
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Asignar'}</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}
