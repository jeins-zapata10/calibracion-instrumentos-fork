/**
 * Calcula el estado mensual de cada pinza a partir del historial.
 * Una calibración se considera vigente únicamente durante su mes calendario,
 * usando America/Bogota. No modifica datos ni archivos visuales.
 */
function calMesDeFecha_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, CAL_CONFIG.zonaHoraria, 'yyyy-MM');
  }
  // Permite fechas de texto ISO ya existentes en Sheets.
  const texto = calTexto_(valor);
  return /^\d{4}-(0[1-9]|1[0-2])(?:-|$)/.test(texto) ? texto.slice(0, 7) : '';
}

function calFechaLegible_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, CAL_CONFIG.zonaHoraria, 'yyyy-MM-dd HH:mm:ss');
  }
  return calTexto_(valor);
}

function calEstadoMensual_(idInstrumento, registros, mesActual) {
  // Los registros se añaden al final: la última fila del mes prevalece.
  let ultimoMes = null;
  let ultimaCalibracion = null;
  registros.forEach(registro => {
    if (calTexto_(registro.id_instrumento) !== idInstrumento) return;
    if (registro.resultado === 'CALIBRADA') ultimaCalibracion = registro;
    if (calMesDeFecha_(registro.fecha_hora) === mesActual) ultimoMes = registro;
  });

  const estado = !ultimoMes ? 'PENDIENTE'
    : calTexto_(ultimoMes.resultado) === 'CALIBRADA' ? 'CALIBRADA'
    : 'NO_CALIBRADA';

  return {
    estado,
    calibrada: estado === 'CALIBRADA',
    etiquetaEstado: estado === 'CALIBRADA' ? 'Calibrada'
      : estado === 'NO_CALIBRADA' ? 'No calibrada'
      : 'Pendiente de calibración',
    // Identificador semántico para el frontend futuro; no altera colores CSS.
    indicador: estado === 'CALIBRADA' ? 'success' : 'pending',
    ultimaRevisionMes: ultimoMes ? calFechaLegible_(ultimoMes.fecha_hora) : null,
    ultimaCalibracion: ultimaCalibracion
      ? calFechaLegible_(ultimaCalibracion.fecha_hora) : null
  };
}

/**
 * Devuelve datos para las tarjetas de la primera vista.
 * La cantidad de líneas procede de LINEAS; las tres actuales no se codifican.
 * No escribe en Sheets.
 */
function consultarPanelCalibracion(idLinea) {
  const id = calTexto_(idLinea);
  const linea = listarLineas().find(item => item.id === id);
  if (!linea) throw new Error('Selecciona una línea activa válida.');

  const mesActual = Utilities.formatDate(
    new Date(), CAL_CONFIG.zonaHoraria, 'yyyy-MM'
  );

  const pinzas = listarInstrumentos(id);
  const registros = calRegistros_(CAL_CONFIG.hojas.calibraciones);
  const instrumentos = pinzas.map(pinza => ({
    ...pinza,
    ...calEstadoMensual_(pinza.id, registros, mesActual)
  }));

  return {
    linea: { id: linea.id, nombre: linea.nombre },
    periodo: mesActual,
    total: instrumentos.length,
    calibradas: instrumentos.filter(item => item.calibrada).length,
    instrumentos
  };
}
