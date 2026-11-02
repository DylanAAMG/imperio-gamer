// Datos de los torneos. Lo usan la página y la API: se edita solo acá.
// `detalles`: cada texto se muestra como un renglón en la página del torneo.
// `cierre`: momento en que se cierra la inscripción (hora de Argentina).

export const TORNEOS = [
  {
    id: "fifa",
    juego: "FIFA",
    titulo: "FIFA 1v1",
    tipo: "individual",
    cupos: 16,
    fecha: "2026-11-05",
    dia: "Jueves",
    numero: 5,
    formato: "Individual, 1 contra 1",
    cierre: "2026-11-05T00:00:00-03:00",
    detalles: [],
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
    cierre: "2026-11-12T00:00:00-03:00",
    detalles: [],
  },
  {
    id: "lol",
    juego: "League of Legends",
    titulo: "League of Legends",
    tipo: "equipo",
    cupos: 8,
    jugadores: 5,
    fecha: "2026-11-19",
    dia: "Jueves",
    numero: 19,
    formato: "Por equipos de 5",
    cierre: "2026-11-19T00:00:00-03:00",
    detalles: [],
  },
];

export const buscarTorneo = (id) => TORNEOS.find((t) => t.id === id);
export const estaAbierto = (t, ahora = new Date()) => ahora < new Date(t.cierre);
