import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://iyxhxlelpvsbasbcdxtb.supabase.co',
  'sb_publishable_babADgwcweSzJDLcRTf-_g_5Piwwicc'
)

const IDS = {
  avanza:    '04eddfe4-2dfb-4047-acf6-ce7a10416153',
  urvan1:    '538d951a-3f59-4534-b129-7acb48d754c1',
  urvan2:    'f2dd49d2-3441-4186-a04f-05218a055dce',
  hiace1:    '6e5b64e8-ee0b-4583-8f5b-0b711005383d',
  sprinter1: '1b702c42-4923-4243-b5bb-6f91181eab75',
  sprinter2: '836ce062-42e7-41d3-888e-f6fca4850c04',
  sprinter3: 'e72b1806-ef65-4ebd-a3d4-8a0c3bbe2501',
}

// Datos del dashboard de kilometraje (última actualización 28/jun/2026)
const registros = [
  { unidad_id: IDS.avanza,    kilometraje: 29790,  fecha: '2026-06-28', notas: 'Último registro conocido' },
  { unidad_id: IDS.urvan1,    kilometraje: 237172, fecha: '2026-06-28', notas: 'Último registro conocido' },
  { unidad_id: IDS.urvan2,    kilometraje: 156703, fecha: '2026-06-29', notas: 'Último registro conocido' },
  { unidad_id: IDS.hiace1,    kilometraje: 358278, fecha: '2026-06-28', notas: 'Último registro conocido' },
  { unidad_id: IDS.sprinter1, kilometraje: 173395, fecha: '2026-06-28', notas: 'Último registro conocido' },
  { unidad_id: IDS.sprinter2, kilometraje: 102248, fecha: '2026-06-28', notas: 'Último registro conocido' },
  { unidad_id: IDS.sprinter3, kilometraje: 96017,  fecha: '2026-06-28', notas: 'Último registro conocido' },
]

const { error } = await supabase.from('kilometraje_unidades').insert(registros)
if (error) {
  console.error('Error:', error.message)
} else {
  console.log(`✅ ${registros.length} registros de kilometraje importados`)
}
