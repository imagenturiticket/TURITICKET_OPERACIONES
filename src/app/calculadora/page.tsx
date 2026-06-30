'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const TOURS_FORANEOS = ['catemaco','tajin','tajín','orizaba','xalapa','jalapa','cempoala','dunas','chachalacas','rafting','jalcomulco','cafe','tour del cafe','tlacotalpan','puebla','veracruz','roca','alvarado']
const LOCALES = ['san juan','mandinga','local','ulua']
const TIPOS_SERVICIO = ['tour_foraneo','servicio_local','renta','transfer','transfer_especial','tour_transfer','jornada_8h','descanso','vacaciones','falta','oficina','otro']
const LABEL_TIPO: any = { tour_foraneo:'Tour foráneo', servicio_local:'Servicio local', renta:'Renta', transfer:'Transfer sencillo', transfer_especial:'Transfer especial', tour_transfer:'Tour + Transfer', jornada_8h:'Jornada 8H', descanso:'Descanso', vacaciones:'Vacaciones', falta:'Falta', oficina:'Oficina', otro:'Otro' }
const VIATICOS: any = { tour_foraneo:250, servicio_local:150, renta:450, transfer:0, transfer_especial:0, tour_transfer:450, jornada_8h:0, descanso:0, vacaciones:0, falta:0, oficina:0, otro:0 }
const BONO_DERECHO: any = { tour_foraneo:true, servicio_local:false, renta:true, transfer:false, transfer_especial:false, tour_transfer:true, jornada_8h:false, descanso:false, vacaciones:false, falta:false, oficina:false, otro:false }

const DIAS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function formatFechaES(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const date = new Date(y, m-1, d)
  return `${DIAS_ES[date.getDay()]} ${d} de ${MESES_ES[m-1]}`
}

