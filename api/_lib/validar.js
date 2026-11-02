const limpiar = (v) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RIOT_ID = /^[^#]{3,16}#[\p{L}\p{N}]{3,5}$/u;

// Devuelve { datos } o { errores: { campo: mensaje } }.
export function validarInscripcion(t, cuerpo) {
  const errores = {};
  const nombre = limpiar(cuerpo.nombre);
  const email = limpiar(cuerpo.email).toLowerCase();
  const whatsapp = limpiar(cuerpo.whatsapp).replace(/\D/g, "");
  const participante = limpiar(cuerpo.participante);

  if (nombre.length < 2 || nombre.length > 80) errores.nombre = "Escribí tu nombre y apellido.";
  if (!EMAIL.test(email) || email.length > 120) errores.email = "Escribí un email válido.";
  if (whatsapp.length < 10 || whatsapp.length > 15) {
    errores.whatsapp = "Escribí tu WhatsApp con código de área, por ejemplo 11 2345 6789.";
  }
  if (participante.length < 2 || participante.length > 40) {
    errores.participante =
      t.tipo === "equipo" ? "Escribí el nombre del equipo." : "Escribí tu usuario del juego.";
  }

  let jugadores = [];
  if (t.tipo === "equipo") {
    const lista = Array.isArray(cuerpo.jugadores) ? cuerpo.jugadores.map(limpiar) : [];
    jugadores = lista.slice(0, t.jugadores);
    for (let i = 0; i < t.jugadores; i++) {
      if (!RIOT_ID.test(jugadores[i] ?? "")) {
        errores[`jugador${i}`] = "Usá el formato Nombre#TAG, por ejemplo Dolan#LAS.";
      }
    }
    const vistos = new Set();
    jugadores.forEach((j, i) => {
      const clave = j.toLowerCase();
      if (j && vistos.has(clave)) errores[`jugador${i}`] = "Este jugador ya está en la lista.";
      vistos.add(clave);
    });
  }

  if (Object.keys(errores).length) return { errores };
  return { datos: { nombre, email, whatsapp, participante, jugadores } };
}

// Traduce una violación de índice único a un mensaje para el formulario.
export function errorDuplicado(e, t) {
  const texto = `${e?.constraint ?? ""} ${e?.message ?? ""}`;
  if (e?.code !== "23505" && !texto.includes("uq_")) return null;
  if (texto.includes("uq_email")) return { email: "Este email ya está anotado en este torneo." };
  if (texto.includes("uq_whatsapp")) {
    return { whatsapp: "Este WhatsApp ya está anotado en este torneo." };
  }
  return {
    participante:
      t.tipo === "equipo"
        ? "Ya hay un equipo anotado con ese nombre."
        : "Ese usuario ya está anotado en este torneo.",
  };
}
