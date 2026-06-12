'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const TIPOS_SERVICIO = ['tour_foraneo','tour_local','servicio_local','renta','transfer','tour_transfer','local_transfer','jornada_8h','tour_largo','descanso_trabajado','descanso','oficina','otro']
const LABEL_TIPO: any = { tour_foraneo:'Tour foráneo', tour_local:'Tour local', servicio_local:'Servicio local', renta:'Renta', transfer:'Transfer', tour_transfer:'Tour + Transfer', local_transfer:'Local + Transfer', jornada_8h:'Jornada 8H', tour_largo:'Tour largo', descanso_trabajado:'Descanso trabajado', descanso:'Descanso', oficina:'Oficina', otro:'Otro' }

function clasificarTipo(tipo: string, destino: string, nota: string): string {
  const t = tipo?.toLowerCase() || ''
  const d = destino?.toLowerCase() || ''
  const n = nota?.toLowerCase() || ''
  if (t === 'renta') return 'renta'
  if (t === 'transfer') return 'transfer'
  if (t === 'local') return 'servicio_local'
  if (n.includes('tour largo')) return 'tour_largo'
  if (n.includes('jornada 8h') || n.includes('jornada 8')) return 'jornada_8h'
  if (t === 'tour') {
    const foraneos = ['catemaco','tajin','tajín','orizaba','puebla','veracruz','xalapa','jalapa','córdoba','cordoba','tlacotalpan','boca del rio','boca del río']
    if (foraneos.some(f => d.includes(f))) return 'tour_foraneo'
    return 'tour_local'
  }
  if (t === 'oficina') return 'oficina'
  return 'otro'
}

function calcularPagoBase(tipoServicio: string, tarifas: any[]): number {
  const mapa: any = { tour_foraneo:'tour_foraneo', tour_local:'tour_local', servicio_local:'servicio_local', renta:'renta', transfer:'transfer', tour_transfer:'renta', local_transfer:'tour_foraneo' }
  const key = mapa[tipoServicio]
  if (!key) return 0
  return tarifas.find(t => t.tipo === key)?.monto || 0
}

function tieneDerecho(tipoServicio: string): boolean {
  return ['tour_foraneo','renta','tour_transfer'].includes(tipoServicio)
}

