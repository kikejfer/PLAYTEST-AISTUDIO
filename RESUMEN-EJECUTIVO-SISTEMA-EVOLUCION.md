# 📊 Resumen Ejecutivo - Sistema de Seguimiento y Evolución

## 🎯 Visión General

El Sistema de Seguimiento y Evolución transforma Lumiquiz en una plataforma de **aprendizaje adaptativo** que:

- ✅ Rastrea el progreso detallado de cada estudiante por bloque
- ✅ Identifica automáticamente áreas de dificultad
- ✅ Genera contenido de refuerzo personalizado
- ✅ Otorga recompensas (Luminarias) por logros
- ✅ Permite al profesor visualizar evolución en tiempo real
- ✅ Desbloquea contenido progresivamente según maestría

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO JUEGA                            │
│                     (Responde preguntas)                         │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              FIN DE PARTIDA (Backend)                            │
│  • Recibe respuestas en batch                                    │
│  • Llama: registrar_respuestas_batch()                          │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│         TABLA: historial_respuestas                              │
│  • Inserta cada respuesta individual                             │
│  • Trigger AUTOMÁTICO se dispara después del INSERT             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│      TRIGGER: trigger_actualizar_evolucion                       │
│  • Calcula maestría del bloque                                   │
│  • Actualiza racha, tasa de acierto, etc.                       │
│  • Determina estado (no_iniciado, en_progreso, completado)      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│           TABLA: evolucion_bloque                                │
│  • Maestría actualizada (0-100%)                                 │
│  • Estado actualizado                                            │
│  • Estadísticas recalculadas                                    │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│         VERIFICACIÓN DE LOGROS (Backend)                         │
│  • ¿Maestría >= 90%?                                             │
│    → Sí: Otorgar 100 Luminarias                                 │
│  • ¿Se desbloqueó nuevo bloque?                                 │
│    → Sí: Notificar al usuario                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Flujo de Datos Simplificado

```
Usuario responde pregunta
    ↓
historial_respuestas (INSERT)
    ↓
TRIGGER actualiza evolucion_bloque automáticamente
    ↓
Backend verifica logros
    ↓
Luminarias otorgadas si aplica
    ↓
Frontend actualiza UI
```

---

## 🗂️ Estructura de Tablas

### 1. **historial_respuestas** (Tabla principal de tracking)

| Campo               | Tipo         | Descripción                              |
|---------------------|--------------|------------------------------------------|
| historial_id        | SERIAL       | ID único de la respuesta                 |
| user_id             | INTEGER      | Usuario que respondió                    |
| question_id         | INTEGER      | Pregunta respondida                      |
| block_id            | INTEGER      | Bloque al que pertenece                  |
| fue_correcta        | BOOLEAN      | Si la respuesta fue correcta             |
| tiempo_respuesta    | INTEGER      | Milisegundos que tardó                   |
| modo_juego          | VARCHAR(50)  | Tipo de juego (classic, exam, refuerzo)  |
| fecha_respuesta     | TIMESTAMPTZ  | Cuándo respondió                         |

**Índices clave:**
- `(user_id, block_id)` - Queries de evolución por usuario/bloque
- `(user_id, question_id)` - Historial de pregunta específica
- `(fecha_respuesta DESC)` - Queries de actividad reciente

### 2. **evolucion_bloque** (Métricas agregadas por bloque)

| Campo                   | Tipo          | Descripción                          |
|-------------------------|---------------|--------------------------------------|
| user_id                 | INTEGER       | Usuario                              |
| block_id                | INTEGER       | Bloque                               |
| maestria                | DECIMAL(5,2)  | Porcentaje 0-100 de dominio          |
| estado                  | VARCHAR(20)   | no_iniciado/en_progreso/completado   |
| preguntas_vistas        | INTEGER       | Cuántas preguntas ha intentado       |
| racha_actual            | INTEGER       | Correctas consecutivas               |
| tasa_acierto_reciente   | DECIMAL(5,2)  | % acierto últimos 20 intentos        |
| tiempo_total_estudio    | INTEGER       | Minutos acumulados                   |

**Se actualiza automáticamente** vía trigger después de cada respuesta.

