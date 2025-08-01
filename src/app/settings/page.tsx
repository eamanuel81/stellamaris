
"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { AppLayout } from "@/components/app-layout"
import { supabase } from "@/lib/supabaseClient"
import { useAvatar } from "@/contexts/avatar-context"
import { changeUserPassword, validatePassword } from "@/lib/auth-utils"
import { updateUserProfile } from "@/lib/profile-utils"
import { useNotifications } from "@/hooks/use-notifications"
import { useNotificationPreferences } from "@/hooks/use-notification-preferences"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Alert,
  AlertDescription,
  Switch,
} from "@/components/ui"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string;
  name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface EmployeeData {
  id: string;
  name: string;
  lastName: string;
  nickname: string;
  dni: string;
  phone: string;
  address: string;
  email: string;
  subrole: string;
}

export default function SettingsPage() {
  const { role, logout } = useAuth();
  const { avatarKey, updateAvatar, refreshAvatar } = useAvatar();
  const { toast } = useToast();
  const { clearAllNotifications } = useNotifications();
  const { preferences, toggleNotifications, isLoading: preferencesLoading } = useNotificationPreferences();
  
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [employee, setEmployee] = React.useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  
  // Form states
  const [formData, setFormData] = React.useState({
    name: '',
    lastName: '',
    nickname: '',
    phone: '',
    address: '',
  });
  
  // Password states
  const [passwordData, setPasswordData] = React.useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});


  // Cargar datos del usuario
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (user && user.email) {
            // Load user data silently
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', user.email)
                .single();

            // Set initial form data based on available information
            const initialFormData = {
                name: (profileData?.firstName || employeeData?.name || user.user_metadata?.firstName || '') as string,
                lastName: (profileData?.lastName || employeeData?.lastName || user.user_metadata?.lastName || '') as string,
                nickname: (employeeData?.nickname || '') as string,
                phone: (profileData?.phone || employeeData?.phone || '') as string,
                address: (profileData?.address || employeeData?.address || '') as string
            };

            setFormData(initialFormData);
        }

      } catch (error) {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleAvatarChange = async () => {
    const newAvatarKey = Date.now().toString();
    
    try {
      const success = await updateAvatar(newAvatarKey);
      
      if (success) {
        toast({
          title: "Avatar actualizado",
          description: "Tu avatar ha sido cambiado exitosamente.",
        });
      } else {
        throw new Error('Failed to update avatar');
      }

    } catch (error) {
      // Handle error silently
      toast({
        title: "Error",
        description: "No se pudo actualizar el avatar. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validar nueva contraseña
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.error || 'Error en la contraseña';
    }

    // Validar confirmación
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma la nueva contraseña';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const result = await updateUserProfile(user.id, user.email!, formData);

      if (result.success) {
        // Profile updated successfully
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido guardada exitosamente.",
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }

    } catch (error) {
      // Handle error silently
      
      let errorMessage = "No se pudo actualizar el perfil. Inténtalo de nuevo.";
      
      if (error instanceof Error) {
        if (error.message.includes('policy')) {
          errorMessage = "No tienes permisos para actualizar tu perfil. Contacta al administrador.";
        } else if (error.message.includes('network')) {
          errorMessage = "Error de conexión. Verifica tu conexión a internet.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      const result = await changeUserPassword(passwordData.newPassword);

      if (result.success) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente.",
        });

        // Limpiar formulario
        setPasswordData({
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }

    } catch (error) {
      // Handle error silently
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-2xl mx-auto">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Configuración
          </h1>
          <p className="text-muted-foreground">
            Gestiona la configuración de tu cuenta y tus preferencias.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Esta es tu información personal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
               <Avatar className="h-20 w-20">
                                     <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarKey}`} alt="User" />
                 <AvatarFallback>{role === 'admin' ? 'A' : 'E'}</AvatarFallback>
               </Avatar>
               <div className="space-y-2">
                 <Label>Avatar</Label>
                 <div>
                    <Button variant="outline" onClick={handleAvatarChange}>Cambiar Avatar</Button>
                 </div>
                 <p className="text-xs text-muted-foreground">
                    Haga clic para generar un nuevo avatar aleatorio.
                 </p>
               </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="nickname">Apodo</Label>
              <Input 
                id="nickname" 
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder="Tu apodo o nombre preferido"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone" 
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input 
                id="address" 
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Tu dirección"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile?.email || ''} 
                disabled 
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                El email no se puede cambiar desde aquí.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contraseña</CardTitle>
            <CardDescription>
              Cambia tu contraseña. Se recomienda usar una contraseña segura con al menos 6 caracteres.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={errors.newPassword ? 'border-red-500' : ''}
                placeholder="Ingresa tu nueva contraseña"
              />
              {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword}</p>}
              <p className="text-xs text-muted-foreground">
                La contraseña debe tener entre 6 y 128 caracteres.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                placeholder="Confirma tu nueva contraseña"
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
            <CardDescription>
              Detalles de tu cuenta y permisos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Rol</Label>
                <p className="text-sm text-muted-foreground">
                  {role === 'admin' ? 'Administrador' : 'Empleado'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Subrol</Label>
                <p className="text-sm text-muted-foreground">
                  {employee?.subrole ? employee.subrole.charAt(0).toUpperCase() + employee.subrole.slice(1) : 'No asignado'}
                </p>
              </div>
            </div>
            {employee?.dni && (
              <div>
                <Label className="text-sm font-medium">DNI</Label>
                <p className="text-sm text-muted-foreground">{employee.dni}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>
              Configura tus preferencias de notificaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notificaciones de tareas</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe notificaciones cuando se te asignen nuevas tareas o se modifiquen las existentes.
                </p>
              </div>
              <Switch
                checked={preferences.enabled}
                onCheckedChange={async (enabled) => {
                  const result = await toggleNotifications(enabled);
                  if (result.error) {
                    toast({
                      title: "Error",
                      description: "No se pudo actualizar la configuración de notificaciones.",
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Configuración actualizada",
                      description: `Las notificaciones han sido ${enabled ? 'activadas' : 'desactivadas'}.`,
                    });
                  }
                }}
                disabled={preferencesLoading}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Limpiar todas las notificaciones</Label>
                <p className="text-sm text-muted-foreground">
                  Elimina todas las notificaciones existentes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await clearAllNotifications();
                  if (result.error) {
                    toast({
                      title: "Error",
                      description: "No se pudieron eliminar las notificaciones.",
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Notificaciones eliminadas",
                      description: "Todas las notificaciones han sido eliminadas.",
                    });
                  }
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
