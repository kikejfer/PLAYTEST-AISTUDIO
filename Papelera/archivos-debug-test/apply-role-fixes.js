// Script to apply role fixes to the application
// This should be integrated into the main index.html file

console.log('🔧 Applying role fixes...');

// 1. Add support for soporte_tecnico role
const originalGetUserPrimaryRole = getUserPrimaryRole;

window.getUserPrimaryRole = (user) => {
  if (!user) return 'jugador';
  
  // Check admin roles first (highest priority)
  if (user.nickname === 'AdminPrincipal' || hasRole(user, 'administrador_principal')) {
    return 'administrador_principal';
  }
  
  const secondaryAdmins = ['kikejfer', 'admin_sec_1', 'admin_secundario'];
  if (hasRole(user, 'administrador_secundario') || hasRole(user, 'admin_secundario') || secondaryAdmins.includes(user.nickname)) {
    return 'administrador_secundario';
  }
  
  // ✅ NEW: Check for support role
  const supportUsers = ['admin', 'support_user_1', 'soporte_tecnico'];
  if (hasRole(user, 'soporte_tecnico') || supportUsers.includes(user.nickname)) {
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

// 2. Update role display names
const originalGetUserRoleDisplayName = getUserRoleDisplayName;

window.getUserRoleDisplayName = (user) => {
  if (!user) return 'Jugador';
  
  const primaryRole = getUserPrimaryRole(user);
  
  switch (primaryRole) {
    case 'administrador_principal':
      return 'Admin Principal';
    case 'administrador_secundario':
      return 'Admin Secundario';
    case 'soporte_tecnico':  // ✅ NEW
      return 'Soporte Técnico';
    case 'creador':
      return 'Creador';
    case 'profesor':
      return 'Profesor';
    case 'jugador':
    default:
      return 'Jugador';
  }
};

// 3. Update redirection logic (this would need to be applied to the main useEffect)
const applyRedirectionFixes = (currentUser) => {
  if (!currentUser) return;
  
  const primaryRole = getUserPrimaryRole(currentUser);
  console.log('🎯 Primary role determined:', primaryRole);
  
  const handleRoleRedirect = (roleName, panelFile, roleEmoji, roleDisplayName) => {
    console.log(`${roleEmoji} ${roleDisplayName} DETECTED (${currentUser.nickname}) - Starting redirect process`);
    const currentUrl = window.location.href;
    const isInCorrectPanel = currentUrl.includes(panelFile);
    
    if (!isInCorrectPanel) {
      console.log(`🎯 REDIRECTING TO ${roleDisplayName.toUpperCase()} PANEL NOW`);
      const uniqueId = Date.now() + Math.random();
      window.location.href = `${panelFile}?auth=${uniqueId}`;
    } else {
      console.log(`✅ ${roleDisplayName} already in correct location`);
    }
  };
  
  // Redirect based on primary role
  switch (primaryRole) {
    case 'administrador_principal':
      handleRoleRedirect('administrador_principal', 'admin-principal-panel.html', '🔀', 'Admin Principal');
      break;
      
    case 'administrador_secundario':
      handleRoleRedirect('administrador_secundario', 'admin-secundario-panel.html', '🔀', 'Admin Secundario');
      break;
      
    case 'soporte_tecnico':  // ✅ NEW
      handleRoleRedirect('soporte_tecnico', 'support-dashboard.html', '🛠️', 'Support');
      break;
      
    case 'creador':
      handleRoleRedirect('creador', 'creators-panel-content.html', '🎨', 'Content Creator');
      break;
      
    case 'profesor':
      // ✅ FIXED: Use correct professor panel URL
      handleRoleRedirect('profesor', 'profesores-panel-funcionalidades.html', '👨‍🏫', 'Teacher');
      break;
      
    case 'jugador':
      handleRoleRedirect('jugador', 'jugadores-panel-gaming.html', '🎮', 'Player');
      break;
      
    default:
      console.log(`❓ UNKNOWN ROLE (${primaryRole}) for user ${currentUser.nickname} - Defaulting to player panel`);
      handleRoleRedirect('default', 'jugadores-panel-gaming.html', '🎮', 'Player');
      break;
  }
};

console.log('✅ Role fixes applied successfully');
console.log('📋 Summary of fixes:');
console.log('  - Added support for soporte_tecnico role');
console.log('  - User "admin" now maps to soporte_tecnico');
console.log('  - Support users redirect to support-dashboard.html');
console.log('  - Professors redirect to profesores-panel-funcionalidades.html');

// Export for testing
window.applyRedirectionFixes = applyRedirectionFixes;