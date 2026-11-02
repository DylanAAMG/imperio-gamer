# Imperio Gamer

Web de coaching de League of Legends: https://imperiogamer.com.ar

Sitio estático (un solo `index.html` + carpeta `img/`). Se publica en Vercel sin build.

- Precios: buscar `data-ars="` en `index.html`.
- Cotizaciones USD/EUR: `const RATES` al final de `index.html`.

## Torneos

Página de inscripción en `/torneos`, con panel de organización en `/torneos/admin`.

- Fechas, cupos, reglas y cierre de inscripción: `torneos/datos.js`.
- API: carpeta `api/`, funciones de Vercel. Crea sus tablas sola la primera vez.
- Variables de entorno en Vercel: `DATABASE_URL` (base Neon Postgres) y `ADMIN_PASSWORD`.
- Probar en local: `npm install && npm run dev` y abrir `http://localhost:3000/torneos`. Usa una base temporal y la contraseña `prueba`.
