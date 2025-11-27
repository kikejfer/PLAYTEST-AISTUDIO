# 🪙 Guía de Integración de Luminarias en PLAYTEST

## 📋 Resumen

Este documento explica cómo integrar el sistema de moneda virtual **Luminarias** en los modos de juego de PLAYTEST.

---

## ✅ ¿Qué ya está listo?

### 1. **Backend Completo**
- ✅ Base de datos configurada (`database-schema-luminarias.sql`)
- ✅ API endpoints funcionando (`playtest-backend/routes/luminarias.js`)
- ✅ Sistema de transacciones y balance implementado

### 2. **Frontend Base**
- ✅ Contador en el header (`header-component.html` línea 23-27)
- ✅ Componente React para gestión (`LuminariasUsuario.jsx`)
- ✅ Archivos HTML para tienda, historial, admin

### 3. **Gestor de Luminarias**
- ✅ Módulo centralizado (`luminarias-manager.js`)
- ✅ Sistema de recompensas automático
- ✅ Notificaciones visuales con animación
- ✅ Cálculo inteligente de recompensas según rendimiento

---

## 🚀 Pasos para Integrar Luminarias en un Modo de Juego

### **Paso 1: Incluir el Script de Luminarias**

En el `<head>` de tu archivo HTML de juego, añade:

```html
<!-- Gestor de Luminarias -->
<script src="luminarias-manager.js"></script>
```

**Ejemplo:** En `game-classic.html`, después de la línea 77:

```html
<!-- Sistema Persistente PLAYTEST -->
<script type="module" src="persistent-system-init.js"></script>

<!-- Gestor de Luminarias -->
<script src="luminarias-manager.js"></script>
```

---

### **Paso 2: Recompensar al Finalizar la Partida**

Cuando el jugador termine una partida, llama a la función de recompensa:

```javascript
// Al finalizar la partida
async function endGame() {
    // ... tu código existente para finalizar el juego ...

    // Calcular resultados
    const gameResults = {
        gameMode: 'classic',              // Modo de juego actual
        correctAnswers: correctCount,     // Respuestas correctas
        totalQuestions: questions.length, // Total de preguntas
        score: finalScore,                // Puntuación final
        victory: didWin                   // Si ganó (para modos competitivos)
    };

    // Otorgar Luminarias
    if (window.luminariasManager) {
        const result = await window.luminariasManager.rewardGameCompletion(gameResults);

        if (result.success) {
            console.log(`🪙 Ganaste ${result.amount} Luminarias!`);
        }
    }

    // ... resto de tu código ...
}
```

---

### **Paso 3: Actualizar el Balance en el Header**

El balance se actualiza automáticamente, pero puedes forzar una actualización:

```javascript
// Actualizar balance manualmente si es necesario
await window.luminariasManager.loadBalance();
```

---

## 🎮 Ejemplos por Modo de Juego

### **Modo Clásico (game-classic.html)**

```javascript
// Dentro de tu función que procesa el final del juego
const finishGame = async () => {
    const results = {
        gameMode: 'classic',
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        score: score
    };

    // Recompensar Luminarias
    const reward = await window.luminariasManager.rewardGameCompletion(results);

    // Mostrar resultados finales
    showResultsScreen(results, reward.amount);
};
```

### **Modo Contrarreloj (game-time-trial.html)**

```javascript
const endTimeTrial = async () => {
    const results = {
        gameMode: 'time_trial',
        correctAnswers: correctCount,
        totalQuestions: questionCount,
        score: finalScore,
        // El multiplicador es 1.2x para este modo
    };

    await window.luminariasManager.rewardGameCompletion(results);
};
```

### **Modo Duelo (game-duel.html)**

```javascript
const finishDuel = async (didWin) => {
    const results = {
        gameMode: 'duel',
        correctAnswers: myCorrectAnswers,
        totalQuestions: totalQuestions,
        score: myScore,
        victory: didWin  // Bonus +10 si ganaste
    };

    await window.luminariasManager.rewardGameCompletion(results);
};
```