### 3. **block_prerequisites** (Árbol de conocimiento)

| Campo                  | Tipo          | Descripción                           |
|------------------------|---------------|---------------------------------------|
| block_id               | INTEGER       | Bloque que requiere prerequisito      |
| prerequisite_block_id  | INTEGER       | Bloque que debe completarse antes     |
| maestria_minima        | DECIMAL(5,2)  | % mínimo requerido (ej: 80%)          |
| requiere_completado    | BOOLEAN       | Si requiere estado "completado"       |

---

## 🧮 Cálculo de Maestría

La **maestría** de un bloque se calcula ponderando múltiples factores:

```
Maestría = (40% × Tasa Global) +
           (30% × Tasa Reciente) +
           (20% × Cobertura de Preguntas) +
           (10% × Bonus por Racha)
```

**Componentes:**

1. **Tasa Global (40%):** % de acierto de todas las respuestas del bloque
2. **Tasa Reciente (30%):** % de acierto de las últimas 20 respuestas
3. **Cobertura (20%):** % de preguntas únicas del bloque que ha respondido correctamente
4. **Bonus Racha (10%):** Puntos extra por racha de respuestas correctas consecutivas

**Estados derivados de maestría:**

| Maestría | Estado        | Descripción                              |
|----------|---------------|------------------------------------------|
| 0%       | no_iniciado   | No ha intentado el bloque                |
| 1-84%    | en_progreso   | Estudiando el bloque                     |
| 85-94%   | completado    | Bloque dominado                          |
| 95-100%  | maestro       | Maestría total del bloque                |

---

## 🎮 Modo de Juego "Refuerzo Personalizado"

### ¿Qué es?

Un nuevo modo de juego que genera quizzes personalizados con las preguntas que el usuario más necesita reforzar.

### ¿Cómo identifica preguntas difíciles?

La función `obtener_preguntas_dificiles()` selecciona preguntas donde:
- El usuario las ha intentado **al menos 2 veces**
- Tiene una **tasa de fallo > 40%**
- Las ordena por: mayor tasa de fallo → más intentos → más recientes

### Ejemplo:

```sql
SELECT * FROM obtener_preguntas_dificiles(
    1,    -- user_id
    5,    -- block_id (o NULL para todos)
    20    -- límite de preguntas
);
```

**Resultado:**
```
question_id | text_question             | tasa_fallo | total_intentos
------------|---------------------------|------------|---------------
    45      | ¿Capital de Francia?      | 75.00      | 8
    67      | ¿Fórmula del agua?        | 66.67      | 6
    89      | ¿Año de la Revolución?    | 60.00      | 5
```

---

## 🏆 Sistema de Recompensas (Luminarias)

### Integración con sistema existente

El nuevo sistema **NO crea** una tabla nueva de luminarias. **Usa el sistema existente:**

```javascript
// Al alcanzar 90% de maestría en un bloque
await pool.query(`
    SELECT process_luminarias_transaction(
        $1,                         -- user_id
        'earn',                     -- tipo: ganar
        100,                        -- cantidad
        'user',                     -- rol
        'achievements',             -- categoría
        'block_mastery',            -- subcategoría
        'complete_block',           -- acción
        'Dominio de bloque',        -- descripción
        $2,                         -- block_id
        'block',                    -- tipo de referencia
        '{}'                        -- metadata
    )
`, [userId, blockId]);
```

### Recompensas automáticas:

| Logro                       | Luminarias |
|-----------------------------|------------|
| Maestría 90% en bloque      | 100        |
| Completar todos prerequisitos| 50         |
| Racha de 10 correctas       | 20         |
| Modo refuerzo completado    | 30         |

---

## 👨‍🏫 Dashboard del Profesor

### Vista de evolución de estudiante

**Endpoint:** `GET /api/evolucion/estudiante/:id/resumen`

**Respuesta:**
```json
{
  "estudiante": {
    "id": 123,
    "nickname": "Juan",
    "email": "juan@example.com"
  },
  "evolucion": [
    {
      "block_id": 5,
      "block_name": "Matemáticas Básicas",
      "maestria": 85.50,
      "estado": "completado",
      "preguntas_vistas": 45,
      "total_preguntas": 50,
      "tiempo_estudio": 320,
      "tasa_acierto": 87.20,
      "racha_maxima": 12,
      "desbloqueado": true,
      "preguntas_dificiles": [
        {
          "question_id": 45,
          "text": "¿Cuál es la fórmula del área del círculo?",
          "intentos": 5,
          "tasa_fallo": 60.00
        }
      ]
    }
  ]
}
```

