/**
 * Contratos públicos de consulta del backend para integración con la interfaz.
 * No cambia HTML, estilos ni datos. Zona horaria: America/Bogota.
 *
 * Métodos:
 *   obtenerDatosPanel()
 *   obtenerHistorialPaginado({fechaInicio, fechaFin, idLinea, idInstrumento, pagina, tamanoPagina})
 */

/**
 * Obtiene en una sola llamada las líneas y las tarjetas de sus instrumentos
 * con el estado mensual calculado a partir de CALIBRACIONES.
 * Solo lectura. La vista podrá usar los datos sin modificar su diseño.
 */
function obtenerDatosPanel() {
  const lineas = listarLineas();
  const mes = Utilities.formatDate(new Date(), CAL_CONFIG.zonaHoraria, 'yyyy-MM');
  const instrumentos = calRegistros_(CAL_CONFIG.hojas.instrumentos)
    .filter(item => calActivo_(item.activo));
  const registros = calRegistros_(CAL_CONFIG.hojas.calibraciones);

  return {
    ok: true,
    periodo: mes,
    lineas: lineas.map(linea => {
      const tarjetas = instrumentos
        .filter(item => calTexto_(item.id_linea) === linea.id)
        .map(item => {
          const id = calTexto_(item.id_instrumento);
          return {
            id,
            nombre: calTexto_(item.nombre),
            idLinea: linea.id,
            ...calEstadoMensual_(id, registros, mes)
          };
        });
      return {
        id: linea.id,
        nombre: linea.nombre,
        total: tarjetas.length,
        calibradas: tarjetas.filter(pinza => pinza.calibrada).length,
        instrumentos: tarjetas
      };
    })
  };
}

/**
 * Devuelve la página solicitada del historial sin exponer números de fila
 * de Sheets. Preserva los filtros existentes de consultarHistorial.
 */
function obtenerHistorialPaginado(filtros) {
  const parametros = filtros || {};
  if (typeof parametros !== 'object' || Array.isArray(parametros)) {
    throw new Error('Los filtros deben enviarse como objeto.');
  }

  const pagina = parametros.pagina == null ? 1 : Number(parametros.pagina);
  const tamanoPagina = parametros.tamanoPagina == null ? 20 : Number(parametros.tamanoPagina);
  if (!Number.isInteger(pagina) || pagina < 1) {
    throw new Error('pagina debe ser un entero positivo.');
  }
  if (!Number.isInteger(tamanoPagina) || tamanoPagina < 1 || tamanoPagina > 100) {
    throw new Error('tamanoPagina debe estar entre 1 y 100.');
  }

  const historial = consultarHistorial(parametros)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora) || b.id.localeCompare(a.id));
  const total = historial.length;
  const totalPaginas = Math.ceil(total / tamanoPagina);
  const inicio = (pagina - 1) * tamanoPagina;

  return {
    ok: true,
    pagina,
    tamanoPagina,
    total,
    totalPaginas,
    registros: historial.slice(inicio, inicio + tamanoPagina)
  };
}

/** Prueba de solo lectura de los nuevos contratos. */
function pruebaApiPanelHistorial() {
  const panel = obtenerDatosPanel();
  const resumen = panel.lineas.map(linea => ({
    idLinea: linea.id,
    total: linea.total,
    calibradas: linea.calibradas,
    pendientes: linea.instrumentos.filter(x => x.estado === 'PENDIENTE').length
  }));
  const historial = obtenerHistorialPaginado({ pagina: 1, tamanoPagina: 10 });

  const correcto = panel.ok && historial.ok &&
    panel.lineas.every(l => l.total === l.instrumentos.length) &&
    panel.lineas.every(l => l.calibradas === l.instrumentos.filter(x => x.calibrada).length) &&
    historial.registros.length <= 10;

  const resultado = {
    ok: correcto,
    periodo: panel.periodo,
    lineas: resumen,
    historial: { total: historial.total, pagina: historial.pagina,
      registrosEnPagina: historial.registros.length }
  };
  Logger.log('=== PRUEBA API PANEL E HISTORIAL ===');
  Logger.log(JSON.stringify(resultado, null, 2));
  if (!correcto) throw new Error('Contrato de consulta inconsistente.');
  return resultado;
}
