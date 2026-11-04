/** Consulta de instrumentos sin modificar los componentes visuales. */
function listarInstrumentos(idLinea) {
  const id = calTexto_(idLinea);
  if (!id) throw new Error('Indica el ID de la línea.');
  if (!listarLineas().some(linea => linea.id === id)) {
    throw new Error('La línea no existe o está inactiva.');
  }
  return calRegistros_(CAL_CONFIG.hojas.instrumentos)
    .filter(fila => calTexto_(fila.id_linea) === id && calActivo_(fila.activo))
    .map(fila => ({
      id: calTexto_(fila.id_instrumento),
      nombre: calTexto_(fila.nombre),
      idLinea: id,
      estado: calTexto_(fila.estado_actual) || 'PENDIENTE'
    }));
}


/**
 * Registra una pinza real en una línea existente.
 * Uso administrativo: registrarInstrumento_({id: 'P1-002', nombre: 'Pinza amperimétrica', idLinea: 'LIN-001'})
 * No registra calibraciones ni modifica el frontend.
 */
function registrarInstrumento_(datos) {
  if (!datos || typeof datos !== 'object') {
    throw new Error('Debes proporcionar los datos del instrumento.');
  }

  const id = calTexto_(datos.id);
  const nombre = calTexto_(datos.nombre);
  const idLinea = calTexto_(datos.idLinea);

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,49}$/.test(id)) {
    throw new Error('ID inválido: usa entre 2 y 50 caracteres alfanuméricos, guion o guion bajo.');
  }
  if (!nombre || nombre.length > 120 || /^[=+@\-]/.test(nombre)) {
    throw new Error('Nombre inválido: debe tener entre 1 y 120 caracteres y no iniciar como fórmula.');
  }
  if (!idLinea) throw new Error('Debes indicar la línea.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!listarLineas().some(linea => linea.id === idLinea)) {
      throw new Error('La línea no existe o está inactiva.');
    }
    const existentes = calRegistros_(CAL_CONFIG.hojas.instrumentos);
    const repetido = existentes.find(item => calTexto_(item.id_instrumento).toUpperCase() === id.toUpperCase());
    if (repetido) {
      throw new Error('Ya existe una pinza con este ID: ' + id);
    }

    const hoja = calHoja_(CAL_CONFIG.hojas.instrumentos);
    hoja.appendRow([id, nombre, idLinea, 'PENDIENTE', true]);
    SpreadsheetApp.flush();

    return {
      ok: true,
      instrumento: { id: id, nombre: nombre, idLinea: idLinea, estado: 'PENDIENTE', activo: true }
    };
  } finally {
    lock.releaseLock();
  }
}