### Funcionalidades del profesor:

1. **Ver evolución completa** de cada estudiante
2. **Identificar preguntas problemáticas** automáticamente
3. **Desbloquear bloques manualmente** si el estudiante está listo
4. **Otorgar Luminarias de recompensa** por esfuerzo o logro especial
5. **Ver estadísticas comparativas** entre estudiantes

---

## 🔄 Sistema de Prerequisites (Desbloqueo Progresivo)

### Ejemplo de configuración:

```
Bloque 1: "Sumas Básicas"
    ↓
Bloque 2: "Restas Básicas" (requiere 80% maestría en Bloque 1)
    ↓
Bloque 3: "Multiplicación" (requiere completar Bloques 1 y 2)
    ↓
Bloque 4: "División" (requiere 90% maestría en Bloque 3)
```

**Código SQL:**
```sql
INSERT INTO block_prerequisites (block_id, prerequisite_block_id, maestria_minima, requiere_completado)
VALUES
    (2, 1, 80.00, false),   -- Bloque 2 requiere 80% en Bloque 1
    (3, 1, 85.00, true),    -- Bloque 3 requiere completar Bloque 1
    (3, 2, 85.00, true),    -- Bloque 3 requiere completar Bloque 2
    (4, 3, 90.00, false);   -- Bloque 4 requiere 90% en Bloque 3
```

**Verificar desbloqueo:**
```javascript
const desbloqueado = await pool.query(
    'SELECT bloque_desbloqueado($1, $2)',
    [userId, blockId]
);
// Retorna: true o false
```

---

## 📊 Vistas Materializadas (Performance)

### 1. mv_ranking_maestria

Ranking de usuarios por bloque, ordenado por maestría.

**Refresco:** Cada hora

### 2. mv_estadisticas_bloques

Estadísticas agregadas de cada bloque (promedio de maestría, tasa de acierto global, etc.)

**Refresco:** Cada hora

**Comando:**
```sql
SELECT refrescar_vistas_materializadas();
```

---

## 🧹 Mantenimiento Automático

### Limpieza de historial antiguo

**Función:** `limpiar_historial_antiguo()`

- Elimina respuestas de hace más de X días (default: 2 años)
- **Mantiene siempre las últimas 5 respuestas** de cada pregunta por usuario
- Ejecutar mensualmente

```sql
-- Eliminar respuestas de hace más de 2 años
SELECT limpiar_historial_antiguo(730);
```

### Cron jobs recomendados (Node.js)

```javascript
const cron = require('node-cron');

// Cada hora: refrescar vistas materializadas
cron.schedule('0 * * * *', async () => {
    await pool.query('SELECT refrescar_vistas_materializadas()');
});

// Cada día a las 3 AM: limpiar historial antiguo
cron.schedule('0 3 * * *', async () => {
    await pool.query('SELECT limpiar_historial_antiguo(730)');
});
```

---

## 📦 Archivos Entregados

1. **database-migration-sistema-evolucion.sql**
   - Script SQL completo (ejecutar en pgAdmin4)
   - Crea todas las tablas, funciones, triggers y vistas

2. **GUIA-RAPIDA-SISTEMA-EVOLUCION.md**
   - Comandos SQL útiles
   - Queries de ejemplo
   - Troubleshooting

3. **ENDPOINTS-API-SISTEMA-EVOLUCION.md**
   - Código completo de `routes/evolucion.js`
   - Ejemplos de integración frontend
   - Modificaciones necesarias en endpoints existentes

4. **RESUMEN-EJECUTIVO-SISTEMA-EVOLUCION.md** (este documento)
   - Visión general del sistema
   - Arquitectura y flujos
   - Guía de implementación

---

## 🚀 Pasos de Implementación

