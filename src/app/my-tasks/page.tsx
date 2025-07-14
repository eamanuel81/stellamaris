"use client"
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
import { assignments, employees, tasks } from "@/lib/data"
import { Car, Check, ChevronDown, Clock } from "lucide-react"

const getTaskById = (id: string) => tasks.find((t) => t.id === id)
const getEmployeeById = (id: string) => employees.find((e) => e.id === id)

const statusMap: { [key: string]: { text: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode } } = {
  completed: { text: "Terminado", variant: "default", icon: <Check className="h-3 w-3" /> },
  accepted: { text: "Aceptado", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  assigned: { text: "Asignado", variant: "outline", icon: <Clock className="h-3 w-3" /> },
};


export default function MyTasksPage() {
  const myAssignments = assignments.filter(a => ['1','2','3'].includes(a.employeeId)); // Simulating employee logged in

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
            const task = getTaskById(assignment.taskId);
            if (!task) return null;

            const currentStatus = statusMap[assignment.status];
            
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
                                {assignment.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {assignment.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                       </div>
                        <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4" />
                           <span>Duración estimada: {task.duration} min</span>
                       </div>
                   </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                   <Badge variant={currentStatus.variant}>
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
                        <DropdownMenuItem disabled={assignment.status === 'accepted'}>Aceptar Tarea</DropdownMenuItem>
                        <DropdownMenuItem disabled={assignment.status === 'completed'}>Marcar como Terminada</DropdownMenuItem>
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
