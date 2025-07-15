
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Separator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui"
import { PlusCircle, Clock, User, ChevronDown, Car, Trash2 } from "lucide-react"
import { employees, tasks as initialTasks, assignments as initialAssignments, Assignment, Task } from "@/lib/data"
import { cn } from "@/lib/utils"
import { TaskDialog } from "@/components/task-dialog"

const generateTimeSlots = () => {
  const slots = []
  // from 6 AM to 1 AM next day
  for (let i = 6; i <= 24; i++) {
    slots.push(`${String(i % 24).padStart(2, '0')}:00`)
  }
  slots.push('01:00')
  return slots
}

const getTaskById = (id: string, tasks: Task[]) => tasks.find(t => t.id === id)
const getEmployeeById = (id: string) => employees.find(e => e.id === id)


const groupAssignmentsByTimeAndTask = (assignmentsToGroup: Assignment[]) => {
    const grouped = new Map<string, Assignment[]>();

    assignmentsToGroup.forEach(assignment => {
        const key = `${assignment.taskId}-${assignment.startTime.getTime()}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(assignment);
    });
    
    return Array.from(grouped.values());
}

const DayView = ({ assignments, tasks, onTaskClick }: { assignments: Assignment[], tasks: Task[], onTaskClick: (assignmentGroup: Assignment[]) => void }) => {
    const timeSlots = generateTimeSlots()
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAssignments = assignments.filter(a => {
        const assignmentDate = new Date(a.startTime);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate.getTime() === today.getTime();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const groupedAssignments = groupAssignmentsByTimeAndTask(todayAssignments);

    const getTaskPosition = (startTime: Date) => {
        const startHour = 6;
        const hours = new Date(startTime).getHours() + new Date(startTime).getMinutes() / 60;
        const topPosition = (hours - startHour) * 48; // 48px per hour (h-12)
        return Math.max(0, topPosition);
    }

    const getTaskHeight = (startTime: Date, endTime: Date) => {
        const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);
        const height = (durationMinutes / 60) * 48; // 48px per hour
        return Math.max(24, height - 2); // Subtract 2px for a small gap, min height 24px
    }

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
                                    <div className="h-12 border-b border-dashed"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-0 left-[60px] right-0 bottom-0 pr-4">
                         {groupedAssignments.map((assignmentGroup, index) => {
                            const firstAssignment = assignmentGroup[0];
                            const task = getTaskById(firstAssignment.taskId, tasks);
                            if (!task) return null;

                            const assignedEmployees = assignmentGroup.map(a => getEmployeeById(a.employeeId)).filter(Boolean) as (typeof employees[0])[];
                            const startTime = new Date(firstAssignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const endTime = new Date(firstAssignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const top = getTaskPosition(firstAssignment.startTime);
                            const height = getTaskHeight(firstAssignment.startTime, firstAssignment.endTime);
                            
                            return (
                                <Tooltip key={`${firstAssignment.id}-${index}`}>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => onTaskClick(assignmentGroup)}
                                            className="absolute w-[calc(100%-1rem)] rounded-lg bg-primary/20 p-2 border border-primary/50 cursor-pointer hover:bg-primary/30 z-10"
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                        >
                                            <p className="font-bold text-sm text-primary-foreground truncate">{task.title}</p>
                                            <p className="text-xs text-primary-foreground/80 truncate">{assignedEmployees.map(e => e.name).join(', ')}</p>
                                        </div>
                                    </TooltipTrigger>
                                     <TooltipContent className="max-w-xs">
                                        <div className="space-y-2 p-2">
                                            <h4 className="font-bold">{task.title}</h4>
                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                            <Separator />
                                            <div className="flex items-start gap-2 text-sm">
                                                <User className="h-4 w-4 mt-0.5 shrink-0" />
                                                <span>{assignedEmployees.map(e => `${e.name} ${e.lastName}`).join(', ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 shrink-0" />
                                                <span>{startTime} a {endTime} ({task.duration} min)</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                         })}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

const WeekView = ({ assignments, tasks, onTaskClick }: { assignments: Assignment[], tasks: Task[], onTaskClick: (assignmentGroup: Assignment[]) => void }) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const groupAssignmentsForDay = (day: Date) => {
        const dayAssignments = assignments
            .filter(a => {
                const assignmentDate = new Date(a.startTime);
                assignmentDate.setHours(0,0,0,0);
                const compareDate = new Date(day);
                compareDate.setHours(0,0,0,0);
                return assignmentDate.getTime() === compareDate.getTime();
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        return groupAssignmentsByTimeAndTask(dayAssignments);
    }

    return (
        <TooltipProvider>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="grid grid-cols-7 border-b">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="p-2 text-center border-r last:border-r-0">
                            <p className="font-semibold text-sm">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                            <p className="text-xs text-muted-foreground">{day.toLocaleDateString('es-ES', { day: '2-digit' })}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 h-[600px] overflow-y-auto">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="border-r last:border-r-0 p-2 space-y-2">
                            {groupAssignmentsForDay(day)
                                .map((assignmentGroup, index) => {
                                    const firstAssignment = assignmentGroup[0];
                                    const task = getTaskById(firstAssignment.taskId, tasks);
                                    if (!task) return null;

                                    const assignedEmployees = assignmentGroup.map(a => getEmployeeById(a.employeeId)).filter(Boolean) as (typeof employees[0])[];

                                    const startTime = new Date(firstAssignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const endTime = new Date(firstAssignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <Tooltip key={`${firstAssignment.id}-${index}`}>
                                            <TooltipTrigger asChild>
                                                <Card 
                                                    onClick={() => onTaskClick(assignmentGroup)}
                                                    className="p-2 bg-primary/10 cursor-pointer hover:bg-primary/20"
                                                >
                                                    <p className="font-bold text-xs truncate">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {assignedEmployees.map(e => e.name).join(', ')}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{startTime} - {endTime}</span>
                                                    </div>
                                                </Card>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <div className="space-y-2 p-2">
                                                    <h4 className="font-bold">{task.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                    <Separator />
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <User className="h-4 w-4 mt-0.5 shrink-0" />
                                                        <span>{assignedEmployees.map(e => `${e.name} ${e.lastName}`).join(', ')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-4 w-4 shrink-0" />
                                                        <span>{startTime} a {endTime} ({task.duration} min)</span>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    )
}

const AssignTaskDialogContent = ({ setOpen, onAssignTask, onUpdateTask, onDeleteTask, assignmentToEdit, tasks, onTaskCreated }: { setOpen: (open: boolean) => void; onAssignTask: (newAssignments: Assignment[]) => void; onUpdateTask: (originalAssignments: Assignment[], newAssignmentData: Omit<Assignment, 'id' | 'status'>, newEmployeeIds: string[]) => void; onDeleteTask: (assignmentsToDelete: Assignment[]) => void; assignmentToEdit: Assignment[] | null; tasks: Task[]; onTaskCreated: (task: Task) => void; }) => {
    const isEditMode = !!assignmentToEdit;
    const firstAssignment = isEditMode ? assignmentToEdit[0] : null;

    const [selectedTaskId, setSelectedTaskId] = React.useState<string>(firstAssignment?.taskId || "");
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>(isEditMode ? assignmentToEdit.map(a => a.employeeId) : []);
    const [startTime, setStartTime] = React.useState(firstAssignment? new Date(firstAssignment.startTime).toTimeString().substring(0,5) : "09:00");
    const [endTime, setEndTime] = React.useState(firstAssignment? new Date(firstAssignment.endTime).toTimeString().substring(0,5) : "11:00");
    const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
    
    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    const [date, setDate] = React.useState(firstAssignment ? formatDateForInput(firstAssignment.startTime) : formatDateForInput(new Date()));

    React.useEffect(() => {
        if (isEditMode && assignmentToEdit) {
            const first = assignmentToEdit[0];
            setSelectedTaskId(first.taskId);
            setSelectedEmployees(assignmentToEdit.map(a => a.employeeId));
            setStartTime(new Date(first.startTime).toTimeString().substring(0,5));
            setEndTime(new Date(first.endTime).toTimeString().substring(0,5));
            setDate(formatDateForInput(new Date(first.startTime)));
        } else {
             // Reset form for new assignment
            setSelectedTaskId("");
            setSelectedEmployees([]);
            setStartTime("09:00");
            setEndTime("11:00");
            setDate(formatDateForInput(new Date()));
        }
    }, [assignmentToEdit, isEditMode, open]); // also depend on open to reset

    const handleTaskSelectChange = (taskId: string) => {
        setSelectedTaskId(taskId);
        setSelectedEmployees([]); // Reset employees when task changes
    };

    const handleEmployeeSelect = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    }
    
    const handleSubmit = () => {
        if (!selectedTaskId || selectedEmployees.length === 0) {
            alert("Por favor seleccione una tarea y al menos un empleado.");
            return;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const assignmentDate = new Date(date + 'T00:00:00'); // Use T00:00:00 to avoid timezone issues

        const startDate = new Date(assignmentDate.getTime());
        startDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date(assignmentDate.getTime());
        endDate.setHours(endHour, endMinute, 0, 0);

        const newAssignmentData = {
            taskId: selectedTaskId,
            startTime: startDate,
            endTime: endDate,
        };
        
        if (isEditMode && assignmentToEdit) {
            onUpdateTask(assignmentToEdit, newAssignmentData, selectedEmployees);
        } else {
            const newAssignments = selectedEmployees.map(employeeId => {
                return {
                    id: `a${Date.now()}${Math.random()}`, // simple unique id
                    taskId: selectedTaskId,
                    employeeId: employeeId,
                    startTime: startDate,
                    endTime: endDate,
                    status: 'assigned' as const
                };
            });
            onAssignTask(newAssignments);
        }

        setOpen(false);
    }
    
    const handleDelete = () => {
        if(assignmentToEdit) {
            onDeleteTask(assignmentToEdit);
            setOpen(false);
        }
    }

    const handleTaskCreated = (newTask: Task) => {
        onTaskCreated(newTask);
        setSelectedTaskId(newTask.id); // auto-select the new task
        setIsCreateTaskOpen(false); // Close the creation dialog
    }

    const selectedTask = getTaskById(selectedTaskId, tasks);
    const qualifiedEmployees = selectedTask?.qualifiedEmployeeIds && selectedTask.qualifiedEmployeeIds.length > 0
        ? employees.filter(emp => selectedTask.qualifiedEmployeeIds!.includes(emp.id))
        : employees;


    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{isEditMode ? 'Editar Tarea Asignada' : 'Asignar una nueva tarea'}</DialogTitle>
                <DialogDescription>
                    {isEditMode ? 'Modifique los detalles de la asignación.' : 'Seleccione la tarea, el empleado y el horario.'}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="startTime">Hora de Inicio</Label>
                        <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="endTime">Hora de Fin</Label>
                        <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
            </div>
            <DialogFooter className="sm:justify-between">
                <div>
                     {isEditMode && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive">
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
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Asignar'}</Button>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}


export default function SchedulePage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [assignments, setAssignments] = React.useState<Assignment[]>([])
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [editingAssignmentGroup, setEditingAssignmentGroup] = React.useState<Assignment[] | null>(null);

  const loadInitialData = React.useCallback(() => {
    try {
        // Load tasks
        const savedTasks = localStorage.getItem('tasks');
        setTasks(savedTasks ? JSON.parse(savedTasks) : initialTasks);

        // Load assignments
        const savedAssignments = localStorage.getItem('assignments');
        if (savedAssignments) {
            const parsedAssignments = JSON.parse(savedAssignments, (key, value) => {
                if (key === 'startTime' || key === 'endTime') {
                    return new Date(value);
                }
                return value;
            });
            setAssignments(parsedAssignments);
        } else {
            setAssignments(initialAssignments);
        }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setTasks(initialTasks);
        setAssignments(initialAssignments);
    }
  }, []);

  React.useEffect(() => {
    loadInitialData();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'tasks' || event.key === 'assignments') {
            loadInitialData();
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadInitialData]);


  React.useEffect(() => {
    try {
       localStorage.setItem('assignments', JSON.stringify(assignments));
    } catch (error) {
       console.error("Failed to save assignments to localStorage", error);
    }
  }, [assignments]);


  const handleAssignTask = (newAssignments: Assignment[]) => {
    setAssignments(prev => [...prev, ...newAssignments]);
  }

 const handleUpdateTask = (originalAssignments: Assignment[], newAssignmentData: Omit<Assignment, 'id' | 'status' | 'employeeId'>, newEmployeeIds: string[]) => {
    setAssignments(prev => {
        const originalIds = new Set(originalAssignments.map(a => a.id));
        const filtered = prev.filter(a => !originalIds.has(a.id));

        const newAssignments = newEmployeeIds.map(employeeId => {
            return {
                id: `a${Date.now()}${Math.random()}`,
                taskId: newAssignmentData.taskId,
                employeeId: employeeId,
                startTime: newAssignmentData.startTime,
                endTime: newAssignmentData.endTime,
                status: 'assigned' as const
            };
        });

        return [...filtered, ...newAssignments];
    });

    setEditingAssignmentGroup(null);
}

  const handleDeleteAssignment = (assignmentsToDelete: Assignment[]) => {
      setAssignments(prev => {
          const idsToDelete = new Set(assignmentsToDelete.map(a => a.id));
          return prev.filter(a => !idsToDelete.has(a.id));
      });
      setEditingAssignmentGroup(null);
  }

  const handleTaskClick = (assignmentGroup: Assignment[]) => {
    setEditingAssignmentGroup(assignmentGroup);
    setIsEditOpen(true);
  }

  const handleCloseDialogs = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setTimeout(() => {
       setEditingAssignmentGroup(null);
    }, 200);
  }

  const handleTaskCreated = (newTask: Task) => {
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
     try {
        const newTasksJSON = JSON.stringify(updatedTasks);
        localStorage.setItem('tasks', newTasksJSON);
        window.dispatchEvent(new StorageEvent('storage', { key: 'tasks', newValue: newTasksJSON }));
    } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Asignar Tareas
            </h1>
            <p className="text-muted-foreground">
              Configure el calendario laboral y asigne tareas a los empleados.
            </p>
          </div>
           <Dialog open={isCreateOpen} onOpenChange={open => open ? setIsCreateOpen(true) : handleCloseDialogs()}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingAssignmentGroup(null); setIsCreateOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Asignar Tarea
              </Button>
            </DialogTrigger>
            <AssignTaskDialogContent setOpen={setIsCreateOpen} onAssignTask={handleAssignTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteAssignment} assignmentToEdit={null} tasks={tasks} onTaskCreated={handleTaskCreated} />
          </Dialog>
        </header>

        <Dialog open={isEditOpen} onOpenChange={open => open ? setIsEditOpen(true) : handleCloseDialogs()}>
            <AssignTaskDialogContent setOpen={setIsEditOpen} onAssignTask={handleAssignTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteAssignment} assignmentToEdit={editingAssignmentGroup} tasks={tasks} onTaskCreated={handleTaskCreated} />
        </Dialog>
        
        <Tabs defaultValue="week" className="w-full">
            <div className="flex justify-end">
                <TabsList>
                    <TabsTrigger value="day">Hoy</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="day" className="mt-4">
                <DayView assignments={assignments} tasks={tasks} onTaskClick={handleTaskClick} />
            </TabsContent>
            <TabsContent value="week" className="mt-4">
                <WeekView assignments={assignments} tasks={tasks} onTaskClick={handleTaskClick} />
            </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}