function clasificarTipo(tipo: string, destino: string, nota: string): string {
  const t = tipo?.toLowerCase().trim() || ''
  const d = destino?.toLowerCase().trim() || ''
  const n = nota?.toLowerCase().trim() || ''
  if (d.includes('vacacion')) return 'vacaciones'
  if (d.includes('falta')) return 'falta'
  if (d.includes('tour + transfer') || n.includes('tour + transfer')) return 'tour_transfer'
  if (t === 'renta' && !d.includes('tour')) return 'renta'
  if (t === 'oficina' || d.includes('oficina') || d.includes('a. oficina')) return 'oficina'
  if (d.includes('descanso') || n.includes('descanso')) return 'descanso'
  if (t === 'transfer' || d === 'transfer') return 'transfer'
  if (t === 'local' || t === 'servicio_local') return 'servicio_local'
  if (n.includes('jornada') || d.includes('jornada') || d.includes('a. gaby') || d.includes('apoyo')) return 'jornada_8h'
  if (t === 'tour' || t === 'renta') {
    if (TOURS_FORANEOS.some(f => d.includes(f)) || d === '') return 'tour_foraneo'
    if (LOCALES.some(l => d.includes(l))) return 'servicio_local'
    return 'tour_foraneo'
  }
  return 'otro'
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
      setMensaje('⚠️ Selecciona operador y periodo'); setTimeout(() => setMensaje(''), 3000); return
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

    const fechasSucio = new Set(reportes?.map((r: any) => r.fecha) || [])
    let nuevos = 0, duplicados = 0

    if (asig) {
      const nuevasFilas: any[] = []
      for (const a of asig) {
        const uid = `${a.fecha}-${a.operador_id}-${a.unidad_id}-${a.destino}-${a.tipo}`
        if (filas.some(f => f._uid === uid)) { duplicados++; continue }
        const tipoServicio = clasificarTipo(a.tipo, a.destino || '', a.nota || '')
        const pagoBase = VIATICOS[tipoServicio] || 0
        const derecho = BONO_DERECHO[tipoServicio] || false
        const sucio = fechasSucio.has(a.fecha)

        // Si es servicio local sin destino, mostrar LOCALES
        let destinoMostrar = a.destino || ''
        if (tipoServicio === 'servicio_local' && !destinoMostrar) {
          destinoMostrar = 'LOCALES'
        }
        // Si es descanso sin destino, mostrar DESCANSO
        if (tipoServicio === 'descanso' && !destinoMostrar) {
          destinoMostrar = 'DESCANSO'
        }
        // Si es oficina sin destino, mostrar OFICINA
        if (tipoServicio === 'oficina' && !destinoMostrar) {
          destinoMostrar = 'OFICINA'
        }

        nuevasFilas.push({
          _uid: uid, asignacion_id: a.id, fecha: a.fecha,
          unidad_nombre: a.unidades?.nombre || '',
          destino: destinoMostrar, tipo_servicio: tipoServicio,
          pax: a.pax || 1, hora_inicio: a.hora_inicio || '', hora_fin: a.hora_fin || '',
          nota_original: a.nota || '', nota_pago: '',
          pago_base: pagoBase,
          bono: derecho && !sucio,
          extra: 0, festivo: 0, descuento: 0, origen: 'historial'
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
      const updated = { ...f, [campo]: valor }
      if (campo === 'tipo_servicio') {
        updated.pago_base = VIATICOS[valor] || 0
        if (!BONO_DERECHO[valor]) updated.bono = false
      }
      return updated
    }))
  }

  function eliminarFila(idx: number) { setFilas(prev => prev.filter((_, i) => i !== idx)) }

  function agregarManual() {
    setFilas(prev => [...prev, {
      _uid: 'manual-' + Date.now(), asignacion_id: null,
      fecha: fechaInicio || new Date().toISOString().split('T')[0],
      unidad_nombre: '', destino: '', tipo_servicio: 'tour_foraneo',
      pax: 1, hora_inicio: '', hora_fin: '', nota_original: '', nota_pago: '',
      pago_base: 250, bono: true, extra: 0, festivo: 0, descuento: 0, origen: 'manual'
    }])
  }

  function totalFila(f: any) {
    if (['descanso','vacaciones','falta','oficina','jornada_8h'].includes(f.tipo_servicio)) return f.festivo || 0
    return (f.pago_base||0) + (f.bono?100:0) + (f.extra||0) + (f.festivo||0) - (f.descuento||0)
  }

  const subtotalServicios = filas.reduce((s,f) => s+(f.pago_base||0), 0)
  const totalBonos = filas.reduce((s,f) => s+(f.bono?100:0), 0)
  const totalExtras = filas.reduce((s,f) => s+(f.extra||0), 0)
  const totalFestivos = filas.reduce((s,f) => s+(f.festivo||0), 0)
  const totalDescuentos = filas.reduce((s,f) => s+(f.descuento||0), 0)
  const sueldoTotal = sueldoBase * diasPeriodo
  const totalPagar = subtotalServicios + totalBonos + totalExtras + totalFestivos - totalDescuentos + sueldoTotal
  const totalPagado = pagoTransferencia + pagoEfectivo
  const saldoPendiente = totalPagar - totalPagado

  async function guardarPago() {
    if (!operadorId || !fechaInicio || !fechaFin || filas.length === 0) {
      setMensaje('⚠️ Completa operador, periodo y servicios'); setTimeout(() => setMensaje(''), 3000); return
    }
    setGuardando(true)
    const { data: pago, error } = await supabase.from('pagos_operador').insert({
      operador_id: operadorId, fecha_inicio: fechaInicio, fecha_fin: fechaFin,
      subtotal_servicios: subtotalServicios, total_viaticos: 0,
      total_bonos: totalBonos, total_extras: totalExtras + totalFestivos, total_descuentos: totalDescuentos,
      total_a_pagar: totalPagar, pago_transferencia: pagoTransferencia,
      pago_efectivo: pagoEfectivo, total_pagado: totalPagado,
      saldo_pendiente: saldoPendiente, estado, notas: notaPago
    }).select().single()
    if (error || !pago) { setMensaje('❌ Error: ' + error?.message); setGuardando(false); return }
    for (const f of filas) {
      await supabase.from('detalles_pago').insert({
        pago_id: pago.id, asignacion_id: f.asignacion_id, fecha: f.fecha,
        operador_id: operadorId, unidad_nombre: f.unidad_nombre, destino: f.destino,
        tipo_servicio: f.tipo_servicio, pax: f.pax,
        nota_original: f.nota_original, nota_pago: f.nota_pago,
        pago_base: f.pago_base, bono_limpieza: f.bono?100:0, bono_puntualidad: 0,
        viaticos: 0, extra: (f.extra||0)+(f.festivo||0), descuento: f.descuento,
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

    doc.setFillColor(67, 56, 202)
    doc.rect(0, 0, 216, 18, 'F')
    doc.setTextColor(255,255,255)
    doc.setFontSize(13); doc.setFont('helvetica','bold')
    doc.text('Recibo de Pago', 15, 11)
    doc.setTextColor(0,0,0)

    doc.setFontSize(11); doc.setFont('helvetica','bold')
    doc.text(`Operador: ${op?.nombre?.toUpperCase() || ''}`, 15, 27)
    doc.setFont('helvetica','normal'); doc.setFontSize(9)
    const [yi,mi,di] = fechaInicio.split('-').map(Number)
    const [yf,mf,df] = fechaFin.split('-').map(Number)
    doc.text(`Periodo: ${di} de ${MESES_ES[mi-1]} al ${df} de ${MESES_ES[mf-1]} de ${yf}`, 15, 33)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}`, 15, 39)
    doc.text(`Estado: ${estado.toUpperCase()}`, 15, 45)

    autoTable(doc, {
      startY: 51,
      head: [['Fecha','Unidad','Destino','Tipo','Viát.','Bono','Festivo','Extra','Desc.','Total']],
      body: filas.map(f => {
        const esTrabajado = !['descanso','vacaciones','falta'].includes(f.tipo_servicio)
        const bonoMonto = f.bono ? '$100' : '—'
        return [
          formatFechaES(f.fecha),
          f.unidad_nombre||'—',
          f.destino||'—',
          LABEL_TIPO[f.tipo_servicio]||f.tipo_servicio,
          esTrabajado ? `$${f.pago_base}` : '—',
          BONO_DERECHO[f.tipo_servicio] ? bonoMonto : '—',
          f.festivo > 0 ? `$${f.festivo}` : '—',
          f.extra > 0 ? `$${f.extra}` : '—',
          f.descuento > 0 ? `-$${f.descuento}` : '—',
          esTrabajado || f.festivo > 0 ? `$${totalFila(f)}` : '—',
        ]
      }),
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor:[67,56,202], textColor:255, fontStyle:'bold', fontSize:8 },
      columnStyles: {
        0:{cellWidth:38}, 1:{cellWidth:18}, 2:{cellWidth:22}, 3:{cellWidth:25},
        4:{cellWidth:12,halign:'center'}, 5:{cellWidth:12,halign:'center'},
        6:{cellWidth:14,halign:'center'}, 7:{cellWidth:12,halign:'center'},
        8:{cellWidth:12,halign:'center'}, 9:{cellWidth:16,halign:'right'},
      },
      didParseCell: (data: any) => {
        const row = filas[data.row.index]
        if (!row) return
        if (['descanso','vacaciones'].includes(row.tipo_servicio)) {
          data.cell.styles.fillColor = [210,210,220]; data.cell.styles.textColor = [100,100,115]
        } else if (row.tipo_servicio === 'falta') {
          data.cell.styles.fillColor = [80,20,20]; data.cell.styles.textColor = [255,150,150]
        }
        if (data.column.index === 5 && data.section === 'body') {
          if (data.cell.text[0]==='$100') data.cell.styles.textColor = [80,200,120]
          if (data.cell.text[0]==='—' && BONO_DERECHO[row.tipo_servicio]) data.cell.styles.textColor = [220,80,80]
        }
      }
    })

    let y = (doc as any).lastAutoTable.finalY + 6
    doc.setFillColor(245,245,250)
    doc.rect(15, y, 186, 52, 'F')
    doc.setDrawColor(200,200,210)
    doc.rect(15, y, 186, 52, 'S')
    doc.setFontSize(9); doc.setFont('helvetica','bold')
    doc.setTextColor(67,56,202)
    doc.text('RESUMEN DE PAGO', 20, y+6)
    doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); doc.setFontSize(8.5)

    const col1=20, col2=85, col3=138
    doc.text(`TRANSFERENCIA:`, col1, y+13)
    doc.setFont('helvetica','bold'); doc.text(`$${sueldoTotal.toLocaleString()}`, col2, y+13)
    doc.setFont('helvetica','normal')
    doc.text(`Subtotal viáticos:`, col1, y+20)
    doc.setFont('helvetica','bold'); doc.text(`$${subtotalServicios.toLocaleString()}`, col2, y+20)
    doc.setFont('helvetica','normal')
    doc.text(`Total bonos:`, col1, y+27)
    doc.setFont('helvetica','bold'); doc.text(`$${totalBonos.toLocaleString()}`, col2, y+27)
    doc.setFont('helvetica','normal')
    if (totalFestivos>0) {
      doc.setTextColor(180,140,0)
      doc.text(`Días festivos:`, col1, y+34)
      doc.setFont('helvetica','bold'); doc.text(`$${totalFestivos.toLocaleString()}`, col2, y+34)
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0)
    }
    if (totalExtras>0) {
      doc.text(`Extras:`, col1, y+34)
      doc.setFont('helvetica','bold'); doc.text(`$${totalExtras.toLocaleString()}`, col2, y+34)
      doc.setFont('helvetica','normal')
    }
    if (totalDescuentos>0) {
      doc.setTextColor(200,50,50)
      doc.text(`Descuentos:`, col1, y+34)
      doc.setFont('helvetica','bold'); doc.text(`-$${totalDescuentos.toLocaleString()}`, col2, y+34)
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0)
    }

    doc.setFillColor(67,56,202)
    doc.rect(col3-3, y+4, 62, 13, 'F')
    doc.setTextColor(255,255,255)
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text('TOTAL A PAGAR', col3, y+9)
    doc.setFontSize(12); doc.setFont('helvetica','bold')
    doc.text(`$${totalPagar.toLocaleString()}`, col3, y+15)
    doc.setTextColor(0,0,0); doc.setFont('helvetica','normal'); doc.setFontSize(8.5)
    doc.text(`Pago transferencia: $${pagoTransferencia.toLocaleString()}`, col3, y+24)
    doc.setDrawColor(100,100,100)
    doc.line(col3, y+30, col3+55, y+30)
    doc.setFontSize(7); doc.setTextColor(120,120,120)
    doc.text('Firma de recibido', col3, y+34)
    doc.setFontSize(8.5); doc.setTextColor(0,0,0); doc.setFont('helvetica','normal')
    doc.text(`Pago efectivo: $${pagoEfectivo.toLocaleString()}`, col3, y+40)
    const cs = saldoPendiente>0?[200,50,50]:[50,150,80]
    doc.setTextColor(cs[0],cs[1],cs[2]); doc.setFont('helvetica','bold')
    doc.text(`Saldo pendiente: $${saldoPendiente.toLocaleString()}`, col3, y+47)
    doc.setTextColor(0,0,0); doc.setFont('helvetica','normal')

    y += 58
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFillColor(250,250,252)
    doc.rect(15, y, 186, 30, 'F')
    doc.setDrawColor(200,200,210)
    doc.rect(15, y, 186, 30, 'S')
    doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.line(20, y+20, 95, y+20)
    doc.text('Entregó', 20, y+25)
    doc.line(115, y+20, 195, y+20)
    doc.text('Recibió', 115, y+25)

    doc.setFontSize(7); doc.setTextColor(150,150,150)
    doc.text(`${new Date().toLocaleString('es-MX')}`, 108, 275, {align:'center'})

    doc.save(`Pago_${op?.nombre||'operador'}_${fechaInicio}_al_${fechaFin}.pdf`)
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
              <button key={t} onClick={() => setVistaTab(t)} className={`px-3 py-2 rounded-lg text-sm font-medium ${vistaTab===t?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t==='calc'?'🧮 Calculadora':t==='historial'?'📋 Historial pagos':'⚙️ Tarifas'}
              </button>
            ))}
          </div>
        </div>

        {mensaje && <div className="mb-4 bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg text-sm">{mensaje}</div>}

        {vistaTab==='tarifas' && (
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-300">Tarifas de viáticos</h2>
              <button onClick={() => setEditandoTarifas(!editandoTarifas)} className="text-sm text-indigo-400">{editandoTarifas?'Cerrar':'Editar'}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tarifas.map(t => (
                <div key={t.id} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{t.descripcion}</p>
                  {editandoTarifas ? (
                    <div className="flex items-center gap-1"><span className="text-gray-500 text-sm">$</span>
                      <input type="number" defaultValue={t.monto} onBlur={e => guardarTarifa(t.id, parseFloat(e.target.value))}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white w-20" />
                    </div>
                  ) : <p className="text-lg font-bold text-green-400">${t.monto}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {vistaTab==='historial' && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {pagosGuardados.length===0 ? <div className="text-center text-gray-500 py-12">No hay pagos guardados</div> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400">Operador</th>
                  <th className="text-left px-4 py-3 text-gray-400">Periodo</th>
                  <th className="text-right px-4 py-3 text-gray-400">Total</th>
                  <th className="text-right px-4 py-3 text-gray-400">Pagado</th>
                  <th className="text-right px-4 py-3 text-gray-400">Saldo</th>
                  <th className="px-4 py-3 text-gray-400">Estado</th>
                </tr></thead>
                <tbody>
                  {pagosGuardados.map((p,i) => (
                    <tr key={p.id} className={`border-b border-gray-800 ${i%2===0?'':'bg-gray-950'}`}>
                      <td className="px-4 py-3 font-medium">{p.operadores?.nombre}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p.fecha_inicio} — {p.fecha_fin}</td>
                      <td className="px-4 py-3 text-right font-bold">${p.total_a_pagar?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-400">${p.total_pagado?.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${p.saldo_pendiente>0?'text-red-400':'text-green-400'}`}>${p.saldo_pendiente?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${p.estado==='pagado'?'bg-green-900 text-green-200':p.estado==='parcial'?'bg-yellow-900 text-yellow-200':'bg-red-900 text-red-200'}`}>{p.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {vistaTab==='calc' && (
          <>
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
                <button onClick={importarHistorial} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{loading?'Importando...':'📥 Importar desde historial'}</button>
                <button onClick={agregarManual} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium">+ Agregar manual</button>
                <button onClick={() => setFilas([])} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-400">🗑 Limpiar</button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 mb-4 flex gap-6 items-center">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Sueldo base diario</label>
                <div className="flex items-center gap-2"><span className="text-gray-500">$</span>
                  <input type="number" value={sueldoBase} onChange={e => setSueldoBase(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-24" />
                </div>
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{diasPeriodo} días</span> × <span className="text-white font-medium">${sueldoBase}</span> = <span className="text-green-400 font-bold text-base">${sueldoTotal.toLocaleString()}</span>
              </div>
            </div>

            {filas.length > 0 && (
              <div className="bg-gray-900 rounded-xl overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400">
                        <th className="px-3 py-3 text-left">Fecha</th>
                        <th className="px-3 py-3 text-left">Unidad</th>
                        <th className="px-3 py-3 text-left">Destino</th>
                        <th className="px-3 py-3 text-left">Tipo</th>
                        <th className="px-3 py-3 text-center">Viáticos</th>
                        <th className="px-3 py-3 text-center">✓ Bono</th>
                        <th className="px-3 py-3 text-center text-yellow-400">🎉 Festivo</th>
                        <th className="px-3 py-3 text-center">Extra</th>
                        <th className="px-3 py-3 text-center">Desc.</th>
                        <th className="px-3 py-3 text-center font-bold text-white">Total</th>
                        <th className="px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f, i) => {
                        const derecho = BONO_DERECHO[f.tipo_servicio]
                        const esInactivo = ['descanso','vacaciones','falta','oficina','jornada_8h'].includes(f.tipo_servicio)
                        return (
                          <tr key={i} className={`border-b border-gray-800 ${
                            f.tipo_servicio==='descanso'?'bg-gray-800 opacity-60':
                            f.tipo_servicio==='vacaciones'?'bg-blue-950 opacity-70':
                            f.tipo_servicio==='falta'?'bg-red-950':
                            i%2===0?'':'bg-gray-950'
                          }`}>
                            <td className="px-3 py-2 text-gray-300 text-xs">{formatFechaES(f.fecha)}</td>
                            <td className="px-3 py-2 text-gray-400">{f.unidad_nombre||'—'}</td>
                            <td className="px-3 py-2 text-gray-400 max-w-20 truncate">{f.destino||'—'}</td>
                            <td className="px-3 py-2">
                              <select value={f.tipo_servicio} onChange={e => actualizarFila(i,'tipo_servicio',e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-32">
                                {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{LABEL_TIPO[t]}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {!esInactivo ? <input type="number" value={f.pago_base||0} onChange={e => actualizarFila(i,'pago_base',parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-16 text-center" /> : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {derecho ? <button onClick={() => actualizarFila(i,'bono',!f.bono)} className={`text-lg font-bold ${f.bono?'text-green-400':'text-red-400'}`}>{f.bono?'✓':'✗'}</button> : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input type="number" value={f.festivo||0} onChange={e => actualizarFila(i,'festivo',parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-yellow-300 w-16 text-center" />
                            </td>
                            <td className="px-3 py-2 text-center">
                              {!esInactivo ? <input type="number" value={f.extra||0} onChange={e => actualizarFila(i,'extra',parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-14 text-center" /> : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input type="number" value={f.descuento||0} onChange={e => actualizarFila(i,'descuento',parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white w-14 text-center" />
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-green-400">{esInactivo && !f.festivo?'—':`$${totalFila(f)}`}</td>
                            <td className="px-3 py-2"><button onClick={() => eliminarFila(i)} className="text-gray-500 hover:text-red-400">×</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Resumen</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Transferencia ({diasPeriodo}d)</span><span className="font-medium">${sueldoTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Viáticos</span><span>${subtotalServicios.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Bonos</span><span>${totalBonos.toLocaleString()}</span></div>
                    {totalFestivos>0&&<div className="flex justify-between text-yellow-400"><span>Días festivos</span><span>${totalFestivos.toLocaleString()}</span></div>}
                    {totalExtras>0&&<div className="flex justify-between"><span className="text-gray-400">Extras</span><span>${totalExtras.toLocaleString()}</span></div>}
                    {totalDescuentos>0&&<div className="flex justify-between text-red-400"><span>Descuentos</span><span>-${totalDescuentos.toLocaleString()}</span></div>}
                    <div className="flex justify-between font-bold text-green-400 text-base border-t border-gray-700 pt-2 mt-2"><span>TOTAL A PAGAR</span><span>${totalPagar.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Registro de pago</h3>
                  <div className="space-y-3">
                    <div><label className="text-xs text-gray-400 block mb-1">Transferencia</label>
                      <div className="flex items-center gap-2"><span className="text-gray-500">$</span><input type="number" value={pagoTransferencia} onChange={e => setPagoTransferencia(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-32" /></div>
                    </div>
                    <div><label className="text-xs text-gray-400 block mb-1">Efectivo</label>
                      <div className="flex items-center gap-2"><span className="text-gray-500">$</span><input type="number" value={pagoEfectivo} onChange={e => setPagoEfectivo(parseFloat(e.target.value)||0)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-32" /></div>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Total pagado</span><span className="font-medium text-green-400">${totalPagado.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Saldo pendiente</span>
                      <span className={`font-bold ${saldoPendiente>0?'text-red-400':'text-green-400'}`}>${saldoPendiente.toLocaleString()}</span>
                    </div>
                    <div><label className="text-xs text-gray-400 block mb-1">Estado</label>
                      <select value={estado} onChange={e => setEstado(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full">
                        <option value="pendiente">Pendiente</option>
                        <option value="parcial">Pagado parcial</option>
                        <option value="pagado">Pagado completo</option>
                      </select>
                    </div>
                    <div><label className="text-xs text-gray-400 block mb-1">Notas</label>
                      <input type="text" value={notaPago} onChange={e => setNotaPago(e.target.value)} placeholder="Observaciones..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filas.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <button onClick={guardarPago} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{guardando?'Guardando...':'💾 Guardar pago'}</button>
                <button onClick={generarPDF} className="bg-green-700 hover:bg-green-600 px-5 py-2 rounded-lg text-sm font-medium">📄 Generar PDF</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}