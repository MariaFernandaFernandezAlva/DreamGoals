// Círculo de carga reutilizable. Reemplaza a todos los textos sueltos
// tipo "Cargando..." / "Cargando metas..." por una animación
// consistente en toda la app.
interface SpinnerProps {
  // Si se usa dentro de un modal (que ya tiene su propio fondo/tamaño),
  // pasa "modal" para que no ocupe toda la pantalla.
  variante?: "pagina" | "modal";
}

export function Spinner({ variante = "pagina" }: SpinnerProps) {
  const contenedor =
    variante === "pagina"
      ? "flex min-h-[50vh] w-full items-center justify-center"
      : "flex items-center justify-center py-10";

  return (
    <div className={contenedor}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-emerald-600" />
    </div>
  );
}