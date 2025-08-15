# Sistema de Roles Jerárquico No Excluyente - PLAYTEST

## Descripción General

Este documento describe la implementación completa del sistema de roles jerárquico no excluyente para la aplicación PLAYTEST, que permite la gestión de múltiples tipos de usuario con roles simultáneos y asignación automática.

## Estructura de Roles

### Jerarquía de Roles (No Excluyentes)

1. **Administrador Principal** (Nivel 1)
   - Acceso total al sistema
   - Gestión de otros administradores
   - Asignación inicial de profesores/creadores
   - Nickname especial: "AdminPrincipal" (auto-asignación)

2. **Administrador Secundario** (Nivel 2)  
   - Acceso total pero gestiona usuarios asignados
   - Asignado manualmente por Administrador Principal
   - Redistribución automática de usuarios

3. **Profesor/Creador de contenido** (Nivel 3)
   - Auto-asignado al crear primer bloque público
   - Responsable de incidencias de sus bloques
   - Gestión de contenido propio

4. **Usuario** (Nivel 4)
   - Auto-asignado al cargar primer bloque ajeno
   - Acceso a juegos y funcionalidades básicas

5. **Servicio Técnico** (Nivel 5)
   - Recibe únicamente incidencias técnicas generales
   - Asignación manual

## Archivos Implementados

### Base de Datos
- `database-schema-roles.sql`: Esquema completo con tablas, triggers y funciones

### Backend
- `routes/roles.js`: API completa para gestión de roles
- Actualización en `server.js`: Registro de rutas de roles

### Frontend
- `admin-principal-panel.html`: Panel completo del Administrador Principal
- `admin-secundario-panel.html`: Panel del Administrador Secundario

## Funcionalidades Principales

### 1. Sistema de Asignación Automática

#### Auto-asignación de Profesor/Creador
```sql
-- Trigger que se ejecuta al crear un bloque público
CREATE TRIGGER trigger_auto_assign_profesor_creador
    AFTER INSERT ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_profesor_creador();
```

#### Auto-asignación de Usuario
```sql
-- Trigger que se ejecuta al cargar bloques ajenos
CREATE TRIGGER trigger_auto_assign_usuario
    AFTER UPDATE OF loaded_blocks ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_usuario_role();
```

#### Auto-asignación de AdminPrincipal
```sql
-- Trigger que se ejecuta en el registro
CREATE TRIGGER trigger_check_admin_principal
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_principal_registration();
```

### 2. Algoritmo de Redistribución Automática

Cuando se crea un nuevo Administrador Secundario:
1. Se obtienen todos los usuarios sin asignar (profesores y usuarios básicos)
2. Se distribuyen equitativamente entre todos los Admin. Secundarios
3. Se excluye al AdminPrincipal de las asignaciones

### 3. Sistema de Luminarias

Tabla `user_luminarias` que trackea:
- **actuales**: Luminarias disponibles
- **ganadas**: Total ganadas en juegos
- **gastadas**: Usadas en funcionalidades  
- **abonadas**: Agregadas manualmente por admin
- **compradas**: Adquiridas con dinero real

### 4. Panel del Administrador Principal

#### Sección 1: Administradores Secundarios
- Listado con estadísticas de cada admin
- Botón para añadir nuevos admins por nickname
- Ordenación por luminarias descendente

#### Sección 2: Profesores/Creadores  
- Información expandible hasta nivel pregunta
- Desplegables para reasignar entre admins
- Datos completos de luminarias
- Estructura: Usuario → Bloque → Tema → Pregunta

#### Sección 3: Usuarios (Jugadores)
- Listado con reasignación entre admins
- Ordenación por luminarias
- Información de bloques cargados

### 5. Panel de Administradores Secundarios

#### Diferencias vs Panel Principal:
- **SIN datos de luminarias**
- **SIN funcionalidad de reasignación**
- Solo usuarios asignados a ese admin específico
- Resumen estadístico personalizado

#### Secciones:
1. **Profesores Asignados**: Con expansión de contenido
2. **Usuarios Asignados**: Listado básico

## Endpoints de API

### Autenticación y Roles
- `GET /api/roles/my-roles`: Obtener roles del usuario actual
- `POST /api/roles/assign-admin-secundario`: Asignar admin secundario (solo AdminPrincipal)
- `POST /api/roles/reassign-user`: Reasignar usuario a otro admin (solo AdminPrincipal)

### Paneles Administrativos
- `GET /api/roles/admin-principal-panel`: Datos completos del panel principal
- `GET /api/roles/admin-secundario-panel`: Datos del panel secundario

### Información Expandible  
- `GET /api/roles/profesor-blocks/:profesorId`: Bloques de un profesor
- `GET /api/roles/block-topics/:blockId`: Temas de un bloque
- `GET /api/roles/topic-questions/:blockId/:topic`: Preguntas de un tema

## Características Técnicas

### Seguridad
- Middleware `requireAdminRole` verifica permisos
- Verificación de asignaciones antes de mostrar datos
- Tokens JWT para autenticación

### Performance
- Índices optimizados en tablas de roles
- Vista `user_complete_info` para consultas complejas
- Paginación y límites en consultas grandes

### Escalabilidad
- Sistema de roles extensible
- Algoritmo de redistribución eficiente
- Estructura modular de componentes

## Instalación y Despliegue

### 1. Base de Datos
```bash
# Ejecutar el esquema de roles
psql -d playtest -f database-schema-roles.sql
```

### 2. Backend
```bash
# Las rutas ya están registradas en server.js
# Solo reiniciar el servidor
npm start
```

### 3. Frontend
- Los archivos HTML están listos para usar
- Incluir en el sistema de navegación principal
- Configurar rutas de acceso según roles

## Flujo de Uso

### Registro Inicial
1. Usuario se registra con nickname "AdminPrincipal" → Auto-asignación de rol
2. Otros usuarios se registran → Sin rol inicial

### Creación de Contenido
1. Usuario crea primer bloque público → Auto-asignación "profesor_creador"
2. AdminPrincipal ve al nuevo profesor en su panel
3. Sistema puede auto-asignar profesor a un Admin Secundario

### Consumo de Contenido
1. Usuario carga bloque ajeno → Auto-asignación "usuario" 
2. Sistema lo asigna automáticamente a un Admin Secundario

### Gestión Administrativa
1. AdminPrincipal asigna Administradores Secundarios
2. Redistribución automática de usuarios
3. Reasignaciones manuales según necesidades

## Mantenimiento

### Logs Importantes
- Asignaciones automáticas de roles
- Redistribuciones de usuarios
- Errores de permisos

### Monitoreo
- Número de usuarios por Admin Secundario
- Carga de trabajo distribuida
- Actividad de creación de contenido

### Backup
- Tablas críticas: `user_roles`, `admin_assignments`, `user_luminarias`
- Triggers y funciones de auto-asignación

## Extensibilidad

### Nuevos Roles
1. Agregar en tabla `roles`
2. Definir permisos en JSON
3. Crear triggers de auto-asignación si aplica
4. Actualizar paneles administrativos

### Nuevas Funcionalidades
- Sistema de notificaciones por rol
- Reportes avanzados por admin
- Gestión de incidencias automática
- Sistema de recompensas por luminarias

Este sistema proporciona una base sólida y escalable para la gestión de roles en PLAYTEST, con automatización inteligente y interfaces administrativas completas.