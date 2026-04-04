
"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Anchor, Ship, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/components/auth-provider";
import logoFull from "../../logo.png";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, isLoading, role } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  
  const [showPassword, setShowPassword] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [hasAttemptedLogin, setHasAttemptedLogin] = React.useState(false);

  React.useEffect(() => {
    // Solo redirigir si el usuario ya intentó hacer login o si ya está autenticado
    if (hasAttemptedLogin && role) {
      if (role === "admin") {
        router.push("/dashboard");
      } else if (role === "employee") {
        router.push("/my-tasks");
      }
    }
  }, [role, router, hasAttemptedLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHasAttemptedLogin(true);

    const result = await login(email, password);
    if (result && result.error) {
      setError(result.error);
      setHasAttemptedLogin(false);
    } else if (result) {
      const dest = result.subrole === 'admin' || result.subrole === 'encargado'
        ? '/dashboard'
        : '/my-tasks';
      router.push(dest);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  
  const handleLogout = async () => {
    await logout();
    setHasAttemptedLogin(false);
    setEmail("");
    setPassword("");
    setError(null);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <Image src={logoFull} alt="Stella Maris" width={280} height={140} className="h-auto w-56" priority />
            </div>
            <CardTitle className="font-headline text-3xl">Stella Maris Manager</CardTitle>
            <CardDescription>
              Inicie sesión para gestionar las tareas de la guardería.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="empleado@stellamaris.com" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
            {/* <Button variant="link" size="sm" className="w-full font-normal text-muted-foreground">
              ¿Olvidó su contraseña?
            </Button> */}
            {role && !hasAttemptedLogin && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
