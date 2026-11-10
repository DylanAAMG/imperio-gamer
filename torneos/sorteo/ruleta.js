// Ruleta de la página pública. No decide nada: el ganador ya viene sorteado
// desde el editor y la rueda solo gira hasta dejarlo bajo la flecha.

const COLORES = ["#ff7a14", "#2a211b"];
const TERCERO = "#ffb13d";
const VUELTA = Math.PI * 2;

export function crearRuleta(canvas, etiqueta) {
  let lista = [];
  let angulo = 0;

  function medir() {
    const lado = canvas.clientWidth || 400;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(lado * dpr);
    canvas.height = Math.round(lado * dpr);
  }

  const paso = () => VUELTA / Math.max(1, lista.length);
  const bajoFlecha = () => {
    const a = (((-angulo) % VUELTA) + VUELTA) % VUELTA;
    return Math.min(lista.length - 1, Math.floor(a / paso()));
  };

  function dibujar() {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const r = w / 2;
    ctx.clearRect(0, 0, w, w);
    const n = lista.length;
    if (!n) return;
    const p = paso();
    const conTexto = n <= 60;
    const fuente = Math.max(9, Math.min(r * 0.075, r * p * 0.55));
    for (let i = 0; i < n; i++) {
      const a0 = angulo + i * p - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(r, r);
      ctx.arc(r, r, r - 1, a0, a0 + p);
      ctx.closePath();
      // Con cantidad impar, el último toma otro color para no repetir junto al primero.
      const color = n > 1 && n % 2 && i === n - 1 ? TERCERO : COLORES[i % 2];
      ctx.fillStyle = color;
      ctx.fill();
      if (conTexto) {
        ctx.save();
        ctx.translate(r, r);
        ctx.rotate(a0 + p / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = color === COLORES[1] ? "#f1ebe4" : "#000";
        ctx.font = `600 ${fuente}px Barlow, system-ui, sans-serif`;
        const nombre = lista[i].length > 18 ? `${lista[i].slice(0, 17)}…` : lista[i];
        ctx.fillText(nombre, r - fuente * 0.8, 0);
        ctx.restore();
      }
    }
    ctx.beginPath();
    ctx.arc(r, r, r * 0.11, 0, VUELTA);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.015);
    ctx.strokeStyle = "#ff7a14";
    ctx.stroke();
  }

  const mostrarActual = () => {
    if (etiqueta && lista.length) etiqueta.textContent = lista[bajoFlecha()];
  };

  // Ángulo que deja el centro del lugar i bajo la flecha, con un poco de margen al azar.
  function anguloPara(i) {
    const p = paso();
    const desvio = (Math.random() - 0.5) * p * 0.6;
    return -((i + 0.5) * p + desvio);
  }

  const observador = new ResizeObserver(() => {
    medir();
    dibujar();
  });
  observador.observe(canvas);
  medir();

  return {
    nombres(nuevos) {
      lista = [...nuevos];
      dibujar();
      mostrarActual();
    },
    apuntar(nombre) {
      const i = lista.indexOf(nombre);
      if (i < 0) return;
      angulo = anguloPara(i);
      dibujar();
      mostrarActual();
    },
    girarA(nombre, ms = 6000) {
      const i = lista.indexOf(nombre);
      if (i < 0) return Promise.resolve();
      const inicio = angulo;
      const destino = anguloPara(i);
      const vueltas = 5 + Math.floor(ms / 1500);
      const recorrido = ((((destino - inicio) % VUELTA) + VUELTA) % VUELTA) + VUELTA * vueltas;
      const t0 = performance.now();
      return new Promise((listo) => {
        function cuadro(t) {
          const x = Math.min(1, (t - t0) / ms);
          const frenado = 1 - Math.pow(1 - x, 4);
          angulo = inicio + recorrido * frenado;
          dibujar();
          mostrarActual();
          if (x < 1) requestAnimationFrame(cuadro);
          else {
            angulo = destino;
            dibujar();
            if (etiqueta) etiqueta.textContent = nombre;
            listo();
          }
        }
        requestAnimationFrame(cuadro);
      });
    },
  };
}
