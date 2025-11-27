# 🎮 Ejemplo Práctico: Integrar Luminarias en game-classic.html

## 📝 Paso a Paso

### **Paso 1: Añadir el Script de Luminarias**

En `game-classic.html`, línea 77, después de:
```html
<!-- Sistema Persistente PLAYTEST -->
<script type="module" src="persistent-system-init.js"></script>
```

**Añadir:**
```html
<!-- Gestor de Luminarias -->
<script src="luminarias-manager.js"></script>
```

---

### **Paso 2: Modificar la Función `handleFinish`**

En `game-classic.html`, alrededor de la línea 278, la función actual es:

```javascript
const handleFinish = async () => {
    setGameState('finished');
    setIsConfirmingFinish(false);

    if (currentUser && userAnswers.length > 0) {
        // CRITICAL: Save score FIRST (independent operation)
        try {
            const totalAnswered = userAnswers.filter(a => a.result !== 'BLANCO' && a.result !== 'BLANK').length;
            const correctAnswers = userAnswers.filter(a => a.result === 'ACIERTO').length;
            const totalQuestions = questions.length;
            const calculatedScore = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 10).toFixed(2) : 0;

            console.log('📊 Classic - Score calculation:', {
                correct: correctAnswers,
                totalQuestions: totalQuestions,
                totalAnswered: totalAnswered,
                timeElapsed: timeElapsed,
                calculatedScore: calculatedScore,
                formula: `(${correctAnswers} / ${totalQuestions}) × 10`
            });

            const scoreData = {
                score: parseFloat(calculatedScore),
                correct: correctAnswers,
                incorrect: userAnswers.filter(a => a.result === 'FALLO').length,
                blank: userAnswers.filter(a => a.result === 'BLANCO' || a.result === 'BLANK').length,
                totalQuestions: totalQuestions,
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

        // IMPORTANT: Update user stats (independent, non-critical)
        try {
            const gameResults = {
                answers: userAnswers,
                timeElapsed: timeElapsed
            };
            console.log('💾 Updating user stats for gameId:', game.id);
            await apiDataService.updateUserStats(currentUser.id, game.id, gameResults, 'classic');
            console.log('✅ User stats updated successfully');
        } catch (statsError) {
            console.error('❌ Failed to update stats:', statsError);
        }
    }
};
```

---

### **Modificar a:**

```javascript
const handleFinish = async () => {
    setGameState('finished');
    setIsConfirmingFinish(false);

    if (currentUser && userAnswers.length > 0) {
        // CRITICAL: Save score FIRST (independent operation)
        try {
            const totalAnswered = userAnswers.filter(a => a.result !== 'BLANCO' && a.result !== 'BLANK').length;
            const correctAnswers = userAnswers.filter(a => a.result === 'ACIERTO').length;
            const totalQuestions = questions.length;
            const calculatedScore = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 10).toFixed(2) : 0;

            console.log('📊 Classic - Score calculation:', {
                correct: correctAnswers,
                totalQuestions: totalQuestions,
                totalAnswered: totalAnswered,
                timeElapsed: timeElapsed,
                calculatedScore: calculatedScore,
                formula: `(${correctAnswers} / ${totalQuestions}) × 10`
            });

            const scoreData = {
                score: parseFloat(calculatedScore),
                correct: correctAnswers,
                incorrect: userAnswers.filter(a => a.result === 'FALLO').length,
                blank: userAnswers.filter(a => a.result === 'BLANCO' || a.result === 'BLANK').length,
                totalQuestions: totalQuestions,
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

        // IMPORTANT: Update user stats (independent, non-critical)
        try {
            const gameResults = {
                answers: userAnswers,
                timeElapsed: timeElapsed
            };
            console.log('💾 Updating user stats for gameId:', game.id);
            await apiDataService.updateUserStats(currentUser.id, game.id, gameResults, 'classic');
            console.log('✅ User stats updated successfully');
        } catch (statsError) {
            console.error('❌ Failed to update stats:', statsError);
        }

        // ============================================
        // 🪙 NUEVA SECCIÓN: RECOMPENSA DE LUMINARIAS
        // ============================================
        try {
            const totalAnswered = userAnswers.filter(a => a.result !== 'BLANCO' && a.result !== 'BLANK').length;
            const correctAnswers = userAnswers.filter(a => a.result === 'ACIERTO').length;
            const totalQuestions = questions.length;
            const calculatedScore = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 10).toFixed(2) : 0;

            // Preparar datos para la recompensa de Luminarias
            const luminariasGameData = {
                gameMode: 'classic',                          // Modo de juego
                correctAnswers: correctAnswers,               // Respuestas correctas
                totalQuestions: totalQuestions,               // Total de preguntas
                score: parseFloat(calculatedScore) * 100,     // Puntuación (0-1000)
                victory: false                                // No aplica para modo clásico
            };

            console.log('🪙 Procesando recompensa de Luminarias:', luminariasGameData);

            // Otorgar Luminarias (esto mostrará la notificación animada automáticamente)
            if (window.luminariasManager) {
                const luminariasResult = await window.luminariasManager.rewardGameCompletion(luminariasGameData);

                if (luminariasResult.success) {
                    console.log(`✅ Ganaste ${luminariasResult.amount} Luminarias!`);
                    console.log('🎯 Nueva balance:', window.luminariasManager.getBalance());
                } else {
                    console.error('❌ Error al otorgar Luminarias:', luminariasResult.error);
                }
            } else {
                console.warn('⚠️ Luminarias Manager no disponible');
            }
        } catch (luminariasError) {
            console.error('❌ Error en recompensa de Luminarias:', luminariasError);
            // No bloquear el flujo del juego si falla la recompensa
        }
        // ============================================
        // FIN SECCIÓN LUMINARIAS
        // ============================================
    }
};
```

