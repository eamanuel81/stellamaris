
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
  Badge,
} from "@/components/ui"
import { clients as initialClients, Client } from "@/lib/data"
import { MoreHorizontal, PlusCircle, Search, Ship as ShipIcon } from "lucide-react"
import { ClientDialog } from "@/components/client-dialog"

export default function ClientsPage() {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [clientToEdit, setClientToEdit] = React.useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useEffect(() => {
        try {
            const savedClients = localStorage.getItem('clients');
            setClients(savedClients ? JSON.parse(savedClients) : initialClients);
        } catch (error) {
            console.error("Failed to load clients from localStorage", error);
            setClients(initialClients);
        }

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'clients') {
                try {
                    const savedClients = localStorage.getItem('clients');
                    setClients(savedClients ? JSON.parse(savedClients) : initialClients);
                } catch (error) {
                    console.error("Failed to load clients from localStorage", error);
                    setClients(initialClients);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const updateClientsAndStorage = (updatedClients: Client[]) => {
        setClients(updatedClients);
        try {
            const newClientsJSON = JSON.stringify(updatedClients);
            localStorage.setItem('clients', newClientsJSON);
            window.dispatchEvent(new StorageEvent('storage', { key: 'clients', newValue: newClientsJSON }));
        } catch (error) {
            console.error("Failed to save clients to localStorage", error);
        }
    };

    const handleCreateClick = () => {
        setClientToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (client: Client) => {
        setClientToEdit(client);
        setIsDialogOpen(true);
    };

    const handleSaveClient = (clientData: Client) => {
        const isEditing = clients.some(c => c.id === clientData.id);
        let updatedClients;
        if (isEditing) {
            updatedClients = clients.map(c => c.id === clientData.id ? clientData : c);
        } else {
            updatedClients = [...clients, clientData];
        }
        updateClientsAndStorage(updatedClients);
    };
    
    const handleDeleteClient = (clientId: string) => {
        const updatedClients = clients.filter(c => c.id !== clientId);
        updateClientsAndStorage(updatedClients);
    };

    const filteredClients = clients.filter(client => {
        const searchTermLower = searchTerm.toLowerCase();
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
            <Button onClick={handleCreateClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Cliente
            </Button>
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
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(client)}>Editar</DropdownMenuItem>
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
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y sus datos.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
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
        </Card>
      </div>
    </AppLayout>
  )
}
