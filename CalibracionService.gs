/** Registra confirmaciones de estado con historial permanente. */
function registrarCalibracion(datos) {
  if (!datos || typeof datos !== 'object' || datos.calibrada !== true) {
    throw new Error('Solo se admite la confirmación explícita de calibración.');
  }
  const idInstrumento = calTexto_(datos.idInstrumento);
  if (!idInstrumento) throw new Error('Se requiere idInstrumento.');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const instrumentos = calRegistros_(CAL_CONFIG.hojas.instrumentos);
    const instrumento = instrumentos.find(item => calTexto_(item.id_instrumento) === idInstrumento);
    if (!instrumento || !calActivo_(instrumento.activo)) {
      throw new Error('Instrumento inexistente o inactivo.');
    }
    const idLinea = calTexto_(instrumento.id_linea);
    if (!listarLineas().some(linea => linea.id === idLinea)) {
      throw new Error('Línea inexistente o inactiva.');
    }
    const fecha = new Date();
    // Impide confirmaciones repetidas de una misma pinza en el mes.
    // Se comprueba dentro del bloqueo para proteger solicitudes concurrentes.
    const mes = Utilities.formatDate(fecha, CAL_CONFIG.zonaHoraria, 'yyyy-MM');
    const yaConfirmada = calRegistros_(CAL_CONFIG.hojas.calibraciones)
      .some(item => calTexto_(item.id_instrumento) === idInstrumento &&
        calTexto_(item.resultado) === 'CALIBRADA' &&
        calMesDeFecha_(item.fecha_hora) === mes);
    if (yaConfirmada) {
      throw new Error('La pinza ya tiene una calibración confirmada este mes.');
    }
    const resultado = 'CALIBRADA';
    const id = 'CAL-' + Utilities.getUuid();
    const correo = Session.getActiveUser().getEmail() || 'NO_IDENTIFICADO';
    // Primero se escribe el historial: es la fuente de verdad del estado mensual.
    const hoja = calHoja_(CAL_CONFIG.hojas.calibraciones);
    hoja.appendRow([id, fecha, idInstrumento, idLinea, resultado, correo]);
    SpreadsheetApp.flush();

    // El estado_actual del inventario es una copia auxiliar, no determina
    // si una pinza está calibrada este mes. Si falla, el historial se conserva
    // y la interfaz puede seguir consultando el estado mensual correcto.
    let estadoInventarioActualizado = true;
    try {
      const hojaInstrumentos = calHoja_(CAL_CONFIG.hojas.instrumentos);
      hojaInstrumentos.getRange(instrumento._fila, 4).setValue(resultado);
      SpreadsheetApp.flush();
    } catch (errorEstado) {
      estadoInventarioActualizado = false;
      console.error('Calibración ' + id + ' registrada, pero no se pudo actualizar estado_actual: ' + errorEstado);
    }

    return {
      ok: true, idCalibracion: id, idInstrumento: idInstrumento,
      idLinea: idLinea, resultado: resultado,
      estadoInventarioActualizado: estadoInventarioActualizado,
      fechaHora: Utilities.formatDate(fecha, CAL_CONFIG.zonaHoraria, 'yyyy-MM-dd HH:mm:ss')
    };
  } finally {
    lock.releaseLock();
  }
}

function consultarHistorial(filtros) {
  filtros = filtros || {};
  const inicio = calTexto_(filtros.fechaInicio);
  const fin = calTexto_(filtros.fechaFin);
  if ((inicio && !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) ||
      (fin && !/^\d{4}-\d{2}-\d{2}$/.test(fin))) {
    throw new Error('Las fechas deben usar AAAA-MM-DD.');
  }
  if (inicio && fin && inicio > fin) throw new Error('Rango de fechas inválido.');
  const instrumentos = calRegistros_(CAL_CONFIG.hojas.instrumentos);
  const nombres = {};
  instrumentos.forEach(item => nombres[calTexto_(item.id_instrumento)] = calTexto_(item.nombre));
  return calRegistros_(CAL_CONFIG.hojas.calibraciones)
    .filter(item => {
      const fecha = item.fecha_hora instanceof Date
        ? Utilities.formatDate(item.fecha_hora, CAL_CONFIG.zonaHoraria, 'yyyy-MM-dd')
        : calTexto_(item.fecha_hora).slice(0, 10);
      return (!inicio || fecha >= inicio) && (!fin || fecha <= fin) &&
        (!filtros.idLinea || calTexto_(item.id_linea) === calTexto_(filtros.idLinea)) &&
        (!filtros.idInstrumento || calTexto_(item.id_instrumento) === calTexto_(filtros.idInstrumento));
    })
    .reverse()
    .map(item => ({
      id: calTexto_(item.id_calibracion),
      fechaHora: item.fecha_hora instanceof Date
        ? Utilities.formatDate(item.fecha_hora, CAL_CONFIG.zonaHoraria, 'yyyy-MM-dd HH:mm:ss')
        : calTexto_(item.fecha_hora),
      idInstrumento: calTexto_(item.id_instrumento),
      nombreInstrumento: nombres[calTexto_(item.id_instrumento)] || '',
      idLinea: calTexto_(item.id_linea),
      resultado: calTexto_(item.resultado),
      registradoPor: calTexto_(item.registrado_por)
    }));
}
