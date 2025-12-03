import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usuarioService } from "./services/usuarioService";
import { documentoService } from "./services/documentoService";
import ModalRevision from "./ModalRevision";
import ModalDocumentosUsuario from "./ModalDocumentosUsuario";
import ModalAgregarUsuario from "./ModalAgregarUsuario";
import ModalConfirmacion from "./ModalConfirmacion";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [userData] = useState(() => {
    const storedData = localStorage.getItem('user_data');
    return storedData ? JSON.parse(storedData) : {};
  });

  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [documentosPendientes, setDocumentosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vistaActual, setVistaActual] = useState("usuarios");
  const [modalRevisionAbierto, setModalRevisionAbierto] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);
  const [modalDocumentosAbierto, setModalDocumentosAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [documentosUsuario, setDocumentosUsuario] = useState([]);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);
  const [modalAgregarUsuarioAbierto, setModalAgregarUsuarioAbierto] = useState(false);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const [, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const verificarAutenticacionYCargarDatos = async () => {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      console.log('🔐 Verificando autenticación:', {
        token: token ? 'PRESENTE' : 'AUSENTE',
        userData: userData,
        esAdmin: userData.id_cargo === 1
      });

      if (!token) {
        console.error('❌ No hay token, redirigiendo al login...');
        navigate("/");
        return;
      }

      if (userData.id_cargo !== 1) {
        console.warn('⚠️ Usuario no es administrador, redirigiendo...');
        navigate("/dashboard");
        return;
      }

      // Cargar datos iniciales
      try {
        setLoading(true);
        setError(null);
        
        console.log('📥 Cargando datos iniciales para admin...');

        // Cargar usuarios
        const responseUsuarios = await usuarioService.obtenerClientes();
        console.log('👥 Respuesta de usuarios:', responseUsuarios.data);
        
        if (responseUsuarios.data.success) {
          setUsuarios(responseUsuarios.data.usuarios || []);
        } else {
          console.error('❌ Error en respuesta de usuarios:', responseUsuarios.data);
        }

        // Cargar documentos pendientes
        try {
          console.log('📋 Solicitando documentos pendientes...');
          
          const response = await documentoService.obtenerPendientes();
          console.log('✅ Respuesta de documentos pendientes:', {
            success: response.data.success,
            total: response.data.pendientes?.length,
            datos: response.data
          });
          
          if (response.data.success) {
            setDocumentosPendientes(response.data.pendientes || []);
            console.log(`📄 Documentos pendientes cargados: ${response.data.pendientes?.length || 0}`);
          } else {
            console.error('❌ Error en respuesta de pendientes:', response.data);
            setDocumentosPendientes([]);
          }
        } catch (error) {
          console.error('💥 Error cargando documentos pendientes:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
          
          if (error.response?.status === 401) {
            console.log('🔒 Sesión expirada en documentos pendientes...');
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            navigate("/");
            return;
          }
          
          setDocumentosPendientes([]);
        }
        
      } catch (error) {
        console.error('❌ Error cargando datos:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 401) {
          console.log('🔒 Sesión expirada, limpiando datos...');
          localStorage.removeItem('token');
          localStorage.removeItem('user_data');
          navigate("/");
          return;
        }
        
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    verificarAutenticacionYCargarDatos();
  }, [navigate]);

  const getNombreCompleto = (usuario) => {
    return `${usuario.nombre} ${usuario.ape_pat} ${usuario.ape_mat}`.trim();
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    getNombreCompleto(usuario).toLowerCase().includes(busqueda.toLowerCase()) ||
    (usuario.RFC && usuario.RFC.toLowerCase().includes(busqueda.toLowerCase())) ||
    (usuario.correo && usuario.correo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const cargarDocumentosPendientes = async () => {
    try {
      console.log('📋 Solicitando documentos pendientes...');
      
      const response = await documentoService.obtenerPendientes();
      console.log('✅ Respuesta de documentos pendientes:', {
        success: response.data.success,
        total: response.data.pendientes?.length,
        datos: response.data
      });
      
      if (response.data.success) {
        setDocumentosPendientes(response.data.pendientes || []);
        console.log(`📄 Documentos pendientes cargados: ${response.data.pendientes?.length || 0}`);
      } else {
        console.error('❌ Error en respuesta de pendientes:', response.data);
        setDocumentosPendientes([]);
      }
    } catch (error) {
      console.error('💥 Error cargando documentos pendientes:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        console.log('🔒 Sesión expirada en documentos pendientes...');
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        navigate("/");
        return;
      }
      
      setDocumentosPendientes([]);
    }
  };

  const handleAgregarUsuario = async (nuevoUsuario) => {
    try {
      console.log('👤 Intentando agregar nuevo usuario:', nuevoUsuario);
      
      const resultado = await usuarioService.crearUsuario(nuevoUsuario);
      
      console.log('✅ Respuesta del backend:', resultado);
      
      if (resultado.success) {
        alert('✅ Usuario agregado correctamente');
        setModalAgregarUsuarioAbierto(false);
        
        // Recargar usuarios después de agregar uno nuevo
        const responseUsuarios = await usuarioService.obtenerClientes();
        if (responseUsuarios.data.success) {
          setUsuarios(responseUsuarios.data.usuarios || []);
        }
      } else {
        alert(`❌ Error: ${resultado.message}`);
      }
    } catch (error) {
      console.error('💥 Error agregando usuario:', {
        message: error.message,
        errorCompleto: error
      });
      alert(`❌ Error al agregar el usuario: ${error.message}`);
    }
  };

  const handleEliminarUsuario = async (usuario) => {
    try {
      console.log('🗑️ Eliminando usuario y todos sus documentos:', usuario.id);
      
      const resultado = await usuarioService.eliminarUsuario(usuario.id);
      
      console.log('✅ Respuesta eliminar usuario completo:', resultado);
      
      if (resultado.success) {
        let mensaje = resultado.message;
        
        alert(mensaje);
        setModalConfirmacionAbierto(false);
        setUsuarioAEliminar(null);
        
        // Recargar usuarios después de eliminar
        const responseUsuarios = await usuarioService.obtenerClientes();
        if (responseUsuarios.data.success) {
          setUsuarios(responseUsuarios.data.usuarios || []);
        }
      } else {
        alert(`❌ Error: ${resultado.message}`);
      }
    } catch (error) {
      console.error('💥 Error eliminando usuario:', error);
      alert(`❌ Error al eliminar el usuario: ${error.message}`);
    }
  };

  const solicitarEliminarUsuario = (usuario) => {
    setUsuarioAEliminar(usuario);
    setModalConfirmacionAbierto(true);
  };

  const cancelarEliminacion = () => {
    setModalConfirmacionAbierto(false);
    setUsuarioAEliminar(null);
  };

  const cargarDocumentosUsuario = async (usuario) => {
    try {
      setCargandoDocumentos(true);
      setUsuarioSeleccionado(usuario);
      
      console.log('🔍 DEBUG - URL que se intenta acceder:', {
        baseURL: 'http://localhost:8000',
        ruta: `/api/admin/usuarios/${usuario.id}/documentos`,
        urlCompleta: `http://localhost:8000/api/admin/usuarios/${usuario.id}/documentos`,
        usuarioId: usuario.id
      });

      const documentos = await obtenerDocumentosUsuario(usuario.id);
      
      setDocumentosUsuario(documentos);
      setModalDocumentosAbierto(true);
      console.log('✅ Documentos cargados exitosamente:', documentos);
      
    } catch (error) {
      console.error('💥 Error cargando documentos usuario:', {
        message: error.message,
        usuario: usuario.id,
        errorCompleto: error
      });
      
      alert(`Error: ${error.message}. Verifica que la ruta exista en el backend.`);
    } finally {
      setCargandoDocumentos(false);
    }
  };

  const obtenerDocumentosUsuario = async (usuarioId) => {
    try {
      const token = localStorage.getItem('token');
      
      const url = `http://localhost:8000/api/admin/usuarios/${usuarioId}/documentos`;
      console.log('🔄 URL completa:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.documentos || [];
      } else {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('💥 Error obteniendo documentos:', error);
      throw error;
    }
  };

  const descargarDocumentoUsuario = async (documentoId, nombreArchivo) => {
    try {
      console.log('📥 Descargando documento usuario ID:', documentoId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/documentos/descargar/${documentoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error en la descarga');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const rfcUsuario = usuarioSeleccionado?.RFC ? usuarioSeleccionado.RFC.trim() : 'sin-rfc';
      const nombreDescarga = `${rfcUsuario} - ${nombreArchivo}`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreDescarga;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Documento descargado con nombre:', nombreDescarga);
      
    } catch (error) {
      console.error('❌ Error descargando documento:', error);
      alert('Error al descargar el documento: ' + error.message);
    }
  };

  const visualizarDocumentoUsuario = async (documentoId) => {
    try {
      console.log('👁️ Visualizando documento:', documentoId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/documentos/descargar/${documentoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el documento');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('❌ Error visualizando documento:', error);
      alert('Error al visualizar el documento: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    navigate("/");
  };

  const solicitarLogout = () => {
    setModalLogoutAbierto(true);
  };

  const handleVerArchivos = (usuario) => {
    cargarDocumentosUsuario(usuario);
  };

  const handleRevisarDocumento = (documento) => {
    setDocumentoSeleccionado(documento);
    setModalRevisionAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalRevisionAbierto(false);
    setDocumentoSeleccionado(null);
  };

  const handleCerrarModalDocumentos = () => {
    setModalDocumentosAbierto(false);
    setUsuarioSeleccionado(null);
    setDocumentosUsuario([]);
  };

  const manejarDescarga = (id) => {
    const token = localStorage.getItem('token');

    fetch(`http://localhost:8000/api/admin/documentos/descargar/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    })
    .catch(err => console.error("Error descargando PDF:", err));
  };

  const handleDecisionDocumento = async (decision, comentario) => {
    try {
      console.log(`🔄 Procesando documento: ${decision}`, {
        documentoId: documentoSeleccionado.id,
        comentario: comentario
      });

      if (decision === 'aprobar') {
        await documentoService.aprobarDocumento(documentoSeleccionado.id, comentario);
      } else {
        await documentoService.rechazarDocumento(documentoSeleccionado.id, comentario);
      }
      
      await cargarDocumentosPendientes();
      handleCerrarModal();
      
      alert(`✅ Documento ${decision === 'aprobar' ? 'aprobado' : 'rechazado'} correctamente`);
      
    } catch (error) {
      console.error('❌ Error procesando documento:', error);
      alert('❌ Error al procesar el documento');
    }
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

  const getEstadoDocumentoTexto = (estado) => {
    const estados = {
      'pendiente': '⏳ Pendiente',
      'aprobado': '✅ Aprobado',
      'rechazado': '❌ Rechazado'
    };
    return estados[estado] || estado;
  };

  const getGeneroTexto = (genero) => {
    const generos = {
      'masculino': '♂ Masculino',
      'femenino': '♀ Femenino'
    };
    return generos[genero] || 'No especificado';
  };

  // Renderizar vista móvil para usuarios
  const renderUsuariosMobile = () => (
    <div className="usuarios-cards-mobile">
      {usuariosFiltrados.map((usuario) => (
        <div key={usuario.id} className="usuario-card-mobile">
          <div className="usuario-info-mobile">
            <h4>{getNombreCompleto(usuario)}</h4>
            <p><strong>RFC:</strong> {usuario.RFC || 'N/A'}</p>
            <p><strong>Correo:</strong> {usuario.correo || 'N/A'}</p>
            <p><strong>Género:</strong> {getGeneroTexto(usuario.genero)}</p>
          </div>
          <div className="acciones-mobile">
            <button 
              className="btn-ver-archivos"
              onClick={() => handleVerArchivos(usuario)}
              disabled={cargandoDocumentos}
            >
              {cargandoDocumentos ? '📁 Cargando...' : '📁 Documentos'}
            </button>
            <button 
              className="btn-eliminar-usuario"
              onClick={() => solicitarEliminarUsuario(usuario)}
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Renderizar vista desktop para usuarios
  const renderUsuariosDesktop = () => (
    <div className="table-container">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>RFC</th>
            <th>Correo Electrónico</th>
            <th>Género</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((usuario) => (
            <tr key={usuario.id} className="usuario-row">
              <td className="nombre-completo">
                <strong>{getNombreCompleto(usuario)}</strong>
              </td>
              <td className="rfc">{usuario.RFC || 'N/A'}</td>
              <td className="correo">{usuario.correo || 'N/A'}</td>
              <td className="genero">
                <span className={`badge genero-${usuario.genero}`}>
                  {getGeneroTexto(usuario.genero)}
                </span>
              </td>
              <td className="acciones">
                <div className="action-buttons-row">
                  <button 
                    className="btn-ver-archivos"
                    onClick={() => handleVerArchivos(usuario)}
                    title="Ver documentos del usuario"
                    disabled={cargandoDocumentos}
                  >
                    {cargandoDocumentos ? '📁 Cargando...' : '📁 Documentos'}
                  </button>
                  <button 
                    className="btn-eliminar-usuario"
                    onClick={() => solicitarEliminarUsuario(usuario)}
                    title="Eliminar usuario"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Estado sin datos
  const renderSinDatos = () => (
    <div className="no-data-message">
      {busqueda ? (
        <>
          <div className="no-data-icon">🔍</div>
          <h3>No se encontraron usuarios</h3>
          <p>No hay resultados para "<strong>{busqueda}</strong>"</p>
          <button 
            className="btn-limpiar-busqueda"
            onClick={() => setBusqueda("")}
          >
            Mostrar todos los usuarios
          </button>
        </>
      ) : (
        <>
          <div className="no-data-icon">👥</div>
          <h3>No hay usuarios registrados</h3>
          <p>No se encontraron usuarios cliente en el sistema</p>
          <button 
            className="btn-agregar-primero"
            onClick={() => setModalAgregarUsuarioAbierto(true)}
          >
            ➕ Agregar el primer usuario
          </button>
        </>
      )}
    </div>
  );

  if (loading && documentosPendientes.length === 0 && usuarios.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <header className="admin-header">
        <div className="header-content">
          <h1>Instituto Tecnológico de Ciudad Valles</h1>
          <div className="user-info">
            <span>Panel de Administración - {userData.nombre}</span>
            <button className="logout-btn" onClick={solicitarLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <section className="admin-title-section">
          <h1>Gestión de Docentes</h1>
          <div className="vista-selector">
            <button 
              className={`vista-btn ${vistaActual === 'usuarios' ? 'active' : ''}`}
              onClick={() => setVistaActual('usuarios')}
            >
              👥 Lista de Usuarios
            </button>
            <button 
              className={`vista-btn ${vistaActual === 'pendientes' ? 'active' : ''}`}
              onClick={() => setVistaActual('pendientes')}
            >
              📋 Documentos Pendientes
              {documentosPendientes.length > 0 && (
                <span className="badge-pendientes">{documentosPendientes.length}</span>
              )}
            </button>
          </div>
        </section>

        {vistaActual === 'pendientes' && (
          <section className="pendientes-section">
            <div className="section-header">
              <h2>📋 Documentos Pendientes de Revisión</h2>
              <div className="header-actions">
                <span className="total-pendientes">
                  {documentosPendientes.length} documento(s) pendiente(s)
                </span>
                <button 
                  className="btn-refresh"
                  onClick={cargarDocumentosPendientes}
                  title="Actualizar lista"
                  disabled={loading}
                >
                  {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando documentos pendientes...</p>
              </div>
            ) : documentosPendientes.length === 0 ? (
              <div className="sin-pendientes">
                <div className="sin-pendientes-icon">✅</div>
                <h3>No hay documentos pendientes</h3>
                <p>Todos los documentos han sido revisados</p>
                <button 
                  className="btn-refresh"
                  onClick={cargarDocumentosPendientes}
                >
                  🔄 Revisar de nuevo
                </button>
              </div>
            ) : (
              <div className="pendientes-grid">
                {documentosPendientes.map((documento) => (
                  <div key={documento.id} className="documento-pendiente-card">
                    <div className="documento-header">
                      <div className="documento-info">
                        <h4>{getTipoDocumentoTexto(documento.tipo_documento)}</h4>
                        <p className="usuario-info">
                          👤 {getNombreCompleto(documento.usuario)}
                        </p>
                        <p className="fecha-subida">
                          📅 Subido: {new Date(documento.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className="documento-actions">
                        <button className="btn-visualizar-doc" onClick={() => manejarDescarga(documento.id)}>
                          👁️ Ver PDF
                        </button>
                        <button 
                          className="btn-revisar"
                          onClick={() => handleRevisarDocumento(documento)}
                        >
                          📝 Revisar
                        </button>
                      </div>
                    </div>
                    <div className="documento-detalles">
                      <span className="nombre-archivo">
                        📄 {documento.nombre_archivo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {vistaActual === 'usuarios' && (
          <>
            <section className="busqueda-section">
              <div className="busqueda-container">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, RFC o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="search-input"
                  />
                  <button 
                    className="search-btn"
                    onClick={() => {}} // La búsqueda es en tiempo real
                  >
                    🔍 Buscar
                  </button>
                </div>
                
                {busqueda && (
                  <div className="resultados-info">
                    {usuariosFiltrados.length > 0 ? (
                      <span>{usuariosFiltrados.length} usuario(s) encontrado(s)</span>
                    ) : (
                      <span className="no-results-text">No se encontraron usuarios</span>
                    )}
                  </div>
                )}
              </div>
            </section>

            <div className="admin-divider"></div>

            <section className="usuarios-table-section">
              <div className="section-header">
                <h2>Lista de Docentes</h2>
                <div className="header-actions">
                  <span className="total-usuarios">
                    Total: {usuariosFiltrados.length} usuario(s)
                  </span>
                  <div className="action-buttons">
                    <button 
                      className="btn-agregar-usuario"
                      onClick={() => setModalAgregarUsuarioAbierto(true)}
                      title="Agregar nuevo usuario"
                    >
                      ➕ Agregar Usuario
                    </button>
                    <button 
                      className="btn-refresh"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const responseUsuarios = await usuarioService.obtenerClientes();
                          if (responseUsuarios.data.success) {
                            setUsuarios(responseUsuarios.data.usuarios || []);
                          }
                        } catch (error) {
                          console.error('Error actualizando usuarios:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando usuarios...</p>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="no-data-message-container">
                  {renderSinDatos()}
                </div>
              ) : (
                <>
                  {/* Versión Desktop - Tabla */}
                  {renderUsuariosDesktop()}
                  
                  {/* Versión Mobile - Cards */}
                  {renderUsuariosMobile()}
                </>
              )}
            </section>
          </>
        )}
      </div>

      <ModalRevision
        isOpen={modalRevisionAbierto}
        onClose={handleCerrarModal}
        documento={documentoSeleccionado}
        onDecision={handleDecisionDocumento}
      />

      <ModalDocumentosUsuario
        isOpen={modalDocumentosAbierto}
        onClose={handleCerrarModalDocumentos}
        usuario={usuarioSeleccionado}
        documentos={documentosUsuario}
        cargando={cargandoDocumentos}
        onDescargar={descargarDocumentoUsuario}
        onVisualizar={visualizarDocumentoUsuario}
        getNombreCompleto={getNombreCompleto}
        getTipoDocumentoTexto={getTipoDocumentoTexto}
        getEstadoDocumentoTexto={getEstadoDocumentoTexto}
      />

      <ModalAgregarUsuario
        isOpen={modalAgregarUsuarioAbierto}
        onClose={() => setModalAgregarUsuarioAbierto(false)}
        onAgregarUsuario={handleAgregarUsuario}
      />

      <ModalConfirmacion
        isOpen={modalConfirmacionAbierto}
        onClose={cancelarEliminacion}
        onConfirm={() => handleEliminarUsuario(usuarioAEliminar)}
        titulo="Confirmar Eliminación"
        mensaje={`¿Estás seguro de que deseas eliminar al usuario "${usuarioAEliminar ? getNombreCompleto(usuarioAEliminar) : ''}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, Eliminar"
        textoCancelar="Cancelar"
        tipo="peligro"
      />

      <ModalConfirmacion
        isOpen={modalLogoutAbierto}
        onClose={() => setModalLogoutAbierto(false)}
        onConfirm={handleLogout}
        titulo="Confirmar Cierre de Sesión"
        mensaje="¿Estás seguro de que deseas cerrar sesión?"
        textoConfirmar="Sí, Cerrar Sesión"
        textoCancelar="Cancelar"
        tipo="advertencia"
      />
    </div>
  );
};

export default AdminDashboard;