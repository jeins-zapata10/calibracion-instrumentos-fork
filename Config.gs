/** Configuración del almacenamiento. Nunca publicar el ID real en el repositorio. */
const CAL_CONFIG = Object.freeze({
  hojas: Object.freeze({
    lineas: 'LINEAS',
    instrumentos: 'INSTRUMENTOS',
    calibraciones: 'CALIBRACIONES'
  }),
  columnas: Object.freeze({
    LINEAS: ['id_linea', 'nombre_linea', 'activo'],
    INSTRUMENTOS: ['id_instrumento', 'nombre', 'id_linea', 'estado_actual', 'activo'],
    CALIBRACIONES: ['id_calibracion', 'fecha_hora', 'id_instrumento', 'id_linea', 'resultado', 'registrado_por']
  }),
  zonaHoraria: 'America/Bogota'
});

function calObtenerSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Configura SPREADSHEET_ID en las propiedades del proyecto.');
  return id.trim();
}
