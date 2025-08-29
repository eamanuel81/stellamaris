"use client"

import React, { useMemo, useCallback, useRef } from "react"
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

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Componentes memoizados para inputs pesados
const OptimizedInput = React.memo(({ 
  value, 
  onChange, 
  debounceMs = 0,
  ...props 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  debounceMs?: number;
  [key: string]: any; 
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  // Sincronizar el valor debounced con el onChange parent
  React.useEffect(() => {
    if (debouncedValue !== value && debounceMs > 0) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value, debounceMs]);

  // Sincronizar cuando el valor externo cambia
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Si no hay debounce, actualizar inmediatamente
    if (debounceMs === 0) {
      onChange(newValue);
    }
  }, [onChange, debounceMs]);

  return <Input {...props} value={localValue} onChange={handleChange} />;
});

OptimizedInput.displayName = 'OptimizedInput';

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
    const { employees, isLoading: employeesLoading, error: employeesError } = useEmployees();
    const { tasks, isLoading: tasksLoading, error: tasksError } = useTasks();
    const { clients, refetch: refetchClients } = useClients();

    // Memoizar funciones de búsqueda
    const getEmployeeById = useCallback((id: string) => employees.find(e => e.id === id), [employees]);
    const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);

    const [selectedTaskId, setSelectedTaskId] = React.useState<string>("");
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
    const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(undefined);
    const [selectedBoatIds, setSelectedBoatIds] = React.useState<string[]>([]);
    const [selectedExtras, setSelectedExtras] = React.useState<{ extraId: string, quantity: number }[]>([]);
    const [status, setStatus] = React.useState<AssignmentStatus>('pending');
    const [startTime, setStartTime] = React.useState("09:00");
    const [endTime, setEndTime] = React.useState("10:00");
    const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
    const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
    const [isEndTimeManual, setIsEndTimeManual] = React.useState(false);
    const [timeConflictWarning, setTimeConflictWarning] = React.useState<string>('');
    const [conflictDialogOpen, setConflictDialogOpen] = React.useState(false);
    const [conflictData, setConflictData] = React.useState<{
        employeeName: string;
        conflictDetails: string;
        assignmentData: any;
        isEdit: boolean;
    } | null>(null);
    
    const formatDateForInput = useCallback((date: Date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const [date, setDate] = React.useState(formatDateForInput(new Date()));

    // Memoizar tarea seleccionada
    const selectedTask = useMemo(() => getTaskById(selectedTaskId, tasks), [selectedTaskId, tasks]);

    // Memoizar empleados cualificados
    const qualifiedEmployees = useMemo(() => {
        return selectedTask?.qualifiedEmployeeIds && selectedTask.qualifiedEmployeeIds.length > 0
            ? employees.filter(emp => selectedTask.qualifiedEmployeeIds!.includes(emp.id))
            : employees;
    }, [selectedTask, employees]);

    // Memoizar cliente seleccionado
    const selectedClient = useMemo(() => 
        selectedClientId ? getClientById(selectedClientId) : null, 
        [selectedClientId, getClientById]
    );

    // Memoizar costo total de extras
    const totalExtrasCost = useMemo(() => {
        if (!selectedTask || !selectedTask.extras) return 0;
        return selectedExtras.reduce((total, selected) => {
            const extraDetails = selectedTask.extras?.find(e => e.id === selected.extraId);
            if (!extraDetails) return total;
            return total + (extraDetails.price * selected.quantity);
        }, 0);
    }, [selectedExtras, selectedTask]);

    const hasExtras = useMemo(() => 
        selectedTask && selectedTask.extras && selectedTask.extras.length > 0, 
        [selectedTask]
    );

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
            setIsEndTimeManual(false);
        } else {
            // Limpiar completamente todos los campos
            setSelectedTaskId("");
            setSelectedEmployees([]);
            setSelectedClientId(undefined);
            setSelectedBoatIds([]);
            setSelectedExtras([]);
            setStartTime("09:00");
            setEndTime("10:00");
            setDate(formatDateForInput(new Date()));
            setStatus('pending');
            setIsEndTimeManual(false);
            setTimeConflictWarning('');
            setConflictDialogOpen(false);
            setConflictData(null);
        }
    }, [assignmentToEdit, isEditMode, formatDateForInput]);

    // Debounce para el cálculo automático de hora de fin
    const debouncedStartTime = useDebounce(startTime, 300);
    const debouncedDate = useDebounce(date, 300);

        // Calcular hora de fin automáticamente cuando cambia la tarea o la hora de inicio
    React.useEffect(() => {
        if (!isEndTimeManual && selectedTask && startTime && date && selectedTaskId) {
            const taskDuration = selectedTask.duration;
            
            const startDate = new Date(`${date}T${startTime}`);
            if (isNaN(startDate.getTime())) return;
            
            const endDate = new Date(startDate.getTime() + taskDuration * 60000);

            const endHour = String(endDate.getHours()).padStart(2, '0');
            const endMinute = String(endDate.getMinutes()).padStart(2, '0');
            
                         const newEndTime = `${endHour}:${endMinute}`;
             setEndTime(newEndTime);
        }
    }, [selectedTask, startTime, date, isEndTimeManual, selectedTaskId]);

    

    // Handlers memoizados
    const handleTaskSelectChange = useCallback((taskId: string) => {
        setSelectedTaskId(taskId);
        setSelectedEmployees([]); 
        setSelectedExtras([]); 
    }, []);

    const handleEmployeeSelect = useCallback((employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    }, []);

    const handleSelectAllEmployees = useCallback(() => {
        if (selectedEmployees.length === qualifiedEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(qualifiedEmployees.map(emp => emp.id));
        }
    }, [selectedEmployees.length, qualifiedEmployees]);

    const handleClientSelectChange = useCallback((clientId: string) => {
        setSelectedClientId(clientId === "none" ? undefined : clientId);
        setSelectedBoatIds([]); 
    }, []);

    const handleBoatSelect = useCallback((boatId: string) => {
        setSelectedBoatIds(prev =>
            prev.includes(boatId)
                ? prev.filter(id => id !== boatId)
                : [...prev, boatId]
        );
    }, []);

    const handleExtraQuantityChange = useCallback((extraId: string, quantityStr: string) => {
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
    }, []);

    // Función para validar conflictos de horarios - memoizada
    const checkTimeConflicts = useCallback((employeeId: string, startDate: Date, endDate: Date, excludeAssignmentId?: string): { hasConflict: boolean; conflictingAssignments: Assignment[] } => {
        const conflictingAssignments = assignments.filter(assignment => {
            if (excludeAssignmentId && assignment.id === excludeAssignmentId) {
                return false;
            }
            
            if (!assignment.employeeId.includes(employeeId)) {
                return false;
            }
            
            const assignmentStart = new Date(assignment.startTime);
            const assignmentEnd = new Date(assignment.endTime);
            
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const assignmentStartOnly = new Date(assignmentStart.getFullYear(), assignmentStart.getMonth(), assignmentStart.getDate());
            
            if (startDateOnly.getTime() !== assignmentStartOnly.getTime()) {
                return false;
            }
            
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
    }, [assignments]);
    
    // Verificar conflictos en tiempo real - debounced
    const debouncedEmployees = useDebounce(selectedEmployees, 500);
    const debouncedEndTime = useDebounce(endTime, 500);

    const checkRealTimeConflicts = useCallback(() => {
        if (debouncedEmployees.length === 0 || !debouncedStartTime || !debouncedEndTime || !debouncedDate) {
            setTimeConflictWarning('');
            return;
        }
        
        const [startHour, startMinute] = debouncedStartTime.split(':').map(Number);
        const [endHour, endMinute] = debouncedEndTime.split(':').map(Number);
        const assignmentDate = new Date(debouncedDate + 'T00:00:00');
        const startDate = new Date(assignmentDate.getTime());
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(assignmentDate.getTime());
        endDate.setHours(endHour, endMinute, 0, 0);
        
        const conflicts: string[] = [];
        
        for (const employeeId of debouncedEmployees) {
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
    }, [debouncedEmployees, debouncedStartTime, debouncedEndTime, debouncedDate, checkTimeConflicts, isEditMode, assignmentToEdit, getEmployeeById, tasks]);
    
    React.useEffect(() => {
        checkRealTimeConflicts();
    }, [checkRealTimeConflicts]);
    
    const handleSubmit = useCallback(async () => {
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
            const assignmentData = {
                id: assignmentToEdit.id,
                taskId: selectedTaskId,
                employeeId: selectedEmployees.slice(),
                startTime: startDate,
                endTime: endDate,
                clientId: selectedClientId,
                boatIds: selectedBoatIds,
                selectedExtras: selectedExtras.filter(e => e.quantity > 0),
                status: status
            };
            
            // Verificar conflictos para edición
            if (selectedEmployees && selectedEmployees.length > 0) {
                for (const employeeId of selectedEmployees) {
                    const { hasConflict } = checkTimeConflicts(employeeId, startDate, endDate, assignmentToEdit.id);
                    if (hasConflict) {
                        handleTimeConflict(employeeId, startDate, endDate, assignmentData, true);
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
            // Definir assignmentData antes de verificar conflictos
            const assignmentData = {
                taskId: selectedTaskId,
                employeeId: selectedEmployees.slice(),
                startTime: startDate,
                endTime: endDate,
                clientId: selectedClientId,
                boatIds: selectedBoatIds,
                selectedExtras: selectedExtras.filter(e => e.quantity > 0),
                status: status
            };

            // Verificar conflictos para todos los empleados seleccionados
            for (const employeeId of selectedEmployees) {
                const { hasConflict } = checkTimeConflicts(employeeId, startDate, endDate, undefined);
                if (hasConflict) {
                    handleTimeConflict(employeeId, startDate, endDate, assignmentData, false);
                    return;
                }
            }

            if (onSave) {
                await onSave(assignmentData);
            } else {
                const result = await addAssignment(assignmentData);
                if (result.data && !result.error) {
                    setTimeout(() => {
                        setOpen(false);
                    }, 500);
                }
            }
        }
    }, [selectedTaskId, startTime, endTime, date, isEditMode, assignmentToEdit, selectedEmployees, selectedClientId, selectedBoatIds, selectedExtras, status, checkTimeConflicts, getEmployeeById, tasks, onSave, updateAssignment, setOpen, addAssignment]);

    const handleTaskCreated = useCallback((newTask: Task) => {
        setSelectedTaskId(newTask.id); 
        setIsCreateTaskOpen(false); 
    }, []);

    const handleClientCreated = useCallback(async (newClient: Client) => {
        await refetchClients();
        setSelectedClientId(newClient.id); 
        setIsCreateClientOpen(false); 
    }, [refetchClients]);

    // Función para manejar conflictos de tiempo
    const handleTimeConflict = useCallback((employeeId: string, startDate: Date, endDate: Date, assignmentData: any, isEdit: boolean) => {
        const { conflictingAssignments } = checkTimeConflicts(employeeId, startDate, endDate, isEdit && assignmentToEdit ? assignmentToEdit.id : undefined);
        const employee = getEmployeeById(employeeId);
        
        const conflictDetails = conflictingAssignments.map(a => {
            const task = getTaskById(a.taskId, tasks);
            const assignmentDate = new Date(a.startTime);
            return `• ${task?.title || 'Tarea'} (${assignmentDate.toLocaleDateString()} ${assignmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(a.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
        }).join('\n');

        setConflictData({
            employeeName: `${employee?.name} ${employee?.lastName}`,
            conflictDetails,
            assignmentData,
            isEdit
        });
        setConflictDialogOpen(true);
    }, [checkTimeConflicts, getEmployeeById, tasks, assignmentToEdit]);

    // Función para confirmar y guardar a pesar del conflicto
    const handleConfirmConflict = useCallback(async () => {
        if (!conflictData) return;
        
        try {
            if (conflictData.isEdit) {
                if (onSave) {
                    await onSave(conflictData.assignmentData);
                } else {
                    await updateAssignment(conflictData.assignmentData);
                    setOpen(false);
                }
            } else {
                if (onSave) {
                    await onSave(conflictData.assignmentData);
                } else {
                    const result = await addAssignment(conflictData.assignmentData);
                    if (result.data && !result.error) {
                        setTimeout(() => {
                            setOpen(false);
                        }, 500);
                    }
                }
            }
        } catch (error) {
            console.error('Error al guardar con conflicto:', error);
        } finally {
            setConflictDialogOpen(false);
            setConflictData(null);
        }
    }, [conflictData, onSave, updateAssignment, addAssignment, setOpen]);

    // Función para limpiar el formulario
    const handleCancel = useCallback(() => {
        setSelectedTaskId("");
        setSelectedEmployees([]);
        setSelectedClientId(undefined);
        setSelectedBoatIds([]);
        setSelectedExtras([]);
        setStartTime("09:00");
        setEndTime("10:00");
        setDate(formatDateForInput(new Date()));
        setStatus('pending');
        setIsEndTimeManual(false);
        setTimeConflictWarning('');
        setConflictDialogOpen(false);
        setConflictData(null);
        setOpen(false);
    }, [formatDateForInput, setOpen]);

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
                                    <Button variant="outline" className="flex justify-between items-center font-normal">
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
                            <OptimizedInput 
                                id="date" 
                                type="date" 
                                value={date} 
                                onChange={setDate}
                                debounceMs={300}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Hora de Inicio</Label>
                                <OptimizedInput 
                                    id="startTime" 
                                    type="time" 
                                    value={startTime} 
                                    onChange={(value) => {
                                        setStartTime(value); 
                                        setIsEndTimeManual(false);
                                    }}
                                    disabled={!selectedTaskId}
                                    debounceMs={300}
                                />
                            </div>
                                                         <div className="grid gap-2">
                                 <Label htmlFor="endTime">Hora de Fin (auto)</Label>
                                 <Input 
                                     id="endTime" 
                                     type="time" 
                                     value={endTime} 
                                     onChange={(e) => setEndTime(e.target.value)}
                                     disabled={!isEndTimeManual}
                                 />
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
                                {selectedTask!.extras!.map((extra: TaskExtra) => {
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
                                            <OptimizedInput
                                                id={`extra-${extra.id}`}
                                                type="number"
                                                min="0"
                                                value={currentQuantity.toString()}
                                                onChange={(value) => handleExtraQuantityChange(extra.id, value)}
                                                className="w-24"
                                                placeholder="0"
                                                debounceMs={500}
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

            {/* Diálogo de confirmación de conflictos */}
            <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>⚠️ Conflicto de Horario Detectado</DialogTitle>
                        <DialogDescription>
                            El empleado <strong>{conflictData?.employeeName}</strong> ya tiene tareas asignadas en este horario.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-2">Tareas existentes:</h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <pre className="text-sm text-yellow-800 whitespace-pre-line font-mono">
                                    {conflictData?.conflictDetails}
                                </pre>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ¿Desea continuar y asignar esta tarea de todas formas? 
                            Esto puede resultar en que el empleado tenga múltiples tareas simultáneas.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmConflict} className="bg-amber-600 hover:bg-amber-700">
                            Continuar con Conflicto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                    <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Asignar'}</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}