export default function Calculadora() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [tarifas, setTarifas] = useState<any[]>([])
  const [operadorId, setOperadorId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filas, setFilas] = useState<any[]>([])
  const [sueldoBase, setSueldoBase] = useState(315)
  const [diasPeriodo, setDiasPeriodo] = useState(15)
  const [pagoTransferencia, setPagoTransferencia] = useState(0)
  const [pagoEfectivo, setPagoEfectivo] = useState(0)
  const [notaPago, setNotaPago] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pagosGuardados, setPagosGuardados] = useState<any[]>([])
  const [vistaTab, setVistaTab] = useState<'calc'|'historial'|'tarifas'>('calc')
  const [editandoTarifas, setEditandoTarifas] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: tar } = await supabase.from('tarifas').select('*').order('tipo')
    const { data: pags } = await supabase.from('pagos_operador').select('*, operadores(nombre)').order('created_at', { ascending: false }).limit(30)
    if (ops) setOperadores(ops)
    if (tar) setTarifas(tar)
    if (pags) setPagosGuardados(pags)
  }

  async function importarHistorial() {
    if (!operadorId || !fechaInicio || !fechaFin) {
      setMensaje('⚠️ Selecciona operador y periodo primero'); setTimeout(() => setMensaje(''), 3000); return
    }
    setLoading(true)
    const { data: asig } = await supabase.from('asignaciones')
      .select('*, unidades(nombre)')
      .eq('operador_id', operadorId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha')
    const { data: reportes } = await supabase.from('reportes_incidencia')
      .select('*').eq('operador_responsable_id', operadorId)
      .gte('fecha', fechaInicio).lte('fecha', fechaFin).eq('bono_descontado', true)

    const unidadesSuciasDates = new Set(reportes?.map((r: any) => r.fecha) || [])
    let nuevos = 0, duplicados = 0

    if (asig) {
      const nuevasFilas: any[] = []
      for (const a of asig) {
        const uid = `${a.fecha}-${a.operador_id}-${a.unidad_id}-${a.destino}-${a.tipo}`
        if (filas.some(f => f._uid === uid)) { duplicados++; continue }
        const tipoServicio = clasificarTipo(a.tipo, a.destino || '', a.nota || '')
        const pagoBase = calcularPagoBase(tipoServicio, tarifas)
        const derecho = tieneDerecho(tipoServicio)
        const tieneSucio = unidadesSuciasDates.has(a.fecha)
        nuevasFilas.push({
          _uid: uid, asignacion_id: a.id, fecha: a.fecha,
          unidad_nombre: a.unidades?.nombre || '',
          destino: a.destino || '', tipo_servicio: tipoServicio,
          pax: a.pax || 1, hora_inicio: a.hora_inicio || '', hora_fin: a.hora_fin || '',
          nota_original: a.nota || '', nota_pago: '',
          pago_base: pagoBase,
          bono_limpieza: derecho && !tieneSucio ? 100 : 0,
          bono_puntualidad: derecho ? 100 : 0,
          viaticos: 0, extra: 0, descuento: 0,
          origen: 'historial', _editado: false
        })
        nuevos++
      }
      setFilas(prev => [...prev, ...nuevasFilas])
    }
    setLoading(false)
    setMensaje(`✅ ${nuevos} servicios importados${duplicados > 0 ? `. ${duplicados} ya existían.` : '.'}`)
    setTimeout(() => setMensaje(''), 5000)
  }

  function actualizarFila(idx: number, campo: string, valor: any) {
    setFilas(prev => prev.map((f, i) => {
      if (i !== idx) return f
      const updated = { ...f, [campo]: valor, _editado: true }
      if (campo === 'tipo_servicio' && !f._editado) {
        updated.pago_base = calcularPagoBase(valor, tarifas)
        const derecho = tieneDerecho(valor)
        updated.bono_limpieza = derecho ? (f.bono_limpieza > 0 ? 100 : 0) : 0
        updated.bono_puntualidad = derecho ? 100 : 0
      }
      return updated
    }))
  }

  function eliminarFila(idx: number) {
    setFilas(prev => prev.filter((_, i) => i !== idx))
  }

  function agregarManual() {
    setFilas(prev => [...prev, {
      _uid: 'manual-' + Date.now(), asignacion_id: null, fecha: fechaInicio || new Date().toISOString().split('T')[0],
      unidad_nombre: '', destino: '', tipo_servicio: 'tour_foraneo',
      pax: 1, hora_inicio: '', hora_fin: '', nota_original: '', nota_pago: '',
      pago_base: calcularPagoBase('tour_foraneo', tarifas),
      bono_limpieza: 100, bono_puntualidad: 100, viaticos: 0, extra: 0, descuento: 0,
      origen: 'manual', _editado: true
    }])
  }

  function totalFila(f: any) {
    return (f.pago_base || 0) + (f.bono_limpieza || 0) + (f.bono_puntualidad || 0) + (f.viaticos || 0) + (f.extra || 0) - (f.descuento || 0)
  }

  const subtotalServicios = filas.reduce((s, f) => s + (f.pago_base || 0), 0)
  const totalBonos = filas.reduce((s, f) => s + (f.bono_limpieza || 0) + (f.bono_puntualidad || 0), 0)
  const totalViaticos = filas.reduce((s, f) => s + (f.viaticos || 0), 0)
  const totalExtras = filas.reduce((s, f) => s + (f.extra || 0), 0)
  const totalDescuentos = filas.reduce((s, f) => s + (f.descuento || 0), 0)
  const sueldoTotal = sueldoBase * diasPeriodo
  const totalPagar = subtotalServicios + totalBonos + totalViaticos + totalExtras - totalDescuentos + sueldoTotal
  const totalPagado = pagoTransferencia + pagoEfectivo
  const saldoPendiente = totalPagar - totalPagado

  async function guardarPago() {
    if (!operadorId || !fechaInicio || !fechaFin) {
      setMensaje('⚠️ Completa operador y periodo'); setTimeout(() => setMensaje(''), 3000); return
    }
    if (filas.length === 0) {
      setMensaje('⚠️ No hay servicios para guardar'); setTimeout(() => setMensaje(''), 3000); return
    }
    setGuardando(true)
    const { data: pago, error } = await supabase.from('pagos_operador').insert({
      operador_id: operadorId, fecha_inicio: fechaInicio, fecha_fin: fechaFin,
      subtotal_servicios: subtotalServicios, total_viaticos: totalViaticos,
      total_bonos: totalBonos, total_extras: totalExtras, total_descuentos: totalDescuentos,
      total_a_pagar: totalPagar, pago_transferencia: pagoTransferencia,
      pago_efectivo: pagoEfectivo, total_pagado: totalPagado,
      saldo_pendiente: saldoPendiente, estado, notas: notaPago
    }).select().single()

    if (error || !pago) { setMensaje('❌ Error: ' + error?.message); setGuardando(false); return }

    for (const f of filas) {
      await supabase.from('detalles_pago').insert({
        pago_id: pago.id, asignacion_id: f.asignacion_id,
        fecha: f.fecha, operador_id: operadorId,
        unidad_nombre: f.unidad_nombre, destino: f.destino,
        tipo_servicio: f.tipo_servicio, pax: f.pax,
        hora_inicio: f.hora_inicio, hora_fin: f.hora_fin,
        nota_original: f.nota_original, nota_pago: f.nota_pago,
        pago_base: f.pago_base, bono_limpieza: f.bono_limpieza,
        bono_puntualidad: f.bono_puntualidad, viaticos: f.viaticos,
        extra: f.extra, descuento: f.descuento,
        total_dia: totalFila(f), origen: f.origen
      })
    }
    setMensaje('✅ Pago guardado correctamente')
    setGuardando(false)
    cargarDatos()
    setTimeout(() => setMensaje(''), 4000)
  }

  async function generarPDF() {
    if (filas.length === 0) { setMensaje('⚠️ No hay servicios'); setTimeout(() => setMensaje(''), 3000); return }
    const op = operadores.find(o => o.id === operadorId)
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('TURITICKET', 105, 20, { align: 'center' })
    doc.setFontSize(12); doc.setFont('helvetica', 'normal')
    doc.text('Recibo de Pago de Operador', 105, 28, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Operador: ${op?.nombre || ''}`, 20, 40)
    doc.text(`Periodo: ${fechaInicio} al ${fechaFin}`, 20, 47)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, 20, 54)
    doc.text(`Estado: ${estado.toUpperCase()}`, 20, 61)

    autoTable(doc, {
      startY: 70,
      head: [['Fecha','Unidad','Destino','Tipo','Base','Bonos','Viát.','Extra','Desc.','Total']],
      body: filas.map(f => [
        f.fecha, f.unidad_nombre, f.destino || '—',
        LABEL_TIPO[f.tipo_servicio] || f.tipo_servicio,
        `$${f.pago_base}`,
        `$${(f.bono_limpieza||0)+(f.bono_puntualidad||0)}`,
        `$${f.viaticos||0}`, `$${f.extra||0}`, `$${f.descuento||0}`,
        `$${totalFila(f)}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [67, 56, 202] }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Sueldo base (${diasPeriodo} días x $${sueldoBase}): $${sueldoTotal.toLocaleString()}`, 20, finalY)
    doc.text(`Subtotal servicios: $${subtotalServicios.toLocaleString()}`, 20, finalY + 7)
    doc.text(`Total bonos: $${totalBonos.toLocaleString()}`, 20, finalY + 14)
    doc.text(`Total viáticos: $${totalViaticos.toLocaleString()}`, 20, finalY + 21)
    doc.text(`Descuentos: -$${totalDescuentos.toLocaleString()}`, 20, finalY + 28)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL A PAGAR: $${totalPagar.toLocaleString()}`, 20, finalY + 38)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pago transferencia: $${pagoTransferencia.toLocaleString()}`, 20, finalY + 45)
    doc.text(`Pago efectivo: $${pagoEfectivo.toLocaleString()}`, 20, finalY + 52)
    doc.text(`Saldo pendiente: $${saldoPendiente.toLocaleString()}`, 20, finalY + 59)

    const firmaY = finalY + 75
    doc.text('RECIBÍ DE CONFORMIDAD', 105, firmaY, { align: 'center' })
    doc.line(20, firmaY + 15, 90, firmaY + 15)
    doc.line(110, firmaY + 15, 190, firmaY + 15)
    doc.text(`Nombre: ${op?.nombre || ''}`, 20, firmaY + 20)
    doc.text('Firma', 110, firmaY + 20)
    doc.line(20, firmaY + 30, 90, firmaY + 30)
    doc.line(110, firmaY + 30, 190, firmaY + 30)
    doc.text('Fecha', 20, firmaY + 35)
    doc.text('Entregó', 110, firmaY + 35)

    doc.save(`Pago_${op?.nombre || 'operador'}_${fechaInicio}_${fechaFin}.pdf`)
  }

  async function guardarTarifa(id: string, monto: number) {
    await supabase.from('tarifas').update({ monto }).eq('id', id)
    cargarDatos()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-semibold">Calculadora de pagos</h1><p className="text-gray-400 text-sm">Pago quincenal por operador</p></div>
          <div className="flex gap-2">
            {(['calc','historial','tarifas'] as const).map(t => (
              <button key={t} onClick={() => setVistaTab(t)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${vistaTab===t?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t === 'calc' ? '🧮 Calculadora' : t === 'historial' ? '📋 Historial pagos' : '⚙️ Tarifas'}
              </button>
            ))}
          </div>
        </div>

        {mensaje && <div className="mb-4 bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg text-sm">{mensaje}</div>}

        {vistaTab === 'tarifas' && (
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-300">Configuración de tarifas</h2>
              <button onClick={() => setEditandoTarifas(!editandoTarifas)} className="text-sm text-indigo-400 hover:text-indigo-300">{editandoTarifas ? 'Cerrar edición' : 'Editar tarifas'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tarifas.map(t => (
                <div key={t.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{t.descripcion}</p>
                  {editandoTarifas ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input type="number" defaultValue={t.monto} onBlur={e => guardarTarifa(t.id, parseFloat(e.target.value))}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white w-24" />
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-green-400">${t.monto}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {vistaTab === 'historial' && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {pagosGuardados.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No hay pagos guardados</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800"><th className="text-left px-4 py-3 text-gray-400">Operador</th><th className="text-left px-4 py-3 text-gray-400">Periodo</th><th className="text-right px-4 py-3 text-gray-400">Total</th><th className="text-right px-4 py-3 text-gray-400">Pagado</th><th className="text-right px-4 py-3 text-gray-400">Saldo</th><th className="px-4 py-3 text-gray-400">Estado</th></tr></thead>
                <tbody>
                  {pagosGuardados.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                      <td className="px-4 py-3 font-medium">{p.operadores?.nombre}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p.fecha_inicio} — {p.fecha_fin}</td>
                      <td className="px-4 py-3 text-right font-bold">${p.total_a_pagar?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-400">${p.total_pagado?.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${p.saldo_pendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>${p.saldo_pendiente?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${p.estado==='pagado'?'bg-green-900 text-green-200':p.estado==='parcial'?'bg-yellow-900 text-yellow-200':'bg-red-900 text-red-200'}`}>{p.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaTab === 'calc' && (
          <>
            {/* Selector operador y periodo */}
            <div className="bg-gray-900 rounded-xl p-5 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Operador</label>
                  <select value={operadorId} onChange={e => setOperadorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="">Seleccionar...</option>
                    {operadores.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Fecha inicio</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Fecha fin</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Días del periodo</label>
                  <input type="number" value={diasPeriodo} onChange={e => setDiasPeriodo(parseInt(e.target.value)||15)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={importarHistorial} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {loading ? 'Importando...' : '📥 Importar desde historial'}
                </button>
                <button onClick={agregarManual} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium">+ Agregar manual</button>
                <button onClick={() => setFilas([])} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-400">🗑 Limpiar</button>
              </div>
            </div>

            {/* Sueldo base */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4 flex gap-6 items-center">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sueldo base diario</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input type="number" value={sueldoBase} onChange={e => setSueldoBase(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-24" />
                </div>
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{diasPeriodo} días</span> × <span className="text-white font-medium">${sueldoBase}</span> = <span className="text-green-400 font-bold text-base">${(sueldoBase * diasPeriodo).toLocaleString()}</span>
              </div>
            </div>

            {/* Tabla de servicios */}
            {filas.length > 0 && (
              <div className="bg-gray-900 rounded-xl overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400">
                        <th className="px-2 py-3 text-left">Fecha</th>
                        <th className="px-2 py-3 text-left">Unidad</th>
                        <th className="px-2 py-3 text-left">Destino</th>
                        <th className="px-2 py-3 text-left">Tipo</th>
                        <th className="px-2 py-3 text-center">Base</th>
                        <th className="px-2 py-3 text-center">B.Limp</th>
                        <th className="px-2 py-3 text-center">B.Punt</th>
                        <th className="px-2 py-3 text-center">Viát.</th>
                        <th className="px-2 py-3 text-center">Extra</th>
                        <th className="px-2 py-3 text-center">Desc.</th>
                        <th className="px-2 py-3 text-center font-bold text-white">Total</th>
                        <th className="px-2 py-3 text-left">Origen</th>
                        <th className="px-2 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f, i) => (
                        <tr key={i} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                          <td className="px-2 py-2">{f.fecha}</td>
                          <td className="px-2 py-2 text-gray-400">{f.unidad_nombre||'—'}</td>
                          <td className="px-2 py-2 text-gray-400">{f.destino||'—'}</td>
                          <td className="px-2 py-2">
                            <select value={f.tipo_servicio} onChange={e => actualizarFila(i,'tipo_servicio',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-32">
                              {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{LABEL_TIPO[t]}</option>)}
                            </select>
                          </td>
                          {['pago_base','bono_limpieza','bono_puntualidad','viaticos','extra','descuento'].map(campo => (
                            <td key={campo} className="px-2 py-2 text-center">
                              <input type="number" value={f[campo]||0} onChange={e => actualizarFila(i, campo, parseFloat(e.target.value)||0)}
                                className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-14 text-center" />
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center font-bold text-green-400">${totalFila(f)}</td>
                          <td className="px-2 py-2">
                            <span className={`text-xs px-1 py-0.5 rounded ${f.origen==='historial'?'bg-blue-900 text-blue-200':'bg-yellow-900 text-yellow-200'}`}>{f.origen==='historial'?'Hist.':'Manual'}</span>
                          </td>
                          <td className="px-2 py-2"><button onClick={() => eliminarFila(i)} className="text-gray-500 hover:text-red-400">×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resumen */}
            {filas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Resumen del pago</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Sueldo base ({diasPeriodo}d)</span><span>${sueldoTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Subtotal servicios</span><span>${subtotalServicios.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total bonos</span><span>${totalBonos.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total viáticos</span><span>${totalViaticos.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Extras</span><span>${totalExtras.toLocaleString()}</span></div>
                    <div className="flex justify-between text-red-400"><span>Descuentos</span><span>-${totalDescuentos.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-green-400 text-base border-t border-gray-700 pt-2 mt-2"><span>TOTAL A PAGAR</span><span>${totalPagar.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Registro de pago</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Pago transferencia</label>
                      <div className="flex items-center gap-2"><span className="text-gray-500">$</span><input type="number" value={pagoTransferencia} onChange={e => setPagoTransferencia(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-32" /></div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Pago efectivo</label>
                      <div className="flex items-center gap-2"><span className="text-gray-500">$</span><input type="number" value={pagoEfectivo} onChange={e => setPagoEfectivo(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-32" /></div>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Total pagado</span>
                      <span className="font-medium text-green-400">${totalPagado.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Saldo pendiente</span>
                      <span className={`font-bold ${saldoPendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>${saldoPendiente.toLocaleString()}</span>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Estado</label>
                      <select value={estado} onChange={e => setEstado(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full">
                        <option value="pendiente">Pendiente</option>
                        <option value="parcial">Pagado parcial</option>
                        <option value="pagado">Pagado completo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Notas</label>
                      <input type="text" value={notaPago} onChange={e => setNotaPago(e.target.value)} placeholder="Observaciones..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filas.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <button onClick={guardarPago} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{guardando ? 'Guardando...' : '💾 Guardar pago'}</button>
                <button onClick={generarPDF} className="bg-green-700 hover:bg-green-600 px-5 py-2 rounded-lg text-sm font-medium">📄 Generar PDF</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
EOcat > /Users/imagenturiticket/turiticket-operadores/src/app/calculadora/page.tsx << 'EOF'
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const TIPOS_SERVICIO = ['tour_foraneo','tour_local','servicio_local','renta','transfer','tour_transfer','local_transfer','jornada_8h','tour_largo','descanso_trabajado','descanso','oficina','otro']
const LABEL_TIPO: any = { tour_foraneo:'Tour foráneo', tour_local:'Tour local', servicio_local:'Servicio local', renta:'Renta', transfer:'Transfer', tour_transfer:'Tour + Transfer', local_transfer:'Local + Transfer', jornada_8h:'Jornada 8H', tour_largo:'Tour largo', descanso_trabajado:'Descanso trabajado', descanso:'Descanso', oficina:'Oficina', otro:'Otro' }

function clasificarTipo(tipo: string, destino: string, nota: string): string {
  const t = tipo?.toLowerCase() || ''
  const d = destino?.toLowerCase() || ''
  const n = nota?.toLowerCase() || ''
  if (t === 'renta') return 'renta'
  if (t === 'transfer') return 'transfer'
  if (t === 'local') return 'servicio_local'
  if (n.includes('tour largo')) return 'tour_largo'
  if (n.includes('jornada 8h') || n.includes('jornada 8')) return 'jornada_8h'
  if (t === 'tour') {
    const foraneos = ['catemaco','tajin','tajín','orizaba','puebla','veracruz','xalapa','jalapa','córdoba','cordoba','tlacotalpan','boca del rio','boca del río']
    if (foraneos.some(f => d.includes(f))) return 'tour_foraneo'
    return 'tour_local'
  }
  if (t === 'oficina') return 'oficina'
  return 'otro'
}

function calcularPagoBase(tipoServicio: string, tarifas: any[]): number {
  const mapa: any = { tour_foraneo:'tour_foraneo', tour_local:'tour_local', servicio_local:'servicio_local', renta:'renta', transfer:'transfer', tour_transfer:'renta', local_transfer:'tour_foraneo' }
  const key = mapa[tipoServicio]
  if (!key) return 0
  return tarifas.find(t => t.tipo === key)?.monto || 0
}

function tieneDerecho(tipoServicio: string): boolean {
  return ['tour_foraneo','renta','tour_transfer'].includes(tipoServicio)
}

export default function Calculadora() {
  const [operadores, setOperadores] = useState<any[]>([])
  const [tarifas, setTarifas] = useState<any[]>([])
  const [operadorId, setOperadorId] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filas, setFilas] = useState<any[]>([])
  const [sueldoBase, setSueldoBase] = useState(315)
  const [diasPeriodo, setDiasPeriodo] = useState(15)
  const [pagoTransferencia, setPagoTransferencia] = useState(0)
  const [pagoEfectivo, setPagoEfectivo] = useState(0)
  const [notaPago, setNotaPago] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pagosGuardados, setPagosGuardados] = useState<any[]>([])
  const [vistaTab, setVistaTab] = useState<'calc'|'historial'|'tarifas'>('calc')
  const [editandoTarifas, setEditandoTarifas] = useState(false)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const { data: ops } = await supabase.from('operadores').select('*').eq('activo', true).order('nombre')
    const { data: tar } = await supabase.from('tarifas').select('*').order('tipo')
    const { data: pags } = await supabase.from('pagos_operador').select('*, operadores(nombre)').order('created_at', { ascending: false }).limit(30)
    if (ops) setOperadores(ops)
    if (tar) setTarifas(tar)
    if (pags) setPagosGuardados(pags)
  }

  async function importarHistorial() {
    if (!operadorId || !fechaInicio || !fechaFin) {
      setMensaje('⚠️ Selecciona operador y periodo primero'); setTimeout(() => setMensaje(''), 3000); return
    }
    setLoading(true)
    const { data: asig } = await supabase.from('asignaciones')
      .select('*, unidades(nombre)')
      .eq('operador_id', operadorId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha')
    const { data: reportes } = await supabase.from('reportes_incidencia')
      .select('*').eq('operador_responsable_id', operadorId)
      .gte('fecha', fechaInicio).lte('fecha', fechaFin).eq('bono_descontado', true)

    const unidadesSuciasDates = new Set(reportes?.map((r: any) => r.fecha) || [])
    let nuevos = 0, duplicados = 0

    if (asig) {
      const nuevasFilas: any[] = []
      for (const a of asig) {
        const uid = `${a.fecha}-${a.operador_id}-${a.unidad_id}-${a.destino}-${a.tipo}`
        if (filas.some(f => f._uid === uid)) { duplicados++; continue }
        const tipoServicio = clasificarTipo(a.tipo, a.destino || '', a.nota || '')
        const pagoBase = calcularPagoBase(tipoServicio, tarifas)
        const derecho = tieneDerecho(tipoServicio)
        const tieneSucio = unidadesSuciasDates.has(a.fecha)
        nuevasFilas.push({
          _uid: uid, asignacion_id: a.id, fecha: a.fecha,
          unidad_nombre: a.unidades?.nombre || '',
          destino: a.destino || '', tipo_servicio: tipoServicio,
          pax: a.pax || 1, hora_inicio: a.hora_inicio || '', hora_fin: a.hora_fin || '',
          nota_original: a.nota || '', nota_pago: '',
          pago_base: pagoBase,
          bono_limpieza: derecho && !tieneSucio ? 100 : 0,
          bono_puntualidad: derecho ? 100 : 0,
          viaticos: 0, extra: 0, descuento: 0,
          origen: 'historial', _editado: false
        })
        nuevos++
      }
      setFilas(prev => [...prev, ...nuevasFilas])
    }
    setLoading(false)
    setMensaje(`✅ ${nuevos} servicios importados${duplicados > 0 ? `. ${duplicados} ya existían.` : '.'}`)
    setTimeout(() => setMensaje(''), 5000)
  }

  function actualizarFila(idx: number, campo: string, valor: any) {
    setFilas(prev => prev.map((f, i) => {
      if (i !== idx) return f
      const updated = { ...f, [campo]: valor, _editado: true }
      if (campo === 'tipo_servicio' && !f._editado) {
        updated.pago_base = calcularPagoBase(valor, tarifas)
        const derecho = tieneDerecho(valor)
        updated.bono_limpieza = derecho ? (f.bono_limpieza > 0 ? 100 : 0) : 0
        updated.bono_puntualidad = derecho ? 100 : 0
      }
      return updated
    }))
  }

  function eliminarFila(idx: number) {
    setFilas(prev => prev.filter((_, i) => i !== idx))
  }

  function agregarManual() {
    setFilas(prev => [...prev, {
      _uid: 'manual-' + Date.now(), asignacion_id: null, fecha: fechaInicio || new Date().toISOString().split('T')[0],
      unidad_nombre: '', destino: '', tipo_servicio: 'tour_foraneo',
      pax: 1, hora_inicio: '', hora_fin: '', nota_original: '', nota_pago: '',
      pago_base: calcularPagoBase('tour_foraneo', tarifas),
      bono_limpieza: 100, bono_puntualidad: 100, viaticos: 0, extra: 0, descuento: 0,
      origen: 'manual', _editado: true
    }])
  }

  function totalFila(f: any) {
    return (f.pago_base || 0) + (f.bono_limpieza || 0) + (f.bono_puntualidad || 0) + (f.viaticos || 0) + (f.extra || 0) - (f.descuento || 0)
  }

  const subtotalServicios = filas.reduce((s, f) => s + (f.pago_base || 0), 0)
  const totalBonos = filas.reduce((s, f) => s + (f.bono_limpieza || 0) + (f.bono_puntualidad || 0), 0)
  const totalViaticos = filas.reduce((s, f) => s + (f.viaticos || 0), 0)
  const totalExtras = filas.reduce((s, f) => s + (f.extra || 0), 0)
  const totalDescuentos = filas.reduce((s, f) => s + (f.descuento || 0), 0)
  const sueldoTotal = sueldoBase * diasPeriodo
  const totalPagar = subtotalServicios + totalBonos + totalViaticos + totalExtras - totalDescuentos + sueldoTotal
  const totalPagado = pagoTransferencia + pagoEfectivo
  const saldoPendiente = totalPagar - totalPagado

  async function guardarPago() {
    if (!operadorId || !fechaInicio || !fechaFin) {
      setMensaje('⚠️ Completa operador y periodo'); setTimeout(() => setMensaje(''), 3000); return
    }
    if (filas.length === 0) {
      setMensaje('⚠️ No hay servicios para guardar'); setTimeout(() => setMensaje(''), 3000); return
    }
    setGuardando(true)
    const { data: pago, error } = await supabase.from('pagos_operador').insert({
      operador_id: operadorId, fecha_inicio: fechaInicio, fecha_fin: fechaFin,
      subtotal_servicios: subtotalServicios, total_viaticos: totalViaticos,
      total_bonos: totalBonos, total_extras: totalExtras, total_descuentos: totalDescuentos,
      total_a_pagar: totalPagar, pago_transferencia: pagoTransferencia,
      pago_efectivo: pagoEfectivo, total_pagado: totalPagado,
      saldo_pendiente: saldoPendiente, estado, notas: notaPago
    }).select().single()

    if (error || !pago) { setMensaje('❌ Error: ' + error?.message); setGuardando(false); return }

    for (const f of filas) {
      await supabase.from('detalles_pago').insert({
        pago_id: pago.id, asignacion_id: f.asignacion_id,
        fecha: f.fecha, operador_id: operadorId,
        unidad_nombre: f.unidad_nombre, destino: f.destino,
        tipo_servicio: f.tipo_servicio, pax: f.pax,
        hora_inicio: f.hora_inicio, hora_fin: f.hora_fin,
        nota_original: f.nota_original, nota_pago: f.nota_pago,
        pago_base: f.pago_base, bono_limpieza: f.bono_limpieza,
        bono_puntualidad: f.bono_puntualidad, viaticos: f.viaticos,
        extra: f.extra, descuento: f.descuento,
        total_dia: totalFila(f), origen: f.origen
      })
    }
    setMensaje('✅ Pago guardado correctamente')
    setGuardando(false)
    cargarDatos()
    setTimeout(() => setMensaje(''), 4000)
  }

  async function generarPDF() {
    if (filas.length === 0) { setMensaje('⚠️ No hay servicios'); setTimeout(() => setMensaje(''), 3000); return }
    const op = operadores.find(o => o.id === operadorId)
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('TURITICKET', 105, 20, { align: 'center' })
    doc.setFontSize(12); doc.setFont('helvetica', 'normal')
    doc.text('Recibo de Pago de Operador', 105, 28, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Operador: ${op?.nombre || ''}`, 20, 40)
    doc.text(`Periodo: ${fechaInicio} al ${fechaFin}`, 20, 47)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, 20, 54)
    doc.text(`Estado: ${estado.toUpperCase()}`, 20, 61)

    autoTable(doc, {
      startY: 70,
      head: [['Fecha','Unidad','Destino','Tipo','Base','Bonos','Viát.','Extra','Desc.','Total']],
      body: filas.map(f => [
        f.fecha, f.unidad_nombre, f.destino || '—',
        LABEL_TIPO[f.tipo_servicio] || f.tipo_servicio,
        `$${f.pago_base}`,
        `$${(f.bono_limpieza||0)+(f.bono_puntualidad||0)}`,
        `$${f.viaticos||0}`, `$${f.extra||0}`, `$${f.descuento||0}`,
        `$${totalFila(f)}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [67, 56, 202] }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Sueldo base (${diasPeriodo} días x $${sueldoBase}): $${sueldoTotal.toLocaleString()}`, 20, finalY)
    doc.text(`Subtotal servicios: $${subtotalServicios.toLocaleString()}`, 20, finalY + 7)
    doc.text(`Total bonos: $${totalBonos.toLocaleString()}`, 20, finalY + 14)
    doc.text(`Total viáticos: $${totalViaticos.toLocaleString()}`, 20, finalY + 21)
    doc.text(`Descuentos: -$${totalDescuentos.toLocaleString()}`, 20, finalY + 28)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL A PAGAR: $${totalPagar.toLocaleString()}`, 20, finalY + 38)
    doc.setFont('helvetica', 'normal')
    doc.text(`Pago transferencia: $${pagoTransferencia.toLocaleString()}`, 20, finalY + 45)
    doc.text(`Pago efectivo: $${pagoEfectivo.toLocaleString()}`, 20, finalY + 52)
    doc.text(`Saldo pendiente: $${saldoPendiente.toLocaleString()}`, 20, finalY + 59)

    const firmaY = finalY + 75
    doc.text('RECIBÍ DE CONFORMIDAD', 105, firmaY, { align: 'center' })
    doc.line(20, firmaY + 15, 90, firmaY + 15)
    doc.line(110, firmaY + 15, 190, firmaY + 15)
    doc.text(`Nombre: ${op?.nombre || ''}`, 20, firmaY + 20)
    doc.text('Firma', 110, firmaY + 20)
    doc.line(20, firmaY + 30, 90, firmaY + 30)
    doc.line(110, firmaY + 30, 190, firmaY + 30)
    doc.text('Fecha', 20, firmaY + 35)
    doc.text('Entregó', 110, firmaY + 35)

    doc.save(`Pago_${op?.nombre || 'operador'}_${fechaInicio}_${fechaFin}.pdf`)
  }

  async function guardarTarifa(id: string, monto: number) {
    await supabase.from('tarifas').update({ monto }).eq('id', id)
    cargarDatos()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-semibold">Calculadora de pagos</h1><p className="text-gray-400 text-sm">Pago quincenal por operador</p></div>
          <div className="flex gap-2">
            {(['calc','historial','tarifas'] as const).map(t => (
              <button key={t} onClick={() => setVistaTab(t)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${vistaTab===t?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t === 'calc' ? '🧮 Calculadora' : t === 'historial' ? '📋 Historial pagos' : '⚙️ Tarifas'}
              </button>
            ))}
          </div>
        </div>

        {mensaje && <div className="mb-4 bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg text-sm">{mensaje}</div>}

        {vistaTab === 'tarifas' && (
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-300">Configuración de tarifas</h2>
              <button onClick={() => setEditandoTarifas(!editandoTarifas)} className="text-sm text-indigo-400 hover:text-indigo-300">{editandoTarifas ? 'Cerrar edición' : 'Editar tarifas'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tarifas.map(t => (
                <div key={t.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{t.descripcion}</p>
                  {editandoTarifas ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input type="number" defaultValue={t.monto} onBlur={e => guardarTarifa(t.id, parseFloat(e.target.value))}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white w-24" />
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-green-400">${t.monto}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {vistaTab === 'historial' && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {pagosGuardados.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No hay pagos guardados</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800"><th className="text-left px-4 py-3 text-gray-400">Operador</th><th className="text-left px-4 py-3 text-gray-400">Periodo</th><th className="text-right px-4 py-3 text-gray-400">Total</th><th className="text-right px-4 py-3 text-gray-400">Pagado</th><th className="text-right px-4 py-3 text-gray-400">Saldo</th><th className="px-4 py-3 text-gray-400">Estado</th></tr></thead>
                <tbody>
                  {pagosGuardados.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                      <td className="px-4 py-3 font-medium">{p.operadores?.nombre}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p.fecha_inicio} — {p.fecha_fin}</td>
                      <td className="px-4 py-3 text-right font-bold">${p.total_a_pagar?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-400">${p.total_pagado?.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${p.saldo_pendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>${p.saldo_pendiente?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${p.estado==='pagado'?'bg-green-900 text-green-200':p.estado==='parcial'?'bg-yellow-900 text-yellow-200':'bg-red-900 text-red-200'}`}>{p.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaTab === 'calc' && (
          <>
            {/* Selector operador y periodo */}
            <div className="bg-gray-900 rounded-xl p-5 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Operador</label>
                  <select value={operadorId} onChange={e => setOperadorId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="">Seleccionar...</option>
                    {operadores.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Fecha inicio</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Fecha fin</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Días del periodo</label>
                  <input type="number" value={diasPeriodo} onChange={e => setDiasPeriodo(parseInt(e.target.value)||15)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={importarHistorial} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {loading ? 'Importando...' : '📥 Importar desde historial'}
                </button>
                <button onClick={agregarManual} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium">+ Agregar manual</button>
                <button onClick={() => setFilas([])} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-400">🗑 Limpiar</button>
              </div>
            </div>

            {/* Sueldo base */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4 flex gap-6 items-center">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sueldo base diario</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input type="number" value={sueldoBase} onChange={e => setSueldoBase(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-24" />
                </div>
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{diasPeriodo} días</span> × <span className="text-white font-medium">${sueldoBase}</span> = <span className="text-green-400 font-bold text-base">${(sueldoBase * diasPeriodo).toLocaleString()}</span>
              </div>
            </div>

            {/* Tabla de servicios */}
            {filas.length > 0 && (
              <div className="bg-gray-900 rounded-xl overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400">
                        <th className="px-2 py-3 text-left">Fecha</th>
                        <th className="px-2 py-3 text-left">Unidad</th>
                        <th className="px-2 py-3 text-left">Destino</th>
                        <th className="px-2 py-3 text-left">Tipo</th>
                        <th className="px-2 py-3 text-center">Base</th>
                        <th className="px-2 py-3 text-center">B.Limp</th>
                        <th className="px-2 py-3 text-center">B.Punt</th>
                        <th className="px-2 py-3 text-center">Viát.</th>
                        <th className="px-2 py-3 text-center">Extra</th>
                        <th className="px-2 py-3 text-center">Desc.</th>
                        <th className="px-2 py-3 text-center font-bold text-white">Total</th>
                        <th className="px-2 py-3 text-left">Origen</th>
                        <th className="px-2 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f, i) => (
                        <tr key={i} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                          <td className="px-2 py-2">{f.fecha}</td>
                          <td className="px-2 py-2 text-gray-400">{f.unidad_nombre||'—'}</td>
                          <td className="px-2 py-2 text-gray-400">{f.destino||'—'}</td>
                          <td className="px-2 py-2">
                            <select value={f.tipo_servicio} onChange={e => actualizarFila(i,'tipo_servicio',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-32">
                              {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{LABEL_TIPO[t]}</option>)}
                            </select>
                          </td>
                          {['pago_base','bono_limpieza','bono_puntualidad','viaticos','extra','descuento'].map(campo => (
                            <td key={campo} className="px-2 py-2 text-center">
                              <input type="number" value={f[campo]||0} onChange={e => actualizarFila(i, campo, parseFloat(e.target.value)||0)}
                                className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-14 text-center" />
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center font-bold text-green-400">${totalFila(f)}</td>
                          <td className="px-2 py-2">
                            <span className={`text-xs px-1 py-0.5 rounded ${f.origen==='historial'?'bg-blue-900 text-blue-200':'bg-yellow-900 text-yellow-200'}`}>{f.origen==='historial'?'Hist.':'Manual'}</span>
                          </td>
                          <td className="px-2 py-2"><button onClick={() => eliminarFila(i)} className="text-gray-500 hover:text-red-400">×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resumen */}
            {filas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Resumen del pago</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Sueldo base ({diasPeriodo}d)</span><span>${sueldoTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Subtotal servicios</span><span>${subtotalServicios.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total bonos</span><span>${totalBonos.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total viáticos</span><span>${totalViaticos.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Extras</span><span>${totalExtras.toLocaleString()}</span></div>
                    <div className="flex justify-between text-red-400"><span>Descuentos</span><span>-${totalDescuentos.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-green-400 text-base border-t border-gray-700 pt-2 mt-2"><span>TOTAL A PAGAR</span><span>${totalPagar.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Registro de pago</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Pago transferencia</label>
                      <div className="flex items-center gap-2"><span className="text-gray-500">$</span><input type="number" value={pagoTransferencia} onChange={e => setPagoTransferencia(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-32" /></div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Pago efectivo</label>
                      <div className="flex items-center gap-2"><span className="text-gray-500">$</span><input type="number" value={pagoEfectivo} onChange={e => setPagoEfectivo(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-32" /></div>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Total pagado</span>
                      <span className="font-medium text-green-400">${totalPagado.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Saldo pendiente</span>
                      <span className={`font-bold ${saldoPendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>${saldoPendiente.toLocaleString()}</span>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Estado</label>
                      <select value={estado} onChange={e => setEstado(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full">
                        <option value="pendiente">Pendiente</option>
                        <option value="parcial">Pagado parcial</option>
                        <option value="pagado">Pagado completo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Notas</label>
                      <input type="text" value={notaPago} onChange={e => setNotaPago(e.target.value)} placeholder="Observaciones..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filas.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <button onClick={guardarPago} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{guardando ? 'Guardando...' : '💾 Guardar pago'}</button>
                <button onClick={generarPDF} className="bg-green-700 hover:bg-green-600 px-5 py-2 rounded-lg text-sm font-medium">📄 Generar PDF</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
