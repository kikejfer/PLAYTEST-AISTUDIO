/**
 * Limpiador de Caché para PLAYTEST
 * Fuerza la recarga de archivos sin caché
 */

console.log('🧹 Iniciando limpieza de caché...');

// Limpiar localStorage de autenticación
const authKeys = ['authToken', 'playtest_auth_token', 'user_data', 'user_role'];
authKeys.forEach(key => {
    if (localStorage.getItem(key)) {
        console.log(`🗑️ Limpiando ${key}`);
        localStorage.removeItem(key);
    }
});

// Limpiar sessionStorage
sessionStorage.clear();

// Forzar recarga sin caché
setTimeout(() => {
    console.log('🔄 Forzando recarga completa...');
    
    // Múltiples métodos para asegurar limpieza
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    // Redirigir a la nueva versión
    const currentUrl = window.location.href;
    if (!currentUrl.includes('-v2.html')) {
        const newUrl = currentUrl.replace('admin-principal-panel.html', 'admin-principal-panel-v2.html');
        console.log('🚀 Redirigiendo a versión actualizada:', newUrl);
        window.location.replace(newUrl);
    } else {
        // Si ya estamos en v2, hacer hard reload
        window.location.reload(true);
    }
}, 1000);