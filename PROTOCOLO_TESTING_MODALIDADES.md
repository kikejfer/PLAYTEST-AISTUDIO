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

```sql
-- Ver todas las partidas creadas (últimas 10)
SELECT id, user_id, mode, status, created_at, finished_at, final_score
FROM games
ORDER BY created_at DESC
LIMIT 10;

-- Ver jugadores de una partida específica
SELECT gp.*, u.nickname
FROM game_players gp
JOIN users u ON gp.user_id = u.id
WHERE gp.game_id = [GAME_ID];

-- Ver puntuaciones de una partida
SELECT gs.*, u.nickname
FROM game_scores gs
JOIN users u ON gs.user_id = u.id
WHERE gs.game_id = [GAME_ID];

-- Ver configuraciones guardadas (Active Games)
SELECT id, user_id, game_type, created_at, last_played_at
FROM user_game_configurations
ORDER BY created_at DESC
LIMIT 10;

-- Ver stats de usuario actualizados
SELECT id, nickname, total_games_played, total_score, correct_answers,
       wrong_answers, answer_history
FROM user_profiles
WHERE id = [USER_ID];
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
- [ ] Campo `finished_at` tiene timestamp
- [ ] Campo `final_score` tiene puntuación final

### Backend - Tabla `user_profiles` (UPDATE):
- [ ] `total_games_played` incrementa en 1
- [ ] `total_score` incrementa correctamente
- [ ] `correct_answers` suma correctamente
- [ ] `wrong_answers` suma correctamente
- [ ] `answer_history` se actualiza con nuevas respuestas

### Backend - Tabla `user_game_configurations`:
- [ ] Se guarda configuración (para Active Games)
- [ ] Campo `game_type` es correcto
- [ ] Campo `config` tiene la configuración JSON
- [ ] Campo `last_played_at` se actualiza

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
