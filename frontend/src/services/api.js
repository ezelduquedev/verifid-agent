import axios from 'axios';

// ─── Instancia base de Axios ──────────────────────────────────────────────────
// Apunta al backend en local. En producción Railway cambiará esta URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 segundos máximo (RNF-03)
});

// ─── Interceptor de REQUEST ───────────────────────────────────────────────────
// Adjunta automáticamente el token JWT en cada petición.
// El componente nunca tiene que añadirlo manualmente.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('verifid_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor de RESPONSE ──────────────────────────────────────────────────
// Gestión centralizada de errores:
// - 401: token expirado o inválido → limpia sesión y redirige al login
// - 403: sin permisos (TC-05, TC-06)
// - 429: rate limiting activo (TC-09)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      // Token inválido o expirado — limpiar sesión
      localStorage.removeItem('verifid_token');
      localStorage.removeItem('verifid_email');
      // El hook useAuth se encargará de redirigir al Step 0
      window.dispatchEvent(new CustomEvent('verifid:session-expired'));
    }

    if (status === 429) {
      console.warn('[VerifID] Rate limit alcanzado. Espera un momento.');
    }

    return Promise.reject(error);
  }
);

// ─── Métodos de Auth ──────────────────────────────────────────────────────────
export const authService = {
  register: (email, password, gdpr_consent) =>
    api.post('/auth/register', { email, password, gdpr_consent }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

// ─── Métodos de Verificación KYC ─────────────────────────────────────────────
export const verifyService = {
  // RF-01: Inicia una nueva verificación, devuelve verification_id
  start: (userData) =>
    api.post('/verify/start', userData),

  // RF-02: Sube una cara del documento (front o back)
  uploadDocument: (verificationId, file, side, docType) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('side', side);       // 'front' | 'back'
    formData.append('docType', docType); // 'DNI' | 'NIE' | 'Pasaporte'
    return api.post(`/verify/${verificationId}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Polling: consulta el estado hasta que el análisis termine
  getStatus: (verificationId) =>
    api.get(`/verify/${verificationId}/status`),

  // RF-05: Obtiene el resultado completo con scores e informe de IA
  getResult: (verificationId) =>
    api.get(`/verify/${verificationId}/result`),

  // RF-07: Descarga el informe PDF generado por el backend (pdfService.js)
  downloadReport: async (verificationId) => {
    const response = await api.get(`/verify/${verificationId}/report`, {
      responseType: 'blob', // Importante: recibir como binario
    });
    // Crear enlace de descarga automático
    const url  = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', `VerifID_${verificationId.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;