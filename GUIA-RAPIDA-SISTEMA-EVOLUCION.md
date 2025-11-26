# 📚 Guía Rápida - Sistema de Seguimiento y Evolución

## 🚀 Instalación Rápida

### 1. Ejecutar Script Principal
```sql
-- En pgAdmin4, abrir y ejecutar:
database-migration-sistema-evolucion.sql
```

### 2. Migrar Datos Históricos (IMPORTANTE - Una sola vez)
```sql
-- Esto migrará todos los datos de user_profiles.answer_history a historial_respuestas
SELECT * FROM migrate_answer_history_to_historial();
```

### 3. Inicializar Evolución de Bloques
```sql
-- Esto creará registros en evolucion_bloque para todos los usuarios con historial
SELECT * FROM inicializar_evolucion_bloques_existentes();
```

### 4. Refrescar Vistas Materializadas
```sql
SELECT refrescar_vistas_materializadas();
```

---

## 📊 Queries Útiles para Verificación

### Ver evolución de un usuario específico
```sql
SELECT * FROM obtener_resumen_evolucion_usuario(1); -- user_id = 1
```

### Ver preguntas difíciles de un usuario en un bloque
```sql
SELECT * FROM obtener_preguntas_dificiles(
    1,      -- user_id
    5,      -- block_id (NULL para todos los bloques)
    10      -- límite de preguntas
);
```

### Verificar si un bloque está desbloqueado
```sql
SELECT bloque_desbloqueado(1, 5); -- user_id=1, block_id=5
-- Retorna: true o false
```

### Ver estadísticas de un bloque
```sql
SELECT * FROM evolucion_bloque
WHERE user_id = 1 AND block_id = 5;
```

### Ver ranking de maestría de un bloque
```sql
SELECT * FROM mv_ranking_maestria
WHERE block_id = 5
ORDER BY ranking
LIMIT 10;
```

### Ver estadísticas globales de bloques
```sql
SELECT * FROM mv_estadisticas_bloques
ORDER BY maestria_promedio DESC;
```

---

## 🔧 Funciones Principales

### 1. Registrar Respuestas (Batch)
**Para usar al final de cada partida:**

```sql
SELECT registrar_respuestas_batch(
    1,  -- user_id
    123, -- game_id
    '[
        {
            "questionId": 45,
            "answerId": 178,
            "blockId": 5,
            "isCorrect": true,
            "timeSpent": 5200,
            "gameType": "classic",
            "difficulty": 3,
            "timestamp": "2025-11-26T10:30:00Z"
        },
        {
            "questionId": 46,
            "answerId": 182,
            "blockId": 5,
            "isCorrect": false,
            "timeSpent": 8500,
            "gameType": "classic",
            "difficulty": 2,
            "timestamp": "2025-11-26T10:30:15Z"
        }
    ]'::jsonb
);
-- Retorna: número de respuestas insertadas
```

### 2. Calcular Maestría Manualmente
```sql
SELECT calcular_maestria_bloque(1, 5); -- user_id, block_id
-- Retorna: DECIMAL (0.00 - 100.00)
```

### 3. Obtener Resumen Completo de Evolución
```sql
SELECT * FROM obtener_resumen_evolucion_usuario(1);
-- Retorna tabla con:
-- - Todos los bloques del usuario
-- - Maestría de cada uno
-- - Preguntas difíciles
-- - Si está desbloqueado
```

---

## 🎯 Establecer Prerequisitos de Bloques

