import React from "react";
import "./ModalDocumentosUsuario.css";

const ModalDocumentosUsuario = ({
  isOpen,
  onClose,
  usuario,
  documentos,
  cargando,
  onDescargar,
  onVisualizar,
  getNombreCompleto,
  getTipoDocumentoTexto,
  getEstadoDocumentoTexto
}) => {
  if (!isOpen) return null;

  const ordenDocumentos = [
    'acta_nacimiento',
    'comp_dom', 
    'cartilla',
    'curp',
    'ine',
    'csf',
    'cdp',
    'cni',
    'cv',
    'ugs'
  ];

  const documentosOrdenados = [...documentos].sort((a, b) => {
    const indexA = ordenDocumentos.indexOf(a.tipo_documento);
    const indexB = ordenDocumentos.indexOf(b.tipo_documento);
    return indexA - indexB;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content documentos-usuario-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📁 Documentos de {usuario ? getNombreCompleto(usuario) : 'Usuario'}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {cargando ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando documentos...</p>
            </div>
          ) : documentosOrdenados.length === 0 ? (
            <div className="sin-documentos">
              <div className="sin-documentos-icon">📭</div>
              <h3>No hay documentos</h3>
              <p>El usuario no tiene documentos en el sistema.</p>
            </div>
          ) : (
            <div className="documentos-grid">
              {documentosOrdenados.map((documento) => (
                <div key={documento.id} className="documento-card">
                  <div className="documento-header">
                    <h4>{getTipoDocumentoTexto(documento.tipo_documento)}</h4>
                    <div className="documento-estados">
                      <span className={`estado-badge estado-${documento.estado}`}>
                        {getEstadoDocumentoTexto(documento.estado)}
                      </span>
                      {documento.es_actual && (
                        <span className="badge-actual">🟢 Actual</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="documento-info">
                    <p className="nombre-archivo">
                      <strong>📄 Archivo:</strong> {documento.nombre_archivo}
                    </p>
                    <p className="fecha-subida">
                      <strong>📅 Subido:</strong> {new Date(documento.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {documento.revisado_at && (
                      <p className="fecha-revision">
                        <strong>👁️ Revisado:</strong> {new Date(documento.revisado_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  <div className="documento-actions">
                    <button 
                      className="btn-visualizar"
                      onClick={() => onVisualizar(documento.id)}
                      title="Visualizar documento"
                      disabled={documento.estado === 'rechazado'}
                    >
                      👁️ Visualizar
                    </button>
                    <button 
                      className="btn-descargar"
                      onClick={() => onDescargar(documento.id, documento.nombre_archivo)}
                      title="Descargar documento"
                    >
                      ⬇️ Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDocumentosUsuario;