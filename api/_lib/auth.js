import { createHash, timingSafeEqual } from "node:crypto";

const resumen = (v) => createHash("sha256").update(v).digest();

export function autorizado(req) {
  const clave = process.env.ADMIN_PASSWORD;
  if (!clave) return false;
  const enviada = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  return timingSafeEqual(resumen(enviada), resumen(clave));
}

// Una pequeña espera vuelve impráctico probar contraseñas en masa.
export const esperaPorClaveIncorrecta = () => new Promise((r) => setTimeout(r, 800));
