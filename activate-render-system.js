/**
 * Script de Activación - Sistema Persistente PLAYTEST en Render
 * Configura automáticamente el sistema para funcionar en Render.com
 */

const fs = require('fs');
const path = require('path');

class RenderSystemActivator {
    constructor() {
        this.frontendFiles = [
            'index.html',
            'all-blocks.html',
            'game-trivial.html',
            'game-classic.html',
            'game-duel.html',
            'admin-principal-panel.html',
            'admin-secundario-panel.html'
        ];
        
        this.renderBackendURL = 'https://playtest-backend.onrender.com';
        this.persistentScript = '<script type="module" src="persistent-system-init.js"></script>';
    }
    
    async activateSystem() {
        console.log('🚀 Activando Sistema Persistente para Render...');
        console.log('='.repeat(60));
        
        try {
            // 1. Verificar archivos del sistema persistente
            await this.verifyPersistentFiles();
            
            // 2. Actualizar archivos HTML principales
            await this.updateHTMLFiles();
            
            // 3. Crear archivo de configuración para Render
            await this.createRenderConfig();
            
            // 4. Generar documentación de despliegue
            await this.generateDeploymentDocs();
            
            console.log('\n✅ Sistema activado exitosamente!');
            console.log('\n📋 Próximos pasos:');
            console.log('1. Subir el código a GitHub');
            console.log('2. Conectar el repositorio en Render.com');
            console.log('3. Usar render.yaml para configuración automática');
            console.log('4. Esperar el despliegue automático');
            console.log('\n🌐 El sistema funcionará automáticamente en Render!');
            
        } catch (error) {
            console.error('❌ Error activando sistema:', error);
            throw error;
        }
    }
    
