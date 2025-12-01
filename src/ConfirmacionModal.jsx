import React from "react";
import "./ConfirmacionModal.css";

/**
 * Modal de confirmación para cerrar sesión
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Controla si el modal está abierto
 * @param {function} props.onClose - Función para cerrar el modal
 * @param {function} props.onConfirm - Función para confirmar la acción
 * @param {string} props.tipo - Tipo de confirmación: "simple" o "cambios"
 */
const ConfirmacionModal = ({ isOpen, onClose, onConfirm, tipo = "simple" }) => {
  if (!isOpen) return null;

  /**
   * Renderiza el contenido según el tipo de confirmación
   */
  const renderContenido = () => {
    switch (tipo) {
      case "cambios":
        return {
          titulo: "⚠️ Cambios No Guardados",
          mensaje: "Tienes documentos que no han sido guardados en el servidor. ¿Qué deseas hacer?",
          mostrarOpciones: true
        };
      
      case "simple":
      default:
        return {
          titulo: "🔒 Cerrar Sesión",
          mensaje: "¿Estás seguro de que deseas cerrar sesión?",
          mostrarOpciones: false
        };
    }
  };

  const contenido = renderContenido();

  return (
    <div className="confirmacion-overlay" onClick={onClose}>
      <div className="confirmacion-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="confirmacion-header">
          <h2>{contenido.titulo}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Cuerpo del modal */}
        <div className="confirmacion-body">
          <p>{contenido.mensaje}</p>
          
          {contenido.mostrarOpciones && (
            <div className="advertencia-cambios">
              <div className="icono-advertencia">⚠️</div>
              <div className="texto-advertencia">
                <strong>Advertencia:</strong> Si cierras sesión sin guardar, podrías perder los documentos recientemente subidos.
              </div>
            </div>
          )}
        </div>

        {/* Footer del modal con botones de acción */}
        <div className="confirmacion-footer">
          {contenido.mostrarOpciones ? (
            <>
              <button className="btn-cancelar" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn-continuar" onClick={onClose}>
                Continuar Editando
              </button>
              <button className="btn-confirmar" onClick={onConfirm}>
                Cerrar Sin Guardar
              </button>
            </>
          ) : (
            <>
              <button className="btn-cancelar" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={onConfirm}>
                Sí, Cerrar Sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionModal;