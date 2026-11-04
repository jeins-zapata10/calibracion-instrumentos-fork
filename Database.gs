/** Acceso centralizado a Sheets. No modifica el frontend. */
function calLibro_() {
  return SpreadsheetApp.openById(calObtenerSpreadsheetId_());
}

function calHoja_(nombre) {
  const hoja = calLibro_().getSheetByName(nombre);
  if (!hoja) throw new Error('No existe la pestaña: ' + nombre);
  return hoja;
}

function calRegistros_(nombre) {
  const hoja = calHoja_(nombre);
  const filas = hoja.getDataRange().getValues();
  const encabezados = CAL_CONFIG.columnas[nombre];
  if (!encabezados) throw new Error('Pestaña no permitida: ' + nombre);
  if (filas[0].slice(0, encabezados.length).some((v, i) => v !== encabezados[i])) {
    throw new Error('Los encabezados no coinciden en ' + nombre);
  }
  return filas.slice(1).map((valores, indice) => {
    const registro = { _fila: indice + 2 };
    encabezados.forEach((clave, i) => registro[clave] = valores[i]);
    return registro;
  }).filter(registro => encabezados.some(clave => registro[clave] !== ''));
}

function calActivo_(valor) {
  return valor === true || String(valor).trim().toLowerCase() === 'true';
}

function calTexto_(valor) {
  return String(valor == null ? '' : valor).trim();
}
