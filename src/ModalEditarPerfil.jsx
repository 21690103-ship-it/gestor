import React, { useState } from "react";
import "./ModalEditarPerfil.css";

const ModalEditarPerfil = ({ isOpen, onClose, usuario, onActualizarPerfil }) => {
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    ape_pat: usuario?.ape_pat || "",
    ape_mat: usuario?.ape_mat || "",
    RFC: usuario?.RFC || "",
    correo: usuario?.correo || "",
    contraseña: "",
    confirmarContraseña: ""
  });
  
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarContraseña, setMostrarContraseña] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convertir RFC a mayúsculas automáticamente
    if (name === "RFC") {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError("");
  };

  const validarFormulario = () => {
    // Validar nombre
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    
    // Validar apellido paterno
    if (!formData.ape_pat.trim()) {
      setError("El apellido paterno es obligatorio");
      return false;
    }
    
    // Validar RFC
    if (!formData.RFC.trim()) {
      setError("El RFC es obligatorio");
      return false;
    }
    
    // Validar formato de RFC (opcional, pero recomendado)
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (formData.RFC.trim() && !rfcRegex.test(formData.RFC.trim())) {
      setError("El formato del RFC no es válido");
      return false;
    }
    
    // Validar correo electrónico
    if (!formData.correo.trim()) {
      setError("El correo electrónico es obligatorio");
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      setError("Ingrese un correo electrónico válido");
      return false;
    }
    
    // El apellido materno puede quedar vacío, así que no lo validamos
    
    // Validar contraseña solo si se ingresó una nueva
    if (formData.contraseña || formData.confirmarContraseña) {
      if (formData.contraseña.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return false;
      }
      if (formData.contraseña !== formData.confirmarContraseña) {
        setError("Las contraseñas no coinciden");
        return false;
      }
    }
    
    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validarFormulario()) return;

  setCargando(true);
  try {
    // Preparar datos para enviar
    const datosActualizados = {
      nombre: formData.nombre.trim(),
      ape_pat: formData.ape_pat.trim(),
      RFC: formData.RFC.trim(),
      correo: formData.correo.trim()
    };
    
    // ✅ ENVIAR null en lugar de string vacío
    if (formData.ape_mat && formData.ape_mat.trim()) {
      datosActualizados.ape_mat = formData.ape_mat.trim();
    } else {
      datosActualizados.ape_mat = null; // Enviar null en lugar de string vacío
    }
    
    // Solo incluir contraseña si se cambió
    if (formData.contraseña) {
      datosActualizados.contraseña = formData.contraseña;
    }
    
    await onActualizarPerfil(datosActualizados);
    
    onClose();
    
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    setError(error.message || "Error al actualizar el perfil");
  } finally {
    setCargando(false);
  }
};

  const handleCerrar = () => {
    setFormData({
      nombre: usuario?.nombre || "",
      ape_pat: usuario?.ape_pat || "",
      ape_mat: usuario?.ape_mat || "",
      RFC: usuario?.RFC || "",
      correo: usuario?.correo || "",
      contraseña: "",
      confirmarContraseña: ""
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-perfil" onClick={handleCerrar}>
      <div className="modal-content-perfil" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-perfil">
          <h2>✏️ Editar Perfil</h2>
          <button className="modal-close-btn-perfil" onClick={handleCerrar}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-perfil">
          {error && (
            <div className="error-message-perfil">
              ❌ {error}
            </div>
          )}

          <div className="form-grid-perfil">
            <div className="form-group-perfil">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingrese su nombre"
                required
              />
            </div>

            <div className="form-group-perfil">
              <label>Apellido Paterno *</label>
              <input
                type="text"
                name="ape_pat"
                value={formData.ape_pat}
                onChange={handleChange}
                placeholder="Ingrese su apellido paterno"
                required
              />
            </div>

            <div className="form-group-perfil">
              <label>Apellido Materno</label> {/* Quitado el asterisco */}
              <input
                type="text"
                name="ape_mat"
                value={formData.ape_mat}
                onChange={handleChange}
                placeholder="Ingrese su apellido materno (opcional)"
              />
            </div>

            <div className="form-group-perfil">
              <label>RFC *</label>
              <input
                type="text"
                name="RFC"
                value={formData.RFC}
                onChange={handleChange}
                placeholder="Ingrese su RFC (13 caracteres)"
                required
                maxLength="13"
                className="input-rfc"
              />
            </div>

            <div className="form-group-perfil">
              <label>Correo Electrónico *</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div className="form-group-perfil full-width">
              <div className="password-header">
                <label>Nueva Contraseña (opcional)</label>
                <button 
                  type="button"
                  className="btn-mostrar-contrasena"
                  onClick={() => setMostrarContraseña(!mostrarContraseña)}
                >
                  {mostrarContraseña ? "👁️ Ocultar" : "👁️ Mostrar"}
                </button>
              </div>
              <input
                type={mostrarContraseña ? "text" : "password"}
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                placeholder="Dejar en blanco para no cambiar"
                minLength="6"
              />
              <small className="password-hint">
                Mínimo 6 caracteres. Solo completar si desea cambiar la contraseña.
              </small>
            </div>

            <div className="form-group-perfil full-width">
              <label>Confirmar Nueva Contraseña</label>
              <input
                type={mostrarContraseña ? "text" : "password"}
                name="confirmarContraseña"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                placeholder="Confirmar nueva contraseña"
                minLength="6"
              />
            </div>
          </div>

          <div className="form-info-perfil">
            <p><strong>Nota:</strong></p>
            <ul>
              <li>Los campos marcados con * son obligatorios</li>
              <li>El apellido materno es opcional</li>
              <li>El RFC se guardará automáticamente en MAYÚSCULAS</li>
              <li>Dejar los campos de contraseña en blanco para no cambiarla</li>
              <li>Los cambios pueden tardar unos minutos en reflejarse</li>
            </ul>
          </div>
        </form>

        <div className="modal-footer-perfil">
          <button 
            type="button" 
            className="btn-cancelar-perfil" 
            onClick={handleCerrar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-guardar-perfil" 
            onClick={handleSubmit}
            disabled={cargando}
          >
            {cargando ? '🔄 Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarPerfil;