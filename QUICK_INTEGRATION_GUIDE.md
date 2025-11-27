# 🚀 Guía Rápida: Integrar Luminarias en Cualquier Modo de Juego

## ✅ Ya Hecho en game-classic.html

El modo Clásico ya está completamente integrado y funcional. Úsalo como referencia.

---

## 📝 Pasos para Integrar en Otros Modos

### **Paso 1: Añadir el Script** (1 línea)

En el `<head>` de tu archivo HTML, después de `persistent-system-init.js`:

```html
<!-- Gestor de Luminarias -->
<script src="luminarias-manager.js"></script>
```

**Archivos donde añadir:**
- `game-time-trial.html`
- `game-duel.html`
- `game-exam.html`
- `game-lives.html`
- `game-marathon.html`
- `game-streak.html`
- `game-trivial.html`
- `game-by-levels.html`

---

### **Paso 2: Añadir Código de Recompensa**

En la función que finaliza el juego (usualmente `handleFinish`), después de guardar la puntuación y actualizar estadísticas, añade:

```javascript
// ============================================
// 🪙 RECOMPENSA DE LUMINARIAS
// ============================================
try {
    const correctAnswers = userAnswers.filter(a => a.result === 'ACIERTO').length;
    const totalQuestions = questions.length;
    const calculatedScore = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 10).toFixed(2) : 0;

    // Preparar datos para la recompensa de Luminarias
    const luminariasGameData = {
        gameMode: 'CAMBIAR_AQUI',              // 👈 IMPORTANTE: Cambiar según el modo
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        score: parseFloat(calculatedScore) * 100,
        victory: false                         // 👈 Cambiar a true en modo Duelo si ganó
    };

    console.log('🪙 Procesando recompensa de Luminarias:', luminariasGameData);

    if (window.luminariasManager) {
        const luminariasResult = await window.luminariasManager.rewardGameCompletion(luminariasGameData);

        if (luminariasResult.success) {
            console.log(`✅ Ganaste ${luminariasResult.amount} Luminarias!`);
        } else {
            console.error('❌ Error al otorgar Luminarias:', luminariasResult.error);
        }
    } else {
        console.warn('⚠️ Luminarias Manager no disponible');
    }
} catch (luminariasError) {
    console.error('❌ Error en recompensa de Luminarias:', luminariasError);
}
// ============================================
// FIN RECOMPENSA DE LUMINARIAS
// ============================================
```

---

## 🎮 Configuración por Modo de Juego

### **game-time-trial.html** (Contrarreloj)
```javascript
gameMode: 'time_trial',    // Multiplicador ×1.2
victory: false
```

### **game-duel.html** (Duelo)
```javascript
gameMode: 'duel',          // Multiplicador ×1.5
victory: didWin            // 👈 Variable que indica si ganó el duelo (+10 bonus)
```

### **game-exam.html** (Examen)
```javascript
gameMode: 'exam',          // Multiplicador ×1.4
victory: false
```

### **game-lives.html** (Vidas)
```javascript
gameMode: 'lives',         // Multiplicador ×1.3
victory: false
```

### **game-marathon.html** (Maratón)
```javascript
gameMode: 'marathon',      // Multiplicador ×1.6
victory: false
```

### **game-streak.html** (Racha)
```javascript
gameMode: 'streak',        // Multiplicador ×1.4
victory: false
```

### **game-trivial.html** (Trivial)
```javascript
gameMode: 'trivial',       // Multiplicador ×1.1
victory: false
```

### **game-by-levels.html** (Por Niveles)
```javascript
gameMode: 'by_levels',     // Multiplicador ×1.3
victory: false
```

---

## 🎯 Ejemplo Completo: game-duel.html

```javascript
// En la función que finaliza el duelo
const finishDuel = async (didWinDuel) => {
    // ... tu código existente de guardar puntuación ...

    // 🪙 RECOMPENSA DE LUMINARIAS
    try {
        const luminariasGameData = {
            gameMode: 'duel',
            correctAnswers: myCorrectAnswers,
            totalQuestions: totalQuestions,
            score: myFinalScore,
            victory: didWinDuel        // 👈 Pasar el resultado del duelo
        };

        if (window.luminariasManager) {
            const result = await window.luminariasManager.rewardGameCompletion(luminariasGameData);

            if (result.success) {
                console.log(`🪙 Ganaste ${result.amount} Luminarias!`);
                // Si ganaste el duelo: base + multiplicador + 10 bonus
            }
        }
    } catch (error) {
        console.error('Error en Luminarias:', error);
    }
};
```

---

## 📊 Recompensas por Modo

| Modo         | Multiplicador | Ejemplo (80% aciertos) |
|--------------|---------------|------------------------|
| Clásico      | ×1.0          | 20 Luminarias         |
| Trivial      | ×1.1          | 22 Luminarias         |
| Contrarreloj | ×1.2          | 24 Luminarias         |
| Vidas        | ×1.3          | 26 Luminarias         |
| Por Niveles  | ×1.3          | 26 Luminarias         |
| Examen       | ×1.4          | 28 Luminarias         |
| Racha        | ×1.4          | 28 Luminarias         |
| Duelo        | ×1.5          | 30 Luminarias         |
| Maratón      | ×1.6          | 32 Luminarias         |

**Bonus Adicionales:**
- Partida Perfecta (100%): **+15 Luminarias**
- Victoria en Duelo: **+10 Luminarias**

---

## ✨ Lo Que Verá el Usuario

1. **Al finalizar la partida:**
   - Se guardan puntuación y estadísticas (como siempre)
   - ✨ **NUEVO:** Aparece notificación dorada animada con el icono `1lum.png`
   - La notificación muestra: "+XX Luminarias"
   - Vuela hacia el header con animación suave
   - El contador en el header se actualiza automáticamente
   - Se reproduce un sonido de recompensa

2. **El usuario verá:**
   ```
   ┌────────────────────┐
   │   🪙               │  ← Icono 1lum.png girando
   │                    │
   │     +25            │  ← Cantidad ganada
   │   LUMINARIAS       │
   │                    │
   └────────────────────┘
   ```

---

## 🔧 Testing Rápido

Una vez integrado en un modo, prueba desde la consola del navegador:

```javascript
// Simular una partida
await window.luminariasManager.rewardGameCompletion({
    gameMode: 'time_trial',
    correctAnswers: 10,
    totalQuestions: 10,
    score: 1000,
    victory: false
});

// Deberías ver:
// - Notificación animada
// - Console log: "✅ Ganaste 40 Luminarias!"
// - Balance actualizado en el header
```

---

## 📍 Ubicación del Código

El código de recompensa debe ir **después** de:
- ✅ Guardar la puntuación (`saveScore`)
- ✅ Actualizar estadísticas del usuario (`updateUserStats`)

Y **antes** de:
- ⏸️ Cambiar a pantalla de resultados
- ⏸️ Cerrar la partida

**Ejemplo de ubicación:**
```javascript
try {
    // 1️⃣ Guardar puntuación
    await apiDataService.saveClassicScore(game.id, scoreData);
} catch (error) { ... }

try {
    // 2️⃣ Actualizar estadísticas
    await apiDataService.updateUserStats(currentUser.id, game.id, gameResults, 'classic');
} catch (error) { ... }

// 🪙 3️⃣ AQUÍ VA EL CÓDIGO DE LUMINARIAS
try {
    const luminariasGameData = { ... };
    if (window.luminariasManager) {
        await window.luminariasManager.rewardGameCompletion(luminariasGameData);
    }
} catch (error) { ... }

// 4️⃣ Resto del código (cambiar estado, etc.)
```

---

## ⚠️ Importante

1. **No bloquear el flujo:** El código de Luminarias está en un `try-catch` para que si falla, el juego siga funcionando normalmente.

2. **Async/await:** Usar `await` para esperar la recompensa antes de continuar.

3. **Verificar existencia:** Siempre verificar `if (window.luminariasManager)` antes de usar.

4. **Logs útiles:** Los console.log ayudan a debuggear si algo falla.

---

## ✅ Checklist de Integración

Por cada modo de juego:

- [ ] Añadir `<script src="luminarias-manager.js"></script>` en el `<head>`
- [ ] Añadir código de recompensa en la función de finalización
- [ ] Cambiar `gameMode` al modo correcto
- [ ] Si es Duelo, pasar `victory: didWin`
- [ ] Probar que funciona en el navegador
- [ ] Verificar que aparece la notificación
- [ ] Verificar que el balance se actualiza
- [ ] Commit y push de los cambios

---

## 🎉 Resultado Final

Una vez integrado en todos los modos:
- ✅ Los usuarios ganan Luminarias automáticamente al jugar
- ✅ Notificaciones visuales espectaculares
- ✅ Balance sincronizado con el backend
- ✅ Sistema de economía virtual funcionando
- ✅ Motivación extra para los jugadores

---

**¿Dudas?** Consulta:
- `LUMINARIAS_INTEGRATION_GUIDE.md` - Guía completa
- `LUMINARIAS_EXAMPLE_INTEGRATION.md` - Ejemplo detallado
- `game-classic.html` - Implementación de referencia
