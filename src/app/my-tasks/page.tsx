
"use client"
import React from "react"
import { AppLayout } from "@/components/app-layout"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui"
import { assignments as initialAssignments, tasks as initialTasks, Assignment, AssignmentStatus, Task } from "@/lib/data"
import { Car, Check, ChevronDown, Clock, X, Ban, Hourglass, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const getTaskById = (id: string, tasks: Task[]) => tasks.find((t) => t.id === id)

type StatusConfig = {
    text: string;
    icon: React.ReactNode;
    classes: string;
}

const statusMap: Record<AssignmentStatus, StatusConfig> = {
  pending: { text: "Pendiente", icon: <Hourglass className="h-3 w-3" />, classes: "bg-amber-100 border-amber-400 text-amber-800" },
  accepted: { text: "Aceptada", icon: <Check className="h-3 w-3" />, classes: "bg-blue-100 border-blue-400 text-blue-800" },
  completed: { text: "Terminada", icon: <CheckCheck className="h-3 w-3" />, classes: "bg-green-100 border-green-400 text-green-800" },
  rejected: { text: "Rechazada", icon: <Ban className="h-3 w-3" />, classes: "bg-gray-200 border-gray-400 text-gray-700" },
  cancelled: { text: "Cancelada", icon: <X className="h-3 w-3" />, classes: "bg-red-100 border-red-400 text-red-800" },
};


export default function MyTasksPage() {
    const [assignments, setAssignments] = React.useState<Assignment[]>([]);
    const [tasks, setTasks] = React.useState<Task[]>([]);

    React.useEffect(() => {
        const loadData = () => {
             try {
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

                const savedTasks = localStorage.getItem('tasks');
                setTasks(savedTasks ? JSON.parse(savedTasks) : initialTasks);

            } catch (error) {
                console.error("Failed to load data from localStorage", error);
                setAssignments(initialAssignments);
                setTasks(initialTasks);
            }
        };
        
        loadData();
        window.addEventListener('storage', loadData);
        return () => window.removeEventListener('storage', loadData);

    }, []);

  // Simulating employee with ID '1' (Juan Perez) is logged in
  const myAssignments = assignments.filter(a => a.employeeId === '1'); 

  const updateAssignmentStatus = (assignmentId: string, newStatus: AssignmentStatus) => {
    const updatedAssignments = assignments.map(a => 
        a.id === assignmentId ? { ...a, status: newStatus } : a
    );
    setAssignments(updatedAssignments);
    try {
        localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
        window.dispatchEvent(new StorageEvent('storage', { key: 'assignments' }));
    } catch(e) {
        console.error("Failed to save assignments to localStorage", e);
    }
  }


  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Mis Tareas
          </h1>
          <p className="text-muted-foreground">
            Aquí están las tareas que te han sido asignadas.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myAssignments.map((assignment) => {
            const task = getTaskById(assignment.taskId, tasks);
            if (!task) return null;

            const currentStatus = statusMap[assignment.status] || statusMap.pending;
            
            return (
              <Card key={assignment.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle>{task.title}</CardTitle>
                    {task.requiresDriving && (
                      <Badge variant="outline" className="flex-shrink-0">
                        <Car className="mr-1 h-3 w-3" />
                        Conducir
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{task.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <div className="text-sm text-muted-foreground space-y-2">
                       <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4" />
                           <span>
                                {new Date(assignment.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(assignment.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                       </div>
                        <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4" />
                           <span>Duración estimada: {task.duration} min</span>
                       </div>
                   </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                   <Badge variant="outline" className={cn("font-normal", currentStatus.classes)}>
                        {currentStatus.icon}
                        <span className="ml-1.5">{currentStatus.text}</span>
                   </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Cambiar Estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={assignment.status === 'accepted'} onClick={() => updateAssignmentStatus(assignment.id, 'accepted')}>Aceptar Tarea</DropdownMenuItem>
                        <DropdownMenuItem disabled={assignment.status === 'completed'} onClick={() => updateAssignmentStatus(assignment.id, 'completed')}>Marcar como Terminada</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateAssignmentStatus(assignment.id, 'rejected')}>Rechazar Tarea</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
