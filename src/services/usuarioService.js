import API from './api';

export const usuarioService = {

    //Obtener todos los usuarios tipo cliente

    obtenerClientes: async () => {
        try {
            const response = await API.get('/usuarios/clientes');
            return response;
        } catch (error) {
            console.error('Error obteniendo clientes:', error);
            throw error;
        }
    },


    //Buscar usuarios por término

    buscarUsuarios: async (termino) => {
        try {
            const response = await API.get('/usuarios/buscar', {
                params: { q: termino }
            });
            return response;
        } catch (error) {
            console.error('Error buscando usuarios:', error);
            throw error;
        }
    },


    //Obtener un usuario específico

    obtenerUsuario: async (id) => {
        try {
            const response = await API.get(`/usuarios/${id}`);
            return response;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            throw error;
        }
    },


    //Actualizar estado de usuario

    actualizarEstado: async (id, estado) => {
        try {
            const response = await API.put(`/usuarios/${id}/estado`, {
                estado: estado
            });
            return response;
        } catch (error) {
            console.error('Error actualizando estado:', error);
            throw error;
        }
    },

crearUsuario: async (usuarioData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:8000/api/admin/usuarios', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usuarioData)
    });

    console.log('📡 Respuesta crear usuario:', {
      status: response.status,
      statusText: response.statusText,
      url: 'http://localhost:8000/api/admin/usuarios'
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `${response.status} ${response.statusText}` };
      }
      
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en crearUsuario:', error);
    throw error;
  }
},

eliminarUsuario: async (usuarioId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:8000/api/admin/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('📡 Respuesta eliminar usuario:', {
      status: response.status,
      statusText: response.statusText,
      url: `http://localhost:8000/api/admin/usuarios/${usuarioId}`
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `${response.status} ${response.statusText}` };
      }
      
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en eliminarUsuario:', error);
    throw error;
  }
},

actualizarPerfil: async (usuarioId, datos) => {
  try {
    const token = localStorage.getItem('token');
    
    console.log('📤 Enviando actualización de perfil:', {
      usuarioId,
      datos,
      url: `http://localhost:8000/api/usuarios/${usuarioId}/perfil`
    });
    
    const response = await fetch(`http://localhost:8000/api/usuarios/${usuarioId}/perfil`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(datos)
    });

    console.log('📥 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const text = await response.text();
        console.error('❌ Respuesta de error:', text.substring(0, 500));
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✅ Perfil actualizado exitosamente:', data);
    return data;
    
  } catch (error) {
    console.error('💥 Error actualizando perfil:', error);
    throw error;
  }
}

};