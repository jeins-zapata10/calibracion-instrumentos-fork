/** Ejecutar manualmente una sola vez para verificar y preparar las pestañas. */
function inicializarBaseDatos() {
  const libro = calLibro_();
  Object.keys(CAL_CONFIG.columnas).forEach(nombre => {
    let hoja = libro.getSheetByName(nombre);
    if (!hoja) hoja = libro.insertSheet(nombre);
    const columnas = CAL_CONFIG.columnas[nombre];
    const rango = hoja.getRange(1, 1, 1, columnas.length);
    const actuales = rango.getValues()[0];
    if (actuales.every(x => x === '')) {
      rango.setValues([columnas]);
      hoja.setFrozenRows(1);
    } else if (actuales.some((valor, indice) => valor !== columnas[indice])) {
      throw new Error('Encabezados diferentes en ' + nombre + '. No se modificó esta pestaña.');
    }
  });
  Logger.log('Hojas preparadas sin borrar datos existentes.');
}

