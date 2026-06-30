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

function f(fecha) {
  if (!fecha) return null
  // Convierte fechas como "29-mar-23", "03-may-23", "01 feb 25", "14-mar-26" a YYYY-MM-DD
  const meses = { ene:'01',feb:'02',mar:'03',abr:'04',may:'05',jun:'06',jul:'07',ago:'08',sep:'09',oct:'10',nov:'11',dic:'12' }
  const s = fecha.toString().toLowerCase().trim().replace(/\//g,'-').replace(/\s+/g,'-')
  // formato DD-MMM-YY o DD-MMM-YYYY
  const m1 = s.match(/^(\d{1,2})[- ]([a-z]+)[- ](\d{2,4})$/)
  if (m1) {
    const [,d,mes,y] = m1
    const mm = meses[mes.substring(0,3)]
    if (!mm) return null
    const yy = y.length === 2 ? '20'+y : y
    return `${yy}-${mm}-${d.padStart(2,'0')}`
  }
  // formato YYYY-MM-DD ya correcto
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s
  return null
}

function c(costo) {
  if (!costo) return null
  const n = parseFloat(costo.toString().replace(/[$,\s]/g,''))
  return isNaN(n) ? null : n
}

function km(k) {
  if (!k) return null
  const n = parseInt(k.toString().replace(/[^\d]/g,''))
  return isNaN(n) ? null : n
}

const registros = [
  // ===== AVANZA =====
  { unidad_id: IDS.avanza, fecha: f('11-feb-26'), categoria: 'Refacciones', detalles: 'Emplacamiento de la unidad YGF-381-C', costo: c('2003'), taller_mecanico: null },
  { unidad_id: IDS.avanza, fecha: f('28-mar-26'), kilometraje: km('9342'), categoria: 'Servicio', detalles: 'Servicio básico 10,000 km: Lavado, cambio de filtro de aceite, cambio de tapon carter, cambio de aceite 5w30', costo: c('2073'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.avanza, fecha: f('23-mar-26'), categoria: 'Refacciones', detalles: 'Compra de Tapetes de plastico Avanza', costo: c('980'), taller_mecanico: 'Mercado Libre' },
  { unidad_id: IDS.avanza, fecha: f('20-may-26'), kilometraje: km('20132'), categoria: 'Servicio', detalles: 'Servicio 20,000 km: cambio de aceite de motor, filtro de aceite, filtro de aire, revisión general de la unidad, lavado de motor y carrocería y Filtro de Aire Cabina A/C', costo: c('3560'), taller_mecanico: 'Agencia Toyota', recomendaciones: 'Frenos optimos (balatas 8mm) Llantas buenas (6mm) Bateria en buen estado' },

  // ===== URVAN 1 =====
  { unidad_id: IDS.urvan1, fecha: f('29-mar-23'), categoria: 'Servicio', detalles: 'Servicio de 20,000 km, 1er servicio, los servicios son a los 10 km', costo: c('4445'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('03-may-23'), categoria: 'Servicio', detalles: 'Servicio 30,000 Km, Programación del cuerpo de aceleración, Lavado de motor, ajuste de freno de estacionamiento, calibración presión de llantas con nitrogeno, escaneo de unidad, cambio de filtro y aceite.', costo: c('3854.17'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('27-may-23'), categoria: 'Verificación', detalles: 'Verificación Mecánica (Mayo 2023)', costo: null },
  { unidad_id: IDS.urvan1, fecha: f('30-may-23'), categoria: 'Verificación', detalles: 'Verificación de Emisiones (Primer Periodo)', costo: null },
  { unidad_id: IDS.urvan1, fecha: f('22-jun-23'), categoria: 'Servicio', detalles: 'Servicio 40,000 km. Cambio de aceite y filtro, cambio de filtro de aire, relleno liquido de frenos, anticongelante; lavado de motor, proteccion a terminales de bateria, programación de cuerpo de aceleración, ajuste de freno de mano.', costo: c('5084.31'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('08-sep-23'), categoria: 'Servicio', detalles: 'Servicio 60,000 km. (servicio mayor) Cambio de aceite y filtro, programación del cuerpo de aceleración, ajuste de freno de mano, lavado de motor, nitrogeno en llantas.', costo: c('3817.92'), taller_mecanico: 'Banzai Nissan Agencia', recomendaciones: 'Cambio próximo de bateria, llantas y balatas.' },
  { unidad_id: IDS.urvan1, fecha: f('02-oct-23'), categoria: 'Batería', detalles: 'Reemplazo de bateria. No Serie: 0008906258', costo: null },
  { unidad_id: IDS.urvan1, fecha: f('21-oct-23'), categoria: 'Incidente', detalles: 'Ruptura faro: Operador tuvo un accidente de transito donde el faro del lado derecho de la unidad resulto agrietado.', costo: null },
  { unidad_id: IDS.urvan1, fecha: f('07-dic-23'), kilometraje: km('80051'), categoria: 'Servicio', detalles: 'Servicio 80,000 km Servicio mayor.- Cambio de aceite y filtro de aceite de motor, cambio liquido de frenos, anticongelante, filtro de aire, lavado de motor, programación del cuerpo de aceleración, ajuste freno de mano e inflado con nitrogeno las 4 llantas.', costo: c('6093.07'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('14-dic-23'), kilometraje: km('80539'), categoria: 'Frenos', detalles: 'Cambio e instalación de balatas delanteras (balatas $4,426, instalación $520.60)', costo: c('4946.62'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('14-dic-23'), kilometraje: km('80562'), categoria: 'Llantas', detalles: 'Compra de 4 llantas FireStone Transforce 195R15C 106/104 R', costo: c('10100.03'), taller_mecanico: 'Ruta 17' },
  { unidad_id: IDS.urvan1, fecha: f('14-dic-23'), kilometraje: km('80562'), categoria: 'Llantas', detalles: 'Alineación de llantas nuevas', costo: c('335'), taller_mecanico: 'VIMOSA Suc. Allende' },
  { unidad_id: IDS.urvan1, fecha: f('24-ene-24'), kilometraje: km('90580'), categoria: 'Servicio', detalles: 'Servicio 90,000 km', costo: null, taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('13-mar-24'), kilometraje: km('102502'), categoria: 'Servicio', detalles: 'Servicio 100,000 km: Servicio mayor, Cambio de aceite de motor, filtro de aceite, cambio de aceite de transmisión, cambio de bujias, limpieza de inyectores, lavado de motor, programación del cuerpo de aceleración, ajuste de freno de estacionamiento, nitrogeno en 4 llantas.', costo: c('9900.69'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('14-abr-24'), categoria: 'Limpiaparabrisas', detalles: 'Cambio de plumillas de limpiaparabrisas', taller_mecanico: 'Rafa' },
  { unidad_id: IDS.urvan1, fecha: f('09-jun-24'), categoria: 'Reporte', detalles: 'Los operadores reportan que la unidad ha aumentado su consumo de combustible, que al regresar de Tajín llegan en reserva aun cuando cargaron $500 en Papantla.' },
  { unidad_id: IDS.urvan1, fecha: f('12-jun-24'), kilometraje: km('123350'), categoria: 'Servicio', detalles: 'Servicio 120,000 km: Servicio básico. Cambio de aceite y filtro de aceite, liquido de frenos, anticongelante, cambio filtro del aire del motor, ajuste freno de mano, programación del cuerpo de aceleración, lavado de motor, nitrogeno 4 llantas, escaneo de unidad. Diagnostico AC y carga de gas.', costo: c('7990.31'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('9-jul-24'), categoria: 'Reparaciones', detalles: 'Rotación, alineación y revisión de baleros. Los baleros están bien, uno zumba ligeramente del lado del operador. Los amortiguadores delanteros ya están vencidos.', costo: c('479'), taller_mecanico: 'VIMOSA Suc. Allende' },
  { unidad_id: IDS.urvan1, fecha: f('18-sep-24'), kilometraje: km('136074'), categoria: 'Servicio', detalles: 'Servicio de 130,000 km: Servicio básico, Cambio de aceite y filtro de aceite del motor, liquido de frenos, anticongelante, liquido de transmisión, cambio filtro de aire de motor, ajuste freno de mano, programación del cuerpo de aceleración, lavado de motor y carroceria, nitrogeno en las 4 llantas, descarbonización.', costo: c('3402'), taller_mecanico: 'Nissan Suc. San Manuel (Puebla)' },
  { unidad_id: IDS.urvan1, fecha: f('26-nov-24'), categoria: 'Llantas', detalles: 'Compra de 4 llantas Goodyear Cargo Marathon 195R15C', costo: c('10167.05'), taller_mecanico: 'VIMOSA Suc. Allende' },
  { unidad_id: IDS.urvan1, fecha: f('12-dic-24'), categoria: 'Alineación y Balanceo', detalles: 'Alineación y Balanceo, se hizo cambio de llantas', costo: c('435'), taller_mecanico: 'VIMOSA Suc. Allende' },
  { unidad_id: IDS.urvan1, fecha: f('05-feb-25'), categoria: 'Aceite', detalles: 'Cambio de Aceite sintetico Mobil', costo: c('355'), taller_mecanico: 'Auto-Refacciones Japon' },
  { unidad_id: IDS.urvan1, fecha: f('24-feb-25'), kilometraje: km('145944'), categoria: 'Servicio', detalles: 'Servicio básico 140,000 km: Cambio de filtro de aceite, arandela carter, 5 ltr de AC 946 ML 15W40, protect termina.', costo: c('3185'), taller_mecanico: 'Nami San Manuel Nissan Puebla' },
  { unidad_id: IDS.urvan1, fecha: f('07-abr-25'), kilometraje: km('147976'), categoria: 'Alineación y Balanceo', detalles: 'Alineación y Balanceo', costo: c('389'), taller_mecanico: 'Vitalizadora Moderna' },
  { unidad_id: IDS.urvan1, fecha: f('03-abr-25'), categoria: 'Chasis', detalles: 'Lavado y sopleteado de Chasis', costo: c('425'), taller_mecanico: 'Victor Manuel Rosete Sosa' },
  { unidad_id: IDS.urvan1, fecha: f('2-jun-25'), kilometraje: km('161033'), categoria: 'Servicio', detalles: 'Servicio básico 150,000 km: Lavado de carroceria, programación de cuerpo de aceleración, lavado de motor, limpieza y ajuste de frenos (4), instalación de nitrogeno 4 llantas, cambio de aceite (5lt), cambio de filtro de aceite, cambio de arandela carter, protect termina.', costo: c('6956.52'), taller_mecanico: 'Banzai Nissan Agencia', recomendaciones: '- Cambiar llantas delanteras por desgaste\n- Foco pellizco fundido\n- Desgaste de Microfiltro de cabina (A/A)\n- Desgaste filtro de aire del motor' },
  { unidad_id: IDS.urvan1, fecha: f('10-jun-25'), kilometraje: km('162555'), categoria: 'Llantas', detalles: 'Cambio llantas delanteras, alineación y balanceo', costo: c('6093'), taller_mecanico: 'VIMOSA SUC. DIAZ MIRON' },
  { unidad_id: IDS.urvan1, fecha: f('19-jun-25'), categoria: 'Refacciones', detalles: 'Compra de tensor de banda, y amortiguadores', costo: c('2816.23'), taller_mecanico: 'Autozone' },
  { unidad_id: IDS.urvan1, fecha: f('20-jun-25'), categoria: 'Reparaciones', detalles: 'Cambio de tensor de banda de accesorios, cambio de amortiguadores traseros, reparación de seguro de la cajuela (chapa trasera)', costo: c('1500'), taller_mecanico: 'Mecanico Jorge' },
  { unidad_id: IDS.urvan1, fecha: f('01-jul-25'), categoria: 'Reparaciones', detalles: 'Desmonte y monte de alternador, sustitución de polea libre, diagnostico', costo: c('2038'), taller_mecanico: 'Tecnico Alberto Rivera' },
  { unidad_id: IDS.urvan1, fecha: f('18-jul-25'), categoria: 'Refacciones', detalles: 'Compra de baleros, reten y aceite del diferencial', costo: c('6845.88'), taller_mecanico: 'Mercado Libre / Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('25-jul-25'), categoria: 'Reparaciones', detalles: 'Desmonte y montaje diferencial, sustitución de baleros corona y piñon, ajuste del diferencial.', costo: c('5000'), taller_mecanico: 'Tecnico Alberto Rivera' },
  { unidad_id: IDS.urvan1, fecha: f('3-ago-25'), categoria: 'Frenos', detalles: 'Cambio de balatas delanteras y asentamiento de frenos', costo: c('991'), taller_mecanico: 'Tecnico Alberto Rivera' },
  { unidad_id: IDS.urvan1, fecha: f('8-ago-25'), categoria: 'Refacciones', detalles: 'Compra de Baleros del candelero de la parte frontal', costo: c('2725'), taller_mecanico: 'Banzai Nissan Agencia' },
  { unidad_id: IDS.urvan1, fecha: f('15-sep-25'), categoria: 'Reparaciones', detalles: 'Cambio de aceite del diferencial', costo: c('600'), taller_mecanico: 'Taller Oscar' },
  { unidad_id: IDS.urvan1, fecha: f('22-sep-25'), categoria: 'Fumigación', detalles: 'Servicio de Fumigación por cucarachas', costo: c('580'), taller_mecanico: 'Israel Carreto' },
  { unidad_id: IDS.urvan1, fecha: f('23-sep-25'), categoria: 'Servicio', detalles: 'Servicio mayor de 170,000 km: Cambio de Aceite de motor, Filtro de aceite, Filtro de aire, Lavado de cuerpo de aceleración, Lavado de inyectores, Revisión general de niveles, cambio de filtro del clima y reemplazo de las 4 bujias', costo: c('5336'), taller_mecanico: 'Taller Pepe' },
  { unidad_id: IDS.urvan1, fecha: f('29-sep-25'), categoria: 'Reparaciones', detalles: 'Servicio de limpieza y lubricacion de cilindro maestro y embrague, cambio de tope de cajuela izquierdo y derecho, cambio de tope de marco de cajuela izquierdo y derecho, sustitución de la contrachapa.', costo: c('6890.40'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan1, fecha: f('7-oct-25'), categoria: 'Batería', detalles: 'Reemplazo de bateria. No Serie: 0008906258', costo: c('3548.50'), taller_mecanico: 'LTH FRAGUA' },
  { unidad_id: IDS.urvan1, fecha: f('10-nov-25'), categoria: 'Golpe', detalles: 'Raspon (El único que la ocupo antes de rafa fue Martín)', taller_mecanico: 'Reportó Rafa' },
  { unidad_id: IDS.urvan1, fecha: f('2-dic-25'), kilometraje: km('193433'), categoria: 'Servicio', detalles: 'Servicio menor de 180,000 km: cambio de aceite de motor, filtro de aceite, filtro de aire, revisión general de la unidad, lavado de motor y carrocería', costo: c('3248'), taller_mecanico: 'JG GROUP CAR TECH', recomendaciones: 'Suspensión/dirección dañada' },
  { unidad_id: IDS.urvan1, fecha: f('10-dic-25'), categoria: 'Reparaciones', detalles: 'CAMBIO Y SERVICIO DE 2 ARTICULACIONES, 2 GOMAS DE BARRA Y BALERO DELANTERO IZQUIERDO', costo: c('9674.40'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan1, fecha: f('26-ene-26'), kilometraje: km('218613'), categoria: 'Servicio', detalles: 'Servicio menor de 200,000 km: cambio de aceite de motor, filtro de aceite, filtro de aire, bujias, lavado de inyectores, lavado de cuerpo de aceleracion, revision general de niveles, revision general de la unidad, lavado de motor y carroceria. Extra: Cambio de filtro de cabina.', costo: c('6400'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan1, fecha: f('6-feb-26'), categoria: 'Reparaciones', detalles: 'Cambio de tapa de cajuela nueva, con bisagras y facia nueva.', taller_mecanico: 'QUALITAS' },
  { unidad_id: IDS.urvan1, fecha: f('15-abr-26'), categoria: 'Golpe', detalles: 'Parabrisas estrellado', taller_mecanico: 'Reportó Hector' },
  { unidad_id: IDS.urvan1, fecha: f('6-may-26'), categoria: 'Reparaciones', detalles: 'Reparacion de Ponche', costo: c('347'), taller_mecanico: 'Vulcanizadora Freddy' },
  { unidad_id: IDS.urvan1, fecha: f('5-may-26'), categoria: 'Reparaciones', detalles: 'Remplazo FOCO CUARTO DELANTERO Lado piloto y CUARTO TRASERO lado piloto', taller_mecanico: 'Taller LA RESISTENCIA' },
  { unidad_id: IDS.urvan1, fecha: f('7-may-26'), categoria: 'Servicio', detalles: 'Servicio menor de 210,000 km: cambio de aceite de motor, filtro de aceite, filtro de aire, revision general de niveles, revision general de la unidad, lavado de motor y carroceria. Extra: Cambio de filtro de cabina.', costo: c('4000'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan1, fecha: f('8-may-26'), categoria: 'Reparaciones', detalles: 'Cambio de BALATAS DELANTERAS Y RECTIFICADO DE 2 DISCOS', costo: c('4800'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan1, fecha: f('16-may-26'), categoria: 'Ponche', detalles: 'Ponche lado piloto delantero, Compuesto en puebla' },
  { unidad_id: IDS.urvan1, fecha: f('19-may-26'), categoria: 'Ponche', detalles: 'Ponche lado Co-piloto delantero, Compuesto en puebla' },

  // ===== URVAN 2 =====
  { unidad_id: IDS.urvan2, fecha: f('5-jul-24'), kilometraje: km('151'), categoria: 'GPS', detalles: 'Instalación del GPS', taller_mecanico: 'Omnicheck' },
  { unidad_id: IDS.urvan2, fecha: f('06-jul-24'), kilometraje: km('151'), categoria: 'Refacciones', detalles: 'Instalación de viniles (Rotulado)', costo: null },
  { unidad_id: IDS.urvan2, fecha: f('12-jul-24'), kilometraje: km('151'), categoria: 'Refacciones', detalles: 'Tramite de placas federales de turismo', costo: c('4018'), taller_mecanico: 'SCT' },
  { unidad_id: IDS.urvan2, fecha: f('30-oct-24'), kilometraje: km('29452'), categoria: 'Servicio', detalles: 'Servicio 20,000 km: cambio de aceite, filtro de aceite, programación del cuerpo de aceleración, lavado de motor, instalación de nitrogeno en las 4 llantas.', costo: c('3957.46'), taller_mecanico: 'Nissan Banzai' },
  { unidad_id: IDS.urvan2, fecha: f('21-dic-24'), kilometraje: km('42640'), categoria: 'Servicio', detalles: 'Servicio 40,000 km: cambio de aceite, filtro de aceite, programación del cuerpo de aceleración, lavado de motor, escaneo de unidad, instalación de nitrogeno en las 4 llantas.', costo: c('5443.85'), taller_mecanico: 'Nissan Banzai' },
  { unidad_id: IDS.urvan2, fecha: f('01-feb-25'), kilometraje: km('53252'), categoria: 'Servicio', detalles: 'Servicio 50,000 km: Tambo AC MT 10W, filtro de aceite, arandela carter, protect termina, tapon de nitrogeno, servicio mayor, programación de cuerpo de aceleración, instalación nitrogeno en las 4 llantas, lavado de motor, material de taller.', costo: c('3895.48'), taller_mecanico: 'Nissan Banzai', recomendaciones: 'Cambiar balatas delanteras y discos delanteros' },
  { unidad_id: IDS.urvan2, fecha: f('11-feb-25'), categoria: 'Frenos', detalles: 'Cambio de balatas de ceramica TRW delanteras', costo: c('1850'), taller_mecanico: 'Taller Tirso' },
  { unidad_id: IDS.urvan2, fecha: f('27-feb-25'), kilometraje: km('60574'), categoria: 'Chasis', detalles: 'Servicio de lavado, servicio de sopleteado, 3 litros H300 p/sopletear', costo: c('424.98'), taller_mecanico: 'Victor Manuel Rosete Sosa' },
  { unidad_id: IDS.urvan2, fecha: f('14-mar-25'), categoria: 'Golpe', detalles: 'Golpe del lado izquierdo en la parte trasera', costo: c('0'), taller_mecanico: 'Reportó Noé' },
  { unidad_id: IDS.urvan2, fecha: f('24-mar-25'), kilometraje: km('66256'), categoria: 'Servicio', detalles: 'Servicio 60,000 km: Cambio de aceite 10W30, filtro de aceite, arandela carter, protect termina, programacion de cuerpo de aceleración, instalación de nitrogeno 4 llantas, lavado de motor', costo: c('3984.16'), taller_mecanico: 'Nissan Banzai' },
  { unidad_id: IDS.urvan2, fecha: f('3-abr-25'), kilometraje: km('68118'), categoria: 'Llantas', detalles: 'Cambio de llantas delanteras, servicio de alineación, y balanceo a las llantas traseras', costo: c('5849.03'), taller_mecanico: 'Vitalizadora Moderna' },
  { unidad_id: IDS.urvan2, fecha: f('18-abr-25'), categoria: 'Reparaciones', detalles: 'Falla de clutch durante el regreso de catemaco', taller_mecanico: 'Operador Noé' },
  { unidad_id: IDS.urvan2, fecha: f('15-abr-25'), categoria: 'Golpe', detalles: 'Reporte de golpe en la parte trasera', taller_mecanico: 'Operador Noé' },
  { unidad_id: IDS.urvan2, fecha: f('23-abr-25'), categoria: 'Reparaciones', detalles: 'Remplazo de cluch volante bimasa, desmonte y montaje de caja de cambio', costo: c('31711.36'), taller_mecanico: 'Tecnico Alberto Rivera' },
  { unidad_id: IDS.urvan2, fecha: f('14-may-25'), kilometraje: km('78992'), categoria: 'Servicio', detalles: 'Servicio 70,000 km: Cambio de aceite 5lt, cambio de filtro de aceite, cambio de arandela carter, protect termina, cambio de tapón de nitrogeno, filtro de aire, servicio mayor, programación de cuerpo de aceleración, instalación de nitrogeno 4 llantas, escaneo de unidad, lavado de motor', costo: c('4917.63'), taller_mecanico: 'Nissan Banzai', recomendaciones: 'Claxón sin fuerza, reemplazo de llantas traseras' },
  { unidad_id: IDS.urvan2, fecha: f('18-may-25'), categoria: 'Golpe', detalles: 'Abolladura de ambos lados', taller_mecanico: 'Reportó Victor' },
  { unidad_id: IDS.urvan2, fecha: f('10-jun-25'), kilometraje: km('88075'), categoria: 'Llantas', detalles: 'Cambio llantas traseras, alineación y balanceo', costo: c('6093'), taller_mecanico: 'VIMOSA SUC. DIAZ MIRON' },
  { unidad_id: IDS.urvan2, fecha: f('23-jun-25'), kilometraje: km('91158'), categoria: 'Servicio', detalles: 'Servicio 80,000 km: Cambio de aceite 5LT, cambio del filtro de aceite, cambio de arandela carter, protect termina, cambio de liquido de frenos 2LT, cambio de anticongelante 7LT, cambio filtro de aire, cambio de tapón de nitrogeno, servicio mayor, programación de cuerpo de aceleración, escaneo de unidad, instalación de nitrogeno 4 llantas, lavado de motor, ajuste de freno de estacionamiento.', costo: c('6637.27'), taller_mecanico: 'Nissan Banzai' },
  { unidad_id: IDS.urvan2, fecha: f('09-ago-25'), kilometraje: km('106165'), categoria: 'Servicio', detalles: 'Servicio 90,000 km: cambio de filtro de aceite, cambio de arandela carter, limpieza y ajuste del sistema de frenos, limpieza de inyectores, protect termina, tapon de nitrogeno, servicio mayor, programación de cuerpo de aceleración, instalación de nitrogeno de las 4 llantas, lavado de motor.', costo: c('7154.50'), taller_mecanico: 'Nissan Banzai', recomendaciones: 'Cambio de las pastillas de freno, tanto delanteras como traseras. Desmontar y rectificar discos delanteros.' },
  { unidad_id: IDS.urvan2, fecha: f('20-ago-25'), categoria: 'Reparaciones', detalles: 'Cambio de balatas delanteras Wagner Ceramica, rectificado de 2 discos, limpieza y ajuste de frenos traseros', costo: c('4176'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan2, fecha: f('12-nov-25'), kilometraje: km('121425'), categoria: 'Servicio', detalles: 'Servicio 100,000 km: cambio de aceite de motor, filtro de aceite, filtro de aire, bujias, lavado de inyectores, lavado de cuerpo de aceleracion, revision general de niveles, revision general de la unidad y lavado de motor y carroceria.', costo: c('5336'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.urvan2, fecha: f('10-mar-26'), kilometraje: km('134561'), categoria: 'Servicio', detalles: 'Servicio 110,000 km: escaneo, kit de afinación y cambio de arandela carter.', costo: c('3767.01'), taller_mecanico: 'NISSAN NAMI PUEBLA' },
  { unidad_id: IDS.urvan2, fecha: f('26-mar-26'), categoria: 'Golpe', detalles: 'Medallón delantero astillado', taller_mecanico: 'REPORTÓ HECTOR' },
  { unidad_id: IDS.urvan2, fecha: f('27-mar-26'), categoria: 'Reparaciones', detalles: 'Arreglo golpe atras cubierto por la otra aseguradora', taller_mecanico: 'Nissan Siniestros' },
  { unidad_id: IDS.urvan2, fecha: f('8-abr-26'), categoria: 'Llantas', detalles: 'Cambio de llantas delanteras 195 R15 carga marca Goodyear Cargo Marathon', costo: c('4887.04'), taller_mecanico: 'VIMOSA SUC. DIAZ MIRON' },
  { unidad_id: IDS.urvan2, fecha: f('8-abr-26'), kilometraje: km('140969'), categoria: 'Alineación y Balanceo', detalles: 'Servicio de alineación', costo: c('408'), taller_mecanico: 'VIMOSA SUC. DIAZ MIRON' },
  { unidad_id: IDS.urvan2, fecha: f('18-abr-26'), categoria: 'Golpe', detalles: 'Parabrisas estrellado por ave en tour a tajin', taller_mecanico: 'Reporto Hector' },
  { unidad_id: IDS.urvan2, fecha: f('23-abr-26'), categoria: 'Reparaciones', detalles: 'Colocacion de PARABRISAS NUEVO', taller_mecanico: 'ROTO' },
  { unidad_id: IDS.urvan2, fecha: f('11-may-26'), categoria: 'Servicio', detalles: 'Servicio 120,000 km: ACEITE DE MOTOR, FILTRO ACEITE, ARANDELA, PROTECCIÓN DE TERMINAL, LÍQUIDO DE FRENOS, ANTICONGELANTE, GRASA FLECHA PROPULSORA', costo: c('6205'), taller_mecanico: 'Nissan Nami San Manuel (puebla)' },
  { unidad_id: IDS.urvan2, fecha: f('21-may-26'), categoria: 'Batería', detalles: 'Se compro eh instalo bateria nueva LTH HITEC', costo: c('3289'), taller_mecanico: 'LTH La Fragua' },
  { unidad_id: IDS.urvan2, fecha: f('29-jun-26'), kilometraje: km('156704'), categoria: 'Servicio', detalles: 'Servicio 130,000 km: FILTRO DE AIRE, FILTRO DE ACEITE, FILTRO DE CABINA Y ACEITE SINTETIDO LIMPIEZA CUERPO DE ACELERACION Y SERVICIO', costo: c('3050'), taller_mecanico: 'Taller Mecanico Oscar', recomendaciones: 'Balatas aun le quedan media Vida' },

  // ===== HIACE 1 (selección de registros principales) =====
  { unidad_id: IDS.hiace1, fecha: f('03-jul-21'), categoria: 'Servicio', detalles: 'Servicio 150,000 km: Cambio de aceite, filtros y calibración freno de mano', costo: c('1495.99'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('13-oct-21'), categoria: 'Servicio', detalles: 'Servicio 160,000 km: Cambio de aceite, filtro de aceite, filtro AC, liquido de frenos, liquido refrigerante y aceite diferencial.', costo: c('5432.99'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('10-ene-22'), categoria: 'Servicio', detalles: 'Servicio 170,000 km: Cambio de aceite y filtro de aceite.', costo: c('1665.01'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('07-mar-22'), categoria: 'Llantas', detalles: 'Compra de 2 llantas. Cambio de llantas delanteras (las anteriores se colocaron como traseras) Alineación y Balanceo', costo: c('4955.52'), taller_mecanico: 'VITANOVA' },
  { unidad_id: IDS.hiace1, fecha: f('29-mar-22'), categoria: 'Servicio', detalles: 'Servicio 180,000 km: Cambio de aceite y filtro de aceite; calibración de freno de mano y reemplazo sistema de embrague.' },
  { unidad_id: IDS.hiace1, fecha: f('09-jun-22'), categoria: 'Servicio', detalles: 'Servicio 190,000 km: Cambio de filtro y aceite, revisión visual de mangueras, banda, fugas de aceite, tuberias y suspensión.', taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('10-ago-22'), categoria: 'Servicio', detalles: 'Servicio 200,000 km, revisión de ruido en la llanta delantera y calibración freno de mano.', costo: c('4804'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('12-dic-22'), categoria: 'Batería', detalles: 'Compra de Bateria NS: 0008351528', costo: c('2395'), taller_mecanico: 'La Resistencia' },
  { unidad_id: IDS.hiace1, fecha: f('16-dic-22'), categoria: 'Llantas', detalles: 'Cambio de 4 llantas nuevas, alineación y balanceo. llantas "General Tire Eurovan2" 195R15. 106/104 R', costo: c('11416.01'), taller_mecanico: 'Tecnollantas' },
  { unidad_id: IDS.hiace1, fecha: f('03-mar-23'), categoria: 'Batería', detalles: 'Compra de Bateria NS: 0010658610', costo: c('2395'), taller_mecanico: 'La Resistencia' },
  { unidad_id: IDS.hiace1, fecha: f('25-abr-23'), categoria: 'Servicio', detalles: 'Servicio 240,000 km (257,929 km): Remplazo de aceite (6 lts) y filtro, inspección visual, Rotación de llantas. Se cambio Filtro de AC, filtro de aire, liquido de frenos.', costo: c('6599.01'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('22-ago-23'), categoria: 'Servicio', detalles: 'Servicio 250,000 km. Cambio de aceite y filtro de aceite, inspección visual.', costo: c('1898.99'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('27-nov-23'), categoria: 'Reparaciones', detalles: 'Se le realizo cambio de caja de velocidades a la unidad.', costo: c('5500'), taller_mecanico: 'Alberto Rivera' },
  { unidad_id: IDS.hiace1, fecha: f('30-ene-24'), kilometraje: km('280627'), categoria: 'Servicio', detalles: 'Servicio 260,000 km (280,627 km): Cambio de filtro y aceite, inspección visual.', costo: c('1898.99'), taller_mecanico: 'Agencia Toyota', recomendaciones: 'Foco de reversa derecho, foco cuarto trasero izquierdo, clutch, rociadores, plumillas. Discos y tambores cristalizados.' },
  { unidad_id: IDS.hiace1, fecha: f('30-ene-24'), kilometraje: km('280627'), categoria: 'Reparaciones', detalles: 'Cambio de clutch', costo: c('4000'), taller_mecanico: 'Alberto Rivera' },
  { unidad_id: IDS.hiace1, fecha: f('01-jul-24'), kilometraje: km('298000'), categoria: 'Servicio', detalles: 'Servicio 300,000 km: Cambio de aceite y filtro de aceite, Cambio de bujias. Balatas, Delanteras: 7 de 10 mm Traseras: 3.5 de 6 mm', costo: c('5140.01'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('09-jul-24'), categoria: 'Llantas', detalles: 'Compra de 3 llantas 195 R 15 Cargo Marathon Goodyear + instalación + alineación y balanceo', costo: c('8745'), taller_mecanico: 'VIMOSA Suc. Allende' },
  { unidad_id: IDS.hiace1, fecha: f('13-nov-24'), kilometraje: km('312023'), categoria: 'Servicio', detalles: 'Servicio 310,000 km, balatas delanteras 1/4 de vida, balatas traseras 1/2 vida, remplazo de aceite y filtro de aceite.', costo: c('1899'), taller_mecanico: 'Agencia Toyota' },
  { unidad_id: IDS.hiace1, fecha: f('14-feb-25'), kilometraje: km('323691'), categoria: 'Servicio', detalles: 'Servicio 320,000 km: Lavado de carrocería, cambio de aceite y filtro (6 lts aceite 5W30), cambio de filtro A/C, filtro de aire, liquido de frenos, aceite diferencial 80W90, liquido anticongelante, sello tapon carter.', costo: c('6928.99'), taller_mecanico: 'Agencia Toyota', recomendaciones: 'Remplazar balatas delanteras, discos delanteros, banda de accesorios (cuarteada)' },
  { unidad_id: IDS.hiace1, fecha: f('18-feb-25'), categoria: 'Frenos', detalles: 'Cambio de Balatas delanteras, Cambio de Balatas traseras, Mantenimiento frenos traseros, Rectificado de discos delanteros, Rectificado de tambores', costo: c('3230'), taller_mecanico: 'TALLER TIRSO / CRISTAMUNDO' },
  { unidad_id: IDS.hiace1, fecha: f('26-feb-25'), kilometraje: km('324958'), categoria: 'Chasis', detalles: 'Servicio de lavado, servicio de sopleteado, 3 litros H300 p/sopletear', costo: c('424.98'), taller_mecanico: 'Victor Manuel Rosete Sosa' },
  { unidad_id: IDS.hiace1, fecha: f('25-mar-25'), categoria: 'Golpe', detalles: 'Golpe lado izquierdo delantero', taller_mecanico: 'Reportó Miguel' },
  { unidad_id: IDS.hiace1, fecha: f('07-abr-25'), categoria: 'Golpe', detalles: 'Golpe lado derecho delantero', taller_mecanico: 'Reportó Victor' },
  { unidad_id: IDS.hiace1, fecha: f('15-may-25'), kilometraje: km('335410'), categoria: 'Servicio', detalles: 'Servicio 330,000 km: limpieza y ajuste de frenos, alineación delantera y balanceo, lavado de carrocería, reemplazo de aceite y filtro 6 lt, filtro de aire, sello tapon carter.', costo: c('2574.01'), taller_mecanico: 'Agencia Toyota', recomendaciones: 'Reemplazar balatas traseras, discos delanteros, banda de accesorios' },
  { unidad_id: IDS.hiace1, fecha: f('17-jun-25'), categoria: 'Reparaciones', detalles: 'Cambio de amortiguadores traseros y delanteros, Cambio de balatas delanteras y traseras', costo: c('5928.93'), taller_mecanico: 'Autozone / Mecanico Jorge' },
  { unidad_id: IDS.hiace1, fecha: f('20-jun-25'), categoria: 'Reparaciones', detalles: 'Cambio de banda de accesorios', costo: c('450'), taller_mecanico: 'Mecanico Jorge' },
  { unidad_id: IDS.hiace1, fecha: f('17-jul-25'), categoria: 'Batería', detalles: 'Compra e instalación de bateria L-35-575 (G3)', costo: c('3385.91'), taller_mecanico: 'RIMSA' },
  { unidad_id: IDS.hiace1, fecha: f('11-sep-25'), categoria: 'Reparaciones', detalles: 'Venta y cambio de cilindro maestro, cambio de liquido de frenos', costo: c('6519.20'), taller_mecanico: 'Taller Pepe' },
  { unidad_id: IDS.hiace1, fecha: f('08-oct-25'), kilometraje: km('344694'), categoria: 'Llantas', detalles: 'Cambio de llantas delanteras + alineación y balanceo', costo: c('6012'), taller_mecanico: 'Llantera Malibran / JG GROUP CAR TECH' },
  { unidad_id: IDS.hiace1, fecha: f('07-nov-25'), categoria: 'Reparaciones', detalles: 'Sustitución de maza de rueda delantera izquierda, 2 terminales, 2 bieletas. Corrección del sistema de frenos trasero.', costo: c('14094'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.hiace1, fecha: f('03-dic-25'), categoria: 'Servicio', detalles: 'Servicio menor de 340,000 km: cambio de aceite de motor, filtro de aceite, revisión general de la unidad, lavado de motor y carrocería', costo: c('3248'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.hiace1, fecha: f('16-abr-26'), categoria: 'Reparaciones', detalles: 'Cambio BOMBA DE FRENOS, LIQUIDO DE FRENOS, LIMPIEZA CUERPO DE ACELERACION Y LAVADO DE INYECTORES', costo: c('11936'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.hiace1, fecha: f('06-may-26'), kilometraje: km('356532'), categoria: 'Servicio', detalles: 'SERVICIO MENOR DE 350,000 km: cambio de aceite de motor, filtro de aceite, revisión general de la unidad, lavado de motor y carrocería', taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.hiace1, fecha: f('12-jun-26'), categoria: 'Reparaciones', detalles: 'Se reparo la Manija de la Puerta Corrediza', costo: c('600'), taller_mecanico: 'Taller Mecanico OSCAR' },

  // ===== SPRINTER 1 =====
  { unidad_id: IDS.sprinter1, fecha: f('03-jul-21'), categoria: 'Servicio', detalles: 'Servicio "A" 20,000 km: Lavado de motor, desinfección de la unidad, cambio de aceite y filtro de aceite, filtro de aire, ajuste de freno de mano, limpieza filtro de particulas.', costo: c('8490.20'), taller_mecanico: 'Agencia Mercedes-Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('25-feb-22'), categoria: 'Servicio', detalles: 'Servicio "B" 40,000 km: Cambio de aceite y filtro de aceite, filtro de aire, filtro de combustible, 2 filtros de AC techo. Ajuste de freno de mano, limpieza filtro de particulas, lavado de motor, desinfección.', costo: c('18633.78'), taller_mecanico: 'Agencia Mercedes-Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('01-jun-22'), categoria: 'Reparaciones', detalles: 'Cambio de Clutch: Se desmonto y monto cambio manual, volante cigueñal, placa de presión del embrague y disco.', costo: c('40284.17'), taller_mecanico: 'Agencia Mercedes-Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('24-nov-22'), categoria: 'Servicio', detalles: 'Servicio (75,009 km) Cambio de aceite, cambio de filtro aire, ajuste freno de mano, lavado de motor, limpieza filtro de particulas, tratamiento para diesel.', costo: c('8052.12'), taller_mecanico: 'Agencia Mercedes-Benz', recomendaciones: 'Las balatas tienen 2,000 km de vida.' },
  { unidad_id: IDS.sprinter1, fecha: f('20-jul-23'), categoria: 'Servicio', detalles: 'Servicio 100,000 km', costo: c('3363.43'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('10-abr-24'), kilometraje: km('119591'), categoria: 'Frenos', detalles: 'Cambio de balatas y discos de freno en las 4 llantas.', costo: c('21434.29'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('04-may-24'), categoria: 'Batería', detalles: 'Compra de bateria, ya que la anterior se encuentra dañada.', costo: c('9582.83'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('30-nov-24'), kilometraje: km('119826'), categoria: 'Servicio', detalles: 'Servicio "Mantenimiento A"', costo: c('10469.88'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('21-dic-24'), kilometraje: km('132495'), categoria: 'Reparaciones', detalles: 'Cambio de zapatas del freno de mano', costo: c('13034.98'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('10-feb-25'), kilometraje: km('137840'), categoria: 'Chasis', detalles: 'Servicio de lavado, servicio de sopleteado, 3 litros H300 p/sopletear', costo: c('425'), taller_mecanico: 'Victor Manuel Rosete Sosa' },
  { unidad_id: IDS.sprinter1, fecha: f('16-abr-25'), kilometraje: km('141275'), categoria: 'Llantas', detalles: 'Cambio de llantas traseras', costo: c('11410'), taller_mecanico: 'Vitalizadora Moderna' },
  { unidad_id: IDS.sprinter1, fecha: f('30-jun-25'), kilometraje: km('146565'), categoria: 'Llantas', detalles: 'Cambio de llantas delanteras + Diagnostico', costo: c('385'), taller_mecanico: 'VIMOSA', recomendaciones: 'Rótulas dañadas' },
  { unidad_id: IDS.sprinter1, fecha: f('29-jul-25'), kilometraje: km('148779'), categoria: 'Servicio', detalles: 'Servicio "Mantenimiento B"', costo: c('4000'), taller_mecanico: 'David Molina Tecnico MB' },
  { unidad_id: IDS.sprinter1, fecha: f('30-jul-25'), categoria: 'Reparaciones', detalles: 'Reparación del sensor de la puerta corrediza', costo: c('2850'), taller_mecanico: 'David Molina Tecnico MB' },
  { unidad_id: IDS.sprinter1, fecha: f('22-sep-25'), categoria: 'Fumigación', detalles: 'Servicio de Fumigación por cucarachas', costo: c('580'), taller_mecanico: 'Israel Carreto' },
  { unidad_id: IDS.sprinter1, fecha: f('26-dic-25'), categoria: 'Golpe', detalles: 'Parabrisas estrellado lado derecho', taller_mecanico: 'Reportó Herverth' },
  { unidad_id: IDS.sprinter1, fecha: f('6-ene-26'), categoria: 'Frenos', detalles: 'Compra y cambio de forros, sensores, discos y pastillas de freno', costo: c('12950.72'), taller_mecanico: 'Agencia Mercedes Benz / Giovanni Tecnico MB' },
  { unidad_id: IDS.sprinter1, fecha: f('6-ene-26'), categoria: 'Reparaciones', detalles: 'Compra e instalación de Estereo', costo: c('3400'), taller_mecanico: 'STEREO' },
  { unidad_id: IDS.sprinter1, fecha: f('20-ene-26'), categoria: 'Reparaciones', detalles: 'Cambio de Polea Damper y cambio de banda de accesorios + cambio de limpia parabrisas', taller_mecanico: 'Giovanni Tecnico MB / RUMSA' },
  { unidad_id: IDS.sprinter1, fecha: f('14-mar-26'), categoria: 'Golpe', detalles: 'Golpe reportado por Chema', taller_mecanico: 'Reportó Chema' },
  { unidad_id: IDS.sprinter1, fecha: f('14-abr-26'), categoria: 'Llantas', detalles: 'Cambio de Llantas Traseras CONTINENTAL', costo: c('11558'), taller_mecanico: 'Vulcanizadora MALIBRAN' },
  { unidad_id: IDS.sprinter1, fecha: f('17-abr-26'), categoria: 'Refacciones', detalles: 'Compra de Faros Originales', costo: c('15504'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter1, fecha: f('12-may-26'), categoria: 'Diagnóstico', detalles: 'Diagnostico Bateria Spr1 - Todo normal, tecnico menciona que tiene 1 año de vida util aun', costo: c('600'), taller_mecanico: 'LTH La Fragua' },

  // ===== SPRINTER 2 =====
  { unidad_id: IDS.sprinter2, fecha: f('02-mar-23'), categoria: 'Servicio', detalles: 'Servicio tipo A (21,576km): cambio de aceite y filtro, filtro de aire, ajuste freno de mano, limpieza de filtro de particulas, lavado de motor.', costo: null, taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter2, fecha: f('15-ago-23'), categoria: 'Clima', detalles: 'Revisión de unidad, corrección de corto señal en el tablero, banda compresor, banda de accesorios, doble recarga refrigerante, 3 filtros de cabina, mantenimiento preventivo general.', costo: c('7870'), taller_mecanico: 'Taller Gavilan' },
  { unidad_id: IDS.sprinter2, fecha: f('12-sep-23'), categoria: 'Reparaciones', detalles: 'Reemplazo de parabrisas estrellado', costo: c('1660.80'), taller_mecanico: 'Vidriofacil' },
  { unidad_id: IDS.sprinter2, fecha: f('07-dic-23'), kilometraje: km('45967'), categoria: 'Servicio', detalles: 'Servicio Tipo B: Se le cambio filtro de aire, filtro diesel, filtro AC.', taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter2, fecha: f('06-dic-23'), kilometraje: km('45967'), categoria: 'Reparaciones', detalles: 'Cambio de kit de embrague: volante de 2 masas, placa de desembrague, clutch. Cableado dañado por roedor reparado.', costo: c('47425.57'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter2, fecha: f('09-dic-23'), kilometraje: km('45972'), categoria: 'Frenos', detalles: 'Cambio de balatas', costo: c('7211.30'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter2, fecha: f('19-dic-24'), categoria: 'Llantas', detalles: 'Cambio de llantas delanteras', costo: null, taller_mecanico: 'Llantera de Cuauhtemoc' },
  { unidad_id: IDS.sprinter2, fecha: f('11-feb-25'), categoria: 'Servicio', detalles: 'Tipo A: Renovación de filtro de aire, ajuste de freno de estacionamiento, kit de servicio de vanes, desinfección, limpieza de motor, limpieza de filtro de particulas, cambio de aceite de motor, junta anular y tratamiento para diesel', costo: c('9990.56'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter2, fecha: f('12-feb-25'), categoria: 'Chasis', detalles: 'Servicio de lavado, servicio de sopleteado, 3 litros H300 p/sopletear', costo: c('425'), taller_mecanico: 'Victor Manuel Rosete Sosa' },
  { unidad_id: IDS.sprinter2, fecha: f('22-feb-25'), categoria: 'Batería', detalles: 'Cambio de batería, L-49-900 AGM (G4)', costo: c('6742.50'), taller_mecanico: 'RIMSA', recomendaciones: 'Cambio de batería sin costo (0-18 meses) = Agosto 2026' },
  { unidad_id: IDS.sprinter2, fecha: f('20-may-25'), categoria: 'Llantas', detalles: 'Cambio de llantas delanteras', costo: c('10794'), taller_mecanico: 'Llantera Malibran' },
  { unidad_id: IDS.sprinter2, fecha: f('21-may-25'), kilometraje: km('80621'), categoria: 'Alineación y Balanceo', detalles: 'Servicio de balanceo y diagnostico de suspensión', costo: c('483'), taller_mecanico: 'VIMOSA', recomendaciones: 'DIAGNOSTICO: 2 rotulas inferiores' },
  { unidad_id: IDS.sprinter2, fecha: f('07-ago-25'), categoria: 'Reparaciones', detalles: 'Bajar el tanque de diésel y limpiar todo el sistema de inyección, desmonte de inyectores y riel de inyección, cambio del filtro de combustible.', costo: c('5500'), taller_mecanico: 'Giovanni Franco Tecnico MB' },
  { unidad_id: IDS.sprinter2, fecha: f('09-sep-25'), kilometraje: km('86376'), categoria: 'Reparaciones', detalles: 'REEMPLAZO DE POLEA TENSORA, REEMPLAZO DE 2 BANDAS, REEMPLAZO DE POLEA GUIA', costo: c('2784'), taller_mecanico: 'JG GROUP CAR TECH' },
  { unidad_id: IDS.sprinter2, fecha: f('22-sep-25'), categoria: 'Fumigación', detalles: 'Servicio de Fumigación por cucarachas', costo: c('580'), taller_mecanico: 'Israel Carreto' },
  { unidad_id: IDS.sprinter2, fecha: f('12-ene-26'), categoria: 'Frenos', detalles: 'Cambio de las balatas del eje delantero y trasero.', costo: c('7094.12'), taller_mecanico: 'Agencia Mercedes Benz / Giovanni Franco Tecnico MB' },
  { unidad_id: IDS.sprinter2, fecha: f('19-ene-26'), categoria: 'Reparaciones', detalles: 'Cambio de Polea DAMPER y bandas', costo: c('12445.69'), taller_mecanico: 'Agencia Mercedes Benz / Giovanni Franco Tecnico MB' },
  { unidad_id: IDS.sprinter2, fecha: f('22-mar-26'), categoria: 'Servicio', detalles: 'Servicio "B": cambio kit de filtros (aire, aceite y combustible), 12 litros de aceite y mano de obra.', costo: c('4100'), taller_mecanico: 'Giovanni Franco Tecnico MB' },
  { unidad_id: IDS.sprinter2, fecha: f('30-mar-26'), categoria: 'Reparaciones', detalles: 'Cambio de POLEA DE REENVIO, 2 CORREAS, 1 TENSOR DE CORREA, 1 LUZ, UNA INTERMITENTE, 1 FILTRO ANTIPOLVO (cabina) y 2 FILTRO DE POLVO FINO (clima trasero).', costo: c('13754.78'), taller_mecanico: 'Agencia Mercedes Benz / Giovanni Franco Tecnico MB' },

  // ===== SPRINTER 3 =====
  { unidad_id: IDS.sprinter3, fecha: f('12-oct-23'), categoria: 'Servicio', detalles: 'Servicio adelantado de 10,000 km (servicio quedo a cuenta de la mercedes).', costo: null, taller_mecanico: 'Agencia Mercedes' },
  { unidad_id: IDS.sprinter3, fecha: f('09-abr-24'), kilometraje: km('35718'), categoria: 'Frenos', detalles: 'Se cambiaron las balatas traseras', costo: c('6148.56'), taller_mecanico: 'Agencia Mercedes' },
  { unidad_id: IDS.sprinter3, fecha: f('08-may-24'), kilometraje: km('39075'), categoria: 'Servicio', detalles: 'Se realizo servicio "B"', costo: null, taller_mecanico: 'Agencia Mercedes' },
  { unidad_id: IDS.sprinter3, fecha: f('09-may-24'), kilometraje: km('39075'), categoria: 'Frenos', detalles: 'Se cambiaron las balatas delanteras', costo: c('6344.93'), taller_mecanico: 'Agencia Mercedes' },
  { unidad_id: IDS.sprinter3, fecha: f('15-jul-24'), kilometraje: km('40650'), categoria: 'Reparaciones', detalles: 'Cambio de clutch y pedal del clutch', costo: c('65994.78'), taller_mecanico: 'Agencia Mercedes-Benz' },
  { unidad_id: IDS.sprinter3, fecha: f('03-sep-24'), categoria: 'Incidente', detalles: 'La unidad tuvo un choque contra una unidad pick up, provocando daños en la parte frontal derecha. (Operador Chema)', taller_mecanico: 'Agencia Mercedes' },
  { unidad_id: IDS.sprinter3, fecha: f('04-oct-24'), kilometraje: km('44974'), categoria: 'Reparaciones', detalles: 'Reparación por choque frontal lado derecho, molduras y refacciones varias.', costo: c('84521.22'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter3, fecha: f('27-sep-24'), categoria: 'Reparaciones', detalles: 'Reparación por choque frontal lado derecho, laminación y pintura.', costo: c('23500'), taller_mecanico: 'FIX CAR (Laminación y Pintura)' },
  { unidad_id: IDS.sprinter3, fecha: f('10-feb-25'), kilometraje: km('55416'), categoria: 'Chasis', detalles: 'Servicio de lavado, servicio de sopleteado, 3 litros H300 p/sopletear', costo: c('425'), taller_mecanico: 'Victor Manuel Rosete Sosa' },
  { unidad_id: IDS.sprinter3, fecha: f('9-jun-25'), kilometraje: km('62336'), categoria: 'Servicio', detalles: 'Servicio "A": Renovación de filtro de aire del motor, desinfección, limpieza de motor, limpieza del filtro de particulas, junta anular, elemento de filtro de aire, elemento de filtro de aceite, tratamiento para diesel.', costo: c('9516.11'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter3, fecha: f('16-jun-25'), categoria: 'Llantas', detalles: 'Compra de llantas: 2 delanteras CONTIVANCONTACT y 2 traseras CONTI VANCONTACT', costo: c('19398'), taller_mecanico: 'Llantera Malibran' },
  { unidad_id: IDS.sprinter3, fecha: f('17-jun-25'), kilometraje: km('62405'), categoria: 'Alineación y Balanceo', detalles: 'Alineación y balanceo', costo: c('866'), taller_mecanico: 'VIMOSA DIAZ MIRON' },
  { unidad_id: IDS.sprinter3, fecha: f('25-jul-25'), kilometraje: km('65440'), categoria: 'Servicio', detalles: 'Servicio "B"', costo: c('4000'), taller_mecanico: 'David Molina Tecnico MB', recomendaciones: 'Diagnostico: Testigo de Comunicación, Arnes del Motor, Sensor de Temperatura' },
  { unidad_id: IDS.sprinter3, fecha: f('6-ago-25'), categoria: 'Reparaciones', detalles: 'Reparación del arnes y sustitución de sensor desgaste trasero para frenos. Cambio de balatas traseras y cambio de pernos (bujes) delanteros.', costo: c('2905.66'), taller_mecanico: 'Agencia Mercedes Benz' },
  { unidad_id: IDS.sprinter3, fecha: f('22-sep-25'), categoria: 'Fumigación', detalles: 'Servicio de Fumigación por cucarachas', costo: c('580'), taller_mecanico: 'Israel Carreto' },
  { unidad_id: IDS.sprinter3, fecha: f('12-ene-26'), categoria: 'Frenos', detalles: 'Compra y cambio de las balatas del eje delantero y trasero.', costo: c('7094.12'), taller_mecanico: 'Agencia Mercedes Benz / Giovanni Franco Tecnico MB' },
  { unidad_id: IDS.sprinter3, fecha: f('12-mar-26'), categoria: 'Golpe', detalles: 'Medallón estrellado', taller_mecanico: 'Reportó Alfonso' },
  { unidad_id: IDS.sprinter3, fecha: f('18-mar-26'), categoria: 'Reparaciones', detalles: 'Cambio de medallón', costo: c('1500'), taller_mecanico: 'ROTO Cristales y Partes' },
  { unidad_id: IDS.sprinter3, fecha: f('22-mar-26'), categoria: 'Servicio', detalles: 'Servicio "A": Cambio de filtro de aire, de aceite y 12 litros de aceite', costo: c('3300'), taller_mecanico: 'Giovanni Franco Tecnico MB' },
  { unidad_id: IDS.sprinter3, fecha: f('30-mar-26'), categoria: 'Reparaciones', detalles: 'Cambio de POLEA DE REENVIO, 2 CORREAS, 1 TENSOR DE CORREA, 1 LUZ, UNA INTERMITENTE, 1 FILTRO ANTIPOLVO (cabina) y 2 FILTRO DE POLVO FINO (clima trasero).', costo: c('13754.78'), taller_mecanico: 'Agencia Mercedes Benz / Giovanni Franco Tecnico MB' },
]

// Filtrar registros con fecha válida
const validos = registros.filter(r => r.fecha !== null)
const invalidos = registros.filter(r => r.fecha === null)

console.log(`Total registros: ${registros.length}`)
console.log(`Con fecha válida: ${validos.length}`)
console.log(`Sin fecha (se omiten): ${invalidos.length}`)

// Insertar en lotes de 50
async function insertar() {
  let insertados = 0
  const loteSize = 50
  for (let i = 0; i < validos.length; i += loteSize) {
    const lote = validos.slice(i, i + loteSize)
    const { error } = await supabase.from('bitacora_unidades').insert(lote)
    if (error) {
      console.error(`Error en lote ${i}-${i+loteSize}:`, error.message)
    } else {
      insertados += lote.length
      console.log(`✓ Insertados ${insertados}/${validos.length}`)
    }
  }
  console.log(`\n✅ Importación completa: ${insertados} registros`)
}

insertar()
