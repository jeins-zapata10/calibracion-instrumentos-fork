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
