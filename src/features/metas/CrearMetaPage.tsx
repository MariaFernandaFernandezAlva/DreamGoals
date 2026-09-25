import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export function CrearMetaPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function cerrar() {
    navigate(-1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg('');

    // Si hay imagen, primero la subimos al bucket y guardamos solo
    // la RUTA (no una URL pública) — el bucket es privado, así que
    // más adelante, para mostrarla, se genera una URL firmada con
    // esa ruta. Path único: id del grupo + timestamp, para que dos
    // metas no puedan pisarse el archivo la una a la otra.
    let imagenPath: string | null = null;
    if (imagen) {
      const extension = imagen.name.split('.').pop();
      const path = `metas/${grupoId}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(path, imagen);
      if (uploadError) {
        setErrorMsg(uploadError.message);
        setEnviando(false);
        return;
      }
      imagenPath = path;
    }

    // A diferencia de grupos, aquí SÍ hacemos un insert directo —
    // la tabla metas ya tiene su propia política de RLS
    // ("crear metas en mis grupos") que valida que seas miembro
    // del grupo, así que no hace falta una función intermedia.
    const { data, error } = await supabase
      .from('metas')
      .insert({
        grupo_id: grupoId!,
        nombre,
        monto_objetivo: Number(montoObjetivo),
        imagen_url: imagenPath,
      })
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
      setEnviando(false);
      return;
    }

    navigate(`/meta/${data.id}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={cerrar}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-neutral-400"
        >
          ×
        </button>

        <h1 className="text-lg font-bold">Nueva meta</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs text-neutral-500">Nombre de la meta</label>
          <input
            id="nombre"
            required
            placeholder="Inicial del departamento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="monto" className="text-xs text-neutral-500">Monto objetivo (S/)</label>
          <input
            id="monto"
            type="number"
            min={1}
            required
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="imagen" className="text-xs text-neutral-500">Imagen (opcional)</label>
          <input
            id="imagen"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImagen(file);
              // URL temporal que vive solo en el navegador — no sube
              // nada, solo permite mostrar la imagen antes de guardar.
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            className="text-xs"
          />
          {previewUrl && (
            <img src={previewUrl} alt="Vista previa" className="mt-2 h-24 w-full rounded-md object-cover" />
          )}
        </div>

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando ? 'Creando...' : 'Crear meta'}
        </button>
      </form>
    </div>
  );
}