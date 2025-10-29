// Script para corregir el rol del usuario "admin" 
// Este script debe ser inyectado en la página principal

console.log('🔧 Aplicando corrección de rol para usuario "admin"...');

// Sobrescribir la función getUserPrimaryRole original
if (typeof window.getUserPrimaryRole === 'function') {
  const originalGetUserPrimaryRole = window.getUserPrimaryRole;
  
  window.getUserPrimaryRole = function(user) {
    if (!user) return 'jugador';
    
    // Check admin roles first (highest priority)
    if (user.nickname === 'AdminPrincipal' || (typeof hasRole === 'function' && hasRole(user, 'administrador_principal'))) {
      return 'administrador_principal';
    }
    
    const secondaryAdmins = ['kikejfer', 'admin_sec_1', 'admin_secundario'];
    if ((typeof hasRole === 'function' && (hasRole(user, 'administrador_secundario') || hasRole(user, 'admin_secundario'))) || 
        secondaryAdmins.includes(user.nickname)) {
      return 'administrador_secundario';
    }
    
    // ✅ NUEVA LÓGICA: Usuarios de soporte técnico
    const supportUsers = ['admin', 'support_user_1', 'soporte_tecnico'];
    if ((typeof hasRole === 'function' && hasRole(user, 'soporte_tecnico')) || 
        supportUsers.includes(user.nickname)) {
      console.log(`🛠️ Usuario ${user.nickname} identificado como soporte técnico`);
      return 'soporte_tecnico';
    }
    
    // For users with multiple roles, choose based on priority
    if (user.roles && Array.isArray(user.roles)) {
      if (user.roles.includes('creador')) return 'creador';
      if (user.roles.includes('profesor')) return 'profesor';
      if (user.roles.includes('jugador')) return 'jugador';
      return 'jugador'; // fallback
    }
    
    // Legacy single role system
    if (user.role === 'creador' || user.role_name === 'creador' || 
        user.role === 'creator' || user.role_name === 'creator') {
      return 'creador';
    }
    
    return 'jugador'; // Default
  };
  
  console.log('✅ Función getUserPrimaryRole actualizada con soporte técnico');
} else {
  console.warn('⚠️ Función getUserPrimaryRole no encontrada');
}

// Función para aplicar redirección con soporte técnico
window.applyFixedRedirection = function(currentUser) {
  if (!currentUser) return;
  
  const primaryRole = window.getUserPrimaryRole(currentUser);
  console.log('🎯 Rol primario determinado:', primaryRole, 'para usuario:', currentUser.nickname);
  
  const handleRoleRedirect = (roleName, panelFile, roleEmoji, roleDisplayName) => {
    console.log(`${roleEmoji} ${roleDisplayName} DETECTADO (${currentUser.nickname}) - Iniciando proceso de redirección`);
    const currentUrl = window.location.href;
    const isInCorrectPanel = currentUrl.includes(panelFile.replace('.html', ''));
    
    if (!isInCorrectPanel) {
      console.log(`🎯 REDIRIGIENDO A PANEL ${roleDisplayName.toUpperCase()} AHORA`);
      const uniqueId = Date.now() + Math.random();
      window.location.href = `${panelFile}?auth=${uniqueId}`;
    } else {
      console.log(`✅ ${roleDisplayName} ya está en la ubicación correcta`);
    }
  };
  
  // Redirección basada en rol primario
  switch (primaryRole) {
    case 'administrador_principal':
      handleRoleRedirect('administrador_principal', 'admin-principal-panel.html', '🔀', 'Admin Principal');
      break;
      
    case 'administrador_secundario':
      handleRoleRedirect('administrador_secundario', 'admin-secundario-panel.html', '🔀', 'Admin Secundario');
      break;
      
    case 'soporte_tecnico':  // ✅ NUEVO CASO
      handleRoleRedirect('soporte_tecnico', 'support-dashboard.html', '🛠️', 'Soporte Técnico');
      break;
      
    case 'creador':
      handleRoleRedirect('creador', 'creators-panel-content.html', '🎨', 'Content Creator');
      break;
      
    case 'profesor':
      handleRoleRedirect('profesor', 'teachers-panel-schedules.html', '👨‍🏫', 'Teacher');
      break;
      
    case 'jugador':
      handleRoleRedirect('jugador', 'jugadores-panel-gaming.html', '🎮', 'Player');
      break;
      
    default:
      console.log(`❓ ROL DESCONOCIDO (${primaryRole}) para usuario ${currentUser.nickname} - Usando panel por defecto`);
      handleRoleRedirect('default', 'jugadores-panel-gaming.html', '🎮', 'Player');
      break;
  }
};

// Aplicar la corrección automáticamente si hay un usuario logueado
try {
  const sessionData = localStorage.getItem('playtest_session') || localStorage.getItem('gameSession');
  if (sessionData) {
    const currentUser = JSON.parse(sessionData);
    if (currentUser && currentUser.nickname === 'admin') {
      console.log('🔧 Aplicando corrección automática para usuario "admin"');
      setTimeout(() => {
        window.applyFixedRedirection(currentUser);
      }, 1000);
    }
  }
} catch (error) {
  console.error('Error aplicando corrección automática:', error);
}

console.log('✅ Script de corrección de rol cargado correctamente');
console.log('📋 Para aplicar manualmente: window.applyFixedRedirection(currentUser)');