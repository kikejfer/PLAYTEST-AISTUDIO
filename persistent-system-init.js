// Sistema Persistente PLAYTEST - Inicialización
// Este archivo maneja la persistencia del estado del juego

console.log('🔄 Sistema persistente PLAYTEST inicializado');

// Recuperar gameId del localStorage si existe
const storedGameId = localStorage.getItem('current_game_id');
const storedGameMode = localStorage.getItem('current_game_mode');

if (storedGameId && storedGameMode) {
    console.log('📦 Game ID recuperado del localStorage:', storedGameId);
    console.log('📦 Game Mode recuperado del localStorage:', storedGameMode);
}

// Función para guardar el estado del juego
window.saveGameState = function(gameId, gameMode) {
    localStorage.setItem('current_game_id', gameId);
    localStorage.setItem('current_game_mode', gameMode);
    console.log('💾 Estado del juego guardado:', { gameId, gameMode });
};

// Función para limpiar el estado del juego
window.clearGameState = function() {
    localStorage.removeItem('current_game_id');
    localStorage.removeItem('current_game_mode');
    console.log('🧹 Estado del juego limpiado');
};

// Función para obtener el gameId actual
window.getCurrentGameId = function() {
    return localStorage.getItem('current_game_id');
};

// Auto-detectar gameId desde URL o localStorage
window.getGameId = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlGameId = urlParams.get('gameId');
    
    if (urlGameId) {
        console.log('🔗 Game ID encontrado en URL:', urlGameId);
        return urlGameId;
    }
    
    const storedGameId = localStorage.getItem('current_game_id');
    if (storedGameId) {
        console.log('📦 Game ID encontrado en localStorage:', storedGameId);
        return storedGameId;
    }
    
    console.warn('⚠️ No se encontró Game ID ni en URL ni en localStorage');
    return null;
};