### Ejemplo: Configurar árbol de conocimiento
```sql
-- Bloque 10 requiere completar bloque 5 con 80% maestría
INSERT INTO block_prerequisites (block_id, prerequisite_block_id, maestria_minima, requiere_completado)
VALUES (10, 5, 80.00, false);

-- Bloque 15 requiere completar bloques 5 Y 10
INSERT INTO block_prerequisites (block_id, prerequisite_block_id, maestria_minima, requiere_completado)
VALUES
    (15, 5, 90.00, true),   -- debe estar COMPLETADO
    (15, 10, 85.00, false); -- solo requiere 85% maestría

-- Verificar prerequisitos
SELECT
    bp.block_id,
    b1.name as bloque,
    bp.prerequisite_block_id,
    b2.name as prerequisito,
    bp.maestria_minima,
    bp.requiere_completado
FROM block_prerequisites bp
JOIN blocks b1 ON bp.block_id = b1.block_id
JOIN blocks b2 ON bp.prerequisite_block_id = b2.block_id
ORDER BY bp.block_id, bp.orden;
```

---

## 📈 Monitoreo y Estadísticas

### Ver top 10 usuarios con mayor maestría global
```sql
SELECT
    u.nickname,
    COUNT(DISTINCT eb.block_id) as bloques_activos,
    ROUND(AVG(eb.maestria), 2) as maestria_promedio,
    SUM(eb.tiempo_total_estudio) as minutos_totales,
    COUNT(*) FILTER (WHERE eb.estado IN ('completado', 'maestro')) as bloques_completados
FROM evolucion_bloque eb
JOIN users u ON eb.user_id = u.id
WHERE eb.estado != 'no_iniciado'
GROUP BY u.id, u.nickname
ORDER BY maestria_promedio DESC, bloques_completados DESC
LIMIT 10;
```

### Ver bloques más difíciles (menor tasa de acierto global)
```sql
SELECT * FROM mv_estadisticas_bloques
ORDER BY tasa_acierto_global ASC
LIMIT 10;
```

### Ver usuarios que necesitan intervención
```sql
SELECT
    u.nickname,
    eb.block_id,
    b.name as block_name,
    eb.maestria,
    eb.preguntas_vistas,
    eb.tiempo_total_estudio,
    eb.tasa_acierto_reciente
FROM evolucion_bloque eb
JOIN users u ON eb.user_id = u.id
JOIN blocks b ON eb.block_id = b.block_id
WHERE eb.estado = 'en_progreso'
  AND eb.maestria < 60  -- Bajo rendimiento
  AND eb.preguntas_vistas >= 10  -- Ya intentó suficientes preguntas
  AND eb.ultima_interaccion > NOW() - INTERVAL '7 days'  -- Activo recientemente
ORDER BY eb.maestria ASC, eb.tiempo_total_estudio DESC;
```

---

## 🧹 Mantenimiento

### Limpiar historial antiguo (mantiene últimas 5 respuestas por pregunta)
```sql
-- Eliminar respuestas de hace más de 2 años
SELECT limpiar_historial_antiguo(730);

-- O personalizar días
SELECT limpiar_historial_antiguo(365); -- 1 año
```

### Refrescar vistas materializadas (ejecutar periódicamente)
```sql
SELECT refrescar_vistas_materializadas();
```

### Ver tamaño de las tablas
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('historial_respuestas', 'evolucion_bloque', 'block_prerequisites')
ORDER BY size_bytes DESC;
```

---

## 🔄 Automatización con Cron Jobs (PostgreSQL)

### Refrescar vistas cada hora
```sql
-- En tu backend Node.js, configurar:
const cron = require('node-cron');

// Cada hora
cron.schedule('0 * * * *', async () => {
    await pool.query('SELECT refrescar_vistas_materializadas()');
    console.log('Vistas materializadas refrescadas');
});

// Cada día a las 3 AM - limpiar historial antiguo
cron.schedule('0 3 * * *', async () => {
    const result = await pool.query('SELECT limpiar_historial_antiguo(730)');
    console.log(`Registros históricos eliminados: ${result.rows[0].limpiar_historial_antiguo}`);
});
```

---

## 🐛 Troubleshooting

### Si el trigger no se dispara
```sql
-- Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_actualizar_evolucion';

-- Recrear el trigger si es necesario
DROP TRIGGER IF EXISTS trigger_actualizar_evolucion ON historial_respuestas;
CREATE TRIGGER trigger_actualizar_evolucion
    AFTER INSERT ON historial_respuestas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_evolucion_bloque();
