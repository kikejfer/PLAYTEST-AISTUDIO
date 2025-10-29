# Documentación Markdown Obsoleta

Esta carpeta contiene archivos de documentación markdown que ya no son necesarios en la raíz del proyecto, pero se conservan como referencia histórica.

**Fecha de limpieza:** 29 de octubre de 2025
**Total de archivos movidos:** 27 archivos markdown

## Estructura de la Documentación Obsoleta

### 📁 documentacion-planes-deployment-obsoletos/ (9 archivos)

Múltiples versiones de planes de despliegue que han sido consolidadas o reemplazadas por versiones finales.

**Planes de despliegue LUMIQUIZ (6 versiones obsoletas):**
- `PLAN-DESPLIEGUE-LUMIQUIZ.md` - Versión original
- `PLAN-DESPLIEGUE-LUMIQUIZ-ACTUALIZADO.md` - Primera actualización
- `PLAN-DESPLIEGUE-LUMIQUIZ-AJUSTADO.md` - Versión ajustada
- `PLAN-DESPLIEGUE-LUMIQUIZ-COMPLETO.md` - Versión completa (63KB)
- `PLAN-DESPLIEGUE-LUMIQUIZ-DEFINITIVO.md` - Versión definitiva
- `PLAN-DESPLIEGUE-LUMIQUIZ-DEFINITIVO-FINAL.md` - Versión definitiva final

**Razón:** Se mantiene activo `PLAN-DESPLIEGUE-LUMIQUIZ-CONJUNTO-FINAL.md` en la raíz como el plan definitivo.

**Guías de deployment duplicadas:**
- `RENDER-DEPLOYMENT.md` - Guía de despliegue en Render (estilo largo)
- `RENDER_DEPLOYMENT.md` - Guía de despliegue en Render (estilo corto)
- `README-DEPLOYMENT.md` - README básico de deployment (23 líneas)

**Razón:** Se mantiene activo `DEPLOYMENT-GUIDE-FINAL.md` como guía definitiva de deployment.

---

### 📁 documentacion-analisis-fixes-completados/ (4 archivos)

Documentos de análisis y correcciones específicas que ya fueron aplicadas al código.

**Archivos:**
- `ANALISIS_CAUSA_RAIZ_SCORES.md` - Análisis de causa raíz sobre scores no guardados (Fecha: 8 Oct 2025)
- `FIX_APLICADO_SCORES.md` - Fix aplicado para el problema de scores (Commit: ef66796)
- `ESCALATION-FIX.md` - Fix del sistema de escalación de tickets
- `ESCALATION-SETUP.md` - Setup del sistema de escalación

**Razón:** Estos problemas ya fueron corregidos y los fixes están integrados en el código actual. Los documentos se conservan como referencia histórica del proceso de debugging.

---

### 📁 documentacion-testing-protocolos/ (5 archivos)

Protocolos de testing específicos y resultados que ya fueron ejecutados y completados.

**Archivos:**
- `PROTOCOLO_PRUEBAS_DUEL.md` - Protocolo de pruebas para modalidad Duel
- `PROTOCOLO_TESTING_COMET.md` - Protocolo de testing COMET
- `PROTOCOLO_TESTING_MODALIDADES.md` - Protocolo general de testing de modalidades
- `RESULTADOS_TESTING_MODALIDADES.md` - Resultados del testing de modalidades
- `Informe Tests.md` - Informe general de tests

**Razón:** Los protocolos ya fueron ejecutados y los tests están implementados en `pruebas-playwright/`. Se mantiene `TESTING_CHECKLIST.md` como checklist activo.

---

### 📁 documentacion-implementaciones-completadas/ (5 archivos)

Summaries y resúmenes de implementaciones que ya están completadas y en producción.

**Archivos:**
- `IMPLEMENTATION_SUMMARY.md` - Summary general de implementación
- `BLOCK_EXPANSION_SUMMARY.md` - Summary de expansión de bloques
- `FASE-2-FLUJO-CLASES-IMPLEMENTACION.md` - Implementación de flujo de clases (Fase 2)
- `RESUMEN_FASE2_GRUPOS_ASIGNACIONES.md` - Resumen de grupos y asignaciones
- `DATABASE-SCHEMA-MIGRATION-SUMMARY.md` - Summary de migración de schema

