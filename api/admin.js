import { createHash, timingSafeEqual } from "node:crypto";
import { borrarInscripcion, leerCupos, listarInscripciones } from "./_lib/db.js";
import { responder, responderErrorDeBase } from "./_lib/http.js";

const resumen = (v) => createHash("sha256").update(v).digest();

function autorizado(req) {
  const clave = process.env.ADMIN_PASSWORD;
  if (!clave) return false;
  const enviada = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  return timingSafeEqual(resumen(enviada), resumen(clave));
}

export default async function handler(req, res) {
  if (!autorizado(req)) {
    // Una pequeña espera vuelve impráctico probar contraseñas en masa.
    await new Promise((r) => setTimeout(r, 800));
    return responder(res, 401, { error: "Contraseña incorrecta." });
  }

  try {
    if (req.method === "GET") {
      const [inscripciones, cupos] = await Promise.all([listarInscripciones(), leerCupos()]);
      return responder(res, 200, { inscripciones, cupos });
    }
    if (req.method === "DELETE") {
      const id = new URL(req.url, "http://local").searchParams.get("id");
      if (!/^\d+$/.test(id ?? "")) return responder(res, 400, { error: "Falta el id." });
      const ok = await borrarInscripcion(id);
      return responder(res, ok ? 200 : 404, ok ? { ok } : { error: "Esa inscripción ya no existe." });
    }
    responder(res, 405, { error: "Método no permitido" });
  } catch (e) {
    responderErrorDeBase(res, e);
  }
}