### Fase 1: Base de Datos ✅ LISTO
1. Ejecutar `database-migration-sistema-evolucion.sql` en pgAdmin4
2. Ejecutar migración de datos históricos
3. Inicializar evolución de bloques
4. Refrescar vistas materializadas

### Fase 2: Backend 🔨 PENDIENTE
1. Crear archivo `routes/evolucion.js` (código proporcionado)
2. Registrar ruta en `server.js`
3. Modificar endpoint de finalizar partida
4. Configurar cron jobs
5. Testing de endpoints

### Fase 3: Frontend Alumno 🔨 PENDIENTE
1. Añadir sección "Mi Progreso" en `jugadores-panel-gaming.html`
2. Implementar modo "Refuerzo Personalizado"
3. Mostrar barras de maestría por bloque
4. Contador de Luminarias visible
5. Notificaciones de logros

### Fase 4: Frontend Profesor 🔨 PENDIENTE
1. Pestaña "Evolución" en `teachers-panel-students.html`
2. Dashboard de progreso por estudiante
3. Lista de preguntas difíciles
4. Botón "Desbloquear bloque"
5. Otorgar Luminarias manualmente

### Fase 5: Testing 🔨 PENDIENTE
1. Testing de triggers (insertar respuestas de prueba)
2. Verificar cálculo de maestría
3. Probar desbloqueo de bloques
4. Performance testing con datos reales
5. Correcciones y ajustes

---

## 💡 Beneficios del Sistema

### Para el Alumno:
- ✅ **Visibilidad clara** de su progreso
- ✅ **Refuerzo personalizado** en áreas débiles
- ✅ **Motivación** a través de Luminarias y logros
- ✅ **Aprendizaje estructurado** con desbloqueo progresivo

### Para el Profesor:
- ✅ **Vista detallada** del progreso de cada alumno
- ✅ **Identificación automática** de áreas problemáticas
- ✅ **Intervención temprana** en estudiantes con dificultades
- ✅ **Reportes de evolución** para padres/institución

### Para la Plataforma:
- ✅ **Retención de usuarios** (gamificación)
- ✅ **Mejora del aprendizaje** (adaptativo)
- ✅ **Datos valiosos** para analytics
- ✅ **Diferenciación** competitiva

---

## 📊 Métricas de Éxito

Después de implementar, medir:

1. **Engagement:**
   - Tiempo promedio de estudio por sesión
   - Frecuencia de uso del modo refuerzo
   - Tasa de retorno semanal

2. **Aprendizaje:**
   - Evolución de maestría a lo largo del tiempo
   - Reducción de preguntas difíciles después de refuerzo
   - % de bloques completados por usuario

3. **Gamificación:**
   - Luminarias ganadas por logros de maestría
   - Racha máxima de respuestas correctas
   - Bloques desbloqueados

---

## 🎯 Próximos Pasos Inmediatos

1. **Revisar** los 3 documentos proporcionados
2. **Ejecutar** el script SQL en pgAdmin4 cuando estés listo
3. **Migrar** los datos históricos
4. **Implementar** los endpoints del backend
5. **Integrar** en el frontend gradualmente

---

## 🆘 Soporte

Si tienes dudas durante la implementación:

1. Revisa la **Guía Rápida** para comandos SQL
2. Consulta **Endpoints API** para código del backend
3. Usa las funciones de **Troubleshooting** en la guía

---

## 📈 Roadmap Futuro (Opcional)

Mejoras a considerar después de la implementación base:

1. **IA Predictiva:** Predecir probabilidad de éxito en exámenes
2. **Recomendaciones automáticas:** Sugerir bloques según perfil
3. **Analytics avanzados:** Heatmaps de dificultad, patrones temporales
4. **Modo colaborativo:** Estudiar en grupo con tracking compartido
5. **Exportar reportes:** PDF de evolución para padres/institución

---

**¡Sistema completo y listo para implementar!** 🚀

Las tablas, funciones y triggers están optimizados para performance y escalabilidad. El trigger automático se encarga de actualizar la maestría después de cada respuesta, por lo que no necesitas código adicional en el backend más allá de registrar las respuestas.

---

**Fecha de creación:** 2025-11-26
**Versión:** 1.0
**Autor:** Sistema de IA - Análisis de arquitectura Lumiquiz
