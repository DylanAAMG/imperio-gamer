import { neon } from "@neondatabase/serverless";
import { TORNEOS } from "../../torneos/datos.js";

let driver = null;
let esquemaListo = null;

// Permite usar otra base en desarrollo local (ver scripts/dev.mjs).
export function usarDriver(d) {
  driver = d;
  esquemaListo = null;
}

function obtenerDriver() {
  if (driver) return driver;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    const e = new Error("Falta DATABASE_URL");
    e.sinBase = true;
    throw e;
  }
  const sql = neon(url);
  driver = (texto, params = []) => sql.query(texto, params);
  return driver;
}

const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS torneo_cupos (
     torneo_id text PRIMARY KEY,
     anotados integer NOT NULL DEFAULT 0 CHECK (anotados >= 0)
   )`,
  `CREATE TABLE IF NOT EXISTS inscripciones (
     id bigserial PRIMARY KEY,
     torneo_id text NOT NULL REFERENCES torneo_cupos (torneo_id),
     participante text NOT NULL,
     nombre text NOT NULL,
     whatsapp text NOT NULL,
     email text NOT NULL,
     jugadores jsonb NOT NULL DEFAULT '[]',
     creado_en timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_participante ON inscripciones (torneo_id, lower(participante))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_email ON inscripciones (torneo_id, email)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp ON inscripciones (torneo_id, whatsapp)`,
  `CREATE TABLE IF NOT EXISTS llaves (
     torneo_id text PRIMARY KEY,
     datos jsonb NOT NULL,
     actualizado timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS sorteos (
     juego text PRIMARY KEY,
     datos jsonb NOT NULL,
     actualizado timestamptz NOT NULL DEFAULT now()
   )`,
];

async function prepararEsquema() {
  const q = obtenerDriver();
  for (const s of ESQUEMA) await q(s);
  for (const t of TORNEOS) {
    await q(`INSERT INTO torneo_cupos (torneo_id) VALUES ($1) ON CONFLICT DO NOTHING`, [t.id]);
  }
}

export async function consulta(texto, params = []) {
  const q = obtenerDriver();
  esquemaListo ??= prepararEsquema().catch((e) => {
    esquemaListo = null;
    throw e;
  });
  await esquemaListo;
  return q(texto, params);
}

export async function leerCupos() {
  const filas = await consulta(`SELECT torneo_id, anotados FROM torneo_cupos`);
  return Object.fromEntries(filas.map((f) => [f.torneo_id, Number(f.anotados)]));
}

// Una sola sentencia: el contador y la inscripción se guardan juntos o no se
// guarda nada. El UPDATE bloquea la fila del torneo, así que dos personas no
// pueden quedarse con el último lugar al mismo tiempo. Devuelve null si no hay lugar.
export async function inscribir(t, d) {
  const filas = await consulta(
    `WITH lugar AS (
       UPDATE torneo_cupos SET anotados = anotados + 1
       WHERE torneo_id = $1 AND anotados < $2::int
       RETURNING anotados
     )
     INSERT INTO inscripciones (torneo_id, participante, nombre, whatsapp, email, jugadores)
     SELECT $1, $3::text, $4::text, $5::text, $6::text, $7::jsonb FROM lugar
     RETURNING id, (SELECT anotados FROM lugar) AS puesto`,
    [t.id, t.cupos, d.participante, d.nombre, d.whatsapp, d.email, JSON.stringify(d.jugadores)]
  );
  return filas[0] ? Number(filas[0].puesto) : null;
}

export async function listarInscripciones() {
  return consulta(
    `SELECT id, torneo_id, participante, nombre, whatsapp, email, jugadores, creado_en
     FROM inscripciones ORDER BY torneo_id, creado_en`
  );
}

// Borra la inscripción y libera su lugar en la misma sentencia.
export async function borrarInscripcion(id) {
  const filas = await consulta(
    `WITH borrada AS (DELETE FROM inscripciones WHERE id = $1 RETURNING torneo_id)
     UPDATE torneo_cupos SET anotados = anotados - 1
     WHERE torneo_id IN (SELECT torneo_id FROM borrada)
     RETURNING torneo_id`,
    [id]
  );
  return filas.length > 0;
}

// Llaves eliminatorias: una fila por torneo con los cruces, ganadores y resultados.
export async function leerLlaves() {
  const filas = await consulta(`SELECT torneo_id, datos, actualizado FROM llaves`);
  return Object.fromEntries(
    filas.map((f) => [
      f.torneo_id,
      { datos: typeof f.datos === "string" ? JSON.parse(f.datos) : f.datos, actualizado: f.actualizado },
    ])
  );
}

export async function guardarLlave(id, datos) {
  const filas = await consulta(
    `INSERT INTO llaves (torneo_id, datos) VALUES ($1, $2::jsonb)
     ON CONFLICT (torneo_id) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now()
     RETURNING actualizado`,
    [id, JSON.stringify(datos)]
  );
  return filas[0].actualizado;
}

// Sorteos: uno publicado por juego. Al volver a sortear, se reemplaza.
export async function leerSorteos() {
  const filas = await consulta(`SELECT juego, datos, actualizado FROM sorteos`);
  return Object.fromEntries(
    filas.map((f) => [
      f.juego,
      { datos: typeof f.datos === "string" ? JSON.parse(f.datos) : f.datos, actualizado: f.actualizado },
    ])
  );
}

export async function guardarSorteo(juego, datos) {
  const filas = await consulta(
    `INSERT INTO sorteos (juego, datos) VALUES ($1, $2::jsonb)
     ON CONFLICT (juego) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now()
     RETURNING actualizado`,
    [juego, JSON.stringify(datos)]
  );
  return filas[0].actualizado;
}

export async function borrarSorteo(juego) {
  await consulta(`DELETE FROM sorteos WHERE juego = $1`, [juego]);
}
