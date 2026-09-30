import { useEffect, useState } from 'react';

const CLAVE_LOCALSTORAGE = 'dreamgoals-minimetas-celebradas';

function leerCelebradas(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LOCALSTORAGE) ?? '[]');
  } catch {
    return [];
  }
}

function guardarCelebradas(ids: string[]) {
  try {
    localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(ids));
  } catch {
    // localStorage lleno o bloqueado — no es crítico, simplemente
    // esa minimeta podría volver a "celebrar" en un futuro refresh.
  }
}

// Recibe los ids de las minimetas que están cumplidas AHORA MISMO
// (recalculado en cada render del dashboard, según lo acumulado) y
// devuelve `true` por un instante solo la primera vez que detecta
// una minimeta nueva entre las cumplidas — comparándolas contra las
// que ya quedaron guardadas como "ya celebradas" en localStorage.
//
// Así, si entras y sales del dashboard, o recargas la página, no te
// vuelve a saltar el confeti por algo que ya se cumplió hace días.
export function useCelebrarMinimetas(idsCumplidas: string[]) {
  const [celebrar, setCelebrar] = useState(false);

  useEffect(() => {
    const yaCelebradas = leerCelebradas();
    const nuevas = idsCumplidas.filter((id) => !yaCelebradas.includes(id));

    if (nuevas.length === 0) return;

    guardarCelebradas([...yaCelebradas, ...nuevas]);
    setCelebrar(true);

    // Se apaga solo después de un momento, para que <Celebracion>
    // quede lista para la próxima vez que aparezca otra minimeta
    // cumplida (ver el segundo useEffect de ese componente).
    const timeoutId = setTimeout(() => setCelebrar(false), 300);
    return () => clearTimeout(timeoutId);
    // Se compara por el contenido (JSON), no por la referencia del
    // arreglo, porque "idsCumplidas" se recalcula en cada render del
    // dashboard aunque el contenido no haya cambiado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(idsCumplidas)]);

  return celebrar;
}