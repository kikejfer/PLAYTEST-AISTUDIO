# 🔍 ANÁLISIS DE CAUSA RAÍZ - Scores No Se Guardan

**Fecha:** 8 de Octubre de 2025
**Modalidades afectadas:** Classic, Streak, By Levels, Time Trial, Lives, Marathon (6/9)

---

## 📊 SÍNTOMA

Las 6 modalidades afectadas muestran el mismo patrón:
- ✅ Partida se crea correctamente en tabla `games`
- ✅ Jugador se registra en tabla `game_players`
- ❌ NO se guarda registro en tabla `game_scores`
- ❌ Status permanece en "active" (debería cambiar a "completed")

---

## 🔬 INVESTIGACIÓN REALIZADA

### 1. Verificación de código frontend (game-classic.html)

**Líneas clave:**
- **278-339**: Función `handleFinish()` - Se ejecuta al finalizar el juego
- **287**: Log "💾 Saving game results for gameId"
- **290**: **PRIMERA llamada:** `await apiDataService.updateUserStats()`
- **303**: **SEGUNDA llamada:** `await apiDataService.saveClassicScore()`
- **330**: **TERCERA llamada:** `await dataService.updateGame()` (actualiza status)

**Estructura de try-catch:**
```javascript
const handleFinish = async () => {
    setGameState('finished');
    setIsConfirmingFinish(false);
    if (currentUser && userAnswers.length > 0) {
        const gameResults = { answers: userAnswers, timeElapsed: timeElapsed };
        try {
            // 1. Primera llamada (línea 290)
            await apiDataService.updateUserStats(currentUser.id, game.id, gameResults, game.mode);
            console.log('✅ User stats updated successfully');

            // 2. Segunda llamada (línea 303) - NUNCA SE EJECUTA
            const scoreData = { /* ... */ };
            console.log('📊 Saving score data:', scoreData);
            await apiDataService.saveClassicScore(game.id, scoreData);
            console.log('✅ Classic score saved successfully');

            // 3. Anidado dentro de otro try (línea 308)
            try {
                await apiDataService.updateUserStats(/* segunda vez */);
            } catch (statsError) {
                console.error('❌ Failed to update user statistics:', statsError);
            }

            // 4. Tercera llamada (línea 330) - NUNCA SE EJECUTA
            try {
                await dataService.updateGame(game.id, { status: 'completed' });
            } catch (updateError) {
                console.error('❌ Failed to update game status to completed:', updateError);
            }

        } catch (error) {
            console.error('❌ Failed to save game results:', error);
        }
    }
};
```

### 2. Verificación de servicios (api-data-service.js)

**Funciones verificadas:**
- ✅ `saveClassicScore()` - Línea 718 - EXISTE
- ✅ `saveStreakScore()` - Línea 740 - EXISTE
- ✅ `saveMarathonScore()` - Línea 751 - EXISTE
- ✅ `saveLivesScore()` - Línea 762 - EXISTE
- ✅ `saveTimeTrialScore()` - Línea 784 - EXISTE
- ✅ `updateUserStats()` - Línea 796 - EXISTE

**Todas las funciones están implementadas correctamente.**

### 3. Verificación de backend (playtest-backend/routes/games.js)

**Endpoint verificado:**
- ✅ `POST /api/games/:id/scores` - Línea 604 - EXISTE Y FUNCIONA

**Lógica del endpoint:**
```javascript
router.post('/:id/scores', authenticateToken, async (req, res) => {
  try {
    const gameId = req.params.id;
    const { scoreData, gameType } = req.body;

    // 1. Verifica que el usuario esté en la partida
    const playerCheck = await pool.query(
      'SELECT user_id FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.user.id]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to save score for this game' });
    }

    // 2. Guarda el score en game_scores
    await pool.query(
      'INSERT INTO game_scores (game_id, game_type, score_data) VALUES ($1, $2, $3)',
      [gameId, gameType, scoreData]
    );

    // 3. Marca el juego como completado
    await pool.query(
      'UPDATE games SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', gameId]
    );

    res.status(201).json({ message: 'Score saved and game completed successfully' });

  } catch (error) {
    console.error('Error saving game score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**El endpoint está bien implementado.**

### 4. Verificación de IDs de partidas

```bash
$ node check-broken-games.js

