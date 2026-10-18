// Cloudflare puede responder a un pedido de la API con una verificación ("Just a moment...")
// en vez de la respuesta de la app. Eso es lo que hacía parecer que "no guardaba".

const CHALLENGE_BODY = /challenge-platform|Just a moment|cf-chl|Attention Required/i;

// Detecta una respuesta de desafío de Cloudflare. Solo lee el cuerpo en el caso raro
// de una respuesta HTML de error, así que no cuesta nada en pedidos normales.
export async function isCloudflareChallenge(res: Response): Promise<boolean> {
  if (res.headers.get('cf-mitigated') === 'challenge') return true;
  const isErrorStatus = res.status === 403 || res.status === 429 || res.status === 503;
  const isHtml = (res.headers.get('content-type') ?? '').includes('text/html');
  if (!isErrorStatus || !isHtml) return false;
  try {
    return CHALLENGE_BODY.test(await res.clone().text());
  } catch {
    return false;
  }
}

export const isApiUrl = (input: RequestInfo | URL): boolean => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
};
