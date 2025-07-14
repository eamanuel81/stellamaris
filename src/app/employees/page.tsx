"use client"

import { AppLayout } from "@/components/app-layout"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
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
} from "@/components/ui"
import { employees } from "@/lib/data"
import { Car, MoreHorizontal, PlusCircle, Search } from "lucide-react"
import React from "react"

export default function EmployeesPage() {
    const [open, setOpen] = React.useState(false);
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Empleados
            </h1>
            <p className="text-muted-foreground">
              Gestione el personal de la guardería.
            </p>
          </div>
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                <DialogDescription>
                  Complete los datos del empleado. Se le enviará un enlace para generar su contraseña.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" placeholder="Juan" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" placeholder="Perez" />
                  </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nickname">Apodo</Label>
                    <Input id="nickname" placeholder="Juani" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input id="dni" placeholder="12345678" />
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="address">Domicilio</Label>
                    <Input id="address" placeholder="Av. Siempre Viva 123" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Número de Celular</Label>
                    <Input id="phone" type="tel" placeholder="1122334455" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="juan.perez@example.com" />
                  </div>
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="canDrive" />
                    <Label htmlFor="canDrive" className="font-normal">
                       El empleado sabe conducir lanchas
                    </Label>
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="sendLink" defaultChecked/>
                    <Label htmlFor="sendLink" className="font-normal">
                       Enviar enlace para generar nueva contraseña
                    </Label>
                </div>
              </div>
              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" onClick={() => setOpen(false)}>Guardar Empleado</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, DNI o apodo..." className="pl-9" />
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Apodo</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead className="text-center">Sabe Conducir</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                         <AvatarFallback>{employee.name[0]}{employee.lastName[0]}</AvatarFallback>
                       </Avatar>
                       <div>
                         {employee.name} {employee.lastName}
                         <div className="text-xs text-muted-foreground">{employee.email}</div>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.dni}</TableCell>
                  <TableCell>{employee.nickname}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell className="text-center">
                    {employee.canDrive && (
                       <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700">
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Tareas</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  )
}
