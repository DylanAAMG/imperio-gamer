import { TORNEOS, estaAbierto } from "../torneos/datos.js";
import { leerCupos } from "./_lib/db.js";
import { responder, responderErrorDeBase } from "./_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return responder(res, 405, { error: "Método no permitido" });
  try {
    const cupos = await leerCupos();
    responder(res, 200, {
      torneos: TORNEOS.map((t) => ({
        id: t.id,
        anotados: cupos[t.id] ?? 0,
        cupos: t.cupos,
        abierto: estaAbierto(t),
      })),
    });
  } catch (e) {
    responderErrorDeBase(res, e);
  }
}
