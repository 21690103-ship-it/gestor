import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ActualizarArchivoModal from "./ActualizarArchivoModal";
import ConfirmacionModal from "./ConfirmacionModal";
import ModalEditarPerfil from "./ModalEditarPerfil";
import { documentoService } from "./services/documentoService";
import { usuarioService } from "./services/usuarioService";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  
  const userData = useMemo(() => {
    const storedData = localStorage.getItem('user_data');
    return storedData ? JSON.parse(storedData) : {};
  }, []);

  const userId = userData.id;

  const [documentos, setDocumentos] = useState({
    actaNacimiento: null,
    comprobanteDomicilio: null,
    curp: null,
    cartillaMilitar: null,
    ine: null,
    csf: null,
    cdp: null,
    cni: null,
    cv: null,
    ugs: null
  });
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);
  const [modalEditarPerfilAbierto, setModalEditarPerfilAbierto] = useState(false);
  const [setActualizandoPerfil] = useState(false);
  const documentosConfig = {
    actaNacimiento: { 
      tipo: 'actaNacimiento', 
      nombre: 'Acta de Nacimiento',
      backendType: 'acta_nacimiento'
    },
    comprobanteDomicilio: { 
      tipo: 'comprobanteDomicilio', 
      nombre: 'Comprobante de Domicilio',
      backendType: 'comp_dom'
    },
    curp: { 
      tipo: 'curp', 
      nombre: 'CURP',
      backendType: 'curp'
    },
    cartillaMilitar: { 
      tipo: 'cartillaMilitar', 
      nombre: 'Cartilla Militar', 
      backendType: 'cartilla'
    },
    ine: {
      tipo: 'ine',
      nombre: 'INE "Instituto Nacional Electoral"',
      backendType: 'ine'
    },
    csf: {
      tipo: 'csf',
      nombre: 'Constancia de Situación Fiscal',
      backendType: 'csf'
    },
    cdp: {
      tipo: 'cdp',
      nombre: 'Constancia de Declaracion Patrimonial',
      backendType: 'cdp'
    },
    cni: {
      tipo: 'cni',
      nombre: 'Constancia de No Inhabilitado',
      backendType: 'cni'
    },
    cv: {
      tipo: 'cv',
      nombre: 'Currículum Vitae',
      backendType: 'cv'
    },
    ugs: {
      tipo: 'ugs',
      nombre: 'Último Grado de Estudios',
      backendType: 'ugs'
    }
  };

  useEffect(() => {
    if (!userId) {
      console.warn('⚠️ No hay userId, redirigiendo al login...');
      navigate("/");
      return;
    }
  }, [userId, navigate]);

  useEffect(() => {
    console.log('🎯 Dashboard montado - Cargando datos iniciales');
    console.log('🔍 UserData:', userData);
    console.log('🔍 User ID:', userId);
    
    const cargarDatosIniciales = async () => {
      if (!userId) {
        console.error('❌ No hay userId, no se pueden cargar documentos');
        return;
      }

      try {
        console.log('📡 Solicitando documentos al backend...');
        const response = await documentoService.obtenerDocumentos();
        console.log('🔍 RESPUESTA COMPLETA DEL BACKEND:', response.data);
        
        if (response.data.success) {
          const docs = response.data.documentos;
          console.log('📄 ESTRUCTURA DE DOCUMENTOS DEL BACKEND:', docs);
          
          const documentosBackend = {};
          
          Object.keys(docs).forEach(key => {
            if (docs[key]) {
              const documentoFrontend = {
                'acta_nacimiento': 'actaNacimiento',
                'comp_dom': 'comprobanteDomicilio', 
                'cartilla': 'cartillaMilitar',
                'curp': 'curp',
                'ine': 'ine',
                'csf': 'csf',
                'cdp': 'cdp',
                'cni': 'cni',
                'cv': 'cv',
                'ugs': 'ugs'
              }[key];
              
              if (documentoFrontend) {
                if (typeof docs[key] === 'object' && docs[key] !== null) {
                  // Si es un string (estructura antigua)
                  documentosBackend[documentoFrontend] = {
                    nombre: `${documentoFrontend}.pdf`,
                    fecha: new Date().toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    ruta: docs[key]
                  };
                }
              }
            }
          });
          
          console.log('🔄 Documentos mapeados del backend:', documentosBackend);
          
          // Combinar con documentos locales si existen
          const documentosLocales = JSON.parse(localStorage.getItem('documentos') || '{}');
          console.log('💾 Documentos locales:', documentosLocales);
          
          setDocumentos(prev => ({
            ...prev,
            ...documentosBackend,
            ...documentosLocales
          }));
        }
      } catch (error) {
        console.error('❌ Error cargando documentos:', {
          message: error.message,
          response: error.response?.data
        });
        
        // Cargar documentos locales como fallback
        const documentosLocales = JSON.parse(localStorage.getItem('documentos') || '{}');
        if (Object.keys(documentosLocales).length > 0) {
          console.log('🔄 Cargando documentos locales como fallback');
          setDocumentos(prev => ({
            ...prev,
            ...documentosLocales
          }));
        }
      }
    };

    cargarDatosIniciales();
  }, [userId, userData]);

  const handleActualizarPerfil = async (datosActualizados) => {
    try {
      setActualizandoPerfil(true);
      console.log('🔄 Actualizando perfil del usuario:', datosActualizados);
      
      // Llamar al servicio para actualizar
      const resultado = await usuarioService.actualizarPerfil(userId, datosActualizados);
      
      if (resultado.success) {
        const userDataActualizado = {
          ...userData,
          nombre: datosActualizados.nombre,
          ape_pat: datosActualizados.ape_pat,
          ape_mat: datosActualizados.ape_mat || userData.ape_mat,
          RFC: datosActualizados.RFC,
          correo: datosActualizados.correo
        };
        
        localStorage.setItem('user_data', JSON.stringify(userDataActualizado));
        
        alert('✅ Perfil actualizado correctamente');
        setModalEditarPerfilAbierto(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } else {
        alert(`❌ Error: ${resultado.message}`);
      }
    } catch (error) {
      console.error('💥 Error actualizando perfil:', error);
      alert(`❌ Error al actualizar el perfil: ${error.message}`);
      throw error;
    } finally {
      setActualizandoPerfil(false);
    }
  };

  const handleFileUpload = async (documento, archivo, userId) => {
    console.log('🔍 DEBUG - Datos de subida:', {
      userId: userId,
      tipoUserId: typeof userId,
      userData: userData,
      documento: documento?.tipo
    });
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      const errorMsg = '❌ Error: No se pudo identificar el usuario. Por favor, cierre sesión y vuelva a ingresar.';
      console.error(errorMsg, { userId, userData });
      alert(errorMsg);
      return;
    }

    try {
      console.log('🚀 Subiendo archivo:', {
        documento: documento.tipo,
        archivo: archivo.name,
        userId: userId,
        tamaño: `${(archivo.size / 1024).toFixed(2)} KB`
      });

      const tipoDocumentoMap = {
        'actaNacimiento': 'acta_nacimiento',
        'comprobanteDomicilio': 'comp_dom', 
        'cartillaMilitar': 'cartilla',
        'curp': 'curp',
        'ine': 'ine',
        'csf': 'csf',
        'cdp': 'cdp',
        'cni': 'cni',
        'cv': 'cv',
        'ugs': 'ugs'
      };

      const tipoDocumento = tipoDocumentoMap[documento.tipo] || documento.tipo;
      console.log('🔄 Tipo documento backend:', tipoDocumento);

      const resultado = await documentoService.subirDocumento(archivo, userId, tipoDocumento);
      
      if (resultado.success) {
        const fechaReal = new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const nuevoDocumento = {
          nombre: archivo.name,
          fecha: fechaReal,
          ruta: resultado.documento?.ruta_archivo
        };
        
        console.log('✅ Documento subido exitosamente:', nuevoDocumento);
        
        setDocumentos(prev => ({
          ...prev,
          [documento.tipo]: nuevoDocumento
        }));

        // Guardar en localStorage
        const documentosGuardados = JSON.parse(localStorage.getItem('documentos') || '{}');
        documentosGuardados[documento.tipo] = nuevoDocumento;
        localStorage.setItem('documentos', JSON.stringify(documentosGuardados));
        
        alert(`✅ ${documento.nombre} actualizado correctamente`);
      } else {
        alert(`❌ Error: ${resultado.message}`);
      }
    } catch (error) {
      console.error('💥 Error subiendo documento:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al subir el documento. Verifique su conexión.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleVisualizarDocumento = async (tipoDocumento) => {
    try {
      const documento = documentos[tipoDocumento];
      console.log('🔍 Documento para visualizar:', { tipoDocumento, documento });
      
      if (!documento) {
        alert('❌ No se puede visualizar el documento. El documento no está disponible.');
        return;
      }

      console.log('📡 Obteniendo documentos actuales para encontrar ID...');
      const response = await documentoService.obtenerDocumentos();
      
      if (response.data.success) {
        const docsBackend = response.data.documentos;
        
        // Mapear tipo documento frontend a backend
        const tipoMap = {
          'actaNacimiento': 'acta_nacimiento',
          'comprobanteDomicilio': 'comp_dom',
          'cartillaMilitar': 'cartilla',
          'curp': 'curp',
          'ine': 'ine',
          'csf': 'csf',
          'cdp': 'cdp',
          'cni': 'cni',
          'cv': 'cv',
          'ugs': 'ugs'
        };
        
        const tipoBackend = tipoMap[tipoDocumento];
        const documentoBackend = docsBackend[tipoBackend];
        
        console.log('🎯 Buscando documento:', { tipoBackend, documentoBackend });
        
        if (documentoBackend && documentoBackend.id) {
          const token = localStorage.getItem('token');
          const urlDescarga = `http://localhost:8000/api/documentos/descargar/${documentoBackend.id}`;
          
          console.log('🔗 Descargando documento autenticado...');
          
          const link = document.createElement('a');
          link.href = urlDescarga;
          link.target = '_blank';
          
          // Agregar headers de autorización mediante fetch
          fetch(urlDescarga, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/pdf'
            }
          })
          .then(response => {
            if (response.ok) {
              return response.blob();
            }
            throw new Error('Error en la descarga');
          })
          .then(blob => {
            // Crear URL del blob y abrir en nueva pestaña
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
          })
          .catch(error => {
            console.error('❌ Error descargando documento:', error);
            alert('❌ Error al descargar el documento: ' + error.message);
          });
          
        } else {
          alert('❌ No se puede visualizar el documento. El documento no está disponible en el sistema.');
        }
      } else {
        alert('❌ Error al obtener información del documento.');
      }
      
    } catch (error) {
      console.error('💥 Error visualizando documento:', error);
      alert('❌ Error al visualizar el documento: ' + error.message);
    }
  };

  const abrirModal = (tipoDocumento) => {
    const documento = documentosConfig[tipoDocumento];
    if (documento) {
      setDocumentoActual(documento);
      setModalAbierto(true);
      console.log('✅ Modal abierto con documento:', documento);
    } else {
      console.error('❌ Documento no encontrado:', tipoDocumento);
    }
  };

  const handleLogout = () => {
    setModalConfirmacionAbierto(true);
  };

  const confirmarLogout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('documentos');
    navigate("/");
  };

  const cancelarLogout = () => {
    setModalConfirmacionAbierto(false);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDocumentoActual(null);
  };

  if (!userId) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Instituto Tecnológico de Ciudad Valles</h1>
          <div className="user-info">
            <span>Bienvenido/a, {userData.nombre}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <section className="personal-data">
          <div className="personal-data-header">
            <h2>Datos Personales</h2>
            <button 
              className="btn-editar-perfil"
              onClick={() => setModalEditarPerfilAbierto(true)}
              title="Editar datos personales"
            >
              ✏️ Editar Perfil
            </button>
          </div>
          <div className="data-grid">
            <div className="data-item">
              <label>Nombre:</label>
              <span>{userData.nombre}</span>
            </div>
            <div className="data-item">
              <label>Apellido Paterno:</label>
              <span>{userData.ape_pat}</span>
            </div>
            <div className="data-item">
              <label>Apellido Materno:</label>
              <span>{userData.ape_mat}</span>
            </div>
            <div className="data-item">
              <label>RFC:</label>
              <span>{userData.RFC}</span>
            </div>
            <div className="data-item">
              <label>Correo electrónico:</label>
              <span>{userData.correo}</span>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        <section className="documents-section">
          <h2>Documentos Personales</h2>
          
          {/* Acta de Nacimiento */}
          <div className="document-card">
            <div className="document-info">
              <h3>Acta de Nacimiento</h3>
              {documentos.actaNacimiento ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.actaNacimiento.nombre}</p>
                  <p className="file-date">Subido: {documentos.actaNacimiento.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.actaNacimiento && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('actaNacimiento')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('actaNacimiento')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* Cartilla Militar (solo si es hombre) */}
          {userData.genero === 'masculino' && (
            <div className="document-card">
              <div className="document-info">
                <h3>Cartilla Militar</h3>
                {documentos.cartillaMilitar ? (
                  <div className="document-details">
                    <p className="file-name">Archivo: {documentos.cartillaMilitar.nombre}</p>
                    <p className="file-date">Subido: {documentos.cartillaMilitar.fecha}</p>
                  </div>
                ) : (
                  <p className="no-file">No se ha subido ningún archivo</p>
                )}
              </div>
              <div className="document-actions">
                {documentos.cartillaMilitar && (
                  <button 
                    className="btn-visualizar"
                    onClick={() => handleVisualizarDocumento('cartillaMilitar')}
                  >
                    👁️ Visualizar
                  </button>
                )}
                <button 
                  className="file-upload-btn"
                  onClick={() => abrirModal('cartillaMilitar')}
                >
                  📎 Actualizar Archivo
                </button>
              </div>
            </div>
          )}

          {/* Comprobante de Domicilio */}
          <div className="document-card">
            <div className="document-info">
              <h3>Comprobante de Domicilio</h3>
              {documentos.comprobanteDomicilio ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.comprobanteDomicilio.nombre}</p>
                  <p className="file-date">Subido: {documentos.comprobanteDomicilio.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.comprobanteDomicilio && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('comprobanteDomicilio')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('comprobanteDomicilio')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* CURP */}
          <div className="document-card">
            <div className="document-info">
              <h3>CURP</h3>
              {documentos.curp ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.curp.nombre}</p>
                  <p className="file-date">Subido: {documentos.curp.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.curp && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('curp')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('curp')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* INE */}
          <div className="document-card">
            <div className="document-info">
              <h3>INE "Instituto Nacional Electoral"</h3>
              {documentos.ine ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.ine.nombre}</p>
                  <p className="file-date">Subido: {documentos.ine.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.ine && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('ine')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('ine')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          <h2>Documentos Profesionales</h2>

          {/* CDP */}
          <div className="document-card">
            <div className="document-info">
              <h3>Constancia de Declaracion Patrimonial</h3>
              {documentos.cdp ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.cdp.nombre}</p>
                  <p className="file-date">Subido: {documentos.cdp.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.cdp && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('cdp')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('cdp')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* CNI */}
          <div className="document-card">
            <div className="document-info">
              <h3>Constancia de No Inhabilitado</h3>
              {documentos.cni ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.cni.nombre}</p>
                  <p className="file-date">Subido: {documentos.cni.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.cni && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('cni')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('cni')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* CSF */}
          <div className="document-card">
            <div className="document-info">
              <h3>Constancia de Situación Fiscal</h3>
              {documentos.csf ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.csf.nombre}</p>
                  <p className="file-date">Subido: {documentos.csf.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.csf && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('csf')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('csf')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* CV */}
          <div className="document-card">
            <div className="document-info">
              <h3>Currículum Vitae</h3>
              {documentos.cv ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.cv.nombre}</p>
                  <p className="file-date">Subido: {documentos.cv.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.cv && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('cv')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('cv')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>

          {/* UGS */}
          <div className="document-card">
            <div className="document-info">
              <h3>Último Grado de Estudios</h3>
              {documentos.ugs ? (
                <div className="document-details">
                  <p className="file-name">Archivo: {documentos.ugs.nombre}</p>
                  <p className="file-date">Subido: {documentos.ugs.fecha}</p>
                </div>
              ) : (
                <p className="no-file">No se ha subido ningún archivo</p>
              )}
            </div>
            <div className="document-actions">
              {documentos.ugs && (
                <button 
                  className="btn-visualizar"
                  onClick={() => handleVisualizarDocumento('ugs')}
                >
                  👁️ Visualizar
                </button>
              )}
              <button 
                className="file-upload-btn"
                onClick={() => abrirModal('ugs')}
              >
                📎 Actualizar Archivo
              </button>
            </div>
          </div>
        </section>
      </div>

      <ActualizarArchivoModal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        documento={documentoActual}
        onFileUpload={handleFileUpload}
        userId={userId}
      />

      <ConfirmacionModal
        isOpen={modalConfirmacionAbierto}
        onClose={cancelarLogout}
        onConfirm={confirmarLogout}
        tipo="simple"
      />

      <ModalEditarPerfil
        isOpen={modalEditarPerfilAbierto}
        onClose={() => setModalEditarPerfilAbierto(false)}
        usuario={userData}
        onActualizarPerfil={handleActualizarPerfil}
      />
    </div>
  );
}

export default Dashboard;