import API from './api';

export const documentoService = {
    subirDocumento: async (archivo, usuarioId, tipoDocumento) => {
        try {
            console.log('📦 Preparando FormData...');
                
            const formData = new FormData();
            formData.append('archivo', archivo);
            formData.append('usuario_id', usuarioId.toString());
            formData.append('tipo_documento', tipoDocumento);
    
            console.log('🚀 Enviando petición POST...', {
                usuario_id: usuarioId,
                tipo_documento: tipoDocumento,
                archivo: archivo.name
            });
                
            const response = await API.post('/documentos/subir', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000,
            });
    
            console.log('📨 Respuesta recibida:', response.data);
            return response.data;
    
        } catch (error) {
            console.error('💥 Error en servicio:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            });
            throw error;
        }
    },

    // Obtener documentos del usuario
    obtenerDocumentos: async () => {
        try {
            const response = await API.get('/documentos');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar documento
    eliminarDocumento: async (tipoDocumento) => {
        try {
            const response = await API.delete(`/documentos/${tipoDocumento}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Agregar estos métodos a documentoService
    obtenerPendientes: async () => {
        const response = await API.get('/admin/documentos/pendientes');
    return response;
    },

    aprobarDocumento: async (documentoId, comentario = '') => {
        try {
            const response = await API.post(`/admin/documentos/${documentoId}/aprobar`, {
                comentario: comentario
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    rechazarDocumento: async (documentoId, comentario = '') => {
        try {
            const response = await API.post(`/admin/documentos/${documentoId}/rechazar`, {
                comentario: comentario
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

adminDescargarDocumento: async (documentoId) => {
    try {
        const response = await API.get(`/admin/documentos/descargar/${documentoId}`, {
            responseType: 'blob',
            withCredentials: true
        });

        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');

    } catch (error) {
        console.error('❌ Error al descargar documento:', error.response?.data);
        throw error;
    }
},

obtenerDocumentosUsuario: async (usuarioId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:8000/api/admin/documentos/usuario/${usuarioId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener documentos del usuario');
  }
  
  return await response.json();
}

};