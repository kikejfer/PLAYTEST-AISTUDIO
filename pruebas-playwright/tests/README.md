# 📋 Suite de Tests Organizados - LumiQuiz/PlayTest

## 🎯 Estructura Organizacional

### **01-infraestructura** 
- `api-tests.spec.js` - Verificación backend health check y conectividad

### **02-autenticacion**
- `simple-roles.spec.js` - Tests básicos de login por roles
- `login-roles.spec.js` - Tests completos de autenticación y redirección

### **03-funcionalidad-core** (Orden de ejecución)
1. `block-creation.spec.js` - **Test 1**: Creación de bloques con carga multiarchivo (AndGar)
2. `block-loading.spec.js` - **Test 2**: Carga de bloques por jugadores (JaiGon, SebDom)  
3. `sequential-block-test.spec.js` - Test de persistencia inmediata
4. `block-download.spec.js` - Descarga de bloques

### **04-administracion**
- `admin-management.spec.js` - Gestión de usuarios y reasignación (AdminPrincipal)
- `secondary-admin.spec.js` - Verificación admin secundario (kikejfer)

### **05-verificacion**
- `verify-andgar-block.spec.js` - Verificación visibilidad propios bloques
- `verify-block-availability.spec.js` - Verificación bloques disponibles para jugadores

### **06-frontend-utilities** 🆕
- `getCurrentUser-global.spec.js` - Tests de función global getCurrentUser
  - Verificación sin redeclaraciones
  - Compatibilidad cross-módulo
  - Manejo de tokens de autenticación
  - Funcionamiento después de reload

### **07-navigation-service** 🆕
- `navigation-service-core.spec.js` - Funcionalidad core del NavigationService
  - Inicialización por roles
  - Detección de usuario y rol
  - Inyección de botones de soporte
  - Funcionalidad de refresh
- `navigation-service-ui.spec.js` - Integración UI del NavigationService
  - Styling y posicionamiento
  - Responsividad mobile/tablet
  - Integración no intrusiva
  - Manejo de errores UI
  - Impacto en rendimiento

## 🚀 Ejecución de Tests

### Tests Principales (orden recomendado):
```bash
# Infraestructura
npx playwright test tests/01-infraestructura/

# Autenticación  
npx playwright test tests/02-autenticacion/

# Funcionalidad Core (secuencial)
npx playwright test tests/03-funcionalidad-core/block-creation.spec.js
npx playwright test tests/03-funcionalidad-core/block-loading.spec.js  
npx playwright test tests/03-funcionalidad-core/sequential-block-test.spec.js
npx playwright test tests/03-funcionalidad-core/block-download.spec.js

# Administración
npx playwright test tests/04-administracion/

# Verificación
npx playwright test tests/05-verificacion/

# Frontend Utilities (nuevos)
npx playwright test tests/06-frontend-utilities/

# Navigation Service (nuevos)
npx playwright test tests/07-navigation-service/
```

### Tests Rápidos (solo core):
```bash
npx playwright test tests/03-funcionalidad-core/block-creation.spec.js tests/03-funcionalidad-core/block-loading.spec.js
```

### Tests Frontend (nuevos):
```bash
# Test función getCurrentUser global
npx playwright test tests/06-frontend-utilities/getCurrentUser-global.spec.js

# Test NavigationService
npx playwright test tests/07-navigation-service/navigation-service-core.spec.js
npx playwright test tests/07-navigation-service/navigation-service-ui.spec.js
```

## ✅ Estado Actual
- **Endpoint `/questions/bulk`**: ✅ Funcionando
- **Test 1** (block-creation): ✅ Exitoso
- **Test 2** (block-loading): ✅ Exitoso  
- **Suite limpia**: ✅ Organizada por categorías
- **Frontend fixes**: ✅ navigation-service.js creado, getCurrentUser sin redeclaraciones
- **Nuevos tests**: ✅ 06-frontend-utilities y 07-navigation-service