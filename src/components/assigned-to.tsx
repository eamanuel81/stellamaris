import { UserX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/lib/data';

// Muestra a quién está asignada una tarea, o la etiqueta SIN ASIGNACIÓN si no tiene a nadie.
export function AssignedTo({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <div className="space-y-2 border-t pt-4">
        <Badge variant="outline" className="border-orange-400 bg-orange-100 text-orange-800">
          <UserX className="mr-1 h-3 w-3" />
          SIN ASIGNACIÓN
        </Badge>
      </div>
    );
  }
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="font-medium text-foreground">Asignado a:</div>
      {employees.map((employee) => (
        <div key={employee.id} className="flex items-center gap-2 font-medium text-foreground">
          <Avatar className="h-6 w-6">
            <AvatarImage src={employee.avatarUrl} alt={employee.name} />
            <AvatarFallback>{employee.name[0]}{employee.lastName[0]}</AvatarFallback>
          </Avatar>
          <span>{employee.name} {employee.lastName}</span>
        </div>
      ))}
    </div>
  );
}
