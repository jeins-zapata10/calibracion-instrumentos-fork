/** Consultas de líneas activas. */
function listarLineas() {
  return calRegistros_(CAL_CONFIG.hojas.lineas)
    .filter(fila => calActivo_(fila.activo))
    .map(fila => ({
      id: calTexto_(fila.id_linea),
      nombre: calTexto_(fila.nombre_linea)
    }));
}
