# 🎫 Guía de Pruebas del Sistema de Soporte Técnico

## 🚀 Introducción
Esta guía te permitirá probar todas las funcionalidades del sistema de soporte técnico implementado.

---

## 📋 **1. Acceso al Sistema**

### **Dashboard Principal**
```
URL: /support-dashboard.html
```
- **Vista:** Panel de control completo con métricas en tiempo real
- **Funciones:** Analytics, gestión de tickets, grupos, y base de conocimiento

### **Lista de Tickets**
```  
URL: /tickets-list.html
```
- **Vista:** Lista completa de todos tus tickets
- **Funciones:** Filtros avanzados, búsqueda, paginación

### **Chat de Ticket**
```
URL: /ticket-chat.html?ticket=ID
```
- **Vista:** Conversación individual del ticket
- **Funciones:** Mensajes, escalación, marcado de soluciones

---

## 🧪 **2. Pruebas Paso a Paso**

### **A. Dashboard de Soporte**

1. **Acceder al dashboard:**
   ```
   Abre: support-dashboard.html
   ```

2. **Verificar métricas:**
   - ✅ Total de tickets abiertos
   - ✅ Tickets resueltos hoy  
   - ✅ Satisfacción promedio
   - ✅ Tiempo promedio de resolución

3. **Probar navegación entre pestañas:**
   - 🎫 **Tickets:** Lista con filtros y acciones
   - 👥 **Grupos:** Gestión de grupos de tickets
   - 📚 **Base de Conocimiento:** Artículos y soluciones
   - 📊 **Analytics:** Reportes y métricas detalladas

4. **Generar reporte:**
   - Ir a pestaña "Analytics"
   - Clic en "Generar Reporte"
   - ✅ Descarga automática de CSV

### **B. Lista de Tickets**

1. **Acceder a la lista:**
   ```
   Abre: tickets-list.html
   ```

2. **Probar filtros avanzados:**
   - **Estado:** Abierto, En Progreso, Esperando Usuario, etc.
   - **Prioridad:** Baja, Media, Alta, Crítica, Urgente
   - **Categoría:** (se cargan dinámicamente)
   - **Escalación:** Sin escalar, Nivel 1, Nivel 2

3. **Verificar funcionalidades:**
   - ✅ Búsqueda en tiempo real
   - ✅ Notificaciones automáticas
   - ✅ Estadísticas en vivo
   - ✅ Filtro "Limpiar" funciona

### **C. Chat de Ticket Individual**

1. **Acceder desde la lista:**
   - Clic en cualquier ticket de la lista
   - Se abre: `ticket-chat.html?ticket=ID`

2. **Probar sidebar de información:**
   - ✅ Número y título del ticket
   - ✅ Estado, prioridad, categoría
   - ✅ Información de escalación (si aplica)
   - ✅ Participantes y fechas
   - ✅ Tickets relacionados (si existen)

3. **Probar funciones de agente** (si tienes permisos):
   - **Cambiar estado:** Usar dropdown y "Actualizar Estado"
   - **Asignar a mí:** Clic en "Asignar a Mí"
   - **Escalar ticket:** Clic en "Escalar Ticket"

4. **Probar chat:**
   - ✅ Escribir y enviar mensajes
   - ✅ Notas internas (toggle rojo si eres agente)
   - ✅ Adjuntar archivos (icono 📎)
   - ✅ Marcar comentarios como solución

---

## 🔧 **3. Funcionalidades Especiales**

### **Para Administradores/Agentes:**
- **Dashboard completo:** Todas las métricas y gestión
- **Asignación de tickets:** Auto-asignación y manual
- **Escalación:** Manual con motivo
- **Notas internas:** Comunicación privada del equipo
- **Marcado de soluciones:** Identificar respuestas que resuelven

### **Para Usuarios Regulares:**
- **Lista de sus tickets:** Solo ven tickets propios
- **Chat básico:** Envío de mensajes y adjuntos
- **Seguimiento:** Estado y progreso de sus tickets

### **Características Avanzadas:**
- **Agrupación automática:** Tickets similares se agrupan
- **Escalación automática:** Por tiempo o reglas definidas
- **Base de conocimiento:** Artículos auto-sugeridos
- **Analytics:** Métricas de rendimiento y satisfacción

---

## 📊 **4. Validaciones de Funcionamiento**

### **Verificar que funciona:**
- [ ] Dashboard carga métricas reales
- [ ] Filtros en lista funcionan correctamente
- [ ] Chat permite enviar mensajes
- [ ] Estados de tickets se actualizan
- [ ] Notificaciones aparecen automáticamente
- [ ] Reportes CSV se descargan
- [ ] Escalación funciona (para agentes)
- [ ] Marcado de soluciones funciona

### **APIs conectadas:**
- `/api/support/tickets` - Lista y gestión de tickets
- `/api/support/dashboard/metrics` - Métricas del dashboard
- `/api/support/categories` - Categorías para filtros
- `/api/support/groups` - Gestión de grupos
- `/api/support/knowledge-base` - Base de conocimiento
- `/api/support/notifications` - Sistema de notificaciones

---

## 🚨 **5. Solución de Problemas**

### **Si algo no funciona:**

1. **Error 404:** Verifica que el backend esté ejecutándose
2. **Sin datos:** Asegúrate de tener tickets en la base de datos
3. **Sin permisos:** Verifica tu rol de usuario (admin/agente/usuario)
4. **Filtros vacíos:** Las categorías se cargan desde la base de datos

### **Crear datos de prueba:**
```bash
# Crear tickets de ejemplo mediante API
POST /api/support/tickets
{
  "subject": "Problema de prueba",
  "description": "Descripción del problema",
  "priority": "medium",
  "category_id": 1
}
```

---

## ✅ **6. Checklist de Pruebas Completas**

- [ ] **Dashboard:** Métricas, navegación, generación de reportes
- [ ] **Lista:** Filtros, búsqueda, paginación, estadísticas
- [ ] **Chat:** Mensajes, cambio de estado, escalación
- [ ] **Notificaciones:** Aparecen y se marcan como leídas
- [ ] **Base de conocimiento:** Artículos visibles y navegables
- [ ] **Grupos:** Lista de grupos con métricas
- [ ] **Analytics:** Reportes y tendencias funcionando
- [ ] **Responsive:** Funciona en móvil y desktop

¡El sistema está completamente funcional y listo para uso en producción! 🎉