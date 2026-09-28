import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

// Este componente sirve para dos rutas distintas:
//   /grupo/:grupoId/nueva-meta  -> crear (grupoId viene en la URL)
//   /meta/:metaId/editar        -> editar (metaId viene en la URL)
// "esEdicion" decide cuál de los dos modos usar.
export function CrearMetaPage() {
  const { grupoId, metaId } = useParams<{ grupoId?: string; metaId?: string }>();
  const navigate = useNavigate();
  const esEdicion = !!metaId;

  // En edición no sabemos el grupo_id hasta cargar la meta — se
  // necesita para armar la ruta de la imagen al subir una nueva.
  const [grupoIdReal, setGrupoIdReal] = useState<string | null>(grupoId ?? null);
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // La ruta de la imagen que YA tiene guardada la meta (si estamos
  // editando) — se conserva tal cual si el usuario no elige una foto
  // nueva en el formulario.
  const [imagenPathActual, setImagenPathActual] = useState<string | null>(null);
  const [cargando, setCargando] = useState(esEdicion);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!esEdicion) return;
    supabase
      .from('metas')
      .select('*')
      .eq('id', metaId!)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        setGrupoIdReal(data.grupo_id);
        setNombre(data.nombre);
        setMontoObjetivo(String(data.monto_objetivo));
        setImagenPathActual(data.imagen_url);
        if (data.imagen_url) {
          const { data: signed } = await supabase.storage
            .from('evidencias')
            .createSignedUrl(data.imagen_url, 3600);
          setPreviewUrl(signed?.signedUrl ?? null);
        }
        setCargando(false);
      });
  }, [esEdicion, metaId]);

  function cerrar() {
    navigate(-1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg('');

    // Si hay imagen nueva, se sube y reemplaza la ruta guardada. Si
    // el usuario no tocó el campo de imagen (típico en edición), se
    // conserva "imagenPathActual" tal cual — no se sube nada.
    let imagenPath: string | null = imagenPathActual;
    if (imagen) {
      const extension = imagen.name.split('.').pop();
      const path = `metas/${grupoIdReal}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(path, imagen);
      if (uploadError) {
        setErrorMsg(uploadError.message);
        setEnviando(false);
        return;
      }
      imagenPath = path;
    }

    if (esEdicion) {
      const { error } = await supabase
        .from('metas')
        .update({
          nombre,
          monto_objetivo: Number(montoObjetivo),
          imagen_url: imagenPath,
        })
        .eq('id', metaId!);

      setEnviando(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      // replace: true para que el dashboard de esa meta se refresque
      // con los datos nuevos (mismo patrón que usamos en todos los
      // demás modales que guardan cambios).
      navigate(`/meta/${metaId}`, { replace: true });
      return;
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

    setEnviando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    navigate(`/meta/${data.id}`);
  }

  if (cargando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
        <div className="rounded-xl bg-white p-6 text-sm text-neutral-500">Cargando...</div>
      </div>
    );
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

        <h1 className="text-lg font-bold">{esEdicion ? 'Editar meta' : 'Nueva meta'}</h1>

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
          <label htmlFor="imagen" className="text-xs text-neutral-500">
            Imagen {esEdicion ? '(deja vacío para conservar la actual)' : '(opcional)'}
          </label>
          <input
            id="imagen"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImagen(file);
              // URL temporal que vive solo en el navegador — no sube
              // nada, solo permite mostrar la imagen antes de guardar.
              if (file) setPreviewUrl(URL.createObjectURL(file));
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
          {enviando
            ? (esEdicion ? 'Guardando...' : 'Creando...')
            : (esEdicion ? 'Guardar cambios' : 'Crear meta')}
        </button>
      </form>
    </div>
  );
}