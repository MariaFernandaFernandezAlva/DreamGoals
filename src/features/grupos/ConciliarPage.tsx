import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import { Image, ShieldCheck, CircleCheckBig, X } from "lucide-react"

export function ConciliarPage() {
  const { metaId } = useParams<{ metaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [saldo, setSaldo] = useState('');
  const [captura, setCaptura] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function cerrar() {
    navigate(-1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captura) {
      setErrorMsg('Sube una captura del saldo.');
      return;
    }
    setEnviando(true);
    setErrorMsg('');

    const extension = captura.name.split('.').pop();
    const path = `conciliaciones/${metaId}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('evidencias').upload(path, captura);
    if (uploadError) {
      setErrorMsg(uploadError.message);
      setEnviando(false);
      return;
    }

    // Recuerda: solo el saldo declarado y la captura — nunca el
    // número de la tarjeta ni datos que la identifiquen.
    const { error } = await supabase.from('conciliaciones').insert({
      meta_id: metaId!,
      usuario_id: user!.id,
      saldo_declarado: Number(saldo),
      captura_url: path,
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
        className="relative flex w-full max-w-104 flex-col gap-5 rounded-4xl bg-[#FAFAF7] p-8 shadow-2xl"
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-njoscuro/20 text-njoscuro">
            <ShieldCheck className="h-6 w-6"/>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-900">
              Subir conciliación
            </h1>
            <p className="mt-0.5 text-xs font-medium text-njoscuro">
              Verificación de fondos
            </p>
          </div>
        </div>
        
        <p className="text-sm leading-relaxed text-neutral-500">
          Sube el saldo real que muestra la tarjeta y una captura de la app del banco. Subirlo desbloquea la página web
          de inmediato, coincida o no con lo calculado.
        </p>

        {/* Monto real */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="saldo" className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Monto real
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
              id="saldo"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="0.00"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              className="w-full bg-transparent px-3 py-3.5 text-sm text-neutral-800 placeholder-neutral-300 outline-none"
            />
          </div>
        </div>

        {/* Captura del saldo */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
              Captura del saldo
            </label>
            <span className="text-xs font-medium text-neutral-400">Obligatorio</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm">
            <div className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-[#F9F7F2] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <Image className="h-5 w-5 text-azul"/>
                <span className="max-w-35 truncate font-medium">
                  {captura?.name || 'Sin archivo'}
                </span>
              </div>
              <label htmlFor="captura" className="cursor-pointer text-sm font-semibold text-[#008A8A] transition-colors hover:text-teal-800">
                {captura ? 'Cambiar' : 'Subir foto'}
              </label>
              <input
                id="captura"
                type="file"
                accept="image/*"
                required
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setCaptura(file);
                  setPreviewUrl(file ? URL.createObjectURL(file) : null);
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
            {enviando ? 'Guardando...' : 'Guardar conciliación'}
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