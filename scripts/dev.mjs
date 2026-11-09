// Servidor local de prueba: sirve la web y la API con una base temporal en memoria.
// Uso: npm run dev (después abrir http://localhost:3000/torneos)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { usarDriver } from "../api/_lib/db.js";
import admin from "../api/admin.js";
import inscripciones from "../api/inscripciones.js";
import llaves from "../api/llaves.js";
import torneos from "../api/torneos.js";

const raiz = process.cwd();
const puerto = Number(process.env.PORT ?? 3000);
process.env.ADMIN_PASSWORD ??= "prueba";

const pg = new PGlite();
usarDriver(async (texto, params = []) => (await pg.query(texto, params)).rows);

const rutas = { "/api/admin": admin, "/api/inscripciones": inscripciones, "/api/llaves": llaves, "/api/torneos": torneos };
const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://local");
  if (rutas[pathname]) return rutas[pathname](req, res);
  try {
    let archivo = join(raiz, normalize(pathname));
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, "index.html");
    res.setHeader("Content-Type", tipos[extname(archivo)] ?? "application/octet-stream");
    res.end(await readFile(archivo));
  } catch {
    res.statusCode = 404;
    res.end("No encontrado");
  }
}).listen(puerto, () => console.log(`http://localhost:${puerto}/torneos`));
