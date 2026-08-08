'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

type Area = 'operador' | 'oficina';
type TipoPermiso = 'dia_descanso' | 'falta' | 'llegada_tarde' | 'cambio_descanso';

const PERSONAS_OFICINA = ['Zeus', 'Lic. Juan', 'Ama', 'Osmar', 'Gaby', 'Michell', 'Mari'];

const TIPO_PERMISO_LABEL: Record<TipoPermiso, string> = {
  dia_descanso: 'Día de descanso',
  falta: 'Falta',
  llegada_tarde: 'Llegada tarde',
  cambio_descanso: 'Cambio de descanso',
};

const TIPO_PERMISO_DESC: Record<TipoPermiso, string> = {
  dia_descanso: 'Solicitud de un día de descanso',
  falta: 'Ausencia de uno o más días, con o sin previo aviso',
  llegada_tarde: 'Aviso de que llegarás después de tu hora de entrada',
  cambio_descanso: 'Mover tu descanso ya asignado a otra fecha',
};

interface Operador {
  id: string;
  nombre: string;
  correo: string | null;
}

async function sha256Hex(texto: string): Promise<string> {
  const enc = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function SolicitudPermisoPage() {
  const [cargando, setCargando] = useState(true);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [folio, setFolio] = useState('');
  const [error, setError] = useState('');

  // Sección 1 — Datos generales
  const [area, setArea] = useState<Area>('operador');
  const [operadorId, setOperadorId] = useState('');
  const [personaOficina, setPersonaOficina] = useState('');
  const [turnoHabitual, setTurnoHabitual] = useState('');

  // Sección 2 — Tipo de permiso
  const [tipoPermiso, setTipoPermiso] = useState<TipoPermiso>('dia_descanso');

  // Sección 3 — Detalle
  const [fechaPermiso, setFechaPermiso] = useState('');
  const [fechaTermino, setFechaTermino] = useState('');
  const [horaLlegada, setHoraLlegada] = useState('');
  const [nuevaFechaDescanso, setNuevaFechaDescanso] = useState('');

  // Sección 4 y 5
  const [motivo, setMotivo] = useState('');
  const [coordinacionCon, setCoordinacionCon] = useState('');

  // Firma
  const [aceptaConsentimiento, setAceptaConsentimiento] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firmando, setFirmando] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);

  useEffect(() => {
    async function cargarOperadores() {
      const { data } = await supabase
        .from('operadores')
        .select('id, nombre, correo')
        .eq('activo', true)
        .order('nombre');
      setOperadores(data || []);
      setCargando(false);
    }
    cargarOperadores();
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    const me = e as React.MouseEvent;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  }

  function iniciarFirma(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setFirmando(true);
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function dibujarFirma(e: React.MouseEvent | React.TouchEvent) {
    if (!firmando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#284D71';
    ctx.lineTo(x, y);
    ctx.stroke();
    setTieneFirma(true);
  }

  function terminarFirma() {
    setFirmando(false);
  }

  function limpiarFirma() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneFirma(false);
  }

  function validar(): string {
    if (area === 'operador' && !operadorId) return 'Selecciona tu nombre.';
    if (area === 'oficina' && !personaOficina) return 'Selecciona tu nombre.';
    if (!turnoHabitual.trim()) return 'Indica tu turno u horario habitual.';
    if (!fechaPermiso) return 'Indica la fecha correspondiente.';
    if (tipoPermiso === 'llegada_tarde' && !horaLlegada) return 'Indica la hora de llegada.';
    if (tipoPermiso === 'cambio_descanso' && !nuevaFechaDescanso) return 'Indica la nueva fecha de descanso.';
    if (!motivo.trim()) return 'Cuéntanos tu motivo.';
    if (!coordinacionCon.trim()) return 'Indica con quién coordinaste.';
    if (!aceptaConsentimiento) return 'Debes aceptar la declaración para continuar.';
    if (!tieneFirma) return 'Falta tu firma.';
    return '';
  }

  async function enviarSolicitud() {
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setEnviando(true);

    const canvas = canvasRef.current!;
    const firmaImagen = canvas.toDataURL('image/png');
    const ahora = new Date().toISOString();

    const nombrePersona =
      area === 'operador'
        ? operadores.find((o) => o.id === operadorId)?.nombre || ''
        : personaOficina;

    const contenidoParaHash = JSON.stringify({
      nombrePersona,
      tipoPermiso,
      fechaPermiso,
      fechaTermino,
      horaLlegada,
      nuevaFechaDescanso,
      motivo,
      coordinacionCon,
      ahora,
    });
    const firmaHash = await sha256Hex(contenidoParaHash + firmaImagen);

    let correo: string | null = null;
    if (area === 'operador') {
      correo = operadores.find((o) => o.id === operadorId)?.correo || null;
    } else {
      const { data } = await supabase
        .from('personal_oficina_correos')
        .select('correo')
        .eq('persona', personaOficina)
        .maybeSingle();
      correo = data?.correo || null;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('solicitudes_permiso')
      .insert({
        tipo_persona: area,
        operador_id: area === 'operador' ? operadorId : null,
        persona_oficina: area === 'oficina' ? personaOficina : null,
        correo,
        turno_habitual: turnoHabitual,
        tipo_permiso: tipoPermiso,
        fecha_permiso: fechaPermiso || null,
        fecha_termino: fechaTermino || null,
        hora_llegada: horaLlegada || null,
        nueva_fecha_descanso: nuevaFechaDescanso || null,
        motivo,
        coordinacion_con: coordinacionCon,
        firma_imagen: firmaImagen,
        firma_hash: firmaHash,
        estado: 'pendiente',
      })
      .select()
      .single();

    setEnviando(false);

    if (insertError || !inserted) {
      setError('Ocurrió un error al enviar tu solicitud. Intenta de nuevo o avisa a tu coordinador.');
      console.error(insertError);
      return;
    }

    setFolio(inserted.id.slice(0, 8).toUpperCase());
    setEnviado(true);
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-[#284D71]">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-[#284D71] mb-2">Solicitud enviada</h1>
          <p className="text-gray-600 mb-4">
            Tu solicitud quedó registrada con el folio{' '}
            <span className="font-mono font-bold">{folio}</span>.
          </p>
          <p className="text-sm text-gray-500">
            Tu coordinador la revisará y te avisaremos por correo cuando sea autorizada o rechazada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#284D71] px-6 py-5">
          <p className="text-white/70 text-xs uppercase tracking-wide">Turiticket DMC &amp; Tours Veracruz</p>
          <h1 className="text-white text-2xl font-bold">Solicitud de Permiso</h1>
        </div>

        <div className="px-6 py-5 bg-amber-50 border-b border-amber-200 text-sm text-amber-900">
          Usa este formato para pedir un día de descanso, reportar o justificar una falta, avisar una
          llegada tarde, o cambiar tu descanso. Entrégalo con al menos 48 horas de anticipación cuando sea
          posible; queda sujeto a autorización.
        </div>

        <div className="px-6 py-6 space-y-8">
          <section>
            <h2 className="text-[#284D71] font-bold mb-3">1. Datos generales</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setArea('operador'); setPersonaOficina(''); }}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                      area === 'operador' ? 'bg-[#284D71] text-white border-[#284D71]' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    Operadores
                  </button>
                  <button
                    type="button"
                    onClick={() => { setArea('oficina'); setOperadorId(''); }}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                      area === 'oficina' ? 'bg-[#284D71] text-white border-[#284D71]' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    Oficina
                  </button>
                </div>
              </div>

              {area === 'operador' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <select
                    value={operadorId}
                    onChange={(e) => setOperadorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Selecciona tu nombre...</option>
                    {operadores.map((o) => (
                      <option key={o.id} value={o.id}>{o.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <select
                    value={personaOficina}
                    onChange={(e) => setPersonaOficina(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Selecciona tu nombre...</option>
                    {PERSONAS_OFICINA.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno / horario habitual</label>
                <input
                  type="text"
                  value={turnoHabitual}
                  onChange={(e) => setTurnoHabitual(e.target.value)}
                  placeholder="Ej. Lunes a sábado, 8am a 5pm"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[#284D71] font-bold mb-3">2. Tipo de permiso</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(TIPO_PERMISO_LABEL) as TipoPermiso[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoPermiso(tipo)}
                  className={`text-left p-3 rounded-lg border ${
                    tipoPermiso === tipo ? 'border-[#284D71] bg-[#284D71]/5' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-gray-800 text-sm">{TIPO_PERMISO_LABEL[tipo]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{TIPO_PERMISO_DESC[tipo]}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[#284D71] font-bold mb-3">3. Detalle de la solicitud</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tipoPermiso === 'dia_descanso' && 'Fecha del descanso solicitado'}
                  {tipoPermiso === 'falta' && 'Día de la falta'}
                  {tipoPermiso === 'cambio_descanso' && 'Fecha actual que quieres cambiar'}
                  {tipoPermiso === 'llegada_tarde' && 'Día en que llegarás tarde'}
                </label>
                <input
                  type="date"
                  value={fechaPermiso}
                  onChange={(e) => setFechaPermiso(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {tipoPermiso === 'falta' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de término <span className="text-gray-400">(opcional, solo si son varios días)</span>
                  </label>
                  <input
                    type="date"
                    value={fechaTermino}
                    onChange={(e) => setFechaTermino(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {tipoPermiso === 'llegada_tarde' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora de llegada</label>
                  <input
                    type="time"
                    value={horaLlegada}
                    onChange={(e) => setHoraLlegada(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {tipoPermiso === 'cambio_descanso' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha de descanso</label>
                  <input
                    type="date"
                    value={nuevaFechaDescanso}
                    onChange={(e) => setNuevaFechaDescanso(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-[#284D71] font-bold mb-3">4. Motivo</h2>
            <p className="text-xs text-gray-500 mb-2">
              Sé específico: menciona el trámite, la persona, el lugar o la institución. Evita respuestas
              genéricas. Ejemplos: cita médica, trámite en el INE, boda, mudanza, trámite escolar de un hijo.
            </p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Cuéntanos tu motivo con detalle..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </section>

          <section>
            <h2 className="text-[#284D71] font-bold mb-3">5. Coordinación con el equipo</h2>
            <p className="text-xs text-gray-500 mb-2">
              Si eres de oficina: quién cubre tus pendientes. Si eres operador: a quién avisaste o si sabes de
              alguien más pidiendo el mismo día o turno.
            </p>
            <input
              type="text"
              value={coordinacionCon}
              onChange={(e) => setCoordinacionCon(e.target.value)}
              placeholder="¿Con quién coordinaste este día/turno?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </section>

          <section>
            <h2 className="text-[#284D71] font-bold mb-3">Firma y autorización</h2>
            <label className="flex items-start gap-2 mb-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={aceptaConsentimiento}
                onChange={(e) => setAceptaConsentimiento(e.target.checked)}
                className="mt-1"
              />
              <span>He leído y estoy de acuerdo con la información capturada en esta solicitud, y firmo de conformidad.</span>
            </label>

            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={180}
                className="w-full bg-white touch-none cursor-crosshair"
                onMouseDown={iniciarFirma}
                onMouseMove={dibujarFirma}
                onMouseUp={terminarFirma}
                onMouseLeave={terminarFirma}
                onTouchStart={iniciarFirma}
                onTouchMove={dibujarFirma}
                onTouchEnd={terminarFirma}
              />
            </div>
            <button
              type="button"
              onClick={limpiarFirma}
              className="mt-2 text-sm text-[#D9272D] font-medium"
            >
              Limpiar firma
            </button>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={enviarSolicitud}
            disabled={enviando}
            className="w-full bg-[#D9272D] text-white font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}