```

### Si las maestrías no se calculan bien
```sql
-- Recalcular maestrías manualmente para todos
UPDATE evolucion_bloque eb
SET maestria = calcular_maestria_bloque(eb.user_id, eb.block_id),
    updated_at = NOW();
```

### Si hay problemas de performance
```sql
-- Verificar índices
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('historial_respuestas', 'evolucion_bloque')
ORDER BY tablename, indexname;

-- Analizar tablas para optimizar query planner
ANALYZE historial_respuestas;
ANALYZE evolucion_bloque;
ANALYZE block_prerequisites;
```

---

## 📋 Checklist Post-Instalación

- [ ] Script principal ejecutado sin errores
- [ ] Datos históricos migrados: `SELECT COUNT(*) FROM historial_respuestas;`
- [ ] Evolución inicializada: `SELECT COUNT(*) FROM evolucion_bloque;`
- [ ] Vistas materializadas refrescadas
- [ ] Triggers funcionando (insertar una respuesta de prueba)
- [ ] Prerequisitos de bloques configurados (si aplica)
- [ ] Cron jobs configurados en backend
- [ ] Endpoints de API implementados (ver siguiente documento)

---

## 📞 Testing Rápido

### Script de prueba completo
```sql
-- 1. Insertar respuesta de prueba
INSERT INTO historial_respuestas (
    user_id, question_id, answer_id, block_id,
    fue_correcta, tiempo_respuesta, modo_juego
)
VALUES (1, 10, 40, 5, true, 5000, 'test');

-- 2. Verificar que se actualizó evolucion_bloque
SELECT * FROM evolucion_bloque WHERE user_id = 1 AND block_id = 5;

-- 3. Ver preguntas difíciles
SELECT * FROM obtener_preguntas_dificiles(1, 5, 5);

-- 4. Ver resumen completo
SELECT * FROM obtener_resumen_evolucion_usuario(1);

-- 5. Limpiar datos de prueba
DELETE FROM historial_respuestas
WHERE user_id = 1 AND modo_juego = 'test';
```

---

## 🎓 Ejemplos de Uso Real

### Escenario 1: Usuario completa una partida
```javascript
// En el backend (Node.js)
const finalizarPartida = async (gameId, userId, respuestas) => {
    // respuestas = array de objetos con estructura definida

    const result = await pool.query(
        'SELECT registrar_respuestas_batch($1, $2, $3)',
        [userId, gameId, JSON.stringify(respuestas)]
    );

    // El trigger automáticamente actualiza evolucion_bloque

    // Verificar si se desbloqueó un logro
    const evolucion = await pool.query(
        'SELECT * FROM evolucion_bloque WHERE user_id = $1 AND block_id = $2',
        [userId, blockId]
    );

    if (evolucion.rows[0].maestria >= 90 &&
        evolucion.rows[0].estado === 'completado') {
        // Otorgar luminarias
        await otorgarLuminarias(userId, 100, 'Bloque completado');
    }
};
```

### Escenario 2: Profesor ve evolución de un alumno
```javascript
// En el endpoint GET /api/teachers/students/:id/evolucion
router.get('/students/:id/evolucion', async (req, res) => {
    const { id } = req.params;

    const evolucion = await pool.query(
        'SELECT * FROM obtener_resumen_evolucion_usuario($1)',
        [id]
    );

    res.json({ evolucion: evolucion.rows });
});
```

### Escenario 3: Modo de juego "Refuerzo Personalizado"
```javascript
// Endpoint GET /api/students/me/preguntas-refuerzo
router.get('/students/me/preguntas-refuerzo', async (req, res) => {
    const { block_id, limit = 20 } = req.query;
    const userId = req.user.id;

    const preguntas = await pool.query(
        'SELECT * FROM obtener_preguntas_dificiles($1, $2, $3)',
        [userId, block_id || null, limit]
    );

    res.json({ preguntas: preguntas.rows });
});
```

---

¡Sistema listo para usar! 🎉
