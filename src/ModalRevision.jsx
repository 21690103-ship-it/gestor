import React, { useState } from "react";
import "./ModalRevision.css";

const ModalRevision = ({ isOpen, onClose, documento, onDecision }) => {
  const [comentario, setComentario] = useState("");
  const [procesando, setProcesando] = useState(false);

  const getNombreCompleto = (usuario) => {
    return `${usuario.nombre} ${usuario.ape_pat} ${usuario.ape_mat}`.trim();
  };

  const getTipoDocumentoTexto = (tipo) => {
    const tipos = {
      'acta_nacimiento': 'Acta de Nacimiento',
      'comp_dom': 'Comprobante de Domicilio',
      'cartilla': 'Cartilla Militar',
      'curp': 'CURP',
      'ine': 'INE "Instituto Nacional Electoral"',
      'csf': 'Constancia de Situación Fiscal',
      'cdp': 'Constancia de Declaracion Patrimonial',
      'cni': 'Constancia de No Inhabilitación',
      'cv': 'Curriculum Vitae',
      'ugs': 'Último Grado de Estudios'
    };
    return tipos[tipo] || tipo;
  };

  const handleAprobar = async () => {
    setProcesando(true);
    try {
      await onDecision('aprobar', comentario);
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async () => {
    setProcesando(true);
    try {
      await onDecision('rechazar', comentario);
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrar = () => {
    setComentario("");
    onClose();
  };

  if (!isOpen || !documento) return null;

  return (
    <div className="modal-overlay-revision">
      <div className="modal-content-revision">
        <div className="modal-header-revision">
          <h2>📝 Revisar Documento</h2>
          <button className="close-btn-revision" onClick={handleCerrar}>×</button>
        </div>

        <div className="modal-body-revision">
          {/* Información del documento */}
          <div className="documento-info-revision">
            <div className="info-item">
              <label>Tipo de Documento:</label>
              <span>{getTipoDocumentoTexto(documento.tipo_documento)}</span>
            </div>
            <div className="info-item">
              <label>Usuario:</label>
              <span>{getNombreCompleto(documento.usuario)}</span>
            </div>
            <div className="info-item">
              <label>Correo:</label>
              <span>{documento.usuario.correo}</span>
            </div>
            <div className="info-item">
              <label>Archivo:</label>
              <span>{documento.nombre_archivo}</span>
            </div>
            <div className="info-item">
              <label>Fecha de Subida:</label>
              <span>{new Date(documento.created_at).toLocaleDateString('es-MX')}</span>
            </div>
          </div>

          {/* Comentario */}
          <div className="comentario-section">
            <label htmlFor="comentario">Comentario (opcional):</label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe un comentario para el usuario..."
              rows="4"
              className="comentario-textarea"
            />
            <small>Este comentario se incluirá en el correo de notificación</small>
          </div>
        </div>

        <div className="modal-footer-revision">
          <button 
            className="btn-cancelar-revision"
            onClick={handleCerrar}
            disabled={procesando}
          >
            Cancelar
          </button>
          <div className="decision-buttons">
            <button 
              className="btn-rechazar"
              onClick={handleRechazar}
              disabled={procesando}
            >
              {procesando ? 'Procesando...' : '❌ Rechazar'}
            </button>
            <button 
              className="btn-aprobar"
              onClick={handleAprobar}
              disabled={procesando}
            >
              {procesando ? 'Procesando...' : '✅ Aprobar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRevision;