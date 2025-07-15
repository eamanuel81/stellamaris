
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Badge,
} from "@/components/ui"
import { clients as initialClients, Client, Boat } from "@/lib/data"
import { MoreHorizontal, PlusCircle, Search, Trash2, Ship as ShipIcon } from "lucide-react"

const ClientDialog = ({
    open,
    setOpen,
    onSave,
    clientToEdit
}: {
    open: boolean,
    setOpen: (open: boolean) => void,
    onSave: (client: Client) => void,
    clientToEdit: Client | null
}) => {
    const isEditMode = !!clientToEdit;
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [internalNote, setInternalNote] = React.useState('');
    const [boats, setBoats] = React.useState<Boat[]>([]);

    React.useEffect(() => {
        if (isEditMode && clientToEdit) {
            setFirstName(clientToEdit.firstName);
            setLastName(clientToEdit.lastName);
            setEmail(clientToEdit.email);
            setPhone(clientToEdit.phone);
            setInternalNote(clientToEdit.internalNote);
            setBoats(clientToEdit.boats);
        } else {
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setInternalNote('');
            setBoats([{ id: `b${Date.now()}`, name: '' }]);
        }
    }, [clientToEdit, isEditMode, open]);

    const handleBoatChange = (index: number, value: string) => {
        const newBoats = [...boats];
        newBoats[index].name = value;
        setBoats(newBoats);
    };

    const handleAddBoat = () => {
        setBoats([...boats, { id: `b${Date.now()}`, name: '' }]);
    };
    
    const handleRemoveBoat = (index: number) => {
        if (boats.length > 1) {
            const newBoats = boats.filter((_, i) => i !== index);
            setBoats(newBoats);
        }
    };

    const handleSubmit = () => {
        if (!firstName || !lastName || !email) {
            alert('Por favor complete Nombre, Apellido y Email.');
            return;
        }

        const clientData: Client = {
            id: isEditMode ? clientToEdit.id : `c${Date.now()}`,
            firstName,
            lastName,
            email,
            phone,
            internalNote,
            boats: boats.filter(b => b.name.trim() !== ''),
            avatarUrl: isEditMode ? clientToEdit.avatarUrl : `https://i.pravatar.cc/150?u=${Date.now()}`
        };

        onSave(clientData);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Complete los datos del cliente y sus embarcaciones.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Perez" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@example.com" />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="phone">Celular</Label>
                            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="1122334455" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="internalNote">Nota Interna</Label>
                         <Textarea id="internalNote" value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="Información relevante sobre el cliente..." />
                    </div>
                    <div className="grid gap-2 pt-2">
                        <Label>Embarcaciones</Label>
                        <div className="space-y-2">
                        {boats.map((boat, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <Input 
                                    value={boat.name}
                                    onChange={(e) => handleBoatChange(index, e.target.value)}
                                    placeholder={`Nombre de la embarcación ${index + 1}`}
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveBoat(index)} disabled={boats.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddBoat} className="mt-2 w-fit">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Embarcación
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Guardar Cliente'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


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
    }, []);

    const updateClientsAndStorage = (updatedClients: Client[]) => {
        setClients(updatedClients);
        try {
            localStorage.setItem('clients', JSON.stringify(updatedClients));
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
