import { autorizado, esperaPorClaveIncorrecta } from "./_lib/auth.js";
import { borrarSorteo, guardarSorteo, leerSorteos } from "./_lib/db.js";
import { leerJson, responder, responderErrorDeBase } from "./_lib/http.js";

const MAX = 500;
const texto = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const ID = /^[a-z0-9-]{1,30}$/;

// Acepta solo la forma que la página sabe dibujar.
function limpiarSorteo(d) {
  if (!d || typeof d !== "object") return null;
  const modo = d.modo === "ganadores" ? "ganadores" : "equipos";
  const nombres = (Array.isArray(d.nombres) ? d.nombres : []).map((n) => texto(n, 40)).filter(Boolean).slice(0, MAX);
  if (!nombres.length) return null;
  const lista = (v) => (Array.isArray(v) ? v.map((n) => texto(n, 40)).filter(Boolean).slice(0, MAX) : []);
  const porEquipo = Math.min(10, Math.max(1, Math.trunc(Number(d.porEquipo)) || 1));
  const cantidad = Math.min(nombres.length, Math.max(1, Math.trunc(Number(d.cantidad)) || 1));
  const r = d.resultado ?? {};
  const equipos = (Array.isArray(r.equipos) ? r.equipos : []).slice(0, MAX).map(lista).filter((e) => e.length);
  const cruces = (Array.isArray(r.cruces) ? r.cruces : [])
    .slice(0, MAX)
    .filter((c) => Array.isArray(c) && Number.isInteger(c[0]) && Number.isInteger(c[1]))
    .filter(([a, b]) => a >= 0 && a < equipos.length && b >= -1 && b < equipos.length)
    .map(([a, b]) => [a, b]);
  return {
    titulo: texto(d.titulo, 60) || "Sorteo",
    modo,
    porEquipo,
    cruces: Boolean(d.cruces),
    cantidad,
    nombres,
    resultado: modo === "ganadores" ? { ganadores: lista(r.ganadores) } : { equipos, sobrantes: lista(r.sobrantes), cruces },
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return responder(res, 200, { sorteos: await leerSorteos() });
    if (req.method !== "PUT" && req.method !== "DELETE") return responder(res, 405, { error: "Método no permitido" });

    if (!autorizado(req)) {
      await esperaPorClaveIncorrecta();
      return responder(res, 401, { error: "Contraseña incorrecta." });
    }

    if (req.method === "DELETE") {
      const juego = new URL(req.url, "http://local").searchParams.get("juego") ?? "";
      if (!ID.test(juego)) return responder(res, 400, { error: "Falta el juego." });
      await borrarSorteo(juego);
      return responder(res, 200, { ok: true });
    }

    let cuerpo;
    try {
      cuerpo = await leerJson(req);
    } catch {
      return responder(res, 400, { error: "No se pudo leer el sorteo." });
    }
    if (!ID.test(cuerpo.juego ?? "")) return responder(res, 400, { error: "Falta el juego." });
    const datos = limpiarSorteo(cuerpo.datos);
    if (!datos) return responder(res, 400, { error: "Cargá al menos un nombre." });
    const actualizado = await guardarSorteo(cuerpo.juego, datos);
    responder(res, 200, { ok: true, actualizado });
  } catch (e) {
    responderErrorDeBase(res, e);
  }
}
