# 🚀 Instalación Sistema de Comunicación PLAYTEST

## Estado del Despliegue

### ✅ **Completado:**
- [x] Commit y push de todos los archivos al repositorio
- [x] Instalación de dependencias adicionales (multer)
- [x] Corrección de vulnerabilidades de seguridad
- [x] Estructura mínima de base de datos creada
- [x] Servidor backend funcionando con nuevas rutas
- [x] Validación de endpoints de API

### 🔄 **En Progreso:**
- [ ] Completar esquema de comunicación en BD
- [ ] Crear usuario AdminPrincipal inicial
- [ ] Testing completo de interfaces frontend
- [ ] Integración con navegación existente

## Pasos de Instalación Completa

### 1. **Prerequisitos**
```bash
# Node.js 18+ y PostgreSQL 12+ requeridos
node --version  # Debería ser v18+
psql --version  # PostgreSQL 12+
```

### 2. **Clonar e Instalar**
```bash
git clone https://github.com/kikejfer/PLAYTEST-AISTUDIO.git
cd PLAYTEST-AISTUDIO/playtest-backend
npm install
```

### 3. **Configurar Base de Datos**
```bash
# Aplicar esquemas en orden:
# 1. Esquema base (si no existe)
psql -d playtest -f ../database-schema.sql

# 2. MANUAL: Completar tablas de comunicación
psql -d playtest -c "
CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id INTEGER REFERENCES users(id) NOT NULL,
    message_text TEXT NOT NULL,
    message_html TEXT,
    is_internal BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    read_by JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES ticket_messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_image BOOLEAN DEFAULT false,
    thumbnail_path VARCHAR(500)
);
"

# Crear directorios necesarios
mkdir -p playtest-backend/uploads/tickets
```

### 4. **Iniciar Servidor**
```bash
cd playtest-backend
npm start

# Debería mostrar:
# ✅ Connected to PostgreSQL database
# 🚀 Server running on port 3000
```

### 5. **Crear Usuario AdminPrincipal**
```bash
# Desde la interfaz web o API:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "AdminPrincipal", 
    "password": "admin123456",
    "email": "admin@playtest.com"
  }'
```

### 6. **Integrar Frontend**
```html
<!-- Agregar en cada página HTML donde quieras soporte -->
<script src="navigation-service.js"></script>

<!-- Para botones específicos de bloque -->
<script>
// En páginas de bloques específicos
const blockId = 123; // ID del bloque actual
const blockName = "Matemáticas"; // Nombre del bloque
const reportButton = NavigationService.createBlockReportButton(blockId, blockName);
document.getElementById('block-actions').appendChild(reportButton);
</script>
```

## Verificación del Sistema

### ✅ **Endpoints Disponibles**
```bash
# Verificar servidor
curl http://localhost:3000/health

# Verificar autenticación (debe requerir token)
curl http://localhost:3000/api/roles/my-roles
# Respuesta esperada: {"error":"Access token required"}

# Verificar categorías (con token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/communication/categories/global
```

### ✅ **Archivos del Sistema**
- `support-form.html` - Formulario unificado de soporte
- `ticket-chat.html` - Chat en tiempo real
- `tickets-list.html` - Panel de gestión
- `admin-principal-panel.html` - Panel administrador principal  
- `admin-secundario-panel.html` - Panel administrador secundario
- `navigation-service.js` - Integración automática

### ✅ **API Routes**
- `/api/roles/*` - Sistema de roles (15+ endpoints)
- `/api/communication/*` - Sistema de tickets y chat (10+ endpoints)

## Testing Manual

### 1. **Test Básico de Soporte**
1. Abrir `support-form.html?type=global`
2. Seleccionar categoría "Ayuda general de uso"
3. Llenar formulario y enviar
4. Verificar que aparece en `tickets-list.html`

### 2. **Test de Chat**
1. Abrir ticket desde la lista
2. Enviar mensajes en el chat
3. Verificar tiempo real (polling cada 3s)

### 3. **Test de Roles**
1. Registrar usuario "AdminPrincipal"
2. Verificar acceso a panel de administración
3. Crear administrador secundario
4. Probar paneles diferenciados

## Troubleshooting

### 🔧 **Problemas Comunes**

#### Servidor no inicia
```bash
# Verificar puerto
netstat -an | grep :3000
# Si está ocupado, cambiar puerto en .env
PORT=3001
```

#### Error de BD
```bash
# Verificar conexión
psql -d playtest -c "SELECT version();"

# Revisar variables de entorno
cat playtest-backend/.env
```

#### Archivos no cargan
```bash
# Verificar permisos de directorio
ls -la playtest-backend/uploads/
chmod 755 playtest-backend/uploads/
```

#### Frontend no conecta
```bash
# Verificar CORS en server.js
# Agregar tu dominio a allowedOrigins si es necesario
```

### 🆘 **Logs Importantes**
```bash
# Logs del servidor
cd playtest-backend && npm start

# Logs de BD en desarrollo
tail -f /var/log/postgresql/postgresql-*.log

# Verificar uploads
ls -la playtest-backend/uploads/tickets/
```

## Próximos Pasos

### Inmediatos
1. ✅ Completar esquema de BD de comunicación
2. ✅ Testing exhaustivo de todas las funcionalidades
3. ✅ Integración con navegación existente
4. ✅ Configurar cron job para escalado automático

### Opcionales
- [ ] Configurar notificaciones por email
- [ ] Integración con webhooks externos
- [ ] Dashboard de métricas de soporte
- [ ] Sistema de plantillas de respuesta

## Comandos de Mantenimiento

```bash
# Escalado manual de tickets
curl -X POST http://localhost:3000/api/communication/escalate-tickets \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Backup de tickets
pg_dump -t tickets -t ticket_messages playtest > backup_tickets.sql

# Limpiar notificaciones antiguas (ejecutar mensualmente)
psql -d playtest -c "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '3 months';"
```

## ⚡ Estado Actual

**Sistema OPERATIVO** con funcionalidades básicas:
- ✅ Backend API completo
- ✅ Servidor funcionando  
- ✅ Estructura mínima de BD
- ✅ Interfaces frontend listas
- ✅ Sistema de roles básico
- 🔄 Esquema de comunicación en proceso

**Próximo paso crítico**: Completar esquema de comunicación en BD para que los formularios y chat funcionen completamente.