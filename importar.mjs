import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://iyxhxlelpvsbasbcdxtb.supabase.co'
const SUPABASE_KEY = 'sb_publishable_babADgwcweSzJDLcRTf-_g_5Piwwicc'

const OPERADORES = {
  'RAFAEL': '9430b2df-8697-4d0d-a0b6-0f4627f43743',
  'RAFA': '9430b2df-8697-4d0d-a0b6-0f4627f43743',
  'CHEMA': 'ca6f9fc3-9da5-4a22-9905-37f4bb1f3eeb',
  'HECTOR': '540a99d2-e7ce-4d4a-bad7-4a929439495b',
  'HERVERT': 'e9298b08-a3f4-4f56-9a13-57f28063da03',
  'HERVERTH': 'e9298b08-a3f4-4f56-9a13-57f28063da03',
  'ALFONSO': 'a3f1f59a-842c-431b-9fd9-c68a23286449',
  'MIGUEL': '16dc1085-fdd2-4173-aea4-0fcb1b49485e',
  'VICTOR': '567d42d2-4d71-43bf-aaf2-bc50df6827d8',
  'VÍCTOR': '567d42d2-4d71-43bf-aaf2-bc50df6827d8',
  'JAIME': 'a9ece74a-ea3c-40ef-98d8-da4d436bf199',
  'SERGIO': '75acc7ac-df0b-4bdc-a3c8-11ecb1b98827',
  'MARTIN': 'ecdf48f9-5eb3-41d6-9c84-408fabf04ef2',
}

const UNIDADES = {
  'URVAN 1': null, 'URVAN 2': null, 'HIACE 1': null, 'HIACE 2': null,
  'SPRINTER 1': null, 'SPRINTER 2': null, 'SPRINTER 3': null,
  'AVANZA': null, 'TEPPE': null
}

async function getUnidades() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/unidades?select=id,nombre`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  })
  const data = await res.json()
  data.forEach(u => { UNIDADES[u.nombre.toUpperCase()] = u.id })
}

function detectarTipo(destino) {
  if (!destino) return null
  const d = String(destino).toUpperCase().trim()
  if (d.includes('DESCANSO') || d.includes('VACACION')) return 'descanso'
  if (d.includes('RENTA')) return 'renta'
  if (d.includes('TRANSFER')) return 'transfer'
  if (d.includes('LOCAL') || d.includes('OFICINA') || d.includes('GABY')) return 'local'
  if (d === 'N/A' || d === '-' || d === 'FALTA' || d === '') return null
  return 'tour'
}

async function insertar(registros) {
  if (registros.length === 0) return
  const res = await fetch(`${SUPABASE_URL}/rest/v1/asignaciones`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(registros)
  })
  if (!res.ok) console.error('Error insertando:', await res.text())
  else console.log(`✅ Insertados ${registros.length} registros`)
}

async function main() {
  await getUnidades()
  console.log('Unidades cargadas:', UNIDADES)

  const fileBuffer = readFileSync('/Users/imagenturiticket/Downloads/C. Operadores 2026.xlsx')
  const wb = XLSX.read(fileBuffer, { type: 'buffer' })

  const meses = ['MAY', 'JUN']
  const registros = []

  for (const mesNombre of meses) {
    const ws = wb.Sheets[mesNombre]
    if (!ws) { console.log(`No encontré hoja ${mesNombre}`); continue }
    const datos = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    console.log(`Procesando ${mesNombre}: ${datos.length} filas`)

    for (const fila of datos) {
      const fechaCell = fila[0]
      if (!fechaCell || isNaN(Number(fechaCell))) continue
      const fecha = new Date(Math.round((Number(fechaCell) - 25569) * 86400 * 1000))
      const fechaStr = fecha.toISOString().split('T')[0]

      const columnas = [1, 5, 9, 13, 17]
      const opKeys = ['RAFAEL', 'CHEMA', 'HECTOR', 'HERVERT', 'ALFONSO']

      columnas.forEach((col, idx) => {
        const destino = fila[col]
        if (!destino || String(destino).trim() === '') return
        const tipo = detectarTipo(String(destino))
        if (!tipo || tipo === 'descanso') return

        const opId = OPERADORES[opKeys[idx]]
        const uniNombre = String(fila[col + 1] || '').toUpperCase().trim()
        const uniId = UNIDADES[uniNombre] || null
        const paxCell = fila[col + 2]
        const pax = paxCell && !isNaN(Number(paxCell)) ? Number(paxCell) : null

        registros.push({
          fecha: fechaStr,
          tipo,
          destino: String(destino).trim(),
          operador_id: opId,
          unidad_id: uniId,
          pax,
          nota: ''
        })
      })
    }
  }

  console.log(`Total registros a insertar: ${registros.length}`)
  await insertar(registros)
}

main().catch(console.error)