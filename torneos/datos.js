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
    detalles: ["19 hs: empieza y termina el mismo día.", "Premio: un periférico."],
  },
  {
    id: "rocket-league",
    juego: "Rocket League",
    titulo: "Rocket League",
    tipo: "equipo",
    cupos: 8,
    jugadores: 2,
    fecha: "2026-11-12",
    dia: "Jueves",
    numero: 12,
    formato: "Por parejas, 2 contra 2",
    cierre: "2026-11-12T20:00:00-03:00",
    detalles: ["Jueves 12, 20 hs.", "Premio: periféricos."],
  },
  {
    id: "valorant-high",
    juego: "Valorant",
    riotId: true,
    titulo: "Valorant High Elo",
    tipo: "equipo",
    cupos: 8,
    jugadores: 5,
    fecha: "2026-11-16",
    dia: "Lunes",
    numero: 16,
    formato: "Por equipos de 5, de Diamante a Radiante",
    cierre: "2026-11-16T19:00:00-03:00",
    detalles: [
      "Lunes 16, 19 hs: primera ronda.",
      "Lunes 23, 19 hs: semifinales y final.",
      "Premio: combo de teclado, mouse y mousepad.",
    ],
  },
  {
    id: "valorant-low",
    juego: "Valorant",
    riotId: true,
    titulo: "Valorant Low Elo",
    tipo: "equipo",
    cupos: 8,
    jugadores: 5,
    fecha: "2026-11-17",
    dia: "Martes",
    numero: 17,
    formato: "Por equipos de 5, de Hierro a Platino",
    cierre: "2026-11-17T19:00:00-03:00",
    detalles: [
      "Martes 17, 19 hs: primera ronda.",
      "Martes 24, 19 hs: semifinales y final.",
      "Premio a definir.",
    ],
  },
];

export const buscarTorneo = (id) => TORNEOS.find((t) => t.id === id);
export const estaAbierto = (t, ahora = new Date()) => ahora < new Date(t.cierre);
