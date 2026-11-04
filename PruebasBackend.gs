/**
 * Pruebas de solo lectura para el backend de calibración.
 * No crea líneas, no modifica Sheets ni toca el frontend.
 *
 * Después de sincronizar con clasp, ejecutar desde Apps Script:
 * 1. diagnosticarLineas
 * 2. pruebaEstadoMensual
 */

function diagnosticarLineas() {
  const hoja = calHoja_(CAL_CONFIG.hojas.lineas);
  const filas = hoja.getDataRange().getValues();
  const encabezados = CAL_CONFIG.columnas.LINEAS;
  const encabezadosReales = (filas[0] || []).slice(0, encabezados.length);
  const encabezadosValidos = encabezados.every((nombre, indice) => encabezadosReales[indice] === nombre);
  const registros = encabezadosValidos ? calRegistros_(CAL_CONFIG.hojas.lineas) : [];
  const resumen = {
    hoja: CAL_CONFIG.hojas.lineas,
    cantidadFilasDatos: Math.max(0, filas.length - 1),
    encabezadosEsperados: encabezados,
    encabezadosReales: encabezadosReales,
    encabezadosValidos: encabezadosValidos,
    lineasRegistradas: registros.length,
    lineasActivas: registros.filter(linea => calActivo_(linea.activo)).length,
    lineasInactivas: registros.filter(linea => !calActivo_(linea.activo)).length,
    lineas: registros.map(linea => ({
      id: calTexto_(linea.id_linea),
      nombre: calTexto_(linea.nombre_linea),
      valorActivo: String(linea.activo),
      activa: calActivo_(linea.activo)
    }))
  };

  Logger.log('=== DIAGNOSTICO DE LINEAS ===');
  Logger.log(JSON.stringify(resumen, null, 2));

  if (!encabezadosValidos) {
    Logger.log('ATENCION: los encabezados no corresponden a los esperados; no se modifico ninguna celda.');
  } else if (!resumen.lineasRegistradas) {
    Logger.log('ATENCION: la hoja LINEAS no tiene registros. Primero hay que definir las tres lineas reales.');
  } else if (!resumen.lineasActivas) {
    Logger.log('ATENCION: hay registros pero ninguno tiene activo=true.');
  }
  return resumen;
}

function pruebaEstadoMensual() {
  const lineas = listarLineas();
  Logger.log('=== LINEAS ACTIVAS ===');
  Logger.log(JSON.stringify(lineas, null, 2));

  if (!lineas.length) {
    Logger.log('Sin lineas activas: ejecutar diagnosticarLineas para conocer la causa.');
    return { ok: false, motivo: 'SIN_LINEAS_ACTIVAS', totalLineas: 0 };
  }

  const resultados = lineas.map(linea => {
    const panel = consultarPanelCalibracion(linea.id);
    Logger.log('=== ' + linea.nombre + ' ===');
    Logger.log(JSON.stringify(panel, null, 2));
    return { idLinea: linea.id, total: panel.total, calibradas: panel.calibradas };
  });

  Logger.log('=== PRUEBA FINALIZADA ===');
  return { ok: true, totalLineas: lineas.length, resultados: resultados };
}
