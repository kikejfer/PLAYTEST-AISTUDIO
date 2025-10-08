# 🧪 PROTOCOLO DE TESTING - MODALIDADES DE JUEGO
## ETAPA 1.3 del Plan Maestro de Desarrollo

**Fecha de creación:** 7 de Octubre de 2025
**Estado:** 🟡 EN CURSO
**Objetivo:** Verificar que las 9 modalidades guardan datos correctamente en la base de datos

---

## 📋 INSTRUCCIONES GENERALES

### Preparación antes de cada test:
1. ✅ Verificar que el backend está corriendo en Render
2. ✅ Tener pgAdmin4 abierto con conexión a Aiven
3. ✅ Preparar queries SQL para verificar datos después de cada partida
4. ✅ Tener usuario de prueba con sesión activa

### Queries SQL para verificación:

**IMPORTANTE:** Consulta DATABASE_SCHEMA_REFERENCE.md para ver todas las columnas disponibles.

```sql
-- 1. Ver todas las partidas creadas (últimas 10)
SELECT
    id,
    game_type,
    status,
    created_by,
    created_at,
    updated_at,
    config,
    game_state
FROM games
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver jugadores de una partida específica
SELECT
    gp.id,
    gp.game_id,
    gp.user_id,
    gp.player_index,
    gp.nickname,
    gp.joined_at,
    u.nickname as current_nickname
FROM game_players gp
JOIN users u ON gp.user_id = u.id
WHERE gp.game_id = [GAME_ID];

-- 3. Ver puntuaciones de una partida
SELECT
    gs.id,
    gs.game_id,
    gs.game_type,
    gs.score_data,
    gs.created_at
FROM game_scores gs
WHERE gs.game_id = [GAME_ID];

-- 4. Ver configuraciones guardadas (Active Games)
SELECT
    id,
    user_id,
    game_type,
    config,
    metadata,
    created_at,
    last_used,
    use_count
FROM user_game_configurations
WHERE user_id = [USER_ID]
ORDER BY last_used DESC
LIMIT 10;

-- 5. Ver stats de usuario actualizados (desde user_profiles)
SELECT
    up.id,
    up.user_id,
    u.nickname,
    up.answer_history,
    up.stats,
    up.preferences,
    up.loaded_blocks,
    up.updated_at
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE up.user_id = [USER_ID];

-- 6. Ver balance de luminarias del usuario
SELECT
    ul.user_id,
    u.nickname,
    ul.current_balance,
    ul.total_earned,
    ul.total_spent,
    ul.lifetime_earnings,
    ul.last_activity
FROM user_luminarias ul
JOIN users u ON ul.user_id = u.id
WHERE ul.user_id = [USER_ID];

-- 7. Ver últimas transacciones de luminarias
SELECT
    lt.id,
    lt.user_id,
    lt.transaction_type,
    lt.amount,
    lt.balance_before,
    lt.balance_after,
    lt.category,
    lt.action_type,
    lt.description,
    lt.created_at
FROM luminarias_transactions lt
WHERE lt.user_id = [USER_ID]
ORDER BY lt.created_at DESC
LIMIT 10;
```

---

## 🎮 MODALIDADES A TESTEAR

### Categoría: ENTRENAMIENTO (Training)
- ✅ Classic Mode
- ✅ Streak Mode
- ✅ By Levels Mode

### Categoría: COMPETICIÓN INDIVIDUAL (Competition - Individual)
- ✅ Exam Mode
- ✅ Lives Mode
- ✅ Time Trial Mode
- ✅ Marathon Mode

### Categoría: COMPETICIÓN MULTIJUGADOR (Competition - Multiplayer)
- ✅ Duel Mode
- ✅ Trivial Mode

---

## 📊 CHECKLIST POR MODALIDAD

Para cada modalidad, verificar:

### Frontend:
- [ ] La partida se carga correctamente
- [ ] Se pueden responder preguntas
- [ ] El contador/timer funciona (si aplica)
- [ ] Se muestra la pantalla de resultados al finalizar
- [ ] No hay errores en consola del navegador (F12)

### Backend - Endpoint `/api/games` (POST):
- [ ] La partida se crea en tabla `games`
- [ ] Campo `mode` corresponde a la modalidad
- [ ] Campo `user_id` es correcto
- [ ] Campo `status` = 'in_progress'

### Backend - Tabla `game_players`:
- [ ] Se crea registro para cada jugador
- [ ] Campo `game_id` apunta correctamente
- [ ] Campo `user_id` es correcto
- [ ] Campo `player_index` es correcto (0, 1, 2...)
- [ ] Campo `nickname` tiene el nickname del usuario

### Backend - Endpoint `/api/games/:id/scores` (POST):
- [ ] Se guarda puntuación en tabla `game_scores`
- [ ] Campo `game_id` apunta correctamente
- [ ] Campo `user_id` es correcto
- [ ] Campo `score` tiene el valor final
- [ ] Campos `correct_answers`, `wrong_answers` son correctos
- [ ] Campo `time_elapsed` tiene el tiempo (si aplica)

