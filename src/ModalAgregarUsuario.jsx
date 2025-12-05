import React, { useState } from "react";
import "./ModalAgregarUsuario.css";

const ModalAgregarUsuario = ({ isOpen, onClose, onAgregarUsuario }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    ape_pat: "",
    ape_mat: "",
    RFC: "",
    correo: "",
    genero: "masculino",
    contraseña: "",
    confirmarContraseña: ""
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    if (!formData.ape_pat.trim()) {
      setError("El apellido paterno es obligatorio");
      return false;
    }
    if (!formData.RFC.trim()) {
      setError("El RFC es obligatorio");
      return false;
    }
    if (!formData.correo.trim()) {
      setError("El correo electrónico es obligatorio");
      return false;
    }
    if (!formData.contraseña) {
      setError("La contraseña es obligatoria");
      return false;
    }
    if (formData.contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (formData.contraseña !== formData.confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setCargando(true);
    try {
      await onAgregarUsuario({
        nombre: formData.nombre.trim(),
        ape_pat: formData.ape_pat.trim(),
        ape_mat: formData.ape_mat.trim(),
        RFC: formData.RFC.trim(),
        correo: formData.correo.trim(),
        genero: formData.genero,
        contraseña: formData.contraseña,
        id_cargo: 2
      });
      
      setFormData({
        nombre: "",
        ape_pat: "",
        ape_mat: "",
        RFC: "",
        correo: "",
        genero: "masculino",
        contraseña: "",
        confirmarContraseña: ""
      });
    } catch (error) {
      console.error('Error en el formulario:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setFormData({
      nombre: "",
      ape_pat: "",
      ape_mat: "",
      RFC: "",
      correo: "",
      genero: "masculino",
      contraseña: "",
      confirmarContraseña: ""
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content agregar-usuario-modal">
        <div className="modal-header">
          <h2>Agregar Usuario</h2>
          <button className="modal-close-btn" onClick={handleCerrar}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-content">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellido Paterno *</label>
                  <input
                    type="text"
                    name="ape_pat"
                    value={formData.ape_pat}
                    onChange={handleChange}
                    placeholder="Apellido paterno"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellido Materno *</label>
                  <input
                    type="text"
                    name="ape_mat"
                    value={formData.ape_mat}
                    onChange={handleChange}
                    placeholder="Apellido materno"
                  />
                </div>

                <div className="form-group">
                  <label>Género *</label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    required
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>RFC *</label>
                  <input
                    type="text"
                    name="RFC"
                    value={formData.RFC}
                    onChange={handleChange}
                    placeholder="RFC"
                    required
                    maxLength="13"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    name="contraseña"
                    value={formData.contraseña}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>Confirmar Contraseña *</label>
                  <input
                    type="password"
                    name="confirmarContraseña"
                    value={formData.confirmarContraseña}
                    onChange={handleChange}
                    placeholder="Confirmar contraseña"
                    required
                    minLength="6"
                  />
                </div>
              </div>

              <div className="form-info">
                <p>Información importante:</p>
                <ul>
                  <li>Todos los campos son obligatorios</li>
                  <li>La contraseña debe tener al menos 6 caracteres</li>
                </ul>
              </div>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-cancelar" 
            onClick={handleCerrar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-agregar" 
            onClick={handleSubmit}
            disabled={cargando}
          >
            {cargando ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregarUsuario;