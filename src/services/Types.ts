export interface Perfil {
  id: string;
  nombre: string;
  created_at: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  invite_code: string;
  cantidad_integrantes: number;
  frecuencia_conciliacion_dias: number;
  creado_por: string;
  created_at: string;
}

export interface MiembroGrupo {
  grupo_id: string;
  usuario_id: string;
  rol: 'admin' | 'miembro';
  created_at: string;
}

export interface Meta {
  id: string;
  grupo_id: string;
  nombre: string;
  monto_objetivo: number;
  estado: 'activa' | 'completada';
  fecha_completada: string | null;
  evidencia_url: string | null;
  comentario_cierre: string | null;
  created_at: string;
}

export interface Minimeta {
  id: string;
  meta_id: string;
  nombre: string;
  monto: number;
  orden: number;
}

export interface Transaccion {
  id: string;
  meta_id: string;
  usuario_id: string;
  tipo: 'deposito' | 'retiro';
  monto: number;
  medio: string;
  comentario: string | null;
  evidencia_url: string | null;
  created_at: string;
}

export interface Conciliacion {
  id: string;
  grupo_id: string;
  usuario_id: string;
  saldo_declarado: number;
  captura_url: string;
  fecha: string;
}

// ─────────────────────────────────────────────────────────
// Forma que espera createClient<Database>(...) — así el
// cliente de Supabase autocompleta y valida cada .from() y
// cada .rpc() por ti. "Row" es lo que devuelve un select;
// "Insert" es lo que aceptas al crear (algunos campos son
// opcionales porque la base de datos los llena sola, como
// id o created_at).
// ─────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil;
        Insert: Partial<Perfil> & { id: string; nombre: string };
        Update: Partial<Perfil>;
      };
      grupos: {
        Row: Grupo;
        Insert: Pick<Grupo, 'nombre' | 'cantidad_integrantes' | 'frecuencia_conciliacion_dias' | 'creado_por'>;
        Update: Partial<Grupo>;
      };
      miembros_grupo: {
        Row: MiembroGrupo;
        Insert: MiembroGrupo;
        Update: Partial<MiembroGrupo>;
      };
      metas: {
        Row: Meta;
        Insert: Pick<Meta, 'grupo_id' | 'nombre' | 'monto_objetivo'>;
        Update: Partial<Meta>;
      };
      minimetas: {
        Row: Minimeta;
        Insert: Pick<Minimeta, 'meta_id' | 'nombre' | 'monto' | 'orden'>;
        Update: Partial<Minimeta>;
      };
      transacciones: {
        Row: Transaccion;
        Insert: Pick<Transaccion, 'meta_id' | 'usuario_id' | 'tipo' | 'monto' | 'medio' | 'comentario' | 'evidencia_url'>;
        Update: Partial<Transaccion>;
      };
      conciliaciones: {
        Row: Conciliacion;
        Insert: Pick<Conciliacion, 'grupo_id' | 'usuario_id' | 'saldo_declarado' | 'captura_url'>;
        Update: Partial<Conciliacion>;
      };
    };
    Functions: {
      // Coincide con la función unirse_a_grupo del esquema SQL:
      // recibe el código de invitación, devuelve el id del grupo.
      unirse_a_grupo: {
        Args: { p_invite_code: string };
        Returns: string;
      };
    };
  };
}