**Razón:** Estas implementaciones están completas y operativas. Los detalles actuales se encuentran en:
- `PLAN_MAESTRO_DESARROLLO.md` - Para el estado general del proyecto
- `DATABASE_SCHEMA_REFERENCE.md` - Para la referencia actual del schema
- `MIGRATION_GUIDE.md` - Para guías de migración

---

### 📁 documentacion-varios/ (8 archivos)

Documentación miscelánea de análisis específicos, comparaciones y versiones obsoletas.

**Archivos:**
- `AVAILABLE_BLOCKS_BUTTONS_REVIEW.md` - Review de botones de bloques disponibles
- `CRITICAL-TOPIC-SEPARATION.md` - Separación de tópicos críticos
- `PPF_VS_PCC_FILE_UPLOAD_COMPARISON.md` - Comparación de carga de archivos PPF vs PCC
- `Archivos.md` - Listado general de archivos (13KB)
- `deployment-status.md` - Status temporal de deployment
- `SISTEMA-ROLES-ACTUALIZADO.md` - Versión duplicada del sistema de roles
- `SISTEMA-COMUNICACION-COMPLETO.md` - Sistema de comunicación (superceded)
- `SOPORTE_TECNICO_BACKEND_REQUIREMENTS.md` - Requirements del soporte técnico backend

**Razón:**
- Reviews y comparaciones específicas completadas
- Status temporales que ya no reflejan el estado actual
- `SISTEMA-ROLES-ACTUALIZADO.md` es duplicado de `SISTEMA-ROLES-JERARQUICO.md` (activo)
- Funcionalidades ya implementadas y documentadas en guías actuales

---

## Archivos Markdown Activos (Mantenidos en Raíz)

Para referencia, estos son los archivos que **NO** se movieron porque están activos:

### Documentación Principal
- `README.md` - README principal del proyecto
- `PLAN_MAESTRO_DESARROLLO.md` - Plan maestro de desarrollo (actualizado: 22 Oct 2025)

### Guías de Instalación y Deployment
- `INSTALL.md` - Guía de instalación
- `DEPLOYMENT-GUIDE-FINAL.md` - Guía final definitiva de deployment
- `PLAN-DESPLIEGUE-LUMIQUIZ-CONJUNTO-FINAL.md` - Plan final de LUMIQUIZ

### Referencias de Sistema
- `DATABASE_SCHEMA_REFERENCE.md` - Referencia activa del schema de BD
- `MIGRATION_GUIDE.md` - Guía de migración
- `NAVIGATION_SYSTEM_README.md` - Sistema de navegación

### Guías de Roles y Permisos
- `SISTEMA-ROLES-JERARQUICO.md` - Sistema de roles jerárquico actual
- `DIFERENCIACION-ROLES-PPF-PCC.md` - Diferenciación de roles Profesor/Creador

### Guías de Testing y Verificación
- `TESTING_CHECKLIST.md` - Checklist activo de testing
- `SUPPORT_SYSTEM_TESTING_GUIDE.md` - Guía de testing del sistema de soporte
- `GUIA_VERIFICACION_GRUPOS_ASIGNACIONES.md` - Guía de verificación
- `SCRIPTS_VERIFICACION_README.md` - Scripts de verificación

### Guías de Componentes Específicos
- `SUPPORT-SYSTEM-GUIDE.md` - Guía del sistema de soporte
- `TEACHERS_PANEL_README.md` - README del panel de profesores

### Subdirectorios Activos
- `docs/BLOCK_OWNERSHIP_MODEL.md` - Modelo de ownership de bloques
- `playtest-backend/README.md` - README del backend
- `playtest-backend/migrations/README.md` - README de migraciones
- `pruebas-playwright/tests/README.md` - README de tests

---

## Notas Importantes

1. **Los archivos en esta carpeta NO se usan en la aplicación actual**
2. **Se conservan como referencia histórica** del proceso de desarrollo
3. **No eliminar sin revisar** - pueden contener información útil sobre decisiones de diseño
4. Se recomienda mantener esta documentación durante al menos 6 meses antes de considerar eliminación permanente

## Recomendaciones

- Si necesitas información sobre el proceso de desarrollo histórico, consulta estos archivos
- Para información actual del sistema, usa los archivos markdown activos en la raíz
- Antes de eliminar permanentemente, asegurar que no hay información única que deba preservarse
