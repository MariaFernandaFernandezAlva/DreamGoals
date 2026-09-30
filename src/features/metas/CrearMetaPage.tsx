import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Spinner } from '../../components/Spinner';
import { Plus, X, SquarePen, CircleCheckBig, Image } from "lucide-react";

export function CrearMetaPage() {
  const { grupoId, metaId } = useParams<{ grupoId?: string; metaId?: string }>();
  const navigate = useNavigate();
  const esEdicion = !!metaId;
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
      navigate(`/meta/${metaId}`, { replace: true });
      return;
    }

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
    return <Spinner variante="modal"/>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={cerrar}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-104 flex-col gap-6 rounded-4xl bg-[#FAFAF7] p-8 shadow-2xl"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-6 top-6 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="h-5 w-5"/>
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-azul/20 text-azul">
            {esEdicion ? <SquarePen className="w-6 h-6"/> : <Plus className="w-6 h-6"/>}
          </div>
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-neutral-900">
              {esEdicion ? 'Editar meta' : 'Nueva meta'}
            </h1>
            <p className="text-sm text-neutral-500">
              {esEdicion ? 'Actualiza tu objetivo financiero' : 'Define tu próximo objetivo financiero'}
            </p>
          </div>
        </div>

        {/* Nombre de la Meta */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Nombre de la meta
            </label>
            <span className="text-xs text-neutral-400">Obligatorio</span>
          </div>
          <input
            id="nombre"
            required
            placeholder="Inicial del departamento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-azul/50 focus:ring-1 focus:azul/50"
          />
        </div>

        {/* Monto Objetivo */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="monto" className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Monto objetivo
            </label>
            <span className="rounded-full bg-azul/10 px-2.5 py-1 text-[10px] font-semibold text-azul">
              Soles (PEN)
            </span>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
            <div className="flex items-center justify-center bg-azul/10 px-4 text-sm font-bold text-azul">
              S/
            </div>
            <input
              id="monto"
              type="number"
              min={1}
              step="0.01"
              required
              placeholder="0.00"
              value={montoObjetivo}
              onChange={(e) => setMontoObjetivo(e.target.value)}
              className="w-full bg-transparent px-3 py-3.5 text-sm text-neutral-800 placeholder-neutral-300 outline-none"
            />
          </div>
        </div>

        {/* Imagen o Avatar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Imagen o avatar
            </label>
            <span className="text-xs text-neutral-400">
              {esEdicion ? 'Opcional (deja vacío)' : 'Opcional'}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm">
            <div className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-[#F9F7F2] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <Image className="h-5 w-5 text-teal-700"/>
                <span className="max-w-[140px] truncate font-medium">
                  {imagen?.name || (imagenPathActual ? 'Imagen actual' : 'Sin imagen')}
                </span>
              </div>
              <label htmlFor="imagen" className="cursor-pointer text-sm font-semibold text-[#008A8A] hover:text-teal-800">
                Cambiar
              </label>
              <input
                id="imagen"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImagen(file);
                  if (file) setPreviewUrl(URL.createObjectURL(file));
                }}
              />
            </div>

            {previewUrl && (
              <div className="relative mt-1.5 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-[#EBE7DF]/30 p-2">
                <img src={previewUrl} alt="Vista previa" className="h-full w-auto max-w-full rounded-lg object-contain shadow-sm" />
                <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-600 shadow-sm backdrop-blur-sm">
                  Vista previa
                </span>
              </div>
            )}
          </div>
        </div>

        {errorMsg && <p className="text-center text-xs font-medium text-red-600">{errorMsg}</p>}

        {/* Botones de acción */}
        <div className="mt-2 flex flex-col gap-4">
          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008A8A] py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:opacity-50"
          >
            {!enviando && (
              <CircleCheckBig className="h-4 w-4"/>
            )}
            {enviando
              ? (esEdicion ? 'Guardando...' : 'Creando...')
              : (esEdicion ? 'Guardar cambios' : 'Crear meta')}
          </button>
          
          <button
            type="button"
            onClick={cerrar}
            className="w-full text-center text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}