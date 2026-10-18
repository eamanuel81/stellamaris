"use client"

import React from "react"
import { ToastAction } from "@/components/ui/toast"
import { toast } from "@/hooks/use-toast"
import { isApiUrl, isCloudflareChallenge } from "@/lib/cloudflare-challenge"

// Si Cloudflare bloquea un pedido de la app con una verificación, avisa con un mensaje claro
// (sin perder lo que el usuario escribió) en lugar de dejar que parezca que no se guardó.
export function CloudflareChallengeGuard() {
  React.useEffect(() => {
    const originalFetch = window.fetch
    let shown = false

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await originalFetch(...args)
      if (!shown && isApiUrl(args[0]) && (await isCloudflareChallenge(res))) {
        shown = true
        toast({
          variant: "destructive",
          title: "Cloudflare pidió una verificación",
          description:
            "No se pudo completar la acción. Verificá en otra pestaña y volvé a intentar: lo que escribiste no se perdió.",
          duration: 60000,
          onOpenChange: (open: boolean) => { if (!open) shown = false },
          action: (
            <ToastAction altText="Verificar en otra pestaña" onClick={() => window.open(window.location.href, "_blank")}>
              Verificar
            </ToastAction>
          ),
        })
      }
      return res
    }

    return () => { window.fetch = originalFetch }
  }, [])

  return null
}
