import { TORNEOS, buscarTorneo, estaAbierto } from "/torneos/datos.js";

const lista = document.getElementById("torneos");
const dialogo = document.getElementById("dialogo");
const WHATSAPP = "https://wa.me/5491122602953";

// null = todavía no se sabe o no se pudo consultar.
const estado = Object.fromEntries(TORNEOS.map((t) => [t.id, { anotados: null, abierto: estaAbierto(t) }]));

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function textoConteo(t, { anotados, abierto }) {
  if (!abierto) return "Inscripción cerrada";
  if (anotados === null) return "";
  const libres = t.cupos - anotados;
  if (libres <= 0) return `Cupos completos: ${t.cupos} de ${t.cupos}`;
  return `${libres === 1 ? "Queda 1 lugar" : `Quedan ${libres} lugares`} de ${t.cupos}`;
}

function htmlTorneo(t) {
  const e = estado[t.id];
  const lleno = e.anotados !== null && e.anotados >= t.cupos;
  const puede = e.abierto && !lleno;
  const accion = t.tipo === "equipo" ? "Anotar equipo" : "Anotarme";
  const textoBoton = !e.abierto ? "Inscripción cerrada" : lleno ? "Cupos completos" : accion;
  const lugares = Array.from({ length: t.cupos }, (_, i) => {
    const ocupado = e.anotados !== null && i < e.anotados;
    return `<li${ocupado ? ` class="ocupado" style="--i:${i}"` : ""}></li>`;
  }).join("");
  const detalles = t.detalles.length
    ? `<ul class="detalles">${t.detalles.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
    : `<ul class="detalles pendiente"><li>Horario, reglas y premios: se publican pronto.</li></ul>`;

  return `<article class="torneo" id="${t.id}">
    <div class="fecha"><b>${t.numero}</b><span>${t.dia}<br>de noviembre</span></div>
    <div class="cuerpo">
      <div><h2>${esc(t.titulo)}</h2><p class="formato">${esc(t.formato)}</p></div>
      <ul class="cupos" style="--n:${t.cupos}" aria-hidden="true">${lugares}</ul>
      <p class="conteo${e.abierto && e.anotados !== null && t.cupos - e.anotados <= 3 ? " aviso" : ""}">${textoConteo(t, e)}</p>
      ${detalles}
      <button class="boton" type="button" data-torneo="${t.id}"${puede ? "" : " disabled"}>${textoBoton}</button>
    </div>
  </article>`;
}

function pintar() {
  lista.innerHTML = TORNEOS.map(htmlTorneo).join("");
}

async function actualizarCupos() {
  try {
    const r = await fetch("/api/torneos", { cache: "no-store" });
    if (!r.ok) throw new Error();
    const { torneos } = await r.json();
    for (const t of torneos) estado[t.id] = { anotados: t.anotados, abierto: t.abierto };
    pintar();
  } catch {
    /* La página sigue siendo usable: el servidor es quien controla los cupos al anotarse. */
  }
}

function campo(nombre, etiqueta, { tipo = "text", ayuda = "", auto = "", extra = "" } = {}) {
  const idAyuda = ayuda ? ` aria-describedby="ayuda-${nombre}"` : "";
  return `<div class="campo">
    <label for="c-${nombre}">${etiqueta}</label>
    ${ayuda ? `<small id="ayuda-${nombre}">${ayuda}</small>` : ""}
    <input id="c-${nombre}" name="${nombre}" type="${tipo}" required${auto ? ` autocomplete="${auto}"` : ""}${idAyuda} ${extra}>
    <span class="error" data-error="${nombre}" hidden></span>
  </div>`;
}

function htmlFormulario(t) {
  const equipo = t.tipo === "equipo";
  const jugadores = equipo
    ? `<fieldset>
        <legend>Jugadores</legend>
        <p>Riot ID de los ${t.jugadores} titulares, con el formato Nombre#TAG.</p>
        ${Array.from({ length: t.jugadores }, (_, i) =>
          campo(`jugador${i}`, `Jugador ${i + 1}${i === 0 ? " (capitán)" : ""}`, { extra: 'placeholder="Nombre#TAG" autocapitalize="off" spellcheck="false"' })
        ).join("")}
      </fieldset>`
    : "";

  return `<form class="hoja" novalidate>
    <div class="hoja-cabeza">
      <div>
        <h2 id="dialogo-titulo">${esc(t.titulo)}</h2>
        <p class="hoja-fecha">${t.dia} ${t.numero} de noviembre</p>
      </div>
      <button class="cerrar" type="button" data-cerrar aria-label="Cerrar">×</button>
    </div>
    <div class="error-general" role="alert" hidden></div>
    ${campo("participante", equipo ? "Nombre del equipo" : "Usuario del juego", { ayuda: equipo ? "" : "Con este nombre vas a figurar en el torneo." })}
    ${campo("nombre", equipo ? "Nombre y apellido del capitán" : "Nombre y apellido", { auto: "name" })}
    ${campo("whatsapp", equipo ? "WhatsApp del capitán" : "WhatsApp", { tipo: "tel", auto: "tel", ayuda: "Por acá te avisamos los cruces." })}
    ${campo("email", "Email", { tipo: "email", auto: "email" })}
    ${jugadores}
    <div class="trampa" aria-hidden="true"><label>Sitio web <input name="sitio" tabindex="-1" autocomplete="off"></label></div>
    <p class="aviso-datos">Usamos estos datos solo para organizar el torneo.</p>
    <button class="boton" type="submit">${equipo ? "Anotar equipo" : "Anotarme"}</button>
  </form>`;
}

function abrir(t) {
  dialogo.innerHTML = htmlFormulario(t);
  dialogo.dataset.torneo = t.id;
  dialogo.showModal();
}

function mostrarErrores(form, errores) {
  form.querySelectorAll("[data-error]").forEach((n) => {
    const mensaje = errores[n.dataset.error];
    n.hidden = !mensaje;
    n.textContent = mensaje ?? "";
    form.elements[n.dataset.error].setAttribute("aria-invalid", mensaje ? "true" : "false");
  });
  form.querySelector('[aria-invalid="true"]')?.focus();
}

function mostrarExito(t, puesto) {
  const nombre = t.tipo === "equipo" ? "Tu equipo quedó anotado" : "Quedaste anotado";
  dialogo.innerHTML = `<div class="hoja exito">
    <h2 id="dialogo-titulo">${nombre}</h2>
    <p><strong>${esc(t.titulo)}</strong>, ${t.dia.toLowerCase()} ${t.numero} de noviembre.${puesto ? ` Tenés el lugar ${puesto} de ${t.cupos}.` : ""}</p>
    <p>Te vamos a escribir por WhatsApp con los cruces.</p>
    <button class="boton" type="button" data-cerrar>Listo</button>
  </div>`;
  dialogo.querySelector("[data-cerrar]").focus();
}

async function enviar(form) {
  const t = buscarTorneo(dialogo.dataset.torneo);
  const general = form.querySelector(".error-general");
  const boton = form.querySelector('[type="submit"]');
  const textoBoton = boton.textContent;
  const f = new FormData(form);
  const cuerpo = Object.fromEntries(f);
  cuerpo.torneo = t.id;
  if (t.tipo === "equipo") cuerpo.jugadores = Array.from({ length: t.jugadores }, (_, i) => f.get(`jugador${i}`));

  general.hidden = true;
  boton.disabled = true;
  boton.textContent = "Anotando…";
  try {
    const r = await fetch("/api/inscripciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const d = await r.json();
    if (r.ok) {
      mostrarExito(t, d.puesto);
      actualizarCupos();
      return;
    }
    if (d.errores) {
      mostrarErrores(form, d.errores);
    } else {
      general.textContent = d.error;
      general.hidden = false;
      if (d.motivo) actualizarCupos();
    }
  } catch {
    general.innerHTML = `No se pudo enviar la inscripción. Revisá tu conexión y volvé a intentar, o <a href="${WHATSAPP}" target="_blank" rel="noopener">escribinos por WhatsApp</a>.`;
    general.hidden = false;
  }
  boton.disabled = false;
  boton.textContent = textoBoton;
}

lista.addEventListener("click", (e) => {
  const b = e.target.closest("[data-torneo]");
  if (b && !b.disabled) abrir(buscarTorneo(b.dataset.torneo));
});
dialogo.addEventListener("click", (e) => {
  if (e.target.closest("[data-cerrar]")) dialogo.close();
});
dialogo.addEventListener("submit", (e) => {
  e.preventDefault();
  enviar(e.target);
});

pintar();
actualizarCupos();
