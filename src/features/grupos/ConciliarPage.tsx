import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';

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
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-4 top-4 text-neutral-400">
          ×
        </button>

        <h1 className="text-lg font-bold">Subir conciliación</h1>
        <p className="text-xs text-neutral-500">
          Sube el saldo real que muestra la tarjeta y una captura de la app del banco. Subirlo desbloquea la app
          de inmediato, coincida o no con lo calculado.
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="saldo" className="text-xs text-neutral-500">Monto real (S/)</label>
          <input
            id="saldo"
            type="number"
            min={0}
            required
            value={saldo}
            onChange={(e) => setSaldo(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="captura" className="text-xs text-neutral-500">Captura del saldo</label>
          <input
            id="captura"
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setCaptura(file);
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
          {enviando ? 'Guardando...' : 'Guardar conciliación'}
        </button>
      </form>
    </div>
  );
}