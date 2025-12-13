
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
import { useTasks } from '@/hooks/use-tasks';

export default function TasksPage() {
    const { tasks, isLoading, error, addTask, updateTask, deleteTask } = useTasks();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [taskToEdit, setTaskToEdit] = React.useState<Task | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [actionLoading, setActionLoading] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);

    const handleCreateClick = () => {
        setTaskToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (task: Task) => {
        setTaskToEdit(task);
        setIsDialogOpen(true);
    };

    const handleSaveTask = async (taskData: Task) => {
        setActionLoading(true);
        setActionError(null);
        const isEditing = !!taskToEdit;
        if (isEditing) {
            const { error } = await updateTask(taskData);
            if (error) setActionError(error.message);
        } else {
            // Eliminar id para que lo genere la base de datos
            const { id, ...taskDataWithoutId } = taskData;
            const { error } = await addTask(taskDataWithoutId as Omit<Task, 'id'>);
            if (error) setActionError(error.message);
        }
        setActionLoading(false);
        setTaskToEdit(null);
    };

    const handleDeleteTask = async (taskId: string) => {
        setActionLoading(true);
        setActionError(null);
        const { error } = await deleteTask(taskId);
        if (error) setActionError(error.message);
        setActionLoading(false);
    };

    const filteredTasks = tasks.filter(task => {
        const searchTermLower = searchTerm.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchTermLower);
        // No filtrar por empleados aquí, ya que employees puede venir de otro lado
        return titleMatch;
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
            <Button onClick={handleCreateClick} disabled={actionLoading}>
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
            placeholder="Buscar por título..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading || actionLoading ? (
          <div className="text-center py-8">Cargando tareas...</div>
        ) : error || actionError ? (
          <div className="text-center text-red-500 py-8">Error: {error || actionError}</div>
        ) : (
        <Card className="overflow-hidden">
          <TooltipProvider>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead className="text-center">Requiere Conducir</TableHead>
                    <TableHead>
                    <span className="sr-only">Acciones</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">{task.description}</TableCell>
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
                            <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  className="cursor-pointer" 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => handleEditClick(task), 0);
                                  }}
                                >
                                  Editar
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
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
                ))}
                </TableBody>
            </Table>
          </TooltipProvider>
        </Card>
        )}
      </div>
    </AppLayout>
  )
}