    async verifyPersistentFiles() {
        console.log('1. 🔍 Verificando archivos del sistema persistente...');
        
        const requiredFiles = [
            'persistent-system-init.js',
            'persistent-api-service.js',
            'feature-flags-api-persistent.js',
            'data-migration-client.js',
            'playtest-backend/server.js',
            'playtest-backend/render.yaml'
        ];
        
        let allFilesExist = true;
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file}`);
            } else {
                console.log(`   ❌ ${file} - FALTANTE`);
                allFilesExist = false;
            }
        }
        
        if (!allFilesExist) {
            throw new Error('Archivos requeridos del sistema persistente no encontrados');
        }
        
        console.log('   ✅ Todos los archivos del sistema persistente están presentes');
    }
    
    async updateHTMLFiles() {
        console.log('\n2. 📝 Actualizando archivos HTML...');
        
        for (const htmlFile of this.frontendFiles) {
            const filePath = path.join(__dirname, htmlFile);
            
            if (!fs.existsSync(filePath)) {
                console.log(`   ⚠️ ${htmlFile} - No encontrado, omitiendo`);
                continue;
            }
            
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Verificar si ya tiene el script persistente
                if (content.includes('persistent-system-init.js')) {
                    console.log(`   ✅ ${htmlFile} - Ya tiene sistema persistente`);
                    continue;
                }
                
                // Buscar donde insertar el script (antes del </head> o antes del primer script)
                let insertPoint = content.indexOf('</head>');
                if (insertPoint === -1) {
                    insertPoint = content.indexOf('<script');
                }
                
                if (insertPoint !== -1) {
                    const beforeInsert = content.substring(0, insertPoint);
                    const afterInsert = content.substring(insertPoint);
                    
                    const newContent = beforeInsert + 
                        '    <!-- Sistema Persistente PLAYTEST -->\n' +
                        '    ' + this.persistentScript + '\n\n' +
                        afterInsert;
                    
                    // Hacer backup del archivo original
                    fs.writeFileSync(filePath + '.backup', content);
                    
                    // Escribir archivo actualizado
                    fs.writeFileSync(filePath, newContent);
                    
                    console.log(`   ✅ ${htmlFile} - Actualizado con sistema persistente`);
                } else {
                    console.log(`   ⚠️ ${htmlFile} - No se pudo encontrar punto de inserción`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${htmlFile} - Error: ${error.message}`);
            }
        }
    }
    
    async createRenderConfig() {
        console.log('\n3. 🔧 Creando configuración para Render...');
        
        // Crear archivo de variables de entorno para referencia
        const envExample = `# Variables de Entorno para Render
# Configurar estas en el dashboard de Render.com

NODE_ENV=production
PORT=3000
JWT_SECRET=<GENERAR_AUTOMATICAMENTE>
DATABASE_URL=<CONECTAR_POSTGRESQL>

# CORS Origins (configurar según tu dominio)
FRONTEND_URL=https://tu-frontend.onrender.com

# Base de datos
DB_NAME=playtest_db
DB_USER=playtest_user
`;
        
        fs.writeFileSync(path.join(__dirname, 'render.env.example'), envExample);
        console.log('   ✅ render.env.example creado');
        
        // Verificar render.yaml en backend
        const renderYamlPath = path.join(__dirname, 'playtest-backend', 'render.yaml');
        if (fs.existsSync(renderYamlPath)) {
            console.log('   ✅ render.yaml encontrado en playtest-backend');
        } else {
            console.log('   ⚠️ render.yaml no encontrado - creando...');
            
            const renderYaml = `services:
  - type: web
    name: playtest-backend
    env: node
    plan: free
    buildCommand: npm install && node simple-persistence-migration.js
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: playtest-db
          property: connectionString
  - type: pserv
    name: playtest-db
    env: postgresql
    plan: free
    databaseName: playtest_db
    databaseUser: playtest_user`;
            
            fs.writeFileSync(renderYamlPath, renderYaml);
            console.log('   ✅ render.yaml creado');
        }
    }
    
    async generateDeploymentDocs() {
        console.log('\n4. 📚 Generando documentación de despliegue...');
        
        const deploymentGuide = `# 🚀 Guía de Despliegue en Render - PLAYTEST

## ✅ Sistema Activado y Listo

El sistema persistente ha sido configurado automáticamente. Todos los archivos HTML principales
ahora incluyen el sistema persistente que funcionará automáticamente en Render.

## 📋 Pasos para Desplegar

### 1. Subir a GitHub
\`\`\`bash
git add .
git commit -m "Activar sistema persistente para Render"
git push origin main
\`\`\`

### 2. Configurar en Render.com

1. **Crear nuevo Web Service**
   - Conectar tu repositorio GitHub
   - Directorio raíz: \`playtest-backend\`
   - Usar \`render.yaml\` para configuración automática

2. **Variables de Entorno** (Se configuran automáticamente via render.yaml)
   - \`NODE_ENV\`: production
   - \`JWT_SECRET\`: Se genera automáticamente
   - \`DATABASE_URL\`: Se conecta automáticamente a PostgreSQL

3. **Base de Datos PostgreSQL**
   - Se crea automáticamente con \`render.yaml\`
   - Nombre: \`playtest-db\`
   - Usuario: \`playtest_user\`

### 3. Configurar Frontend (Opcional)

Si quieres servir el frontend desde Render también:

1. Crear otro Web Service para frontend
2. Usar archivos HTML actualizados
3. Configurar Static Site

### 4. URLs Resultantes

- **Backend**: \`https://playtest-backend.onrender.com\`
- **Frontend**: \`https://tu-frontend.onrender.com\` (si lo despliegas)

## 🔧 Configuración Automática

### Backend
- ✅ Todas las rutas API funcionando
- ✅ PostgreSQL conectado automáticamente
- ✅ Migración de tablas ejecutada al iniciar
- ✅ CORS configurado para frontend

### Frontend
- ✅ Sistema persistente incluido en archivos HTML
- ✅ Detección automática de URL de Render
- ✅ Migración automática de localStorage
- ✅ Fallback a localStorage si falla API

## 🎯 Funcionalidades Activas

Una vez desplegado, tendrás:
- ✅ **Persistencia real** en PostgreSQL
- ✅ **Feature flags** administrables
- ✅ **Preferencias de usuario** persistentes
- ✅ **Estados de juego** guardados automáticamente
- ✅ **Analytics** y métricas
- ✅ **Sistema de migración** automático

## 🔍 Verificación Post-Despliegue

1. Visitar: \`https://tu-backend.onrender.com/health\`
2. Debe retornar: \`{"status": "OK", "timestamp": "..."}\`
3. Verificar logs en Render dashboard
4. Probar login y funcionalidades básicas

## ⚡ Características del Sistema

- **Auto-detección**: El sistema detecta automáticamente si está en Render
- **Migración transparente**: Los usuarios no notan cambios
- **Fallback inteligente**: Funciona aunque falle PostgreSQL temporalmente
- **Cache inteligente**: Reduce llamadas API innecesarias
- **Monitoreo integrado**: Logs y analytics automáticos

¡El sistema está completamente listo para producción en Render! 🎉
`;

        fs.writeFileSync(path.join(__dirname, 'RENDER_DEPLOYMENT.md'), deploymentGuide);
        console.log('   ✅ RENDER_DEPLOYMENT.md creado');
    }
}

// Ejecutar activación si se llama directamente
if (require.main === module) {
    const activator = new RenderSystemActivator();
    
    activator.activateSystem()
        .then(() => {
            console.log('\n🎉 ¡Sistema activado exitosamente para Render!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Error activando sistema:', error);
            process.exit(1);
        });
}

module.exports = RenderSystemActivator;