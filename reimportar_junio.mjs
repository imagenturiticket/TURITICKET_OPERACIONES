import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://iyxhxlelpvsbasbcdxtb.supabase.co',
  'sb_publishable_babADgwcweSzJDLcRTf-_g_5Piwwicc'
)

const DATOS_JUNIO = [
  { fecha: '2026-06-01', operador: 'Rafa', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-01', operador: 'Chema', destino: 'TAJIN', tipo: 'tour' },
  { fecha: '2026-06-01', operador: 'Hector', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-01', operador: 'Hervert', destino: 'TRANSFER', tipo: 'transfer' },
  { fecha: '2026-06-01', operador: 'Alfonso', destino: 'A. OFICINA', tipo: 'local' },
  { fecha: '2026-06-02', operador: 'Rafa', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-02', operador: 'Chema', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-02', operador: 'Hector', destino: 'ORIZABA', tipo: 'tour' },
  { fecha: '2026-06-02', operador: 'Hervert', destino: 'A. GABY', tipo: 'local' },
  { fecha: '2026-06-02', operador: 'Alfonso', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-03', operador: 'Rafa', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-03', operador: 'Chema', destino: 'ROCA', tipo: 'tour' },
  { fecha: '2026-06-03', operador: 'Hector', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-03', operador: 'Hervert', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-03', operador: 'Alfonso', destino: 'CEMPOALA', tipo: 'tour' },
  { fecha: '2026-06-04', operador: 'Rafa', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-04', operador: 'Chema', destino: 'TRANSFER', tipo: 'transfer' },
  { fecha: '2026-06-04', operador: 'Hector', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-04', operador: 'Hervert', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-04', operador: 'Alfonso', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-05', operador: 'Rafa', destino: 'TRANSFER', tipo: 'transfer' },
  { fecha: '2026-06-05', operador: 'Chema', destino: 'ROCA', tipo: 'tour' },
  { fecha: '2026-06-05', operador: 'Hector', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-05', operador: 'Hervert', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-05', operador: 'Alfonso', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-06', operador: 'Rafa', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-06', operador: 'Chema', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-06', operador: 'Hector', destino: 'TAJIN', tipo: 'tour' },
  { fecha: '2026-06-06', operador: 'Hervert', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-06', operador: 'Alfonso', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-07', operador: 'Rafa', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-07', operador: 'Chema', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-07', operador: 'Hector', destino: 'TRANSFER', tipo: 'transfer' },
  { fecha: '2026-06-07', operador: 'Hervert', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-07', operador: 'Alfonso', destino: 'TAJIN', tipo: 'tour' },
  { fecha: '2026-06-08', operador: 'Rafa', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-08', operador: 'Chema', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-08', operador: 'Hector', destino: 'TRANSFER', tipo: 'transfer' },
  { fecha: '2026-06-08', operador: 'Hervert', destino: 'ORIZABA', tipo: 'tour' },
  { fecha: '2026-06-08', operador: 'Alfonso', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-09', operador: 'Rafa', destino: 'S. PUEBLA', tipo: 'local' },
  { fecha: '2026-06-09', operador: 'Chema', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-09', operador: 'Hector', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-09', operador: 'Hervert', destino: 'TRANSFER', tipo: 'transfer' },
  { fecha: '2026-06-09', operador: 'Alfonso', destino: 'A. GABY', tipo: 'local' },
  { fecha: '2026-06-10', operador: 'Rafa', destino: 'PUEBLA', tipo: 'local' },
  { fecha: '2026-06-10', operador: 'Chema', destino: 'A. GABY', tipo: 'local' },
  { fecha: '2026-06-10', operador: 'Hector', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-10', operador: 'Hervert', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-10', operador: 'Alfonso', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-11', operador: 'Rafa', destino: 'PUEBLA', tipo: 'local' },
  { fecha: '2026-06-11', operador: 'Chema', destino: 'A. GABY', tipo: 'local' },
  { fecha: '2026-06-11', operador: 'Hector', destino: 'TAJIN', tipo: 'tour' },
  { fecha: '2026-06-11', operador: 'Hervert', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-11', operador: 'Alfonso', destino: 'A. OFICINA', tipo: 'local' },
  { fecha: '2026-06-12', operador: 'Rafa', destino: 'S. PUEBLA', tipo: 'local' },
  { fecha: '2026-06-12', operador: 'Chema', destino: 'TAJIN', tipo: 'tour' },
  { fecha: '2026-06-12', operador: 'Hector', destino: 'A. OFICINA', tipo: 'local' },
  { fecha: '2026-06-12', operador: 'Hervert', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-12', operador: 'Alfonso', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-13', operador: 'Rafa', destino: 'ORIZABA', tipo: 'tour' },
  { fecha: '2026-06-13', operador: 'Chema', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-13', operador: 'Hector', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-13', operador: 'Hervert', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-13', operador: 'Alfonso', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-14', operador: 'Rafa', destino: 'RENTA', tipo: 'renta' },
  { fecha: '2026-06-14', operador: 'Chema', destino: 'ROCA', tipo: 'tour' },
  { fecha: '2026-06-14', operador: 'Hector', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-14', operador: 'Hervert', destino: 'CATEMACO', tipo: 'tour' },
  { fecha: '2026-06-14', operador: 'Alfonso', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-15', operador: 'Rafa', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-15', operador: 'Chema', destino: 'LOCALES', tipo: 'local' },
  { fecha: '2026-06-15', operador: 'Hector', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-15', operador: 'Hervert', destino: 'DESCANSO', tipo: 'local' },
  { fecha: '2026-06-15', operador: 'Alfonso', destino: 'TAJIN', tipo: 'tour' },
]

async function main() {
  // 1. Obtener IDs de operadores
  const { data: ops } = await supabase.from('operadores').select('id, nombre')
  const opMap = {}
  ops.forEach(o => opMap[o.nombre] = o.id)
  console.log('Operadores encontrados:', Object.keys(opMap))

  // 2. Borrar asignaciones de Junio 2026
  const { error: deleteError } = await supabase
    .from('asignaciones')
    .delete()
    .gte('fecha', '2026-06-01')
    .lte('fecha', '2026-06-30')

  if (deleteError) {
    console.error('Error borrando:', deleteError)
    return
  }
  console.log('✓ Datos de Junio borrados')

  // 3. Insertar datos correctos
  const registros = DATOS_JUNIO.map(d => ({
    fecha: d.fecha,
    tipo: d.tipo,
    destino: d.destino,
    operador_id: opMap[d.operador],
    nota: ''
  })).filter(r => r.operador_id)

  console.log(`Insertando ${registros.length} registros...`)

  const { error: insertError } = await supabase
    .from('asignaciones')
    .insert(registros)

  if (insertError) {
    console.error('Error insertando:', insertError)
  } else {
    console.log('✓ Junio reimportado correctamente')
  }
}

main().catch(console.error)
