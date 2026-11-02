// Datos de los torneos. Lo usan la página y la API: se edita solo acá.
// `detalles`: cada texto se muestra como un renglón en la página del torneo.
// `cierre`: momento en que se cierra la inscripción (hora de Argentina).

export const TORNEOS = [
  {
    id: "fifa",
    juego: "FIFA 26",
    titulo: "FIFA 26",
    tipo: "individual",
    cupos: 16,
    fecha: "2026-11-09",
    dia: "Lunes",
    numero: 9,
    formato: "Individual, 1 contra 1",
    cierre: "2026-11-09T19:00:00-03:00",
    detalles: ["19 hs: empieza y termina el mismo día.", "Premios a definir."],
  },
  {
    id: "valorant",
    juego: "Valorant",
    titulo: "Valorant",
    tipo: "equipo",
    cupos: 8,
    jugadores: 5,
    fecha: "2026-11-12",
    dia: "Jueves",
    numero: 12,
    formato: "Por equipos de 5",
    cierre: "2026-11-12T19:00:00-03:00",
    detalles: [
      "Jueves 12, 19 hs: primera ronda.",
      "Miércoles 18, 19 hs: semifinales y final.",
      "Premios a definir.",
    ],
  },
  {
    id: "lol",
    juego: "League of Legends",
    titulo: "League of Legends",
    tipo: "equipo",
    cupos: 8,
    jugadores: 5,
    fecha: "2026-11-16",
    dia: "Lunes",
    numero: 16,
    formato: "Por equipos de 5",
    cierre: "2026-11-16T19:00:00-03:00",
    detalles: [
      "Lunes 16, 19 hs: primera ronda.",
      "Lunes 23, 19 hs: semifinales y final.",
      "Premios a definir.",
    ],
  },
];

export const buscarTorneo = (id) => TORNEOS.find((t) => t.id === id);
export const estaAbierto = (t, ahora = new Date()) => ahora < new Date(t.cierre);
