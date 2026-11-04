/**
 * Inicialización controlada del catálogo LINEAS.
 * Se ejecuta manualmente una vez desde Apps Script.
 * Solo agrega datos si la hoja está vacía; nunca sustituye filas existentes.
 */
function registrarLineasIniciales() {
  const lineasIniciales = [
    ['LIN-001', 'Línea 1', true],
    ['LIN-002', 'Línea 2', true],
    ['LIN-003', 'Línea 3', true]
  ];
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(30000);

  try {
    const hoja = calHoja_(CAL_CONFIG.hojas.lineas);
    const encabezados = CAL_CONFIG.columnas.LINEAS;
    const valoresEncabezado = hoja.getRange(1, 1, 1, encabezados.length).getValues()[0];
    if (encabezados.some((campo, i) => valoresEncabezado[i] !== campo)) {
      throw new Error('Encabezados inválidos en LINEAS. No se agregaron registros.');
    }

    const existentes = calRegistros_(CAL_CONFIG.hojas.lineas);
    if (existentes.length > 0) {
      const coinciden = lineasIniciales.every(([id, nombre]) =>
        existentes.some(x => calTexto_(x.id_linea) === id &&
                            calTexto_(x.nombre_linea) === nombre &&
                            calActivo_(x.activo))
      );
      const resultado = coinciden && existentes.length === lineasIniciales.length
        ? 'YA_CONFIGURADAS' : 'DATOS_EXISTENTES';
      Logger.log(resultado === 'YA_CONFIGURADAS'
        ? 'Las tres líneas ya existen; no se modificó nada.'
        : 'LINEAS contiene datos. No se modificó nada para evitar duplicados.');
      return { ok: resultado === 'YA_CONFIGURADAS', estado: resultado,
        totalExistentes: existentes.length, lineas: listarLineas() };
    }

    // Evita escribir sobre filas ocupadas que no se hayan considerado registros válidos.
    if (hoja.getLastRow() > 1) {
      throw new Error('LINEAS contiene filas adicionales. Revisión manual necesaria.');
    }

    hoja.getRange(2, 1, lineasIniciales.length, encabezados.length)
      .setValues(lineasIniciales);
    SpreadsheetApp.flush();
    const lineas = listarLineas();
    Logger.log('Tres líneas inicializadas: ' + JSON.stringify(lineas));
    return { ok: true, estado: 'CREADAS', totalCreadas: lineasIniciales.length, lineas };
  } finally {
    bloqueo.releaseLock();
  }
}