### Backend - Tabla `games` (UPDATE):
- [ ] Campo `status` cambia a 'completed'
- [ ] Campo `updated_at` tiene timestamp actualizado
- [ ] Campo `game_state` refleja estado final

### Backend - Tabla `user_profiles` (UPDATE):
- [ ] Campo `stats` JSONB se actualiza correctamente
- [ ] `stats.consolidation.byBlock` se actualiza (si aplica)
- [ ] `stats.consolidation.byTopic` se actualiza (si aplica)
- [ ] `stats.totalGames` incrementa en 1
- [ ] `stats.totalScore` suma correctamente
- [ ] Campo `answer_history` (array JSONB) se actualiza con nuevas respuestas

### Backend - Tabla `user_game_configurations`:
- [ ] Se guarda configuración (para Active Games)
- [ ] Campo `game_type` es correcto
- [ ] Campo `config` tiene la configuración JSONB
- [ ] Campo `metadata` tiene metadatos JSONB (si aplica)
- [ ] Campo `last_used` se actualiza
- [ ] Campo `use_count` incrementa

---

## 🔍 RESULTADOS DE TESTING

### Estado de las verificaciones:
- ✅ = Funciona correctamente
- ⚠️ = Funciona parcialmente (detallar)
- ❌ = No funciona (detallar error)
- ⏳ = Pendiente de probar

---

## 1️⃣ CLASSIC MODE

**Archivo:** `game-classic.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveClassicScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 2️⃣ STREAK MODE

**Archivo:** `game-streak.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveStreakScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 3️⃣ BY LEVELS MODE

**Archivo:** `game-by-levels.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveByLevelsScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada
- [ ] **EXTRA:** Progreso de niveles se guarda en `user_levels` o `block_levels`

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 4️⃣ EXAM MODE

**Archivo:** `game-exam.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveExamScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 5️⃣ LIVES MODE

**Archivo:** `game-lives.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveLivesScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 6️⃣ TIME TRIAL MODE

**Archivo:** `game-time-trial.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveTimeTrialScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada
- [ ] **EXTRA:** Tiempo registrado correctamente

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 7️⃣ MARATHON MODE

**Archivo:** `game-marathon.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveMarathonScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] Jugador en `game_players`
- [ ] Score en `game_scores`
- [ ] Estado actualiza a 'completed'
- [ ] Stats de usuario actualizados
- [ ] Configuración guardada

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 8️⃣ DUEL MODE (Multiplayer)

**Archivo:** `game-duel.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveDuelScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] **MÚLTIPLES** jugadores en `game_players` (mínimo 2)
- [ ] **MÚLTIPLES** scores en `game_scores` (uno por jugador)
- [ ] Estado actualiza a 'completed'
- [ ] Stats de **TODOS** los usuarios actualizados
- [ ] Configuración guardada
- [ ] **EXTRA:** Socket.io funciona para sincronización en tiempo real

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 9️⃣ TRIVIAL MODE (Multiplayer)

**Archivo:** `game-trivial.html`
**Endpoint de guardado:** `/api/games/:id/scores` (método: `saveTrivialScore`)
**Estado:** ⏳ PENDIENTE

### Checklist:
- [ ] Frontend funciona
- [ ] Partida se crea en `games`
- [ ] **MÚLTIPLES** jugadores en `game_players` (mínimo 2)
- [ ] **MÚLTIPLES** scores en `game_scores` (uno por jugador)
- [ ] Estado actualiza a 'completed'
- [ ] Stats de **TODOS** los usuarios actualizados
- [ ] Configuración guardada
- [ ] **EXTRA:** Socket.io funciona para sincronización en tiempo real

### Resultado:
```
[PENDIENTE DE TESTING]
```

### Problemas encontrados:
```
[Ninguno todavía]
```

---

## 📈 RESUMEN FINAL

### Modalidades funcionando correctamente: 0/9
- Ninguna probada aún

### Modalidades con problemas: 0/9
- Ninguna probada aún

### Modalidades completamente rotas: 0/9
- Ninguna probada aún

### Prioridad de corrección:
1. **CRÍTICO:** [Pendiente]
2. **IMPORTANTE:** [Pendiente]
3. **MENOR:** [Pendiente]

---

## 📝 NOTAS DEL TESTING

### Configuración del entorno:
```
Backend URL: https://playtest-backend.onrender.com/api
Database: PostgreSQL en Aiven
Usuario de prueba: [A definir]
```

### Observaciones generales:
```
[Pendiente de testing]
```

---

## ✅ PRÓXIMOS PASOS

Una vez completado este testing:

1. ✅ Documentar todas las modalidades que funcionan
2. ✅ Crear lista priorizada de bugs a corregir
3. ✅ Actualizar PLAN_MAESTRO_DESARROLLO.md con resultados
4. ✅ Pasar a ETAPA 1.4 (corrección de bugs) si es necesario
5. ✅ Si todo funciona, pasar directamente a FASE 2

---

**Última actualización:** 7 de Octubre de 2025 - 15:45
