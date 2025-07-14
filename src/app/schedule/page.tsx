
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Separator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui"
import { PlusCircle, Clock, User, ChevronDown, Car } from "lucide-react"
import { employees, tasks, assignments as initialAssignments, Assignment } from "@/lib/data"
import { cn } from "@/lib/utils"

const generateTimeSlots = () => {
  const slots = []
  // from 6 AM to 1 AM next day
  for (let i = 6; i <= 24; i++) {
    slots.push(`${String(i % 24).padStart(2, '0')}:00`)
  }
  slots.push('01:00')
  return slots
}

const getTaskById = (id: string) => tasks.find(t => t.id === id)
const getEmployeeById = (id: string) => employees.find(e => e.id === id)

const DayView = () => {
    const timeSlots = generateTimeSlots()
    return (
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
                        <div className="h-12 border-b border-dashed">
                            {/* Example Tasks */}
                            {time === "09:00" && (
                            <div className="relative -top-1 h-[6rem] z-10">
                                <div className="absolute w-[calc(100%-1rem)] rounded-lg bg-primary/20 p-2 border border-primary/50">
                                <p className="font-bold text-sm text-primary-foreground">Bajada de Lancha</p>
                                <p className="text-xs text-primary-foreground/80">Carlos Rodriguez</p>
                                </div>
                            </div>
                            )}
                            {time === "11:00" && (
                            <div className="relative -top-1 h-[4rem] z-10">
                                <div className="absolute w-[calc(100%-1rem)] rounded-lg bg-accent/20 p-2 border border-accent/50">
                                <p className="font-bold text-sm text-accent-foreground">Revisión de Motor</p>
                                <p className="text-xs text-accent-foreground/80">Maria Gomez</p>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
    )
}

const WeekView = ({ assignments, onTaskClick }: { assignments: Assignment[], onTaskClick: (assignment: Assignment) => void }) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

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
                            {assignments
                                .filter(a => a.startTime.toDateString() === day.toDateString())
                                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                                .map(assignment => {
                                    const task = getTaskById(assignment.taskId);
                                    const employee = getEmployeeById(assignment.employeeId);
                                    if (!task || !employee) return null;

                                    const startTime = assignment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const endTime = assignment.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <Tooltip key={assignment.id}>
                                            <TooltipTrigger asChild>
                                                <Card 
                                                    onClick={() => onTaskClick(assignment)}
                                                    className="p-2 bg-primary/10 cursor-pointer hover:bg-primary/20"
                                                >
                                                    <p className="font-bold text-xs truncate">{task.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{employee.name} {employee.lastName}</p>
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
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <User className="h-4 w-4" />
                                                        <span>{employee.name} {employee.lastName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-4 w-4" />
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

const AssignTaskDialogContent = ({ setOpen, onAssignTask, onUpdateTask, assignmentToEdit }: { setOpen: (open: boolean) => void; onAssignTask: (newAssignments: Assignment[]) => void; onUpdateTask: (updatedAssignment: Assignment) => void; assignmentToEdit: Assignment | null; }) => {
    const isEditMode = !!assignmentToEdit;
    const [selectedTaskId, setSelectedTaskId] = React.useState<string>("");
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
    const [startTime, setStartTime] = React.useState("09:00");
    const [endTime, setEndTime] = React.useState("11:00");
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        if (isEditMode && assignmentToEdit) {
            setSelectedTaskId(assignmentToEdit.taskId);
            setSelectedEmployees([assignmentToEdit.employeeId]);
            setStartTime(assignmentToEdit.startTime.toTimeString().substring(0,5));
            setEndTime(assignmentToEdit.endTime.toTimeString().substring(0,5));
            // Format date to YYYY-MM-DD for the input
            const yyyy = assignmentToEdit.startTime.getFullYear();
            const mm = String(assignmentToEdit.startTime.getMonth() + 1).padStart(2, '0');
            const dd = String(assignmentToEdit.startTime.getDate()).padStart(2, '0');
            setDate(`${yyyy}-${mm}-${dd}`);
        }
    }, [assignmentToEdit, isEditMode]);


    const handleEmployeeSelect = (employeeId: string) => {
        if (isEditMode) {
            setSelectedEmployees([employeeId]); // Only one employee in edit mode
        } else {
            setSelectedEmployees(prev =>
                prev.includes(employeeId)
                    ? prev.filter(id => id !== employeeId)
                    : [...prev, employeeId]
            );
        }
    }
    
    const handleSubmit = () => {
        if (!selectedTaskId || selectedEmployees.length === 0) {
            // Basic validation
            alert("Por favor seleccione una tarea y al menos un empleado.");
            return;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const assignmentDate = new Date(date + 'T00:00:00'); // Use T00:00:00 to avoid timezone issues

        if (isEditMode && assignmentToEdit) {
            const startDate = new Date(assignmentDate.getTime());
            startDate.setHours(startHour, startMinute);
            
            const endDate = new Date(assignmentDate.getTime());
            endDate.setHours(endHour, endMinute);

            const updatedAssignment: Assignment = {
                ...assignmentToEdit,
                taskId: selectedTaskId,
                employeeId: selectedEmployees[0],
                startTime: startDate,
                endTime: endDate,
            };
            onUpdateTask(updatedAssignment);

        } else {
            const newAssignments = selectedEmployees.map(employeeId => {
                const startDate = new Date(assignmentDate.getTime());
                startDate.setHours(startHour, startMinute);
                
                const endDate = new Date(assignmentDate.getTime());
                endDate.setHours(endHour, endMinute);
                
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
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                        <SelectTrigger id="task">
                            <SelectValue placeholder="Seleccione una tarea" />
                        </SelectTrigger>
                        <SelectContent>
                            {tasks.map(task => (
                                <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Empleado(s)</Label>
                   <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex justify-between items-center">
                                <span className="truncate">
                                    {selectedEmployees.length === 0 && "Seleccione empleados"}
                                    {selectedEmployees.length === 1 && getEmployeeById(selectedEmployees[0])?.name + ' ' + getEmployeeById(selectedEmployees[0])?.lastName}
                                    {selectedEmployees.length > 1 && `${selectedEmployees.length} seleccionados`}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                            <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {employees.map(emp => (
                                <DropdownMenuCheckboxItem
                                    key={emp.id}
                                    checked={selectedEmployees.includes(emp.id)}
                                    onSelect={(e) => e.preventDefault()}
                                    onCheckedChange={() => handleEmployeeSelect(emp.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {emp.name} {emp.lastName}
                                        {emp.canDrive && <Car className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {!isEditMode && <div className="flex flex-wrap gap-1 mt-2">
                        {selectedEmployees.map(id => {
                            const emp = getEmployeeById(id);
                            return emp ? <Badge key={id} variant="secondary">{emp.name} {emp.lastName}</Badge> : null;
                        })}
                    </div>}
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
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Asignar'}</Button>
            </DialogFooter>
        </DialogContent>
    )
}


export default function SchedulePage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [assignments, setAssignments] = React.useState<Assignment[]>(initialAssignments)
  const [editingAssignment, setEditingAssignment] = React.useState<Assignment | null>(null);

  const handleAssignTask = (newAssignments: Assignment[]) => {
    setAssignments(prev => [...prev, ...newAssignments]);
  }

  const handleUpdateTask = (updatedAssignment: Assignment) => {
    setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
    setEditingAssignment(null);
  }

  const handleTaskClick = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsEditOpen(true);
  }

  const handleCloseDialogs = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    // Give time for dialog to close before resetting state
    setTimeout(() => {
       setEditingAssignment(null);
    }, 200);
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
              <Button onClick={() => setIsCreateOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Asignar Tarea
              </Button>
            </DialogTrigger>
            <AssignTaskDialogContent setOpen={setIsCreateOpen} onAssignTask={handleAssignTask} onUpdateTask={handleUpdateTask} assignmentToEdit={null} />
          </Dialog>
        </header>

        <Dialog open={isEditOpen} onOpenChange={open => open ? setIsEditOpen(true) : handleCloseDialogs()}>
            <AssignTaskDialogContent setOpen={setIsEditOpen} onAssignTask={handleAssignTask} onUpdateTask={handleUpdateTask} assignmentToEdit={editingAssignment} />
        </Dialog>
        
        <Tabs defaultValue="week" className="w-full">
            <div className="flex justify-end">
                <TabsList>
                    <TabsTrigger value="day">Hoy</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="day" className="mt-4">
                <DayView />
            </TabsContent>
            <TabsContent value="week" className="mt-4">
                <WeekView assignments={assignments} onTaskClick={handleTaskClick} />
            </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}
