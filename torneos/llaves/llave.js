// Lógica y dibujo de las llaves. Lo usan la página pública y el editor.
// Partido único: cada cruce tiene un solo ganador, que pasa a la ronda siguiente.

export const LIBRE = Object.freeze({ libre: true });
const RONDAS = ["16avos de final", "Octavos de final", "Cuartos de final", "Semifinales", "Final"];

export const nombresRondas = (tamano) => RONDAS.slice(RONDAS.length - Math.log2(tamano));

export const llaveVacia = (tamano = 32) => ({
  tamano,
  participantes: Array(tamano).fill(""),
  ganadores: {},
  marcadores: {},
});

// Cada lado de un partido es un nombre, LIBRE (no hay rival) o null (todavía no se sabe).
export function resolver(d) {
  let lados = d.participantes.map((p) => (p && p.trim() ? p.trim() : LIBRE));
  const rondas = [];
  for (let r = 0; lados.length > 1; r++) {
    const partidos = [];
    for (let i = 0; i < lados.length / 2; i++) {
      const a = lados[2 * i];
      const b = lados[2 * i + 1];
      const clave = `${r}-${i}`;
      let ganador = null;
      if (a === LIBRE && b === LIBRE) ganador = LIBRE;
      else if (a === LIBRE) ganador = b;
      else if (b === LIBRE) ganador = a;
      else if (a && b) {
        const elegido = d.ganadores?.[clave];
        if (elegido === a || elegido === b) ganador = elegido;
      }
      partidos.push({ clave, a, b, ganador, marcador: d.marcadores?.[clave] ?? "" });
    }
    rondas.push(partidos);
    lados = partidos.map((p) => p.ganador);
  }
  const campeon = typeof lados[0] === "string" ? lados[0] : null;
  return { rondas, campeon };
}

// Borra ganadores y resultados que ya no corresponden (por ejemplo, si cambió un cruce anterior).
export function limpiarResultados(d) {
  const validos = new Set();
  for (const ronda of resolver(d).rondas) {
    for (const p of ronda) {
      if (typeof p.a === "string" && typeof p.b === "string" && typeof p.ganador === "string") {
        validos.add(p.clave);
      }
    }
  }
  for (const k of Object.keys(d.ganadores)) if (!validos.has(k)) delete d.ganadores[k];
  const enJuego = new Set(
    resolver(d).rondas.flat().filter((p) => typeof p.a === "string" && typeof p.b === "string").map((p) => p.clave)
  );
  for (const k of Object.keys(d.marcadores)) if (!enJuego.has(k)) delete d.marcadores[k];
  return d;
}

// Reparte los nombres en los lugares. Los pases libres quedan distribuidos en toda la llave,
// así nadie se cruza con otro jugador que pasó libre en la primera ronda.
export function ubicar(nombres, tamano) {
  const partidos = tamano / 2;
  const libres = tamano - nombres.length;
  const lugares = Array(tamano).fill("");
  let k = 0;
  for (let i = 0; i < partidos; i++) {
    const vacios = Math.floor(((i + 1) * libres) / partidos) - Math.floor((i * libres) / partidos);
    if (vacios < 2) lugares[2 * i] = nombres[k++] ?? "";
    if (vacios < 1) lugares[2 * i + 1] = nombres[k++] ?? "";
  }
  return lugares;
}

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function htmlLado(p, nombre, rival, editable) {
  const definido = typeof p.ganador === "string";
  const gano = definido && p.ganador === nombre;
  let clase = "lado";
  let texto = esc(nombre);
  if (nombre === LIBRE) {
    clase += " pendiente";
    texto = "Pase libre";
  } else if (!nombre) {
    clase += " pendiente";
    texto = "Por definir";
  } else if (gano) clase += " gano";
  else if (definido) clase += " perdio";

  if (editable && typeof nombre === "string" && typeof rival === "string") {
    return `<button type="button" class="${clase}" data-clave="${p.clave}" data-nombre="${esc(nombre)}" aria-pressed="${gano}">${texto}</button>`;
  }
  return `<div class="${clase}">${texto}</div>`;
}

function htmlPartido(p, editable) {
  const enJuego = typeof p.a === "string" && typeof p.b === "string";
  let marcador = "";
  if (editable && enJuego) {
    marcador = `<input class="marcador" data-clave="${p.clave}" value="${esc(p.marcador)}" placeholder="Resultado, ej. 2-1" aria-label="Resultado" maxlength="12">`;
  } else if (p.marcador) {
    marcador = `<span class="marcador">${esc(p.marcador)}</span>`;
  }
  const nulo = p.a === LIBRE && p.b === LIBRE ? " nulo" : "";
  return `<div class="celda"><div class="partido${nulo}">${htmlLado(p, p.a, p.b, editable)}${htmlLado(p, p.b, p.a, editable)}${marcador}</div></div>`;
}

export function htmlLlave(d, { editable = false } = {}) {
  const { rondas, campeon } = resolver(d);
  const nombres = nombresRondas(d.tamano);
  const columnas = rondas
    .map((partidos, r) => {
      let cuerpo = "";
      if (partidos.length === 1) cuerpo = htmlPartido(partidos[0], editable);
      else {
        for (let i = 0; i < partidos.length; i += 2) {
          cuerpo += `<div class="par">${htmlPartido(partidos[i], editable)}${htmlPartido(partidos[i + 1], editable)}</div>`;
        }
      }
      return `<section class="ronda${r ? " sigue" : ""}"><h3>${nombres[r]}</h3><div class="partidos">${cuerpo}</div></section>`;
    })
    .join("");
  const ganador = campeon
    ? `<div class="lado gano">${esc(campeon)}</div>`
    : `<div class="lado pendiente">Por definir</div>`;
  return `<div class="llave" style="--cols:${rondas.length + 1}">${columnas}<section class="ronda sigue campeon"><h3>Campeón</h3><div class="partidos"><div class="celda"><div class="partido">${ganador}</div></div></div></section></div>`;
}
