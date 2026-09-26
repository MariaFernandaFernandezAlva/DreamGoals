import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// Reproduce un acorde con el Web Audio API — no depende de ningún
// archivo de sonido externo. Si el navegador bloquea el audio
// (porque el usuario todavía no interactuó con la página),
// simplemente no suena, pero el confeti se ve igual.
// "grande" agrega una cuarta nota (una octava más arriba) y un
// poco más de duración, para que se sienta más importante que el
// festejo de una minimeta.
function reproducirSonidoCelebracion(grande: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const notas = grande
      ? [523.25, 659.25, 783.99, 1046.5] // Do5 - Mi5 - Sol5 - Do6
      : [523.25, 659.25, 783.99]; // Do5 - Mi5 - Sol5
    const duracion = grande ? 0.7 : 0.5;

    notas.forEach((frecuencia, i) => {
      const oscilador = ctx.createOscillator();
      const ganancia = ctx.createGain();
      oscilador.type = 'sine';
      oscilador.frequency.value = frecuencia;

      const inicio = ctx.currentTime + i * 0.08;
      // Sube rápido el volumen y lo deja caer suave — así cada nota
      // se escucha como un "ding" corto, no como un tono plano.
      ganancia.gain.setValueAtTime(0, inicio);
      ganancia.gain.linearRampToValueAtTime(grande ? 0.25 : 0.2, inicio + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);

      oscilador.connect(ganancia).connect(ctx.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + duracion);
    });
  } catch {
    // Web Audio no disponible o bloqueado — no es crítico, seguimos.
  }
}

interface CelebracionProps {
  // Cuando pasa de false a true, dispara confeti + sonido una vez.
  // No vuelve a hacer nada hasta que "trigger" vuelva a false y
  // luego a true de nuevo.
  trigger: boolean;
  // 'minimeta' (por defecto): un estallido de confeti normal.
  // 'meta': la meta completa se logró — más confeti, en dos
  // ráfagas (una al toque y otra medio segundo después) para que
  // se sienta como un festejo más grande.
  intensidad?: 'minimeta' | 'meta';
}

// Componente "invisible": no dibuja nada propio en el layout (el
// confeti pinta sobre un <canvas> a pantalla completa que la
// librería crea y destruye sola). Se usa así:
//   <Celebracion trigger={celebrarMinimeta} />
//   <Celebracion trigger={celebrarMetaCompleta} intensidad="meta" />
// donde ambos "trigger" vienen de useCelebrarMinimetas (ver nota en
// ese archivo sobre cómo se evita que se disparen los dos a la vez).
export function Celebracion({ trigger, intensidad = 'minimeta' }: CelebracionProps) {
  const yaDisparadoRef = useRef(false);

  useEffect(() => {
    if (!trigger || yaDisparadoRef.current) return;
    yaDisparadoRef.current = true;

    if (intensidad === 'meta') {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, zIndex: 9999 });
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 160, origin: { y: 0.4 }, zIndex: 9999 });
      }, 400);
    } else {
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
    }
    reproducirSonidoCelebracion(intensidad === 'meta');
  }, [trigger, intensidad]);

  // Si "trigger" vuelve a false (porque el padre lo resetea), se
  // permite disparar de nuevo la próxima vez que vuelva a true.
  useEffect(() => {
    if (!trigger) yaDisparadoRef.current = false;
  }, [trigger]);

  return null;
}