---

## 📊 Sistema de Recompensas

### **Recompensa Base según Rendimiento**

| % Aciertos | Luminarias Base | Descripción |
|-----------|-----------------|-------------|
| 90-100%   | 25             | Excelente   |
| 75-89%    | 20             | Muy bien    |
| 60-74%    | 15             | Bien        |
| 40-59%    | 10             | Regular     |
| 0-39%     | 5              | Participación |

### **Multiplicadores por Modo**

| Modo         | Multiplicador | Ejemplo (90% aciertos) |
|--------------|---------------|------------------------|
| Clásico      | 1.0x          | 25 Luminarias         |
| Trivial      | 1.1x          | 27 Luminarias         |
| Contrarreloj | 1.2x          | 30 Luminarias         |
| Vidas        | 1.3x          | 32 Luminarias         |
| Por Niveles  | 1.3x          | 32 Luminarias         |
| Examen       | 1.4x          | 35 Luminarias         |
| Racha        | 1.4x          | 35 Luminarias         |
| Duelo        | 1.5x          | 37 Luminarias         |
| Maratón      | 1.6x          | 40 Luminarias         |

### **Bonus Adicionales**

- **Partida Perfecta (100%):** +15 Luminarias
- **Victoria en Duelo:** +10 Luminarias
- **Rango final:** Entre 5 y 50 Luminarias por partida

---

## 🎨 Notificación Visual

Al ganar Luminarias, automáticamente se muestra una **notificación animada** con:

- ✨ Icono de Luminarias girando
- 💰 Cantidad ganada en grande
- 🎯 Animación que "vuela" hacia el contador del header
- 🔊 Sonido de recompensa (opcional)

**Ejemplo visual:**

```
╔════════════════════════╗
║  🪙                    ║
║                        ║
║    +25                 ║
║    LUMINARIAS          ║
║                        ║
╚════════════════════════╝
```

---

## 🔗 Acciones Adicionales con Luminarias

### **Abrir la Tienda**

```javascript
// Botón o enlace para abrir la tienda
<button onclick="window.luminariasManager.openStore()">
    🛒 Tienda de Luminarias
</button>
```

### **Ver Historial de Transacciones**

```javascript
<button onclick="window.luminariasManager.openHistory()">
    📜 Historial
</button>
```

### **Obtener Balance Actual (sin petición al servidor)**

```javascript
const currentBalance = window.luminariasManager.getBalance();
console.log(`Tienes ${currentBalance} Luminarias`);
```

### **Escuchar Cambios en el Balance**

```javascript
window.luminariasManager.addListener((newBalance) => {
    console.log(`Balance actualizado: ${newBalance}`);
    // Actualizar tu UI personalizada
});
```

---

## 🛠️ API del Gestor de Luminarias

### **Métodos Principales**

#### `initialize()`
Inicializa el gestor y carga el balance del usuario.
```javascript
await window.luminariasManager.initialize();
```

#### `loadBalance()`
Recarga el balance desde el backend.
```javascript
const balance = await window.luminariasManager.loadBalance();
```

#### `rewardGameCompletion(gameData)`
Otorga Luminarias por completar una partida.
```javascript
const result = await window.luminariasManager.rewardGameCompletion({
    gameMode: 'classic',
    correctAnswers: 8,
    totalQuestions: 10,
    score: 800,
    victory: false
});

// result: { success: true, amount: 20, transaction_id: 123 }
```

#### `processTransaction(transactionData)`
Procesa una transacción personalizada.
```javascript
const result = await window.luminariasManager.processTransaction({
    transaction_type: 'spend',
    amount: 50,
    user_role: 'user',
    category: 'user_spending',
    subcategory: 'game_features',
    action_type: 'buy_hint',
    description: 'Compra de pista en partida'
});
```

