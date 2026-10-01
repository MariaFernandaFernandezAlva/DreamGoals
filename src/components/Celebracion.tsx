import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

function reproducirSonidoCelebracion(grande: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const notas = grande
      ? [523.25, 659.25, 783.99, 1046.5]
      : [523.25, 659.25, 783.99];
    const duracion = grande ? 0.7 : 0.5;

    notas.forEach((frecuencia, i) => {
      const oscilador = ctx.createOscillator();
      const ganancia = ctx.createGain();
      oscilador.type = 'sine';
      oscilador.frequency.value = frecuencia;

      const inicio = ctx.currentTime + i * 0.08;
      ganancia.gain.setValueAtTime(0, inicio);
      ganancia.gain.linearRampToValueAtTime(grande ? 0.25 : 0.2, inicio + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);

      oscilador.connect(ganancia).connect(ctx.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + duracion);
    });
  } catch {
  }
}

interface CelebracionProps {
  trigger: boolean;
  intensidad?: 'minimeta' | 'meta';
}

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

  useEffect(() => {
    if (!trigger) yaDisparadoRef.current = false;
  }, [trigger]);

  return null;
}