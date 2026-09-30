import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import { BanknoteArrowDown, BanknoteArrowUp, CircleCheckBig, Image, X } from "lucide-react"

export function MovimientoPage() {
  const { metaId, tipo } = useParams<{ metaId: string; tipo: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const esDeposito = tipo === 'deposito';
  const [monto, setMonto] = useState('');
  const [medio, setMedio] = useState('Yape');
  const [comentario, setComentario] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('perfiles').select('nombre').eq('id', user.id).single()
    .then(({ data }) => setNombre(data?.nombre ?? ''));
  }, [user]);

  function cerrar() {
    navigate(-1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg('');

    let evidenciaPath: string | null = null;
    if (foto) {
      const extension = foto.name.split('.').pop();
      const path = `transacciones/${metaId}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(path, foto);
      if (uploadError) {
        setErrorMsg(uploadError.message);
        setEnviando(false);
        return;
      }
      evidenciaPath = path;
    }

    const { error } = await supabase.from('transacciones').insert({
      meta_id: metaId!,
      usuario_id: user!.id,
      tipo: esDeposito ? 'deposito' : 'retiro',
      monto: Number(monto),
      medio,
      comentario: comentario || null,
      evidencia_url: evidenciaPath,
    });

    if (error) {
      setErrorMsg(error.message);
      setEnviando(false);
      return;
    }

    navigate(`/meta/${metaId}`, { replace: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[95vh] w-full max-w-104 flex-col gap-5 overflow-y-auto rounded-4xl bg-[#FAFAF7] p-8 shadow-2xl [&::-webkit-scrollbar]:hidden"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-6 top-6 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X className="h-5 w-5"/>
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${esDeposito ? 'bg-azul/10 text-azul' : 'bg-naranja/10 text-naranja'}`}>
            {esDeposito ? (
              <BanknoteArrowUp className="h-8 w-8"/>
            ) : (
              <BanknoteArrowDown className="h-8 w-8"/>
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-900">
              {esDeposito ? 'Registrar depósito' : 'Registrar retiro'}
            </h1>
            <p className="text-sm text-neutral-500">
              {esDeposito ? 'Añade fondos a tu meta' : 'Retira fondos de tu meta'}
            </p>
          </div>
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">Nombre</label>
          <div className="w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-100/60 px-4 py-3.5 text-sm font-medium text-neutral-500">
            {nombre ?? 'Cargando...'}
          </div>
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="monto" className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Monto
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
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-transparent px-3 py-3.5 text-sm text-neutral-800 placeholder-neutral-300 outline-none"
            />
          </div>
        </div>

        {/* Medio */}
        <div className="flex flex-col gap-2">
          <label htmlFor="medio" className="text-xs font-bold uppercase tracking-wide text-neutral-700">
            Medio
          </label>
          <select
            id="medio"
            value={medio}
            onChange={(e) => setMedio(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-800 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          >
            <option>Yape</option>
            <option>Transferencia</option>
            <option>Depósito en ventanilla</option>
            <option>Otro</option>
          </select>
        </div>

        {/* Comentario */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="comentario" className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Comentario
            </label>
            <span className="text-xs text-neutral-400">Opcional</span>
          </div>
          <textarea
            id="comentario"
            rows={2}
            placeholder="Añade un detalle o referencia..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Foto de evidencia */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Foto de evidencia
            </label>
            <span className="text-xs text-neutral-400">Opcional</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm">
            <div className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-[#F9F7F2] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <Image className="h-5 w-5 text-teal-700"/>
                <span className="max-w-35 truncate font-medium">
                  {foto?.name || 'Sin archivo'}
                </span>
              </div>
              <label htmlFor="foto" className="cursor-pointer text-sm font-semibold text-[#008A8A] transition-colors hover:text-teal-800">
                Cambiar
              </label>
              <input
                id="foto"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setFoto(file);
                  setPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
              />
            </div>

            {previewUrl && (
              <div className="relative mt-1.5 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-[#EBE7DF]/30 p-2">
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
            {enviando ? 'Guardando...' : 'Guardar'}
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