/**
 * Utilidades de autenticación compartidas
 */

/**
 * Limpia la sesión y redirige al login
 */
function handleTokenExpired() {
  console.log('⏰ Token expirado, cerrando sesión...');

  // Limpiar todos los datos de sesión
  localStorage.removeItem('playtest_session');
  localStorage.removeItem('playtest_auth_token');
  localStorage.removeItem('authToken');

  // Mostrar mensaje al usuario
  alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');

  // Redirigir al login
  window.location.href = '/index.html';
}

/**
 * Wrapper para fetch que maneja automáticamente tokens expirados
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
async function authFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // Si recibimos 401, verificar si es por token expirado
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));

      if (data.code === 'TOKEN_EXPIRED') {
        handleTokenExpired();
        throw new Error('Token expired');
      }
    }

    return response;
  } catch (error) {
    // Si el error es de red, propagarlo
    throw error;
  }
}

/**
 * Obtiene los headers de autenticación estándar
 * @param {string} role - Rol actual (PJG, PPF, etc.)
 * @returns {object} Headers con Authorization y X-Current-Role
 */
function getAuthHeaders(role = 'PJG') {
  const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');

  if (!session.token) {
    console.warn('⚠️ No se encontró token de autenticación');
    return {};
  }

  return {
    'Authorization': `Bearer ${session.token}`,
    'X-Current-Role': role,
    'Content-Type': 'application/json'
  };
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
function isAuthenticated() {
  const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');
  return !!(session.token && session.userId);
}

// Exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleTokenExpired,
    authFetch,
    getAuthHeaders,
    isAuthenticated
  };
}
