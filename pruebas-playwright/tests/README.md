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

### **archived** ⚠️
Tests auxiliares archivados (usados para debugging del endpoint bulk):
- debug.spec.js, debug-file-selection.spec.js, manual-debug-selection.spec.js
- visual-verification.spec.js, visual-block-creation.spec.js, manual-observation.spec.js  
- roles.spec.js (redundante - combina todos los tests)

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
```

### Tests Rápidos (solo core):
```bash
npx playwright test tests/03-funcionalidad-core/block-creation.spec.js tests/03-funcionalidad-core/block-loading.spec.js
```

## ✅ Estado Actual
- **Endpoint `/questions/bulk`**: ✅ Funcionando
- **Test 1** (block-creation): ✅ Exitoso
- **Test 2** (block-loading): ✅ Exitoso  
- **Suite limpia**: ✅ Organizada por categorías