---

## 🎯 ¿Qué Hace Esto?

1. **Calcula los resultados** del juego (ya lo hacía)
2. **Guarda la puntuación** en el backend (ya lo hacía)
3. **Actualiza las estadísticas** del usuario (ya lo hacía)
4. **🆕 Otorga Luminarias** según el rendimiento:
   - ✅ Calcula automáticamente cuántas Luminarias mereces
   - ✅ Guarda la transacción en la base de datos
   - ✅ Muestra una notificación visual con animación
   - ✅ Actualiza el contador en el header
   - ✅ Reproduce un sonido de recompensa

---

## 🎨 Resultado Visual

Cuando el jugador termine la partida:

1. Se guardan la puntuación y estadísticas (como siempre)
2. **🆕 Aparece una notificación animada:**
   ```
   ┌──────────────────────┐
   │   🪙                 │
   │                      │
   │     +25              │
   │   LUMINARIAS         │
   │                      │
   └──────────────────────┘
   ```
3. La notificación "vuela" hacia el contador del header
4. El contador se actualiza con el nuevo balance

---

## 📊 Ejemplo de Recompensa

### Escenario 1: Excelente Rendimiento
- **Preguntas:** 10 correctas de 10
- **Porcentaje:** 100%
- **Cálculo:**
  - Base: 25 Luminarias (90-100%)
  - Multiplicador modo clásico: ×1.0
  - Bonus partida perfecta: +15
  - **Total:** 40 Luminarias 🪙

### Escenario 2: Buen Rendimiento
- **Preguntas:** 7 correctas de 10
- **Porcentaje:** 70%
- **Cálculo:**
  - Base: 15 Luminarias (60-74%)
  - Multiplicador modo clásico: ×1.0
  - Sin bonus
  - **Total:** 15 Luminarias 🪙

### Escenario 3: Rendimiento Regular
- **Preguntas:** 4 correctas de 10
- **Porcentaje:** 40%
- **Cálculo:**
  - Base: 10 Luminarias (40-59%)
  - Multiplicador modo clásico: ×1.0
  - Sin bonus
  - **Total:** 10 Luminarias 🪙

---

## 🔧 Personalización

### Cambiar el Modo de Juego

En otros modos, solo cambia el `gameMode`:

**Contrarreloj:**
```javascript
gameMode: 'time_trial'  // Multiplicador 1.2x
```

**Duelo:**
```javascript
gameMode: 'duel',
victory: didWinDuel  // +10 bonus si ganaste
```

**Examen:**
```javascript
gameMode: 'exam'  // Multiplicador 1.4x
```

### Ajustar la Fórmula

Si quieres cambiar cómo se calculan las Luminarias, edita la función `calculateGameReward()` en `luminarias-manager.js`.

---

## ✅ Testing

### Probar en Consola del Navegador

1. Abre el juego
2. Abre DevTools (F12)
3. En la consola, ejecuta:

```javascript
// Simular una partida perfecta
await window.luminariasManager.rewardGameCompletion({
    gameMode: 'classic',
    correctAnswers: 10,
    totalQuestions: 10,
    score: 1000
});

// Ver tu balance
console.log('Balance:', window.luminariasManager.getBalance());
```

### Verificar en el Backend

1. Abre `luminarias-history.html`
2. Deberías ver la transacción:
   - **Tipo:** Ganancia
   - **Cantidad:** +40 (por ejemplo)
   - **Descripción:** "Completar partida en modo Clásico: 10/10 correctas"
   - **Fecha:** Timestamp actual

---

## 🐛 Troubleshooting

### La notificación no aparece

**Problema:** El código se ejecuta pero no ves la animación.

**Solución:**
1. Verifica que `luminarias-manager.js` esté cargado:
   ```javascript
   console.log(window.luminariasManager);
   ```
2. Comprueba errores en la consola
3. Verifica que el token de auth sea válido

### El balance no se actualiza

**Problema:** Ganaste Luminarias pero el contador sigue en 0.

**Solución:**
1. Forzar actualización:
   ```javascript
   await window.luminariasManager.loadBalance();
   ```
2. Verificar que el elemento `#user-luminarias` existe en el DOM
3. Comprobar la conexión con el backend

### Error 401 (Unauthorized)

**Problema:** La petición al backend falla con error 401.

**Solución:**
1. Verificar que el token existe:
   ```javascript
   console.log(localStorage.getItem('playtest_auth_token'));
   ```
2. Hacer login de nuevo si es necesario

---

## 📚 Archivos Modificados

- ✅ `game-classic.html` - Añadido script y código de recompensa
- ✅ `luminarias-manager.js` - Gestor ya creado
- ✅ Backend - Ya funcional

---

## 🚀 Próximos Pasos

1. ✅ **Integrar en game-classic.html** (este ejemplo)
2. ⏳ **Integrar en game-time-trial.html** (multiplicador 1.2x)
3. ⏳ **Integrar en game-duel.html** (con bonus por victoria)
4. ⏳ **Integrar en game-exam.html** (multiplicador 1.4x)
5. ⏳ **Integrar en todos los demás modos**

---

**¡Listo!** Ahora solo necesitas aplicar estos cambios y las Luminarias estarán funcionando en el modo Clásico. 🎮🪙
