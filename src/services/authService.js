import API from './api';

export const authService = {
  // Obtener CSRF token explícitamente
  getCsrfToken: async () => {
    return true;
  },

  login: async (RFC, contraseña) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await API.post('/login', {
        RFC,
        contraseña
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await API.post('/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      return response;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await API.get('/user');
      return response;
    } catch (error) {
      throw error;
    }
  },

  recuperarContraseña: async (datos) => {
    try {
      console.log('📤 Enviando solicitud de recuperación:', datos);
      
      let endpoint = '/auth/recuperar-contrasena';
      
      const response = await API.post(endpoint, datos);
      
      console.log('📥 Respuesta de recuperación:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error en recuperarContraseña:', {
        message: error.message,
        response: error.response?.data
      });
      
      let mensajeError = 'Error al procesar la solicitud';
      
      if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.response?.status === 404) {
        mensajeError = 'Usuario no encontrado';
      } else if (error.response?.status === 422) {
        mensajeError = 'Datos de entrada inválidos';
      }
      
      throw new Error(mensajeError);
    }
  },

  solicitarRecuperacion: async (datos) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/recuperar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(datos)
      });

      console.log('📡 Estado de la respuesta:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Error ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error en solicitarRecuperacion:', error);
      throw error;
    }
  },

  verificarCodigo: async (RFC, codigo) => {
    try {
      const response = await API.post('/auth/verificar-codigo', {
        RFC,
        codigo
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error verificando código:', error);
      throw error;
    }
  },

  cambiarContraseña: async (RFC, codigo, nuevaContraseña) => {
    try {
      const response = await API.post('/auth/cambiar-contrasena', {
        RFC,
        codigo,
        nuevaContraseña
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      throw error;
    }
  },

  manejarRecuperacion: async (datos) => {
    try {
      const { RFC, correo, codigo, nuevaContraseña, accion } = datos;
      
      let endpoint, body;
      
      switch (accion) {
        case 'solicitar':
          endpoint = '/auth/recuperar-contrasena';
          body = { RFC, correo, accion: 'solicitar' };
          break;
          
        case 'verificar':
          endpoint = '/auth/verificar-codigo';
          body = { RFC, codigo };
          break;
          
        case 'cambiar':
          endpoint = '/auth/cambiar-contrasena';
          body = { RFC, codigo, nuevaContraseña };
          break;
          
        default:
          throw new Error('Acción no válida');
      }
      
      console.log(`🔄 Enviando ${accion} a ${endpoint}:`, body);
      
      const response = await API.post(endpoint, body);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error en ${datos.accion}:`, error);
      
      let mensaje = 'Error al procesar la solicitud';
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 404) {
          mensaje = 'Usuario no encontrado';
        } else if (status === 422) {
          mensaje = data.message || 'Datos inválidos';
        } else if (status === 400) {
          mensaje = data.message || 'Solicitud incorrecta';
        } else if (data && data.message) {
          mensaje = data.message;
        }
      } else if (error.message) {
        mensaje = error.message;
      }
      
      throw new Error(mensaje);
    }
  }
};