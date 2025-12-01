import React from "react";
import "./ModalConfirmacion.css";

const ModalConfirmacion = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo = "Confirmar Acción",
  mensaje = "¿Estás seguro de que deseas realizar esta acción?",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  tipo = "normal" // normal, peligro, advertencia
}) => {
  if (!isOpen) return null;

  const getColorBoton = () => {
    switch (tipo) {
      case 'peligro':
        return '#dc3545';
      case 'advertencia':
        return '#dc3545';
      default:
        return '#007bff';
    }
  };

  const getIcono = () => {
    switch (tipo) {
      case 'peligro':
        return '⚠️';
      case 'advertencia':
        return '🔔';
      default:
        return '❓';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content confirmacion-modal">
        <div className="modal-header">
          <h2>{getIcono()} {titulo}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="confirmacion-content">
            <div className="confirmacion-icon">
              {getIcono()}
            </div>
            <div className="confirmacion-mensaje">
              <p>{mensaje}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-cancelar" 
            onClick={onClose}
          >
            {textoCancelar}
          </button>
          <button 
            className="btn-confirmar" 
            onClick={onConfirm}
            style={{ backgroundColor: getColorBoton() }}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;