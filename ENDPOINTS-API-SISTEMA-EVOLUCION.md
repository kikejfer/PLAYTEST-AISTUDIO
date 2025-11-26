# 🔌 Endpoints de API - Sistema de Seguimiento y Evolución

Estos son los endpoints que debes implementar en el backend para integrar el nuevo sistema.

---

## 📁 Archivo: `playtest-backend/routes/evolucion.js`

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// ENDPOINTS PARA ALUMNOS
// =====================================================

/**
 * GET /api/evolucion/me/resumen
 * Obtener resumen completo de evolución del usuario autenticado
 */
router.get('/me/resumen', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT * FROM obtener_resumen_evolucion_usuario($1)',
            [userId]
        );

        res.json({
            success: true,
            evolucion: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo resumen de evolución:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/evolucion/me/bloque/:blockId
 * Obtener evolución específica de un bloque
 */
router.get('/me/bloque/:blockId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { blockId } = req.params;

        const evolucion = await pool.query(`
            SELECT
                eb.*,
                b.name as block_name,
                b.description as block_description,
                bloque_desbloqueado($1, $2) as desbloqueado
            FROM evolucion_bloque eb
            JOIN blocks b ON eb.block_id = b.block_id
            WHERE eb.user_id = $1 AND eb.block_id = $2
        `, [userId, blockId]);

        if (evolucion.rows.length === 0) {
            return res.status(404).json({
                error: 'No hay datos de evolución para este bloque'
            });
        }

        // Obtener preguntas difíciles
        const preguntasDificiles = await pool.query(
            'SELECT * FROM obtener_preguntas_dificiles($1, $2, 10)',
            [userId, blockId]
        );

        res.json({
            success: true,
            evolucion: evolucion.rows[0],
            preguntas_dificiles: preguntasDificiles.rows
        });
    } catch (error) {
        console.error('Error obteniendo evolución de bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/evolucion/me/preguntas-refuerzo
 * Obtener preguntas para modo de refuerzo personalizado
 */
router.get('/me/preguntas-refuerzo', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { block_id, limit = 20 } = req.query;

        const preguntas = await pool.query(
            'SELECT * FROM obtener_preguntas_dificiles($1, $2, $3)',
            [userId, block_id || null, parseInt(limit)]
        );

        if (preguntas.rows.length === 0) {
            return res.json({
                success: true,
                preguntas: [],
                message: 'No hay preguntas que necesiten refuerzo. ¡Excelente trabajo!'
            });
        }

        // Obtener las respuestas para cada pregunta
        const preguntasCompletas = await Promise.all(
            preguntas.rows.map(async (p) => {
                const respuestas = await pool.query(
                    'SELECT * FROM answers WHERE question_id = $1',
                    [p.question_id]
                );

                return {
                    ...p,
                    respuestas: respuestas.rows
                };
            })
        );

        res.json({
            success: true,
            preguntas: preguntasCompletas,
            total: preguntasCompletas.length
        });
    } catch (error) {
        console.error('Error obteniendo preguntas de refuerzo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/evolucion/me/bloques-disponibles
 * Obtener bloques disponibles (desbloqueados) para el usuario
 */
router.get('/me/bloques-disponibles', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const bloques = await pool.query(`
            SELECT
                b.block_id,
                b.name,
                b.description,
                b.is_public,
                bloque_desbloqueado($1, b.block_id) as desbloqueado,
                COALESCE(eb.maestria, 0) as maestria,
                COALESCE(eb.estado, 'no_iniciado') as estado,
                (
                    SELECT array_agg(
                        json_build_object(
                            'block_id', bp.prerequisite_block_id,
                            'nombre', b2.name,
                            'maestria_requerida', bp.maestria_minima,
                            'maestria_actual', COALESCE(eb2.maestria, 0),
                            'cumplido', CASE
                                WHEN bp.requiere_completado THEN eb2.estado IN ('completado', 'maestro')
                                ELSE eb2.maestria >= bp.maestria_minima
                            END
                        )
                    )
                    FROM block_prerequisites bp
                    JOIN blocks b2 ON bp.prerequisite_block_id = b2.block_id
                    LEFT JOIN evolucion_bloque eb2 ON eb2.block_id = bp.prerequisite_block_id
                        AND eb2.user_id = $1
                    WHERE bp.block_id = b.block_id
                ) as prerequisitos
            FROM blocks b
            LEFT JOIN evolucion_bloque eb ON eb.block_id = b.block_id AND eb.user_id = $1
            LEFT JOIN user_loaded_blocks ulb ON ulb.block_id = b.block_id AND ulb.user_id = $1
            WHERE b.is_public = true OR ulb.user_id IS NOT NULL
            ORDER BY
                CASE WHEN bloque_desbloqueado($1, b.block_id) THEN 0 ELSE 1 END,
                COALESCE(eb.maestria, 0) DESC
        `, [userId]);

        res.json({
            success: true,
            bloques: bloques.rows
        });
    } catch (error) {
        console.error('Error obteniendo bloques disponibles:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/evolucion/me/estadisticas
 * Obtener estadísticas globales del usuario
 */
router.get('/me/estadisticas', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await pool.query(`
            SELECT
                COUNT(DISTINCT eb.block_id) as bloques_activos,
                COUNT(*) FILTER (WHERE eb.estado IN ('completado', 'maestro')) as bloques_completados,
                ROUND(AVG(eb.maestria), 2) as maestria_promedio,
                SUM(eb.tiempo_total_estudio) as minutos_totales,
                MAX(eb.racha_maxima) as racha_maxima_global,
                COUNT(DISTINCT hr.question_id) as preguntas_vistas_total,
                ROUND(AVG(CASE WHEN hr.fue_correcta THEN 100.0 ELSE 0.0 END), 2) as tasa_acierto_global
            FROM evolucion_bloque eb
            LEFT JOIN historial_respuestas hr ON hr.user_id = eb.user_id AND hr.block_id = eb.block_id
            WHERE eb.user_id = $1 AND eb.estado != 'no_iniciado'
        `, [userId]);

        res.json({
            success: true,
            estadisticas: stats.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =====================================================
// ENDPOINTS PARA PROFESORES
// =====================================================

/**
 * GET /api/evolucion/estudiante/:studentId/resumen
 * Obtener resumen de evolución de un estudiante (requiere rol profesor)
 */
router.get('/estudiante/:studentId/resumen', authenticateToken, async (req, res) => {
    try {
        // Verificar permisos de profesor
        const teacherCheck = await pool.query(`
            SELECT ur.id FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1
            AND r.name IN ('profesor', 'profesor_creador', 'administrador_principal', 'administrador_secundario')
        `, [req.user.id]);

        if (teacherCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Acceso denegado: se requiere rol de profesor'
            });
        }

        const { studentId } = req.params;

        const evolucion = await pool.query(
            'SELECT * FROM obtener_resumen_evolucion_usuario($1)',
            [studentId]
        );

        // Obtener info del estudiante
        const studentInfo = await pool.query(`
            SELECT id, nickname, email, first_name, last_name
            FROM users WHERE id = $1
        `, [studentId]);

        res.json({
            success: true,
            estudiante: studentInfo.rows[0],
            evolucion: evolucion.rows
        });
    } catch (error) {
        console.error('Error obteniendo evolución del estudiante:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/evolucion/estudiante/:studentId/desbloquear-bloque
 * Desbloquear manualmente un bloque para un estudiante
 */
router.post('/estudiante/:studentId/desbloquear-bloque', authenticateToken, async (req, res) => {
    try {
        // Verificar permisos
        const teacherCheck = await pool.query(`
            SELECT ur.id FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1
            AND r.name IN ('profesor', 'profesor_creador', 'administrador_principal')
        `, [req.user.id]);

        if (teacherCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const { studentId } = req.params;
        const { block_id, razon } = req.body;

        // Crear/actualizar registro en evolucion_bloque para "desbloquear"
        await pool.query(`
            INSERT INTO evolucion_bloque (user_id, block_id, estado, maestria)
            VALUES ($1, $2, 'en_progreso', 0)
            ON CONFLICT (user_id, block_id) DO UPDATE SET
                estado = CASE
                    WHEN evolucion_bloque.estado = 'no_iniciado' THEN 'en_progreso'
                    ELSE evolucion_bloque.estado
                END,
                updated_at = NOW()
        `, [studentId, block_id]);

        // Registrar acción del profesor (opcional: crear tabla de auditoría)
        await pool.query(`
            INSERT INTO teacher_actions (teacher_id, student_id, action_type, action_data, created_at)
            VALUES ($1, $2, 'desbloquear_bloque', $3, NOW())
        `, [
            req.user.id,
            studentId,
            JSON.stringify({ block_id, razon })
        ]);

        res.json({
            success: true,
            message: 'Bloque desbloqueado correctamente'
        });
    } catch (error) {
        console.error('Error desbloqueando bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/evolucion/estudiante/:studentId/dar-recompensa
 * Otorgar luminarias por logro de maestría
 */
router.post('/estudiante/:studentId/dar-recompensa', authenticateToken, async (req, res) => {
    try {
        // Verificar permisos
        const teacherCheck = await pool.query(`
            SELECT ur.id FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1
            AND r.name IN ('profesor', 'profesor_creador', 'administrador_principal')
        `, [req.user.id]);

        if (teacherCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const { studentId } = req.params;
        const { cantidad, razon, block_id } = req.body;

        // Otorgar luminarias usando el sistema existente
        await pool.query(`
            SELECT process_luminarias_transaction(
                $1, 'earn', $2, 'user', 'achievements', 'teacher_reward',
                'teacher_bonus', $3, $4, 'block', '{}'
            )
        `, [studentId, cantidad, razon, block_id]);

        // Actualizar contador en evolucion_bloque
        if (block_id) {
            await pool.query(`
                UPDATE evolucion_bloque
                SET luminarias_ganadas = luminarias_ganadas + $1
                WHERE user_id = $2 AND block_id = $3
            `, [cantidad, studentId, block_id]);
        }

        res.json({
            success: true,
            message: `${cantidad} luminarias otorgadas correctamente`
        });
    } catch (error) {
        console.error('Error otorgando recompensa:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * GET /api/evolucion/estadisticas/bloque/:blockId
 * Obtener estadísticas de un bloque (todos los usuarios)
 */
router.get('/estadisticas/bloque/:blockId', authenticateToken, async (req, res) => {
    try {
        const { blockId } = req.params;

        const stats = await pool.query(`
            SELECT * FROM mv_estadisticas_bloques
            WHERE block_id = $1
        `, [blockId]);

        const ranking = await pool.query(`
            SELECT * FROM mv_ranking_maestria
            WHERE block_id = $1
            ORDER BY ranking
            LIMIT 20
        `, [blockId]);

        res.json({
            success: true,
            estadisticas: stats.rows[0],
            ranking: ranking.rows
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de bloque:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =====================================================
// ENDPOINTS DE INTEGRACIÓN (INTERNOS)
// =====================================================

/**
 * POST /api/evolucion/registrar-respuestas
 * Registrar batch de respuestas (llamado al finalizar partida)
 */
router.post('/registrar-respuestas', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { game_id, respuestas } = req.body;

        if (!Array.isArray(respuestas) || respuestas.length === 0) {
            return res.status(400).json({
                error: 'El campo "respuestas" debe ser un array no vacío'
            });
        }

        const result = await pool.query(
            'SELECT registrar_respuestas_batch($1, $2, $3)',
            [userId, game_id, JSON.stringify(respuestas)]
        );

        const respuestasInsertadas = result.rows[0].registrar_respuestas_batch;

        // El trigger automáticamente actualizó evolucion_bloque
        // Ahora verificar si hay logros nuevos

        const blockIds = [...new Set(respuestas.map(r => r.blockId))];

        for (const blockId of blockIds) {
            const evolucion = await pool.query(`
                SELECT * FROM evolucion_bloque
                WHERE user_id = $1 AND block_id = $2
            `, [userId, blockId]);

            if (evolucion.rows.length > 0) {
                const { maestria, estado, luminarias_ganadas } = evolucion.rows[0];

                // Otorgar luminarias si alcanzó 90% y no las ha recibido antes
                if (maestria >= 90 && luminarias_ganadas === 0) {
                    await pool.query(`
                        SELECT process_luminarias_transaction(
                            $1, 'earn', 100, 'user', 'achievements', 'block_mastery',
                            'complete_block', 'Dominio de bloque alcanzado', $2, 'block', '{}'
                        )
                    `, [userId, blockId]);

                    await pool.query(`
                        UPDATE evolucion_bloque
                        SET luminarias_ganadas = 100
                        WHERE user_id = $1 AND block_id = $2
                    `, [userId, blockId]);
                }
            }
        }

        res.json({
            success: true,
            respuestas_insertadas: respuestasInsertadas,
            message: 'Respuestas registradas correctamente'
        });
    } catch (error) {
        console.error('Error registrando respuestas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
```

---

## 📝 Modificar archivo existente: `playtest-backend/server.js`

Añadir la nueva ruta:

```javascript
// ... otras importaciones ...
const evolucionRoutes = require('./routes/evolucion');

// ... configuración ...

// Registrar rutas
app.use('/api/evolucion', evolucionRoutes);

// ... resto del código ...
```

---

## 🔄 Modificar lógica de fin de partida

### En el endpoint de finalizar partida existente (ejemplo):

**Archivo:** `playtest-backend/routes/games.js`

```javascript
// Modificar el endpoint POST /api/games/:id/finish

router.post('/:id/finish', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { score_data } = req.body;

        // ... lógica existente de finalizar partida ...

        // NUEVO: Registrar respuestas en el sistema de evolución
        if (score_data.answers && score_data.answers.length > 0) {
            // Preparar respuestas en el formato requerido
            const respuestasParaEvolucion = score_data.answers.map(a => ({
                questionId: a.questionId,
                answerId: a.answerId,
                blockId: a.blockId,
                isCorrect: a.isCorrect,
                timeSpent: a.timeSpent,
                gameType: game_type,
                difficulty: a.difficulty || 1,
                timestamp: new Date().toISOString()
            }));

            // Registrar en el sistema de evolución
            await pool.query(
                'SELECT registrar_respuestas_batch($1, $2, $3)',
                [req.user.id, id, JSON.stringify(respuestasParaEvolucion)]
            );
        }

        // ... resto de la lógica ...

        res.json({ success: true, game_id: id });
    } catch (error) {
        console.error('Error finalizando partida:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
```

---

## 🎨 Frontend - Ejemplos de llamadas

### En `jugadores-panel-gaming.html`:

```javascript
// Obtener resumen de evolución
async function cargarEvolucion() {
    try {
        const response = await fetch('/api/evolucion/me/resumen', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarEvolucion(data.evolucion);
        }
    } catch (error) {
        console.error('Error cargando evolución:', error);
    }
}

// Obtener preguntas de refuerzo
async function cargarPreguntasRefuerzo(blockId = null) {
    try {
        const url = blockId
            ? `/api/evolucion/me/preguntas-refuerzo?block_id=${blockId}&limit=20`
            : '/api/evolucion/me/preguntas-refuerzo?limit=20';

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            iniciarModoRefuerzo(data.preguntas);
        }
    } catch (error) {
        console.error('Error cargando preguntas de refuerzo:', error);
    }
}
```

### En `teachers-panel-main.html`:

```javascript
// Ver evolución de un estudiante
async function verEvolucionEstudiante(studentId) {
    try {
        const response = await fetch(`/api/evolucion/estudiante/${studentId}/resumen`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            mostrarDashboardEvolucion(data.estudiante, data.evolucion);
        }
    } catch (error) {
        console.error('Error cargando evolución del estudiante:', error);
    }
}

// Desbloquear bloque manualmente
async function desbloquearBloque(studentId, blockId, razon) {
    try {
        const response = await fetch(`/api/evolucion/estudiante/${studentId}/desbloquear-bloque`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ block_id: blockId, razon })
        });

        const data = await response.json();

        if (data.success) {
            alert('Bloque desbloqueado correctamente');
            verEvolucionEstudiante(studentId); // Recargar
        }
    } catch (error) {
        console.error('Error desbloqueando bloque:', error);
    }
}

// Otorgar luminarias
async function darRecompensa(studentId, cantidad, razon, blockId = null) {
    try {
        const response = await fetch(`/api/evolucion/estudiante/${studentId}/dar-recompensa`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cantidad, razon, block_id: blockId })
        });

        const data = await response.json();

        if (data.success) {
            alert(`${cantidad} luminarias otorgadas correctamente`);
        }
    } catch (error) {
        console.error('Error otorgando recompensa:', error);
    }
}
```

---

## 🔧 Tabla adicional para auditoría (opcional pero recomendado)

```sql
-- En pgAdmin4, ejecutar si quieres tracking de acciones de profesores:

CREATE TABLE IF NOT EXISTS teacher_actions (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'desbloquear_bloque', 'dar_recompensa', etc.
    action_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_teacher_actions_teacher (teacher_id),
    INDEX idx_teacher_actions_student (student_id),
    INDEX idx_teacher_actions_date (created_at DESC)
);
```

---

## ✅ Checklist de Implementación Backend

- [ ] Crear archivo `routes/evolucion.js`
- [ ] Registrar ruta en `server.js`
- [ ] Modificar endpoint de finalizar partida para usar `registrar_respuestas_batch()`
- [ ] Crear tabla `teacher_actions` (opcional)
- [ ] Implementar llamadas en frontend de alumnos
- [ ] Implementar vista de evolución en panel de profesores
- [ ] Configurar cron jobs para refrescar vistas materializadas
- [ ] Testing de todos los endpoints
- [ ] Documentar en Postman/Swagger (opcional)

---

¡Endpoints listos para implementar! 🚀
