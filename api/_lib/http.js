export function responder(res, estado, cuerpo) {
  res.statusCode = estado;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(cuerpo));
}

export async function leerJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  let texto = "";
  for await (const parte of req) {
    texto += parte;
    if (texto.length > 20000) throw new SyntaxError("Cuerpo demasiado largo");
  }
  return JSON.parse(texto || "{}");
}

export function responderErrorDeBase(res, e) {
  console.error(e);
  responder(res, 503, {
    error: "Las inscripciones no están disponibles en este momento. Probá de nuevo en unos minutos.",
  });
}
