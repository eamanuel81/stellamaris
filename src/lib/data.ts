export type Employee = {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  dni: string;
  phone: string;
  address: string;
  canDrive: boolean;
  email: string;
  role: 'admin' | 'employee';
  avatarUrl: string;
  subrole?: 'empleado' | 'encargado' | 'admin'; // <-- Agregado 'admin'
  auth_id?: string; // ID del usuario en Auth de Supabase
};

export type TaskExtra = {
    id: string;
    name: string;
    price: number;
}

export type Task = {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  requiresDriving: boolean;
  type?: string;
  qualifiedEmployeeIds?: string[]; // Array of employee IDs
  extras?: TaskExtra[];
};

export type AssignmentStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export type Assignment = {
    id: string;
    taskId: string;
    employeeId: string[]; // Cambiado de string a string[] para soportar múltiples empleados
    startTime: Date;
    endTime: Date;
    status: AssignmentStatus;
    clientId?: string;
    boatIds?: string[];
    selectedExtras?: { extraId: string; quantity: number }[];
};

export type Boat = {
  id: string;
  name: string;
  hullType: string;
  engine: string;
  registrationNumber: string;
  photos?: string[];
};

export type ResponsibleParty = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
}

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  internalNote: string;
  boats: Boat[];
  responsibles: ResponsibleParty[];
  avatarUrl: string;
};

export const employees: Employee[] = [
  { id: '1', name: 'Juan', lastName: 'Perez', nickname: 'Juani', dni: '12345678', phone: '1122334455', address: 'Av. Siempre Viva 123', canDrive: true, email: 'juan.perez@example.com', role: 'employee', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan' },
  { id: '2', name: 'Maria', lastName: 'Gomez', nickname: 'Maru', dni: '87654321', phone: '1166778899', address: 'Calle Falsa 456', canDrive: false, email: 'maria.gomez@example.com', role: 'employee', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria' },
  { id: '3', name: 'Carlos', lastName: 'Rodriguez', nickname: 'Carlitos', dni: '13579246', phone: '1134567890', address: 'Boulevard de los Sueños Rotos 789', canDrive: true, email: 'carlos.r@example.com', role: 'employee', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos' },
  { id: '4', name: 'Ana', lastName: 'Lopez', nickname: 'Anita', dni: '24681357', phone: '1198765432', address: 'Pasaje de la Piedad 101', canDrive: false, email: 'ana.lopez@example.com', role: 'employee', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana' },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Limpieza de Embarcación', description: 'Limpieza profunda de cubierta y casco.', duration: 120, requiresDriving: false, type: 'Mantenimiento', qualifiedEmployeeIds: ['1', '2', '4'] },
  { id: 't2', title: 'Bajada de Lancha', description: 'Bajar lancha modelo X a la plataforma A.', duration: 30, requiresDriving: true, type: 'Operativo', qualifiedEmployeeIds: ['1', '3'] },
  { id: 't3', title: 'Subida de Lancha', description: 'Subir lancha modelo Y desde el agua.', duration: 45, requiresDriving: true, type: 'Operativo', qualifiedEmployeeIds: ['1', '3'] },
  { id: 't4', title: 'Revisión de Motor', description: 'Chequeo general del estado del motor.', duration: 60, requiresDriving: false, type: 'Mantenimiento', qualifiedEmployeeIds: ['2', '3'] },
  { id: 't5', title: 'Pintura de Casco', description: 'Aplicar una capa de pintura anti-fouling.', duration: 240, requiresDriving: false, type: 'Mantenimiento', qualifiedEmployeeIds: ['1', '4'] },
];

export const assignments: Assignment[] = [
    { id: 'a1', taskId: 't1', employeeId: ['1'], startTime: new Date(new Date().setHours(8, 0, 0, 0)), endTime: new Date(new Date().setHours(10, 0, 0, 0)), status: 'completed', clientId: 'c1', boatIds: ['b1'] },
    { id: 'a2', taskId: 't2', employeeId: ['3'], startTime: new Date(new Date().setHours(9, 0, 0, 0)), endTime: new Date(new Date().setHours(9, 30, 0, 0)), status: 'accepted' },
    { id: 'a3', taskId: 't4', employeeId: ['2'], startTime: new Date(new Date().setHours(11, 0, 0, 0)), endTime: new Date(new Date().setHours(12, 0, 0, 0)), status: 'pending' },
    { id: 'a4', taskId: 't3', employeeId: ['1'], startTime: new Date(new Date().setHours(14, 0, 0, 0)), endTime: new Date(new Date().setHours(14, 45, 0, 0)), status: 'pending', clientId: 'c2', boatIds: ['b3'] },
    // Another task for Juan Perez for today
    { id: 'a5', taskId: 't5', employeeId: ['1'], startTime: new Date(new Date().setHours(15, 0, 0, 0)), endTime: new Date(new Date().setHours(19, 0, 0, 0)), status: 'accepted' },
];

export const clients: Client[] = [
  { 
    id: 'c1', 
    firstName: 'Ricardo', 
    lastName: 'Fort', 
    dni: '22333444',
    email: 'elcomandante@fort.com', 
    phone: '1122334455', 
    internalNote: 'Paga en dólares. Fanático del chocolate.', 
    boats: [
      { id: 'b1', name: 'El Fort-Farré', hullType: 'Tracker open 420 mts', engine: 'Datos del Motor', registrationNumber: 'ABC-123', photos: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'] },
      { id: 'b2', name: 'Miami', hullType: 'Lancha', engine: 'Mercury', registrationNumber: 'DEF-456', photos: [] }
    ],
    responsibles: [],
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ricardo'
  },
  { 
    id: 'c2', 
    firstName: 'Susana', 
    lastName: 'Gimenez', 
    dni: '11222333',
    email: 'su@gimenez.com', 
    phone: '1166778899', 
    internalNote: 'Llama seguido. Preguntar por el perro.', 
    boats: [
      { id: 'b3', name: 'Shock', hullType: 'Yate', engine: 'Rolls-Royce', registrationNumber: 'GHI-789', photos: [] }
    ],
    responsibles: [
        { id: 'r1', firstName: 'Kiko', lastName: 'Gimenez', dni: '12345678', phone: '1199887766' }
    ],
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=susana'
  }
];
