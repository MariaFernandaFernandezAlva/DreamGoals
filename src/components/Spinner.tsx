interface SpinnerProps {
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