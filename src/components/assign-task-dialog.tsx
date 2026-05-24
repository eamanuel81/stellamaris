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
  DropdownMenuItem,
  Textarea
} from "@/components/ui"
import { PlusCircle, Car, ChevronDown, Trash2, Check, ChevronsUpDown } from "lucide-react"
import { Task, Assignment, Client, TaskExtra, AssignmentStatus } from "@/lib/data"
import { cn, matchesAnySearch, matchesSearch } from "@/lib/utils"
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

export const AssignTaskDialog = ({ setOpen, assignmentToEdit, onDelete, onSave, initialDate }: { setOpen: (open: boolean) => void; assignmentToEdit?: Assignment | null; onDelete?: () => void; onSave?: (assignmentData: any) => Promise<void>; initialDate?: string; }) => {
    const isEditMode = !!assignmentToEdit;
    const { assignments, addAssignment, updateAssignment, deleteAssignment } = useAssignments();
    const { employees, isLoading: employeesLoading, error: employeesError } = useEmployees();
    const { tasks, isLoading: tasksLoading, error: tasksError, addTask } = useTasks();
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
    const [observations, setObservations] = React.useState<string>("");
    const [clientComboOpen, setClientComboOpen] = React.useState(false);
    const [boatComboOpen, setBoatComboOpen] = React.useState(false);
    const [clientSearchQuery, setClientSearchQuery] = React.useState("");
    const [boatSearchQuery, setBoatSearchQuery] = React.useState("");
    const [startTime, setStartTime] = React.useState(() => {
        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        return `${currentHour}:00`;
    });
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
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const formatDateForInput = useCallback((date: Date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const [date, setDate] = React.useState(() => initialDate ? initialDate : formatDateForInput(new Date()));

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

    // Memoizar todas las embarcaciones con información del cliente
    const allBoats = useMemo(() => {
        return clients.flatMap(client => 
            client.boats.map(boat => ({
                ...boat,
                clientId: client.id,
                clientName: `${client.firstName} ${client.lastName}`,
                uniqueKey: `${client.id}-${boat.id}` // Clave única para evitar duplicados
            }))
        );
    }, [clients]);

    // Filtrar clientes basado en la búsqueda
    const filteredClients = useMemo(() => {
        const query = clientSearchQuery.trim();
        if (!query) return clients;
        return clients.filter(client =>
            matchesAnySearch(
                [client.firstName, client.lastName, client.dni, client.email, client.phone],
                query
            )
        );
    }, [clients, clientSearchQuery]);

    // Filtrar embarcaciones basado en la búsqueda y el cliente seleccionado
    const filteredBoats = useMemo(() => {
        // Si hay un cliente seleccionado, solo mostrar sus embarcaciones
        let boatsToFilter = allBoats;
        if (selectedClientId) {
            boatsToFilter = allBoats.filter(boat => boat.clientId === selectedClientId);
        }
        
        // Aplicar filtro de búsqueda si existe
        const query = boatSearchQuery.trim();
        if (!query) return boatsToFilter;
        return boatsToFilter.filter(boat =>
            matchesAnySearch(
                [boat.name, boat.registrationNumber, boat.clientName, boat.hullType],
                query
            )
        );
    }, [allBoats, boatSearchQuery, selectedClientId]);

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
            setObservations(assignmentToEdit.observations || "");
            setIsEndTimeManual(false);
        } else {
            // Limpiar completamente todos los campos cuando NO hay tarea a editar
            setSelectedTaskId("");
            setSelectedEmployees([]);
            setSelectedClientId(undefined);
            setSelectedBoatIds([]);
            setSelectedExtras([]);
            // Establecer hora actual sin minutos (ej: 18:00)
            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            setStartTime(`${currentHour}:00`);
            setEndTime("10:00");
            setDate(initialDate ? initialDate : formatDateForInput(new Date()));
            setStatus('pending');
            setObservations(""); // Limpiar observaciones
            setIsEndTimeManual(false);
            setTimeConflictWarning('');
            setConflictDialogOpen(false);
            setConflictData(null);
            // Limpiar búsquedas
            setClientSearchQuery("");
            setBoatSearchQuery("");
            setClientComboOpen(false);
            setBoatComboOpen(false);
        }
    }, [assignmentToEdit, isEditMode, formatDateForInput, initialDate]);

    // Refs para los inputs de búsqueda
    const clientInputRef = useRef<HTMLInputElement>(null);
    const boatInputRef = useRef<HTMLInputElement>(null);

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
        const newClientId = clientId === "none" ? undefined : clientId;
        setSelectedClientId(newClientId);
        
        // Si cambió el cliente, filtrar solo las embarcaciones que pertenecen al nuevo cliente
        if (newClientId && selectedBoatIds.length > 0) {
            const client = clients.find(c => c.id === newClientId);
            if (client) {
                const clientBoatIds = client.boats.map(b => b.id);
                setSelectedBoatIds(prev => prev.filter(id => clientBoatIds.includes(id)));
            }
        } else if (!newClientId) {
            // Si se deselecciona el cliente, limpiar embarcaciones
            setSelectedBoatIds([]);
        }
    }, [clients, selectedBoatIds]);

    const handleBoatSelect = useCallback((boatId: string) => {
        setSelectedBoatIds(prev =>
            prev.includes(boatId)
                ? prev.filter(id => id !== boatId)
                : [...prev, boatId]
        );
        
        // Buscar el cliente propietario de esta embarcación si no hay cliente seleccionado
        if (!selectedClientId) {
            const ownerClient = clients.find(client => 
                client.boats.some(boat => boat.id === boatId)
            );
            if (ownerClient) {
                setSelectedClientId(ownerClient.id);
            }
        }
    }, [selectedClientId, clients]);

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
    
    // Función para limpiar el formulario
    const handleCancel = useCallback(() => {
        setSelectedTaskId("");
        setSelectedEmployees([]);
        setSelectedClientId(undefined);
        setSelectedBoatIds([]);
        setSelectedExtras([]);
        // Establecer hora actual sin minutos
        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        setStartTime(`${currentHour}:00`);
        setEndTime("10:00");
        setDate(formatDateForInput(new Date()));
        setStatus('pending');
        setObservations(""); // Limpiar observaciones
        setIsEndTimeManual(false);
        setTimeConflictWarning('');
        setConflictDialogOpen(false);
        setConflictData(null);
        // Limpiar búsquedas
        setClientSearchQuery("");
        setBoatSearchQuery("");
        setClientComboOpen(false);
        setBoatComboOpen(false);
        setOpen(false);
    }, [formatDateForInput, setOpen]);
    
    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return; // Prevenir envíos múltiples
        
        if (!selectedTaskId) {
            alert("Por favor seleccione una tarea.");
            return;
        }
        
        setIsSubmitting(true);
        try {
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
                status: status,
                observations: observations?.trim() || undefined
            };

            // Verificar conflictos para edición
            if (selectedEmployees && selectedEmployees.length > 0) {
                for (const employeeId of selectedEmployees) {
                    const { hasConflict } = checkTimeConflicts(employeeId, startDate, endDate, assignmentToEdit.id);
                    if (hasConflict) {
                        handleTimeConflict(employeeId, startDate, endDate, assignmentData, true);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            if (onSave) {
                await onSave(assignmentData);
            } else {
                await updateAssignment(assignmentData);
            }
            // Limpiar formulario después de guardar
            handleCancel();
        } else if (selectedEmployees.length === 0) {
            const assignmentData: any = {
                taskId: selectedTaskId,
                startTime: startDate,
                endTime: endDate,
                clientId: selectedClientId,
                boatIds: selectedBoatIds,
                selectedExtras: selectedExtras.filter(e => e.quantity > 0),
                status: status,
                observations: observations?.trim() || null
            };

            if (onSave) {
                await onSave(assignmentData);
            } else {
                await addAssignment(assignmentData);
            }
            // Limpiar formulario después de guardar
            handleCancel();
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
                status: status,
                observations: observations?.trim() || undefined
            };

            // Verificar conflictos para todos los empleados seleccionados
            for (const employeeId of selectedEmployees) {
                const { hasConflict } = checkTimeConflicts(employeeId, startDate, endDate, undefined);
                if (hasConflict) {
                    handleTimeConflict(employeeId, startDate, endDate, assignmentData, false);
                    setIsSubmitting(false);
                    return;
                }
            }

            if (onSave) {
                await onSave(assignmentData);
            } else {
                const result = await addAssignment(assignmentData);
                if (result.data && !result.error) {
                    // Limpiar formulario después de guardar
                    setTimeout(() => {
                        handleCancel();
                    }, 500);
                }
            }
        }
        } catch (error) {
            console.error('Error al guardar asignación:', error);
            alert('Error al guardar la asignación. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedTaskId, startTime, endTime, date, isEditMode, assignmentToEdit, selectedEmployees, selectedClientId, selectedBoatIds, selectedExtras, status, observations, checkTimeConflicts, getEmployeeById, tasks, onSave, updateAssignment, addAssignment, handleCancel, isSubmitting]);

    const handleTaskCreated = useCallback(async (newTask: Task) => {
        const { id: _id, ...taskDataWithoutId } = newTask;
        const { data, error } = await addTask(taskDataWithoutId as Omit<Task, 'id'>);
        if (error) {
            throw error;
        }
        if (data) {
            setSelectedTaskId(data.id);
            setIsCreateTaskOpen(false);
        }
    }, [addTask]);

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
            }
            // Limpiar formulario después de guardar
            handleCancel();
            } else {
                if (onSave) {
                    await onSave(conflictData.assignmentData);
                } else {
                    const result = await addAssignment(conflictData.assignmentData);
                    if (result.data && !result.error) {
                        // Limpiar formulario después de guardar
                        setTimeout(() => {
                            handleCancel();
                        }, 500);
                    }
                }
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {

              console.error('Error al guardar con conflicto:', error);

            }
        } finally {
            setConflictDialogOpen(false);
            setConflictData(null);
        }
    }, [conflictData, onSave, updateAssignment, addAssignment, handleCancel]);

    return (
        <DialogContent 
            className="sm:max-w-lg"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
        >
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
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setIsCreateTaskOpen(true)}
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
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
                            </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>Cliente (Opcional)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setClientComboOpen(!clientComboOpen)}
                                        className="w-full justify-between font-normal"
                                    >
                                        {selectedClientId
                                            ? clients.find((client) => client.id === selectedClientId)?.firstName + " " + clients.find((client) => client.id === selectedClientId)?.lastName
                                            : "Buscar cliente..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                    {clientComboOpen && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-50" 
                                                onClick={() => setClientComboOpen(false)}
                                            />
                                            <div className="absolute top-full left-0 z-50 mt-1 w-[400px] rounded-md border bg-white shadow-md">
                                                <div className="flex items-center border-b px-3 py-2">
                                                    <Input
                                                        ref={clientInputRef}
                                                        placeholder="Buscar cliente por nombre o DNI..."
                                                        value={clientSearchQuery}
                                                        onChange={(e) => setClientSearchQuery(e.target.value)}
                                                        type="text"
                                                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                                                        autoFocus
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto p-1">
                                                <div 
                                                    className={cn(
                                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                        !selectedClientId && "bg-yellow-100 hover:bg-yellow-200"
                                                    )}
                                                    onClick={() => {
                                                        setSelectedClientId(undefined);
                                                        setSelectedBoatIds([]);
                                                        setClientSearchQuery(""); // Limpiar búsqueda primero
                                                        setClientComboOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            !selectedClientId ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    Ninguno
                                                </div>
                                                    {filteredClients.length === 0 && clientSearchQuery && (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                            No se encontraron clientes.
                                                        </div>
                                                    )}
                                                {filteredClients.map((client) => (
                                                    <div
                                                        key={client.id}
                                                        className={cn(
                                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                            selectedClientId === client.id && "bg-yellow-100 hover:bg-yellow-200"
                                                        )}
                                                        onClick={() => {
                                                            handleClientSelectChange(client.id);
                                                            setClientSearchQuery(""); // Limpiar búsqueda primero
                                                            setClientComboOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{client.firstName} {client.lastName}</span>
                                                            <span className="text-xs text-muted-foreground">DNI: {client.dni}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
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
                        
                        <div className="grid gap-2">
                          <Label>Embarcación(es) (Opcional)</Label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setBoatComboOpen(!boatComboOpen)}
                                    className="w-full justify-between font-normal"
                                >
                                    {selectedBoatIds.length === 0 && (selectedClientId ? `Buscar embarcación de ${selectedClient?.firstName}...` : "Buscar embarcación...")}
                                    {selectedBoatIds.length === 1 && allBoats.find(b => b.id === selectedBoatIds[0])?.name}
                                    {selectedBoatIds.length > 1 && `${selectedBoatIds.length} embarcaciones seleccionadas`}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                {boatComboOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-50" 
                                            onClick={() => setBoatComboOpen(false)}
                                        />
                                        <div className="absolute top-full left-0 z-50 mt-1 w-[400px] rounded-md border bg-white shadow-md">
                                            <div className="flex items-center border-b px-3 py-2">
                                                <Input
                                                    ref={boatInputRef}
                                                    placeholder="Buscar embarcación por nombre o matrícula..."
                                                    value={boatSearchQuery}
                                                    onChange={(e) => setBoatSearchQuery(e.target.value)}
                                                    type="text"
                                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                                                    autoFocus
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {selectedClientId && (
                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
                                                        Mostrando embarcaciones de: <span className="font-medium">{selectedClient?.firstName} {selectedClient?.lastName}</span>
                                                    </div>
                                                )}
                                                {filteredBoats.length === 0 && boatSearchQuery && (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                                        No se encontraron embarcaciones.
                                                    </div>
                                                )}
                                                {filteredBoats.length === 0 && !boatSearchQuery && selectedClientId && (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                                        Este cliente no tiene embarcaciones registradas.
                                                    </div>
                                                )}
                                                {filteredBoats.map((boat) => (
                                                    <div
                                                        key={boat.uniqueKey}
                                                        className={cn(
                                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                            selectedBoatIds.includes(boat.id) && "bg-yellow-100 hover:bg-yellow-200"
                                                        )}
                                                        onClick={() => {
                                                            handleBoatSelect(boat.id);
                                                            setBoatSearchQuery(""); // Limpiar búsqueda al seleccionar
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedBoatIds.includes(boat.id) ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{boat.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {boat.registrationNumber} • Cliente: {boat.clientName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-2 border-t">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        setBoatComboOpen(false);
                                                        setBoatSearchQuery("");
                                                    }}
                                                >
                                                    Listo ({selectedBoatIds.length} seleccionada{selectedBoatIds.length !== 1 ? 's' : ''})
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Mostrar embarcaciones seleccionadas */}
                            {selectedBoatIds.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedBoatIds.map((boatId, index) => {
                                        const boat = allBoats.find(b => b.id === boatId);
                                        return boat ? (
                                            <Badge key={`selected-${boat.uniqueKey}-${index}`} variant="secondary" className="gap-1">
                                                {boat.name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleBoatSelect(boatId)}
                                                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

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
                                            className={cn(selectedEmployees.includes(emp.id) && "bg-yellow-100 data-[highlighted]:bg-yellow-200")}
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

                        <div className="grid gap-2">
                            <Label htmlFor="observations">Observaciones (Opcional)</Label>
                            <Textarea
                                id="observations"
                                placeholder="Agregue observaciones o notas sobre esta tarea..."
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Puede dejar asentado información adicional sobre la tarea
                            </p>
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
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Asignar')}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}