#### `getBalance()`
Obtiene el balance actual (sin petición al servidor).
```javascript
const balance = window.luminariasManager.getBalance();
```

#### `openStore()`, `openHistory()`, `openAdmin()`
Abre las ventanas correspondientes.
```javascript
window.luminariasManager.openStore();
window.luminariasManager.openHistory();
window.luminariasManager.openAdmin(); // Solo admin
```

---

## ⚙️ Personalización Avanzada

### **Cambiar el Cálculo de Recompensas**

Si quieres ajustar cómo se calculan las Luminarias, edita en `luminarias-manager.js`:

```javascript
calculateGameReward(gameData) {
    // Tu lógica personalizada aquí
    return customAmount;
}
```

### **Personalizar la Notificación Visual**

Modifica los estilos en `luminarias-manager.js`, sección `showRewardNotification()`:

```javascript
styles.textContent = `
    .luminarias-notification {
        /* Tus estilos personalizados */
    }
`;
```

---

## 🧪 Testing

### **Probar en Modo de Desarrollo**

1. Abre las DevTools (F12)
2. En la consola, ejecuta:

```javascript
// Simular recompensa
await window.luminariasManager.rewardGameCompletion({
    gameMode: 'classic',
    correctAnswers: 10,
    totalQuestions: 10,
    score: 1000
});

// Ver balance actual
console.log(window.luminariasManager.getBalance());
```

### **Ver Transacciones en el Backend**

Accede al historial en:
```
https://tu-dominio.com/luminarias-history.html
```

---

## 🐛 Troubleshooting

### **El contador no se actualiza**

1. Verifica que `luminarias-manager.js` esté incluido
2. Comprueba la consola para errores
3. Asegúrate de que el token de autenticación es válido

```javascript
// Debug
console.log('Token:', localStorage.getItem('playtest_auth_token'));
console.log('Balance:', window.luminariasManager.getBalance());
```

### **Las transacciones fallan**

1. Verifica que el backend esté corriendo
2. Comprueba que la ruta `/api/luminarias` sea correcta
3. Revisa los logs del servidor

### **La notificación no aparece**

1. Verifica que `showRewardNotification()` se esté ejecutando
2. Comprueba que no haya conflictos de z-index con otros elementos
3. Revisa si el CSS se inyectó correctamente

---

## 📚 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `luminarias-manager.js` | Gestor principal de Luminarias |
| `database-schema-luminarias.sql` | Esquema de la base de datos |
| `playtest-backend/routes/luminarias.js` | API endpoints |
| `luminarias-store.html` | Tienda de items |
| `luminarias-history.html` | Historial de transacciones |
| `luminarias-admin.html` | Panel de administración |
| `LuminariasUsuario.jsx` | Componente React |
| `header-component.html` | Header con contador |

---

## ✅ Checklist de Integración

- [ ] Incluir `luminarias-manager.js` en el HTML del juego
- [ ] Llamar a `rewardGameCompletion()` al finalizar partidas
- [ ] Verificar que el contador del header se actualiza
- [ ] Probar la notificación visual
- [ ] Revisar que las transacciones se guardan en el backend
- [ ] Añadir botones para abrir tienda/historial (opcional)

---

## 🎯 Próximos Pasos

1. **Integrar en todos los modos de juego** (classic, time-trial, lives, exam, etc.)
2. **Implementar tienda funcional** con items comprables
3. **Añadir retos diarios** que otorguen Luminarias extra
4. **Sistema de logros** con recompensas en Luminarias
5. **Marketplace** para intercambio entre usuarios

---

## 🤝 Soporte

Si tienes problemas o preguntas:
1. Revisa los logs de la consola
2. Verifica el estado del backend
3. Consulta este documento
4. Revisa el código de `luminarias-manager.js`

---

**¡Listo! Ahora puedes empezar a introducir las Luminarias en tu juego.** 🚀
