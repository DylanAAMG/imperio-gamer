import { buscarTorneo, estaAbierto } from "../torneos/datos.js";
import { inscribir } from "./_lib/db.js";
import { leerJson, responder, responderErrorDeBase } from "./_lib/http.js";
import { errorDuplicado, validarInscripcion } from "./_lib/validar.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return responder(res, 405, { error: "Método no permitido" });

  let cuerpo;
  try {
    cuerpo = await leerJson(req);
  } catch {
    return responder(res, 400, { error: "No se pudo leer el formulario." });
  }

  const t = buscarTorneo(cuerpo.torneo);
  if (!t) return responder(res, 404, { error: "Ese torneo no existe." });
  if (!estaAbierto(t)) {
    return responder(res, 409, { error: "La inscripción a este torneo ya cerró.", motivo: "cerrado" });
  }

  // Campo oculto: solo lo completan los bots. Se responde como si nada para no darles pistas.
  if (cuerpo.sitio) return responder(res, 201, { ok: true, puesto: null, cupos: t.cupos });

  const { datos, errores } = validarInscripcion(t, cuerpo);
  if (errores) return responder(res, 422, { errores });

  try {
    const puesto = await inscribir(t, datos);
    if (puesto === null) {
      return responder(res, 409, { error: "Se completaron los cupos de este torneo.", motivo: "lleno" });
    }
    responder(res, 201, { ok: true, puesto, cupos: t.cupos });
  } catch (e) {
    const duplicado = errorDuplicado(e, t);
    if (duplicado) return responder(res, 422, { errores: duplicado });
    responderErrorDeBase(res, e);
  }
}
