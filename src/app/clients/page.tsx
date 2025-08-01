
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
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
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui"
import { useClients } from '@/hooks/use-clients';
import { Client } from '@/lib/data';
import { PlusCircle, MoreHorizontal, Search, Ship as ShipIcon } from 'lucide-react';
import { ClientDialog } from '@/components/client-dialog';
import { Badge } from '@/components/ui';
import { useAuth } from '@/components/auth-provider';

export default function ClientsPage() {
    const { clients, isLoading, error, addClient, updateClient, deleteClient } = useClients();
    const { subrole } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [clientToEdit, setClientToEdit] = React.useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [actionLoading, setActionLoading] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);

    const handleCreateClick = () => {
        setClientToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (client: Client) => {
        setClientToEdit(client);
        setIsDialogOpen(true);
    };

    const handleSaveClient = async (clientData: Client) => {
        setActionLoading(true);
        setActionError(null);
        const isEditing = !!clientToEdit;
        if (isEditing) {
            const { error } = await updateClient(clientData);
            if (error) setActionError(error.message);
        } else {
            // Eliminar id para que lo genere la base de datos
            const { id, ...clientDataWithoutId } = clientData;
            const { error } = await addClient(clientDataWithoutId as Omit<Client, 'id'>);
            if (error) setActionError(error.message);
        }
        setActionLoading(false);
    };
    
    const handleDeleteClient = async (clientId: string) => {
        setActionLoading(true);
        setActionError(null);
        const { error } = await deleteClient(clientId);
        if (error) setActionError(error.message);
        setActionLoading(false);
    };

    // Filtrar clientes: no mostrar el email del admin (ni clientes con email igual al del usuario actual)
    const filteredClients = clients.filter(client => {
        const searchTermLower = searchTerm.toLowerCase();
        // No mostrar clientes cuyo email coincide con el del usuario logueado (admin)
        if (client.email && subrole === 'admin' && typeof window !== 'undefined') {
            const userEmail = window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token')!).currentSession?.user?.email : null;
            if (userEmail && client.email === userEmail) return false;
        }
        return (
            client.firstName.toLowerCase().includes(searchTermLower) ||
            client.lastName.toLowerCase().includes(searchTermLower) ||
            client.email.toLowerCase().includes(searchTermLower) ||
            client.boats.some(b => b.name.toLowerCase().includes(searchTermLower))
        );
    });

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Clientes
            </h1>
            <p className="text-muted-foreground">
              Gestiona los clientes y sus embarcaciones.
            </p>
          </div>
            {subrole !== 'encargado' && (
              <Button onClick={handleCreateClick} disabled={actionLoading}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Cliente
              </Button>
            )}
        </header>

        <ClientDialog 
            open={isDialogOpen}
            setOpen={setIsDialogOpen}
            onSave={handleSaveClient}
            clientToEdit={clientToEdit}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, email o embarcación..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading || actionLoading ? (
          <div className="text-center py-8">Cargando clientes...</div>
        ) : error || actionError ? (
          <div className="text-center text-red-500 py-8">Error: {error || actionError}</div>
        ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Embarcaciones</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={client.avatarUrl} alt={`${client.firstName} ${client.lastName}`} />
                         <AvatarFallback>{client.firstName[0]}{client.lastName[0]}</AvatarFallback>
                       </Avatar>
                       <div>
                         {client.firstName} {client.lastName}
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="text-sm">{client.email}</div>
                     <div className="text-xs text-muted-foreground">{client.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {client.boats.map(boat => (
                            <Badge key={boat.id} variant="secondary" className="font-normal">
                                <ShipIcon className="mr-1 h-3 w-3" />
                                {boat.name}
                            </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={subrole === 'encargado'}>
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        {subrole !== 'encargado' && (
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditClick(client)}>Editar</DropdownMenuItem >
                        )}
                        {subrole !== 'encargado' && (
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
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y sus datos.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        )}
      </div>
    </AppLayout>
  )
}
