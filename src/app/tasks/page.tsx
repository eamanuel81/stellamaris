
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
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem
} from "@/components/ui"
import { AppLayout } from "@/components/app-layout"
import { Car, MoreHorizontal, PlusCircle, Search } from "lucide-react"
import { tasks as initialTasks, employees, Task } from "@/lib/data"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskDialog } from "@/components/task-dialog"

export default function TasksPage() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [taskToEdit, setTaskToEdit] = React.useState<Task | null>(null);
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useEffect(() => {
        try {
            const savedTasks = localStorage.getItem('tasks');
            if (savedTasks) {
                setTasks(JSON.parse(savedTasks));
            } else {
                setTasks(initialTasks);
            }
        } catch (error) {
            console.error("Failed to load tasks from localStorage", error);
            setTasks(initialTasks);
        }
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error("Failed to save tasks to localStorage", error);
        }
    }, [tasks]);

    const handleCreateClick = () => {
        setTaskToEdit(null);
        setIsDialogOpen(true);
    }

    const handleEditClick = (task: Task) => {
        setTaskToEdit(task);
        setIsDialogOpen(true);
    }
    
    const handleSaveTask = (taskData: Task) => {
        setTasks(prev => {
            const isEditing = prev.some(t => t.id === taskData.id);
            if (isEditing) {
                return prev.map(t => t.id === taskData.id ? taskData : t);
            } else {
                return [...prev, taskData];
            }
        });
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
