import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';

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
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-4 top-4 text-neutral-400">
          ×
        </button>

        <h1 className="text-lg font-bold">{esDeposito ? 'Registrar depósito' : 'Registrar retiro'}</h1>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Nombre</label>
          <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-500">{nombre ?? ''}</div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="monto" className="text-xs text-neutral-500">Monto (S/)</label>
          <input
            id="monto"
            type="number"
            min={1}
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="medio" className="text-xs text-neutral-500">Medio</label>
          <select
            id="medio"
            value={medio}
            onChange={(e) => setMedio(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option>Yape</option>
            <option>Transferencia</option>
            <option>Depósito en ventanilla</option>
            <option>Otro</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="comentario" className="text-xs text-neutral-500">Comentario (opcional)</label>
          <textarea
            id="comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="foto" className="text-xs text-neutral-500">Foto de evidencia</label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setFoto(file);
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
          {enviando ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}