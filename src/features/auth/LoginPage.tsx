import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  // "estado" controla qué le mostramos: el formulario, un mensaje
  // de éxito, o un error — así no necesitamos tres componentes distintos.
  const [estado, setEstado] = useState<'form' | 'enviando' | 'enviado' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado('enviando');

    // signInWithOtp: "OTP" aquí significa el link de un solo uso,
    // no un código de 6 dígitos. Supabase envía el correo solo.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // A dónde debe volver el usuario después de tocar el link
        // del correo. Por ahora, la misma página (el AuthProvider
        // se encarga de detectar la sesión y actualizar la app).
        emailRedirectTo: window.location.origin,
        // Solo se usa si el correo es nuevo (el trigger lo lee de
        // raw_user_meta_data). Si el usuario ya existe, Supabase
        // simplemente lo ignora — no sobrescribe el nombre guardado.
        data: nombre ? { nombre } : undefined,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setEstado('error');
      return;
    }

    setEstado('enviado');
  }

  if (estado === 'enviado') {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            Te enviamos un link de acceso a <strong>{email}</strong>. Ábrelo desde el mismo dispositivo para entrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-8"
      >
        <div className="text-center">
          <h1 className="text-lg font-bold">DreamGoals</h1>
          <p className="mt-1 text-sm text-neutral-500">Bitácora de ahorro grupal</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs text-neutral-500">
            Nombre (solo si es tu primera vez)
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Paolo"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs text-neutral-500">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {estado === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {estado === 'enviando' ? 'Enviando...' : 'Enviar link de acceso'}
        </button>

        <p className="text-center text-xs text-neutral-400">
          Te llegará un enlace por correo, sin necesidad de contraseña.
        </p>
      </form>
    </div>
  );
}