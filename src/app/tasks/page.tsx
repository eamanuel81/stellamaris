
"use client"

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
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui"
import { AppLayout } from "@/components/app-layout"
import { Car, ChevronDown, MoreHorizontal, PlusCircle, Search, Trash2 } from "lucide-react"
import { tasks as initialTasks, employees, Task, TaskExtra } from "@/lib/data"
import React from "react"
import { Badge } from "@/components/ui/badge"

const TaskDialog = ({ 
    open, 
    setOpen, 
    onTaskSave, 
    taskToEdit 
}: { 
    open: boolean;
    setOpen: (open: boolean) => void; 
    onTaskSave: (task: Task) => void;
    taskToEdit: Task | null;
}) => {
    const isEditMode = !!taskToEdit;
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [duration, setDuration] = React.useState<number | "">("");
    const [type, setType] = React.useState("");
    const [requiresDriving, setRequiresDriving] = React.useState(false);
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
    const [extras, setExtras] = React.useState<TaskExtra[]>([]);

    React.useEffect(() => {
        if (isEditMode && taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description);
            setDuration(taskToEdit.duration);
            setType(taskToEdit.type || "");
            setRequiresDriving(taskToEdit.requiresDriving);
            setSelectedEmployees(taskToEdit.qualifiedEmployeeIds || []);
            setExtras(taskToEdit.extras || []);
        } else {
            setTitle("");
            setDescription("");
            setDuration("");
            setType("");
            setRequiresDriving(false);
            setSelectedEmployees([]);
            setExtras([]);
        }
    }, [taskToEdit, isEditMode]);
    
    const handleEmployeeSelect = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    }
    
    const handleSelectAllEmployees = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map(emp => emp.id));
        }
    }

    const handleAddExtra = () => {
        setExtras(prev => [...prev, { id: `extra-${Date.now()}`, name: '', price: 0 }]);
    }

    const handleExtraChange = (index: number, field: 'name' | 'price', value: string | number) => {
        const newExtras = [...extras];
        if (field === 'price') {
             const price = Number(value);
            newExtras[index][field] = isNaN(price) ? 0 : price;
        } else {
            newExtras[index][field] = String(value);
        }
        setExtras(newExtras);
    }
    
    const handleRemoveExtra = (index: number) => {
        setExtras(prev => prev.filter((_, i) => i !== index));
    }

    const totalExtras = React.useMemo(() => {
        return extras.reduce((sum, extra) => sum + (extra.price || 0), 0);
    }, [extras]);


    const handleSubmit = () => {
        if (!title || !description || !duration) {
            alert("Por favor complete Título, Descripción y Duración.");
            return;
        }

        const taskData: Task = {
            id: isEditMode ? taskToEdit!.id : `t${Date.now()}`,
            title,
            description,
            duration: Number(duration),
            type,
            requiresDriving,
            qualifiedEmployeeIds: selectedEmployees,
            extras: extras.filter(e => e.name.trim() !== "") // only save extras with a name
        };

        onTaskSave(taskData);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
             <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Tarea' : 'Crear nuevo tipo de tarea'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifique los detalles de la tarea.' : 'Complete los detalles de la nueva tarea. Podrá asignarla a los empleados más tarde.'}
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="general">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="extras">Extras Opcionales</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general">
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título de la Tarea</Label>
                                <Input id="title" placeholder="Ej: Limpieza de cubierta" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea id="description" placeholder="Describa la tarea en detalle..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duración (minutos)</Label>
                                    <Input id="duration" type="number" placeholder="Ej: 60" value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Tipo (Opcional)</Label>
                                    <Input id="type" placeholder="Ej: Mantenimiento" value={type} onChange={e => setType(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="requiresDriving" checked={requiresDriving} onCheckedChange={(checked) => setRequiresDriving(Boolean(checked))} />
                                <Label htmlFor="requiresDriving" className="font-normal">
                                    Esta tarea necesita que el empleado sepa conducir
                                </Label>
                            </div>
                            <div className="grid gap-2 pt-2">
                                <Label>Empleados Cualificados</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex justify-between items-center font-normal">
                                            <span className="truncate">
                                                {selectedEmployees.length === 0 && "Seleccione empleados"}
                                                {selectedEmployees.length === employees.length && "Todos los empleados seleccionados"}
                                                {selectedEmployees.length > 0 && selectedEmployees.length < employees.length && `${selectedEmployees.length} empleados seleccionados`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                        <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem
                                            checked={selectedEmployees.length === employees.length}
                                            onCheckedChange={handleSelectAllEmployees}
                                        >
                                            Seleccionar Todos
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuSeparator />
                                        {employees.map(emp => (
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
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedEmployees.map(id => {
                                        const emp = employees.find(e => e.id === id);
                                        return emp ? <Badge key={id} variant="secondary">{emp.name} {emp.lastName}</Badge> : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="extras">
                         <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="space-y-4">
                                {extras.map((extra, index) => (
                                    <div key={extra.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                                        <Input 
                                            placeholder="Nombre del extra (ej. Nafta)" 
                                            value={extra.name}
                                            onChange={(e) => handleExtraChange(index, 'name', e.target.value)}
                                        />
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">AR$</span>
                                            <Input 
                                                type="number" 
                                                placeholder="Precio (opcional)" 
                                                className="w-40 pl-10"
                                                value={extra.price || ''}
                                                onChange={(e) => handleExtraChange(index, 'price', e.target.value)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveExtra(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={handleAddExtra} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Agregar Extra
                            </Button>
                            {extras.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between items-center font-semibold">
                                        <span>Total de Extras:</span>
                                        <span>
                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalExtras)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Crear Tarea'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function TasksPage() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [taskToEdit, setTaskToEdit] = React.useState<Task | null>(null);
    const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
    const [searchTerm, setSearchTerm] = React.useState("");

    const handleCreateClick = () => {
        setTaskToEdit(null);
        setIsDialogOpen(true);
    }

    const handleEditClick = (task: Task) => {
        setTaskToEdit(task);
        setIsDialogOpen(true);
    }
    
    const handleSaveTask = (taskData: Task) => {
        const isEditing = tasks.some(t => t.id === taskData.id);
        if (isEditing) {
            setTasks(prev => prev.map(t => t.id === taskData.id ? taskData : t));
        } else {
            setTasks(prev => [...prev, taskData]);
        }
        setTaskToEdit(null);
    }
    
    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    }

    const filteredTasks = tasks.filter(task => {
        const searchTermLower = searchTerm.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchTermLower);
        
        const employeeMatch = task.qualifiedEmployeeIds?.some(empId => {
            const employee = employees.find(e => e.id === empId);
            return employee && (
                employee.name.toLowerCase().includes(searchTermLower) ||
                employee.lastName.toLowerCase().includes(searchTermLower)
            );
        });

        return titleMatch || employeeMatch;
    });
    
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Tipos de Tareas
            </h1>
            <p className="text-muted-foreground">
              Cree y gestione los tipos de tareas para asignar.
            </p>
          </div>
            <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Tarea
            </Button>
        </header>

        <TaskDialog 
            open={isDialogOpen}
            setOpen={setIsDialogOpen}
            onTaskSave={handleSaveTask}
            taskToEdit={taskToEdit}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por título o empleado cualificado..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="overflow-hidden">
          <TooltipProvider>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Empleados Cualificados</TableHead>
                    <TableHead className="text-center">Duración</TableHead>
                    <TableHead className="text-center">Requiere Conducir</TableHead>
                    <TableHead>
                    <span className="sr-only">Acciones</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredTasks.map((task) => {
                    const qualifiedEmployees = task.qualifiedEmployeeIds?.map(id => employees.find(e => e.id === id)).filter(Boolean) as typeof employees;
                    
                    return (
                        <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">{task.description}</TableCell>
                        <TableCell>
                            <div className="flex items-center -space-x-2">
                            {qualifiedEmployees && qualifiedEmployees.length > 0 ? qualifiedEmployees?.slice(0, 3).map(emp => (
                                <Tooltip key={emp.id}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-card">
                                    <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                    <AvatarFallback>{emp.name[0]}{emp.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {emp.name} {emp.lastName}
                                </TooltipContent>
                                </Tooltip>
                            )) : (
                                <span className="text-xs text-muted-foreground italic">Todos</span>
                            )}
                            {qualifiedEmployees && qualifiedEmployees.length > 3 && (
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                                    +{qualifiedEmployees.length - 3}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {qualifiedEmployees.slice(3).map(e => `${e.name} ${e.lastName}`).join(', ')}
                                </TooltipContent>
                                </Tooltip>
                            )}
                            </div>
                        </TableCell>
                        <TableCell className="text-center">{task.duration} min</TableCell>
                        <TableCell className="text-center">
                            {task.requiresDriving && (
                            <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-700">
                                <Car className="mr-2 h-4 w-4" />
                                Sí
                            </Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditClick(task)}>Editar</DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                            Eliminar
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de tarea.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    )
                })}
                </TableBody>
            </Table>
          </TooltipProvider>
        </Card>
      </div>
    </AppLayout>
  )
}
    
