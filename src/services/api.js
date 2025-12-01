import axios from 'axios';

// Función para obtener cookies del navegador
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Instancia base para CSRF
const BASE_API = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

// Instancia para API
const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  timeout: 30000, // 30 segundos timeout
});

// Headers comunes
const COMMON_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

let csrfTokenObtained = false;
let csrfTokenPromise = null;

const ensureCsrfToken = async () => {
  if (csrfTokenObtained) return;
  
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }
  
  csrfTokenPromise = (async () => {
    try {
      console.log('🔄 Obteniendo token CSRF...');
      await BASE_API.get('/sanctum/csrf-cookie');
      csrfTokenObtained = true;
      console.log('✅ CSRF token obtenido exitosamente');
    } catch (error) {
      console.error('❌ Error obteniendo CSRF token:', error);
      csrfTokenObtained = false;
      throw error;
    } finally {
      csrfTokenPromise = null;
    }
  })();
  
  return csrfTokenPromise;
};

API.interceptors.request.use(async (config) => {
  config.headers = {
    ...COMMON_HEADERS,
    ...config.headers,
  };
  
  // OBTENER TOKEN DE AUTENTICACIÓN
  const authToken = localStorage.getItem('token');
  
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  
  const methodsRequiringCsrf = ['post', 'put', 'delete', 'patch'];
  const method = config.method?.toLowerCase();
  
  if (methodsRequiringCsrf.includes(method)) {
    try {
      await ensureCsrfToken();
      
      // Obtener token XSRF de las cookies
      const xsrfToken = getCookie('XSRF-TOKEN');
      
      if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener CSRF token, continuando sin él');
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Petición API:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: authToken ? '[PRESENTE]' : '[AUSENTE]',
        'X-XSRF-TOKEN': config.headers['X-XSRF-TOKEN'] ? '[PRESENTE]' : '[AUSENTE]',
      },
      data: config.data ? '[PRESENTE]' : '[AUSENTE]'
    });
  }
  
  return config;
}, (error) => {
  console.error('❌ Error en interceptor de solicitud:', error);
  return Promise.reject(error);
});

API.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Respuesta exitosa:', {
        url: response.config.url,
        status: response.status,
        statusText: response.statusText,
        success: response.data?.success,
        message: response.data?.message || 'Sin mensaje'
      });
    }
    
    return response;
  },
  (error) => {
    const { config, response, message } = error;
    const url = config?.url || 'URL desconocida';
    const method = config?.method?.toUpperCase() || 'METHOD desconocido';
    
    console.error('❌ Error en respuesta API:', {
      url: `${method} ${url}`,
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      message: message,
      isNetworkError: !response,
    });
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          console.log('🔒 Sesión expirada o token inválido');
          if (window.location.pathname !== '/') {
            localStorage.removeItem('token');
            localStorage.removeItem('user_data');
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
          break;
          
        case 403:
          console.warn('⛔ Acceso prohibido');
          break;
          
        case 404:
          console.warn('🔍 Recurso no encontrado:', url);
          break;
          
        case 419:
          console.warn('🔄 CSRF token inválido, intentando renovar...');
          csrfTokenObtained = false;
          break;
          
        case 422:
          console.warn('📋 Error de validación:', data?.errors);
          break;
          
        case 429:
          console.warn('🐌 Demasiadas peticiones, por favor espere');
          break;
          
        case 500:
          console.error('💥 Error interno del servidor');
          break;
          
        default:
          console.warn(`⚠️ Error HTTP ${status}`);
      }
      
      if (data?.message) {
        error.userMessage = data.message;
      } else {
        // Mensajes genéricos por código de estado
        const genericMessages = {
          401: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
          403: 'No tiene permisos para realizar esta acción.',
          404: 'El recurso solicitado no fue encontrado.',
          422: 'Los datos enviados no son válidos.',
          429: 'Demasiados intentos. Por favor, espere unos minutos.',
          500: 'Error interno del servidor. Por favor, intente más tarde.',
          502: 'El servidor no está respondiendo. Por favor, intente más tarde.',
          503: 'Servicio no disponible temporalmente.',
          504: 'Tiempo de espera agotado. Por favor, intente nuevamente.',
        };
        
        error.userMessage = genericMessages[status] || 
                          `Error ${status}: ${status || 'Error desconocido'}`;
      }
    } else {
      error.userMessage = message.includes('Network Error') 
        ? 'Error de conexión. Verifique su conexión a internet.'
        : 'Error de conexión con el servidor.';
    }
    
    return Promise.reject(error);
  }
);

API.retryRequest = async (config, maxRetries = 2, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await API(config);
    } catch (error) {
      lastError = error;
      
      const shouldRetry = !error.response || 
                         (error.response.status >= 500 && error.response.status < 600);
      
      if (!shouldRetry || attempt === maxRetries) {
        break;
      }
      
      console.log(`🔄 Reintento ${attempt}/${maxRetries} para ${config.url}`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

API.publicRequest = async (config) => {
  const publicConfig = {
    ...config,
    headers: {
      ...config.headers,
      Authorization: undefined,
    }
  };
  
  return API(publicConfig);
};

export { getCookie, ensureCsrfToken };
export default API;