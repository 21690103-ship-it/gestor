// src/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { authService } from "./services/authService";
import ModalRecuperarContraseña from "./ModalRecuperarContraseña";

const Login = () => {
  const [RFC, setRFC] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarModalRecuperacion, setMostrarModalRecuperacion] = useState(false);
  const navigate = useNavigate();

  const handleRFCChange = (e) => {
    const valor = e.target.value;
    const rfcMayusculas = valor.toUpperCase().replace(/\s/g, '');
    setRFC(rfcMayusculas);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!RFC || !contraseña) {
      setMensaje("❌ Por favor, complete todos los campos");
      return;
    }

    setIsLoading(true);
    setMensaje("");

    try {
      const response = await authService.login(RFC, contraseña);
      
      if (response.data.success) {
        setMensaje(`✅ ${response.data.message}`);
        
        setTimeout(() => {
          const userData = response.data.user;
          if (userData.id_cargo === 1) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                        "❌ Error de conexión. Intente nuevamente.";
      setMensaje(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperarContraseña = async (datos) => {
    try {
      const resultado = await authService.manejarRecuperacion(datos);
      return resultado;
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="header-left">
          <div className="logo"> </div>
          <div>
            <h3 className="titulo">TecNM Instituto Tecnológico de Ciudad Valles</h3>
          </div>
        </div>
        <div className="header-right">
          <h3>Sistema de Control Documental</h3>
        </div>
      </header>

      <div className="login-container">
        <h2>INICIO DE SESIÓN</h2>
        
        <form onSubmit={onSubmit}>
          <label>RFC:</label>
          <input
            type="text"
            value={RFC}
            onChange={handleRFCChange}
            placeholder="Ingrese su RFC"
            disabled={isLoading}
            required
            style={{ textTransform: 'uppercase' }}
          />

          <label>Contraseña:</label>
          <input
            type="password"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            placeholder="INGRESE SU CONTRASEÑA"
            disabled={isLoading}
            required
          />

          <div className="forgot-password-link">
            <button 
              type="button" 
              className="btn-olvido-contrasena"
              onClick={() => setMostrarModalRecuperacion(true)}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#0066cc',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '0',
                fontSize: '14px',
                margin: '10px 0',
                display: 'block',
                width: '100%',
                textAlign: 'center'
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "CARGANDO..." : "INICIAR SESIÓN"}
          </button>
        </form>

        {mensaje && (
          <p className={`login-message ${mensaje.includes('✅') ? 'success' : 'error'}`}>
            {mensaje}
          </p>
        )}
      </div>

      <ModalRecuperarContraseña
        isOpen={mostrarModalRecuperacion}
        onClose={() => setMostrarModalRecuperacion(false)}
        onRecuperarContraseña={handleRecuperarContraseña}
      />
    </div>
  );
};

export default Login;