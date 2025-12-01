import React, { useState } from "react";
import "./ModalRecuperarContraseña.css";

const ModalRecuperarContraseña = ({ isOpen, onClose, onRecuperarContraseña }) => {
  const [paso, setPaso] = useState(1);
  const [RFC, setRFC] = useState("");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleRFCChange = (e) => {
    const valor = e.target.value;
    setRFC(valor.toUpperCase().replace(/\s/g, ''));
    setError("");
  };

const handleSolicitarCodigo = async () => {
  if (!RFC.trim() || !correo.trim()) {
    setError("Por favor ingrese RFC y correo electrónico");
    return;
  }

  if (!correo.includes('@')) {
    setError("Por favor ingrese un correo válido");
    return;
  }

  setCargando(true);
  setError("");
  
  try {
    const resultado = await onRecuperarContraseña({
      RFC,
      correo,
      accion: "solicitar"
    });

    if (resultado.success) {
      setMensaje("✅ Código enviado a su correo electrónico");
      setTimeout(() => {
        setPaso(2);
        setMensaje("");
      }, 1500);
    } else {
      setError(resultado.message || "Error al solicitar recuperación");
    }
  } catch (err) {
    setError(err.message || "Error al procesar la solicitud");
  } finally {
    setCargando(false);
  }
};

  const handleVerificarCodigo = async () => {
    if (!codigo.trim() || codigo.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setCargando(true);
    setError("");
    
    try {
      const resultado = await onRecuperarContraseña({
        RFC,
        codigo,
        accion: "verificar"
      });

      if (resultado.success) {
        setMensaje("✅ Código verificado correctamente");
        setTimeout(() => {
          setPaso(3);
          setMensaje("");
        }, 1500);
      } else {
        setError(resultado.message || "Código incorrecto");
      }
    } catch (err) {
      setError(err.message || "Error al verificar el código");
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarContraseña = async () => {
    if (!nuevaContraseña.trim() || nuevaContraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    setError("");
    
    try {
      const resultado = await onRecuperarContraseña({
        RFC,
        codigo,
        nuevaContraseña,
        accion: "cambiar"
      });

      if (resultado.success) {
        setMensaje("✅ Contraseña cambiada exitosamente");
        setTimeout(() => {
          onClose();
          setPaso(1);
          setRFC("");
          setCorreo("");
          setCodigo("");
          setNuevaContraseña("");
          setConfirmarContraseña("");
          setMensaje("");
        }, 2000);
      } else {
        setError(resultado.message || "Error al cambiar la contraseña");
      }
    } catch (err) {
      setError(err.message || "Error al procesar el cambio");
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    onClose();
    setPaso(1);
    setRFC("");
    setCorreo("");
    setCodigo("");
    setNuevaContraseña("");
    setConfirmarContraseña("");
    setMensaje("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-recuperacion" onClick={handleCerrar}>
      <div className="modal-content-recuperacion" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-recuperacion">
          <h2>🔐 Recuperar Contraseña</h2>
          <button className="modal-close-btn-recuperacion" onClick={handleCerrar}>×</button>
        </div>

        <div className="modal-body-recuperacion">
          {mensaje && <div className="mensaje-exito-recuperacion">{mensaje}</div>}
          {error && <div className="error-recuperacion">❌ {error}</div>}

          {paso === 1 && (
            <div className="paso-solicitud">
              <p>Ingrese su RFC y correo electrónico para enviar un código de verificación.</p>
              
              <div className="form-group-recuperacion">
                <label>RFC *</label>
                <input
                  type="text"
                  value={RFC}
                  onChange={handleRFCChange}
                  placeholder="Ingrese su RFC"
                  required
                  style={{ textTransform: 'uppercase' }}
                  disabled={cargando}
                />
              </div>

              <div className="form-group-recuperacion">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={cargando}
                />
              </div>

              <button 
                className="btn-continuar-recuperacion"
                onClick={handleSolicitarCodigo}
                disabled={cargando}
              >
                {cargando ? "Enviando..." : "Enviar Código"}
              </button>
            </div>
          )}

          {paso === 2 && (
            <div className="paso-codigo">
              <p>Se ha enviado un código de 6 dígitos a su correo electrónico. Por favor ingréselo.</p>
              
              <div className="form-group-recuperacion">
                <label>Código de Verificación *</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  required
                  disabled={cargando}
                />
                <small>Ingrese el código de 6 dígitos recibido</small>
              </div>

              <div className="botones-paso">
                <button 
                  className="btn-volver-recuperacion"
                  onClick={() => setPaso(1)}
                  disabled={cargando}
                >
                  ← Volver
                </button>
                <button 
                  className="btn-continuar-recuperacion"
                  onClick={handleVerificarCodigo}
                  disabled={cargando}
                >
                  {cargando ? "Verificando..." : "Verificar Código"}
                </button>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="paso-nueva-contrasena">
              <p>Ingrese su nueva contraseña.</p>
              
              <div className="form-group-recuperacion">
                <label>Nueva Contraseña *</label>
                <input
                  type="password"
                  value={nuevaContraseña}
                  onChange={(e) => setNuevaContraseña(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={cargando}
                />
              </div>

              <div className="form-group-recuperacion">
                <label>Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  value={confirmarContraseña}
                  onChange={(e) => setConfirmarContraseña(e.target.value)}
                  placeholder="Repita la contraseña"
                  required
                  disabled={cargando}
                />
              </div>

              <div className="botones-paso">
                <button 
                  className="btn-volver-recuperacion"
                  onClick={() => setPaso(2)}
                  disabled={cargando}
                >
                  ← Volver
                </button>
                <button 
                  className="btn-continuar-recuperacion"
                  onClick={handleCambiarContraseña}
                  disabled={cargando}
                >
                  {cargando ? "Cambiando..." : "Cambiar Contraseña"}
                </button>
              </div>
            </div>
          )}

          <div className="info-recuperacion">
            <p><strong>Nota:</strong></p>
            <ul>
              <li>El código de verificación tiene una validez de 15 minutos</li>
              <li>Verifique su carpeta de spam si no recibe el correo</li>
              <li>Si tiene problemas, contacte al administrador del sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRecuperarContraseña;