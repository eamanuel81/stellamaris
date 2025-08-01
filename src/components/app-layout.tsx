
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui"
import {
  Bell,
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Settings,
  Ship,
  Users,
  Contact,
  CalendarDays,
  Calendar,
} from "lucide-react"

import { useAuth } from "./auth-provider"
import { useAvatar } from "@/contexts/avatar-context"
import { NotificationsDialog } from "./notifications-dialog"

const adminNavItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
  { href: "/today-tasks", icon: <CalendarDays />, label: "Tareas del Día" },
  { href: "/schedule", icon: <CalendarClock />, label: "Asignar Tareas" },
  { href: "/tasks", icon: <ClipboardList />, label: "Tipos de Tareas" },
  { href: "/employees", icon: <Users />, label: "Empleados" },
  { href: "/clients", icon: <Contact />, label: "Clientes" },
];

const employeeNavItems = [
  { href: "/my-tasks", icon: <ClipboardCheck />, label: "Mis Tareas" },
  { href: "/my-calendar", icon: <Calendar />, label: "Calendario" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, logout, isLoading } = useAuth()
  const { avatarKey } = useAvatar()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isLoading && !role) {
      router.push('/')
    }
  }, [role, isLoading, router])

  if (isLoading || !role) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const navItems = role === "admin" ? adminNavItems : employeeNavItems

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Ship className="h-6 w-6" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-headline text-lg">Stella Maris</span>
              <span className="text-xs text-muted-foreground">Manager</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    {item.icon}
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton tooltip={{ children: "Configuración" }} isActive={pathname === '/settings'}>
                  <Settings />
                  Configuración
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={{ children: "Cerrar Sesión" }}
              >
                <LogOut />
                Cerrar Sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:justify-between">
          <SidebarTrigger className="sm:hidden" />
          <div className="hidden sm:flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="font-semibold text-lg">
                {navItems.find(item => pathname.startsWith(item.href))?.label}
              </h1>
            </div>
          <div className="flex items-center gap-4">
            <NotificationsDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarKey}`} alt="User" />
                    <AvatarFallback>{role === 'admin' ? 'A' : 'E'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {role === 'admin' ? 'Administrador' : 'Empleado'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {/* <Link href="/settings"><DropdownMenuItem>Mi Perfil</DropdownMenuItem></Link> */}
                  <Link href="/settings"><DropdownMenuItem className="cursor-pointer">Configuración</DropdownMenuItem></Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
