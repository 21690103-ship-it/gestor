import React, { useState, useEffect } from "react";
import "./ActualizarArchivoModal.css";

const ActualizarArchivoModal = ({ isOpen, onClose, documento, onFileUpload, userId }) => {
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Cargar historial cuando se abre el modal
  useEffect(() => {
    const cargarHistorialDocumentos = async () => {
      if (!documento?.tipo || !userId) return;
      
      setCargando(true);
      try {
        const token = localStorage.getItem('token');
        
        const tipoDocumentoMap = {
          //documentos personales
          'actaNacimiento': 'acta_nacimiento',
          'comprobanteDomicilio': 'comp_dom', 
          'cartillaMilitar': 'cartilla',
          'curp': 'curp',
          'ine': 'ine',
          //documentos profesionales
          'csf': 'csf',
          'cdp': 'cdp',
          'cni': 'cni',
          'cv': 'cv',
          'ugs': 'ugs'
        };
        
        const tipoDocumentoBackend = tipoDocumentoMap[documento.tipo] || documento.tipo;
        
        const response = await fetch(`http://localhost:8000/api/documentos/historial/${userId}/${tipoDocumentoBackend}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHistorial(data.historial || []);
        }
      } catch (error) {
        console.error('Error cargando historial:', error);
      } finally {
        setCargando(false);
      }
    };

    if (isOpen && documento && userId) {
      cargarHistorialDocumentos();
    } else {
      setHistorial([]);
    }
  }, [isOpen, documento, userId]);

  const handleFileChange = (event) => {
    const archivo = event.target.files[0];
    setError("");
    setNuevoArchivo(null);

    if (!archivo) return;

    if (archivo.type !== 'application/pdf') {
      setError("❌ Solo se permiten archivos PDF");
      event.target.value = '';
      return;
    }

    const extension = archivo.name.split('.').pop().toLowerCase();
    if (extension !== 'pdf') {
      setError("❌ Solo se permiten archivos con extensión .pdf");
      event.target.value = '';
      return;
    }

    const maxSize = 1024 * 1024;
    if (archivo.size > maxSize) {
      const tamañoMB = (archivo.size / (1024 * 1024)).toFixed(2);
      setError(`❌ El archivo es demasiado grande (${tamañoMB} MB). Máximo permitido: 1MB`);
      event.target.value = '';
      return;
    }

    setNuevoArchivo(archivo);
  };

  const handleSubmit = () => {
    if (!nuevoArchivo) {
      setError("❌ Por favor, seleccione un archivo PDF");
      return;
    }

    if (nuevoArchivo.type !== 'application/pdf') {
      setError("❌ Solo se permiten archivos PDF");
      return;
    }

    if (nuevoArchivo.size > 1024 * 1024) {
      setError("❌ El archivo es demasiado grande");
      return;
    }

    onFileUpload(documento, nuevoArchivo, userId);
    onClose();
    setNuevoArchivo(null);
    setError("");
  };

  const handleEliminarSeleccion = () => {
    setNuevoArchivo(null);
    setError("");
    const fileInput = document.getElementById('nuevo-archivo');
    if (fileInput) fileInput.value = '';
  };

  const visualizarDocumento = async (archivo) => {
  try {
    console.log('🔍 Visualizando documento del historial:', archivo);

    if (!archivo || !archivo.id) {
      console.error('❌ Archivo no válido:', archivo);
      alert('❌ No se puede visualizar este documento. El archivo no es válido.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ No hay sesión activa. Por favor, inicie sesión nuevamente.');
      return;
    }

    const urlDescarga = `http://localhost:8000/api/documentos/descargar/${archivo.id}`;
    console.log('🔗 Solicitando documento:', urlDescarga);

    const response = await fetch(urlDescarga, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    console.log('📡 Respuesta del servidor:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('El documento sigue pendiente a revision');
      } else if (response.status === 403) {
        throw new Error('No tiene permisos para ver este documento');
      } else {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('El documento está vacío o no se pudo cargar');
    }

    const url = window.URL.createObjectURL(blob);
    console.log('✅ Documento cargado exitosamente, abriendo...');
    
    // Abrir en nueva pestaña
    const nuevaVentana = window.open(url, '_blank');
    
    if (!nuevaVentana) {
      // Si el popup fue bloqueado, ofrecer descarga
      alert('La ventana emergente fue bloqueada. El documento se descargará automáticamente.');
      const link = document.createElement('a');
      link.href = url;
      link.download = archivo.nombre_archivo || `documento_${archivo.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
  } catch (error) {
    console.error('💥 Error visualizando documento:', error);
    alert(`❌ Error al visualizar el documento: ${error.message}`);
  }
};

const getEstadoArchivo = (archivo) => {
  if (archivo.es_actual) return "🟢 Actual";
  if (archivo.fecha_expiracion) {
    const fechaExp = new Date(archivo.fecha_expiracion);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaExp - hoy) / (1000 * 60 * 60 * 24));
      
    if (diasRestantes <= 15 && diasRestantes > 0) return `🟡 Se borra en ${diasRestantes} días`;
    if (diasRestantes <= 0) return "🔴 Expirado";
  }
  return "⚫ Pendiente";
};

if (!isOpen) return null;

return (
  <div className="modal-overlay">
    <div className="modal-content compact-modal">
      <div className="modal-header">
        <h2>Instituto Tecnológico de Ciudad Valles</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="modal-body compact-body">
        <div className="compact-section">
          <h3>📁 Historial de Archivos - {documento?.nombre}</h3>
          {cargando ? (
            <div className="cargando-historial">🔄 Cargando historial...</div>
          ) : historial.length > 0 ? (
              <div className="historial-content">
                <div className="archivos-grid">
                  {historial.map((archivo, index) => (
                    <div key={archivo.id || index} className={`archivo-compact ${archivo.es_actual ? 'archivo-actual' : ''}`}>
                      <div className="archivo-icon">📄</div>
                      <div className="archivo-info-compact">
                        <div className="archivo-nombre">
                          {archivo.nombre_archivo}
                        </div>
                        <div className="archivo-fecha">
                          📅 {new Date(archivo.created_at).toLocaleDateString('es-MX')}
                        </div>
                        <div className="archivo-estado">
                          {getEstadoArchivo(archivo)}
                        </div>
                      </div>
                      <button 
                        className="btn-visualizar"
                        onClick={() => visualizarDocumento(archivo)}
                        title="Visualizar PDF"
                      >
                        👁️ Ver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sin-historial">
                📭 No hay historial de archivos
              </div>
            )}
          </div>

          <div className="compact-section">
          <h3>📤 Nuevo Archivo</h3>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="upload-area-compact">
            {/* ✅ Input file OCULTO - solo funciona mediante el label */}
            <input
              type="file"
              id="nuevo-archivo"
              onChange={handleFileChange}
              accept=".pdf"
              className="file-input" /* ← Asegúrate de que tenga esta clase */
            />
            
            {/* ✅ Solo se muestra el botón personalizado */}
            {!nuevoArchivo ? (
              <label htmlFor="nuevo-archivo" className="upload-btn-compact">
                <span>📎 Seleccionar Archivo PDF</span>
              </label>
            ) : (
              <div className="file-selected-compact valid-file">
                <div className="file-details">
                  <span className="file-name-compact">
                    📄 {nuevoArchivo.name}
                  </span>
                  <span className="file-size-compact">
                    ({(nuevoArchivo.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <button 
                  className="btn-eliminar-compact"
                  onClick={handleEliminarSeleccion}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="file-requirements">
            <h4>📋 Requisitos:</h4>
            <ul>
              <li>✅ Formato: PDF (.pdf)</li>
              <li>✅ Tamaño máximo: 1MB</li>
              <li>⚠️ El archivo anterior se eliminará en 15 días, se recomienda descargarlo si aun lo utiliza</li>
            </ul>
          </div>
        </div>
        </div>

        <div className="modal-footer compact-footer">
          <button className="btn-cancelar" onClick={onClose}>
            Cancelar
          </button>
          <button 
            className="btn-subir" 
            onClick={handleSubmit}
            disabled={!nuevoArchivo}
          >
            📤 Subir Archivo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActualizarArchivoModal;