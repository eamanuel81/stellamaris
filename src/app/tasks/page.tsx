
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
import { matchesSearch } from '@/lib/utils';

export default function TasksPage() {
    const { tasks, isLoading, error, addTask, updateTask, deleteTask } = useTasks();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [taskToEdit, setTaskToEdit] = React.useState<Task | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [actionLoading, setActionLoading] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);

    const handleCreateClick = () => {
        setTaskToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (task: Task) => {
        setTaskToEdit(task);
        setIsDialogOpen(true);
    };

    const handleSaveTask = async (taskData: Task): Promise<boolean> => {
        setActionLoading(true);
        setActionError(null);
        const isEditing = !!taskToEdit;
        if (isEditing) {
            const { error } = await updateTask(taskData);
            if (error) {
                setActionError(error.message);
                setActionLoading(false);
                throw error;
            }
        } else {
            const { id, ...taskDataWithoutId } = taskData;
            const { error } = await addTask(taskDataWithoutId as Omit<Task, 'id'>);
            if (error) {
                setActionError(error.message);
                setActionLoading(false);
                throw error;
            }
        }
        setActionLoading(false);
        setTaskToEdit(null);
        return true;
    };

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        setActionLoading(true);
        setActionError(null);
        const { error } = await deleteTask(taskToDelete.id);
        if (error) {
            setActionError(error.message);
        } else {
            setIsDeleteDialogOpen(false);
            setTaskToDelete(null);
        }
        setActionLoading(false);
    };

    const filteredTasks = tasks.filter(task => {
        return (
            matchesSearch(task.title, searchTerm) ||
            matchesSearch(task.type, searchTerm) ||
            matchesSearch(task.description, searchTerm)
        );
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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de tarea.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

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
                                    setTimeout(() => handleEditClick(task), 100);
                                  }}
                                >
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setTimeout(() => handleDeleteClick(task), 100);
                                  }}
                                >
                                  Eliminar
                                </DropdownMenuItem>
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
