/**
 * Datos estrictamente ficticios para validar el backend.
 *
 * Requiere configurar en Propiedades del script:
 *   CAL_PERMITIR_DATOS_PRUEBA = SI
 *
 * IMPORTANTE: ejecutar solo sobre una hoja de cálculo de PRUEBAS.
 * Las funciones no se ejecutan automáticamente en el despliegue web.
 */
const CAL_PINZAS_DEMO_ = Object.freeze([
  ['TEST-L1-001', '[PRUEBA] Pinza amperimétrica A', 'LIN-001'],
  ['TEST-L1-002', '[PRUEBA] Pinza amperimétrica B', 'LIN-001'],
  ['TEST-L2-001', '[PRUEBA] Pinza digital A', 'LIN-002'],
  ['TEST-L2-002', '[PRUEBA] Pinza digital B', 'LIN-002'],
  ['TEST-L3-001', '[PRUEBA] Pinza amperimétrica C', 'LIN-003'],
  ['TEST-L3-002', '[PRUEBA] Pinza digital C', 'LIN-003']
]);

function calValidarEntornoPruebas_() {
  const permitido = PropertiesService.getScriptProperties()
    .getProperty('CAL_PERMITIR_DATOS_PRUEBA');
  if (permitido !== 'SI') {
    throw new Error(
      'Carga de prueba bloqueada. Usa una hoja de cálculo de pruebas y configura CAL_PERMITIR_DATOS_PRUEBA=SI.'
    );
  }
}

/**
 * Inserta seis pinzas ficticias, dos por línea. Es idempotente.
 * No reemplaza ni modifica pinzas existentes.
 */
function cargarPinzasDePrueba() {
  calValidarEntornoPruebas_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const lineas = listarLineas();
    const idsLineas = new Set(lineas.map(x => x.id));
    const lineasFaltantes = CAL_PINZAS_DEMO_
      .map(x => x[2]).filter((id, i, arr) => !idsLineas.has(id) && arr.indexOf(id) === i);
    if (lineasFaltantes.length) {
      throw new Error('Faltan líneas activas: ' + lineasFaltantes.join(', '));
    }
    const hoja = calHoja_(CAL_CONFIG.hojas.instrumentos);
    const existentes = calRegistros_(CAL_CONFIG.hojas.instrumentos);
    const idsExistentes = new Set(existentes.map(x => calTexto_(x.id_instrumento).toUpperCase()));
    const nuevos = CAL_PINZAS_DEMO_.filter(x => !idsExistentes.has(x[0]));
    if (nuevos.length) {
      const filas = nuevos.map(([id, nombre, idLinea]) =>
        [id, nombre, idLinea, 'PENDIENTE', true]);
      hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 5).setValues(filas);
      SpreadsheetApp.flush();
    }
    const resultado = {
      ok: true,
      creadas: nuevos.length,
      existentes: CAL_PINZAS_DEMO_.length - nuevos.length,
      totalDemo: CAL_PINZAS_DEMO_.length
    };
    Logger.log(JSON.stringify(resultado));
    return resultado;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Desactiva las seis pinzas ficticias, sin borrarlas ni borrar historial.
 * Útil después de las pruebas; nunca afecta identificadores reales.
 */
function desactivarPinzasDePrueba() {
  calValidarEntornoPruebas_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const hoja = calHoja_(CAL_CONFIG.hojas.instrumentos);
    const registros = calRegistros_(CAL_CONFIG.hojas.instrumentos);
    const idsDemo = new Set(CAL_PINZAS_DEMO_.map(x => x[0]));
    let desactivadas = 0;
    registros.forEach(x => {
      if (idsDemo.has(calTexto_(x.id_instrumento)) &&
          calTexto_(x.nombre).startsWith('[PRUEBA]') && calActivo_(x.activo)) {
        hoja.getRange(x._fila, 5).setValue(false);
        desactivadas++;
      }
    });
    SpreadsheetApp.flush();
    Logger.log('Pinzas ficticias desactivadas: ' + desactivadas);
    return { ok: true, desactivadas };
  } finally {
    lock.releaseLock();
  }
}
