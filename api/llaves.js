import { buscarTorneo } from "../torneos/datos.js";
import { autorizado, esperaPorClaveIncorrecta } from "./_lib/auth.js";
import { guardarLlave, leerLlaves } from "./_lib/db.js";
import { leerJson, responder, responderErrorDeBase } from "./_lib/http.js";

const texto = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

// Guarda solo lo que la página sabe dibujar: nombres de los lugares, ganadores y resultados.
function limpiarLlave(d) {
  const tamano = Number(d?.tamano);
  if (![4, 8, 16, 32].includes(tamano)) return null;
  const mapa = (o, max) =>
    Object.fromEntries(
      Object.entries(o && typeof o === "object" ? o : {})
        .filter(([k]) => /^\d-\d{1,2}$/.test(k))
        .slice(0, 64)
        .map(([k, v]) => [k, texto(v, max)])
        .filter(([, v]) => v)
    );
  return {
    tamano,
    participantes: Array.from({ length: tamano }, (_, i) => texto(d.participantes?.[i], 40)),
    ganadores: mapa(d.ganadores, 40),
    marcadores: mapa(d.marcadores, 12),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return responder(res, 200, { llaves: await leerLlaves() });
    }
    if (req.method !== "PUT") return responder(res, 405, { error: "Método no permitido" });

    if (!autorizado(req)) {
      await esperaPorClaveIncorrecta();
      return responder(res, 401, { error: "Contraseña incorrecta." });
    }
    let cuerpo;
    try {
      cuerpo = await leerJson(req);
    } catch {
      return responder(res, 400, { error: "No se pudo leer la llave." });
    }
    if (!buscarTorneo(cuerpo.torneo)) return responder(res, 404, { error: "Ese torneo no existe." });
    const datos = limpiarLlave(cuerpo.datos);
    if (!datos) return responder(res, 400, { error: "La llave no tiene un tamaño válido." });
    const actualizado = await guardarLlave(cuerpo.torneo, datos);
    responder(res, 200, { ok: true, actualizado });
  } catch (e) {
    responderErrorDeBase(res, e);
  }
}
