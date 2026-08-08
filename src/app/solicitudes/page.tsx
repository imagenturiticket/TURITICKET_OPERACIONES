'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

type TipoPermiso = 'dia_descanso' | 'falta' | 'llegada_tarde' | 'cambio_descanso';
type Estado = 'pendiente' | 'aprobado' | 'rechazado';

const TIPO_PERMISO_LABEL: Record<TipoPermiso, string> = {
  dia_descanso: 'Día de descanso',
  falta: 'Falta',
  llegada_tarde: 'Llegada tarde',
  cambio_descanso: 'Cambio de descanso',
};

interface Solicitud {
  id: string;
  tipo_persona: 'operador' | 'oficina';
  operador_id: string | null;
  persona_oficina: string | null;
  correo: string | null;
  turno_habitual: string | null;
  tipo_permiso: TipoPermiso;
  fecha_permiso: string | null;
  fecha_termino: string | null;
  hora_llegada: string | null;
  nueva_fecha_descanso: string | null;
  motivo: string;
  coordinacion_con: string | null;
  firma_imagen: string | null;
  firma_hash: string | null;
  estado: Estado;
  comentario_revision: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  reflejado_asignacion: boolean;
  created_at: string;
}

interface Operador {
  id: string;
  nombre: string;
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

function formatFechaHora(fechaIso: string | null) {
  if (!fechaIso) return '—';
  return new Date(fechaIso).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [revisorNombre, setRevisorNombre] = useState('');
  const [cargando, setCargando] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [filtro, setFiltro] = useState<Estado>('pendiente');
  const [firmaModal, setFirmaModal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  useEffect(() => {
    async function verificarAcceso() {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email || '';
      const mapa: Record<string, string> = {
        'zeus@turiticket.com': 'ZEUS',
        'juan@turiticket.com': 'LIC.JUAN',
        'ama@turiticket.com': 'AMA',
      };
      if (mapa[email]) {
        setRevisorNombre(mapa[email]);
        setAutorizado(true);
        cargarDatos();
      } else {
        setAutorizado(false);
        router.push('/');
      }
    }
    verificarAcceso();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    const [{ data: sol }, { data: ops }] = await Promise.all([
      supabase.from('solicitudes_permiso').select('*').order('created_at', { ascending: false }),
      supabase.from('operadores').select('id, nombre'),
    ]);
    setSolicitudes(sol || []);
    setOperadores(ops || []);
    setCargando(false);
  }

  function nombreDe(s: Solicitud) {
    if (s.tipo_persona === 'operador') {
      return operadores.find((o) => o.id === s.operador_id)?.nombre || 'Operador';
    }
    return s.persona_oficina || 'Oficina';
  }

  async function procesar(s: Solicitud, nuevoEstado: 'aprobado' | 'rechazado') {
    setProcesando(s.id);
    const comentario = comentarios[s.id] || '';

    const { error: updateError } = await supabase
      .from('solicitudes_permiso')
      .update({
        estado: nuevoEstado,
        comentario_revision: comentario,
        revisado_por: revisorNombre,
        revisado_en: new Date().toISOString(),
      })
      .eq('id', s.id);

    if (updateError) {
      alert('Error al actualizar la solicitud. Intenta de nuevo.');
      setProcesando(null);
      return;
    }

    if (
      nuevoEstado === 'aprobado' &&
      s.tipo_persona === 'operador' &&
      (s.tipo_permiso === 'dia_descanso' || s.tipo_permiso === 'falta') &&
      !s.reflejado_asignacion &&
      s.fecha_permiso
    ) {
      await supabase.from('asignaciones').insert({
        fecha: s.fecha_permiso,
        tipo: 'local',
        destino: s.tipo_permiso === 'dia_descanso' ? 'DESCANSO' : 'FALTA',
        operador_id: s.operador_id,
        unidad_id: null,
      });
      await supabase
        .from('solicitudes_permiso')
        .update({ reflejado_asignacion: true })
        .eq('id', s.id);
    }

    try {
      await fetch('/api/enviar-permiso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitudId: s.id,
          correo: s.correo,
          nombre: nombreDe(s),
          tipoPermiso: s.tipo_permiso,
          estado: nuevoEstado,
          comentario,
        }),
      });
    } catch (e) {
      console.error('No se pudo enviar el correo de notificación', e);
    }

    setProcesando(null);
    cargarDatos();
  }