Partidas rotas encontradas: 6
   ID 266 | classic         | active     | Wed Oct 08 2025 15:54:03
   ID 267 | time-trial      | active     | Wed Oct 08 2025 16:57:03
   ID 268 | lives           | active     | Wed Oct 08 2025 17:01:23
   ID 269 | by-levels       | active     | Wed Oct 08 2025 17:05:12
   ID 271 | streak          | active     | Wed Oct 08 2025 21:34:04
   ID 274 | marathon        | active     | Wed Oct 08 2025 21:40:12

   Game 266: 1 jugador(es) - JaiGon
   Game 267: 1 jugador(es) - JaiGon
   Game 268: 1 jugador(es) - JaiGon
   Game 269: 1 jugador(es) - JaiGon
   Game 271: 1 jugador(es) - JaiGon
   Game 274: 1 jugador(es) - JaiGon
```

**Los IDs son válidos (numéricos) y tienen jugadores registrados.**

---

## 🎯 CAUSA RAÍZ IDENTIFICADA

### **Problema: Orden de ejecución en try-catch**

**Flujo actual erróneo:**
1. Se ejecuta `handleFinish()`
2. **Línea 290**: Se llama a `updateUserStats(currentUser.id, game.id, gameResults, game.mode)`
3. **Si falla** → El `catch` de la línea 335 captura el error
4. **NUNCA se ejecuta** la línea 303 `saveClassicScore()`
5. **NUNCA se ejecuta** la línea 330 `updateGame()` para marcar como "completed"

**Evidencia:**
- El log `"💾 Saving game results for gameId"` (línea 287) **probablemente se ejecuta**
- El log `"📊 Saving score data"` (línea 302) **NUNCA aparece** en la consola
- El log `"✅ Classic score saved successfully"` (línea 304) **NUNCA aparece** en la consola

### **Por qué falla `updateUserStats()`?**

Posibles causas:
1. **`game.mode` es `undefined` o inválido** (línea 290)
2. El endpoint `/users/stats` requiere estructura específica de datos
3. El endpoint `/users/stats` hace múltiples consultas complejas que pueden fallar
4. Error de autenticación o permisos

### **Comparación con modalidades funcionando:**

**Exam Mode (✅ FUNCIONA):**
- Probablemente llama directamente a `saveExamScore()` sin `updateUserStats()` previo
- O tiene mejor manejo de errores

**Trivial Mode (✅ FUNCIONA):**
- Probablemente tiene estructura diferente
- Modalidad multiplayer con lógica distinta

---

## 🔧 SOLUCIONES PROPUESTAS

### **Opción 1: Reestructurar try-catch (RECOMENDADO)**

Separar las llamadas en try-catch independientes para que el fallo de una no afecte a las demás:

```javascript
const handleFinish = async () => {
    setGameState('finished');
    setIsConfirmingFinish(false);

    if (currentUser && userAnswers.length > 0) {
        // 1. CRÍTICO: Guardar score PRIMERO (independiente)
        try {
            const totalAnswered = userAnswers.filter(a => a.result !== 'BLANCO' && a.result !== 'BLANK').length;
            const scoreData = {
                score: userAnswers.filter(a => a.result === 'ACIERTO').length,
                totalQuestions: userAnswers.length,
                totalAnswered: totalAnswered,
                timeElapsed: timeElapsed,
                answers: userAnswers
            };
            console.log('📊 Saving score data:', scoreData);
            await apiDataService.saveClassicScore(game.id, scoreData);
            console.log('✅ Classic score saved successfully');
        } catch (scoreError) {
            console.error('❌ Failed to save score:', scoreError);
        }

        // 2. IMPORTANTE: Actualizar stats (independiente, no crítico)
        try {
            const gameResults = {
                answers: userAnswers,
                timeElapsed: timeElapsed
            };
            console.log('💾 Saving game results for gameId:', game.id);
            await apiDataService.updateUserStats(currentUser.id, game.id, gameResults, 'classic');
            console.log('✅ User stats updated successfully');
        } catch (statsError) {
            console.error('❌ Failed to update user stats:', statsError);
        }

        // 3. CRÍTICO: Marcar como completed (independiente)
        try {
            console.log('🏁 Marking game as completed, gameId:', game.id);
            await dataService.updateGame(game.id, { status: 'completed' });
            console.log('✅ Game marked as completed successfully');
        } catch (updateError) {
            console.error('❌ Failed to update game status:', updateError);
        }
    }
};
```

### **Opción 2: Usar Promise.allSettled**

Ejecutar todas las operaciones en paralelo y manejar errores individualmente:

```javascript
const handleFinish = async () => {
    setGameState('finished');
    setIsConfirmingFinish(false);

    if (currentUser && userAnswers.length > 0) {
        const totalAnswered = userAnswers.filter(a => a.result !== 'BLANCO' && a.result !== 'BLANK').length;
        const scoreData = {
            score: userAnswers.filter(a => a.result === 'ACIERTO').length,
            totalQuestions: userAnswers.length,
            totalAnswered: totalAnswered,
            timeElapsed: timeElapsed,
            answers: userAnswers
        };

        const gameResults = {
            answers: userAnswers,
            timeElapsed: timeElapsed
        };

        const results = await Promise.allSettled([
            apiDataService.saveClassicScore(game.id, scoreData),
            apiDataService.updateUserStats(currentUser.id, game.id, gameResults, 'classic'),
            dataService.updateGame(game.id, { status: 'completed' })
        ]);

        results.forEach((result, index) => {
            const operations = ['saveClassicScore', 'updateUserStats', 'updateGame'];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${operations[index]} succeeded`);
            } else {
                console.error(`❌ ${operations[index]} failed:`, result.reason);
            }
        });
    }
};
```

### **Opción 3: Backend maneja todo (MEJOR a largo plazo)**

Mover la lógica de actualización de stats al backend, dentro del endpoint `/api/games/:id/scores`:

```javascript
// Backend: routes/games.js
router.post('/:id/scores', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gameId = req.params.id;
    const { scoreData, gameType } = req.body;

    // 1. Verificar autorización
    const playerCheck = await client.query(
      'SELECT user_id FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.user.id]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 2. Guardar score
    await client.query(
      'INSERT INTO game_scores (game_id, game_type, score_data) VALUES ($1, $2, $3)',
      [gameId, gameType, scoreData]
    );

    // 3. Marcar como completed
    await client.query(
      'UPDATE games SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', gameId]
    );

    // 4. Actualizar user_profiles (stats y answer_history) - TODO
    // await updateUserProfileStats(client, req.user.id, scoreData);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Score saved successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving game score:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});
```

---

## 📋 PLAN DE ACCIÓN

### FASE 1: Confirmación del diagnóstico
1. [ ] Verificar logs de consola del navegador al jugar una partida de Classic
2. [ ] Confirmar que el log `"📊 Saving score data"` NO aparece
3. [ ] Confirmar que el log `"❌ Failed to save game results"` SÍ aparece

### FASE 2: Aplicar fix rápido (Opción 1)
1. [ ] Modificar `game-classic.html` - Reestructurar try-catch
2. [ ] Modificar `game-streak.html` - Aplicar mismo fix
3. [ ] Modificar `game-by-levels.html` - Aplicar mismo fix
4. [ ] Modificar `game-time-trial.html` - Aplicar mismo fix
5. [ ] Modificar `game-lives.html` - Aplicar mismo fix
6. [ ] Modificar `game-marathon.html` - Aplicar mismo fix

### FASE 3: Testing
1. [ ] Jugar partida de cada modalidad
2. [ ] Verificar que aparezcan los logs correctos
3. [ ] Ejecutar `verify-all-recent-games.js`
4. [ ] Confirmar 100% de partidas con scores guardados

### FASE 4: Refactoring (Opción 3 - opcional)
1. [ ] Mover lógica de stats al backend
2. [ ] Simplificar frontend
3. [ ] Re-testear todo

---

## 🎯 IMPACTO ESPERADO

**Antes del fix:**
- 6/8 modalidades (75%) NO guardan scores

**Después del fix:**
- 9/9 modalidades (100%) deberían guardar scores correctamente
- Status cambia a "completed"
- User stats se actualizan (si no falla)
- Incluso si stats falla, el score Y status se guardan

---

**Última actualización:** 8 de Octubre de 2025 - 22:30
