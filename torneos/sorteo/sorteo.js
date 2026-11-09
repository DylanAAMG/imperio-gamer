// Sorteos: lógica y dibujo compartidos por la página pública y el editor.
import { htmlLlave, llaveVacia, ubicar } from "/torneos/llaves/llave.js";

export const JUEGOS = [
  { id: "fifa", nombre: "FIFA 26", porEquipo: 1 },
  { id: "rocket-league", nombre: "Rocket League", porEquipo: 2 },
  { id: "valorant", nombre: "Valorant", porEquipo: 5 },
  { id: "lol", nombre: "League of Legends", porEquipo: 5 },
  { id: "cs2", nombre: "Counter-Strike 2", porEquipo: 5 },
  { id: "fortnite", nombre: "Fortnite", porEquipo: 2 },
  { id: "otro", nombre: "Otro juego", porEquipo: 1 },
];

export const MAX_NOMBRES = 500;

function azar(max) {
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

export function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// cfg: { modo: "equipos" | "ganadores", nombres, porEquipo, cruces, cantidad }
export function sortear(cfg) {
  const nombres = mezclar(cfg.nombres);
  if (cfg.modo === "ganadores") return { ganadores: nombres.slice(0, cfg.cantidad) };
  const n = cfg.porEquipo;
  const completos = Math.floor(nombres.length / n);
  const equipos = Array.from({ length: completos }, (_, i) => nombres.slice(i * n, (i + 1) * n));
  const sobrantes = nombres.slice(completos * n);
  const cruces = [];
  if (cfg.cruces) {
    for (let i = 0; i < equipos.length; i += 2) cruces.push([i, i + 1 < equipos.length ? i + 1 : -1]);
  }
  return { equipos, sobrantes, cruces };
}

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function tarjetaEquipo(d, i, k) {
  const miembros = d.resultado.equipos[i];
  if (d.porEquipo === 1) return `<div class="s-lado revela" style="--k:${k}">${esc(miembros[0])}</div>`;
  return `<div class="s-equipo revela" style="--k:${k}"><h4>Equipo ${i + 1}</h4><ul>${miembros.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`;
}

// Con cruces, el sorteo se muestra como llave eliminatoria (hasta 32 participantes).
export function llaveDeSorteo(d) {
  if (d.modo !== "equipos" || !d.cruces) return null;
  const nombres = d.resultado.equipos.map((e, i) => (d.porEquipo === 1 ? e[0] : `Equipo ${i + 1}`));
  if (nombres.length < 2 || nombres.length > 32) return null;
  let tamano = 4;
  while (tamano < nombres.length) tamano *= 2;
  return { ...llaveVacia(tamano), participantes: ubicar(nombres, tamano) };
}

export function htmlResultado(d) {
  const llave = llaveDeSorteo(d);
  if (llave) {
    let html = `<div class="llave-scroll s-llave revela" style="--k:0" tabindex="0" aria-label="Llave del sorteo">${htmlLlave(llave)}</div>`;
    if (d.porEquipo > 1) {
      html += `<h3 class="s-subtitulo">Equipos</h3><div class="s-equipos">${d.resultado.equipos.map((_, i) => tarjetaEquipo(d, i, i + 1)).join("")}</div>`;
    }
    if (d.resultado.sobrantes?.length) {
      html += `<p class="s-sobrantes">Sin equipo completo: ${d.resultado.sobrantes.map(esc).join(", ")}.</p>`;
    }
    return html;
  }

  const r = d.resultado;
  let k = 0;
  let cuerpo = "";
  if (d.modo === "ganadores") {
    cuerpo = `<ol class="s-ganadores">${r.ganadores.map((g) => `<li class="revela" style="--k:${k++}">${esc(g)}</li>`).join("")}</ol>`;
  } else if (d.cruces && r.cruces.length) {
    cuerpo = `<div class="s-cruces">${r.cruces
      .map(([a, b], i) => {
        const izq = tarjetaEquipo(d, a, k++);
        const der = b < 0 ? `<div class="s-lado s-libre revela" style="--k:${k++}">Pasa libre</div>` : tarjetaEquipo(d, b, k++);
        return `<div class="s-cruce${d.porEquipo > 1 ? " s-cruce-equipos" : ""}"><span class="s-num">Partido ${i + 1}</span>${izq}<b>vs</b>${der}</div>`;
      })
      .join("")}</div>`;
  } else {
    cuerpo = `<div class="s-equipos">${r.equipos.map((_, i) => tarjetaEquipo(d, i, k++)).join("")}</div>`;
  }
  if (r.sobrantes?.length) {
    cuerpo += `<p class="s-sobrantes">Sin equipo completo: ${r.sobrantes.map(esc).join(", ")}.</p>`;
  }
  return cuerpo;
}

export function resumen(d) {
  const total = `${d.nombres.length} ${d.nombres.length === 1 ? "participante" : "participantes"}`;
  if (d.modo === "ganadores") return `${total}. ${d.cantidad === 1 ? "Sale 1 ganador" : `Salen ${d.cantidad} ganadores`}.`;
  if (d.porEquipo === 1) return `${total}, cruces 1 contra 1.`;
  return `${total}, equipos de ${d.porEquipo}${d.cruces ? " con cruces" : ""}.`;
}