  if (autorizado === null || cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!autorizado) return null;

  const listaFiltrada = solicitudes.filter((s) => s.estado === filtro);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#284D71] mb-1">📝 Solicitudes de Permiso</h1>
        <p className="text-gray-500 text-sm mb-4">Bandeja de revisión y autorización</p>

        <div className="flex gap-2 mb-4">
          {(['pendiente', 'aprobado', 'rechazado'] as Estado[]).map((e) => (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                filtro === e ? 'bg-[#284D71] text-white border-[#284D71]' : 'border-gray-300 text-gray-600'
              }`}
            >
              {e === 'pendiente' ? 'Pendientes' : e === 'aprobado' ? 'Aprobadas' : 'Rechazadas'}
              {' '}({solicitudes.filter((s) => s.estado === e).length})
            </button>
          ))}
        </div>

        {listaFiltrada.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-10">No hay solicitudes en esta categoría.</p>
        )}

        <div className="space-y-4">
          {listaFiltrada.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-[#284D71]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-xs text-gray-400">FOLIO {s.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-bold text-gray-800">{nombreDe(s)}</p>
                  <p className="text-sm text-[#284D71] font-medium">{TIPO_PERMISO_LABEL[s.tipo_permiso]}</p>
                </div>
                <span className="text-xs text-gray-400">{formatFechaHora(s.created_at)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <p><span className="text-gray-400">Área:</span> {s.tipo_persona === 'operador' ? 'Operadores' : 'Oficina'}</p>
                <p><span className="text-gray-400">Turno habitual:</span> {s.turno_habitual || '—'}</p>
                {s.tipo_permiso !== 'llegada_tarde' && (
                  <p><span className="text-gray-400">Fecha:</span> {formatFecha(s.fecha_permiso)}</p>
                )}
                {s.tipo_permiso === 'falta' && s.fecha_termino && (
                  <p><span className="text-gray-400">Termina:</span> {formatFecha(s.fecha_termino)}</p>
                )}
                {s.tipo_permiso === 'llegada_tarde' && (
                  <>
                    <p><span className="text-gray-400">Día:</span> {formatFecha(s.fecha_permiso)}</p>
                    <p><span className="text-gray-400">Hora de llegada:</span> {s.hora_llegada || '—'}</p>
                  </>
                )}
                {s.tipo_permiso === 'cambio_descanso' && (
                  <p><span className="text-gray-400">Nueva fecha:</span> {formatFecha(s.nueva_fecha_descanso)}</p>
                )}
                <p className="col-span-2"><span className="text-gray-400">Coordinó con:</span> {s.coordinacion_con || '—'}</p>
              </div>

              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">{s.motivo}</p>

              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setFirmaModal(s.firma_imagen)}
                  className="text-sm text-[#284D71] font-medium underline"
                >
                  Ver firma
                </button>
              </div>

              {s.estado === 'pendiente' ? (
                <div className="space-y-2">
                  <textarea
                    placeholder="Comentario (opcional)"
                    value={comentarios[s.id] || ''}
                    onChange={(e) => setComentarios({ ...comentarios, [s.id]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={procesando === s.id}
                      onClick={() => procesar(s, 'aprobado')}
                      className="flex-1 bg-green-600 text-white font-medium py-2 rounded-lg disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      disabled={procesando === s.id}
                      onClick={() => procesar(s, 'rechazado')}
                      className="flex-1 bg-[#D9272D] text-white font-medium py-2 rounded-lg disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 border-t pt-2">
                  <p>
                    {s.estado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'} por {s.revisado_por} el {formatFechaHora(s.revisado_en)}
                  </p>
                  {s.comentario_revision && <p className="mt-1 italic">"{s.comentario_revision}"</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {firmaModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setFirmaModal(null)}
        >
          <div className="bg-white rounded-xl p-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-500 mb-2">Firma del solicitante</p>
            <img src={firmaModal} alt="Firma" className="w-full border border-gray-200 rounded-lg bg-white" />
            <button
              onClick={() => setFirmaModal(null)}
              className="mt-3 w-full bg-gray-100 text-gray-600 py-2 rounded-lg text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
