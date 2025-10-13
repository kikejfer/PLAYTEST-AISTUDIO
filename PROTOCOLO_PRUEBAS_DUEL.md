# Protocolo de Pruebas - Modo Duel con Configuración de Preguntas

## Fecha: 2025-10-13

## Objetivo
Verificar que el modo Duel funciona correctamente con las nuevas opciones de configuración de número de preguntas (20/30/40/50) y que ambos jugadores ven las mismas preguntas en el mismo orden.

---

## Cambios Implementados

### 1. **jugadores-panel-gaming.html**
- ✅ Agregado selector de número de preguntas para modo Duelo
- ✅ Opciones: 20, 30, 40, 50 preguntas
- ✅ Valor por defecto: 20 preguntas
- ✅ handleSendChallenge limita las preguntas al número configurado
- ✅ shuffledQuestionIds almacenado en configuración del juego

### 2. **game-duel.html**
- ✅ Removido límite hardcoded de 10 rondas
- ✅ Ahora usa todas las preguntas de shuffledQuestionIds
- ✅ Cálculo dinámico de DUEL_ROUNDS basado en número de preguntas
- ✅ Validación de sincronización de preguntas entre jugadores

---

## Requisitos de Prueba

### Hardware/Software
- 2 navegadores diferentes o 2 dispositivos
- 2 cuentas de jugador activas
- Servidor backend corriendo
- Base de datos accesible

### Preparación
1. Asegurarse de que ambos jugadores tienen bloques de preguntas configurados
2. Verificar que hay suficientes preguntas disponibles (mínimo 50 para prueba completa)
3. Limpiar localStorage en ambos navegadores antes de empezar

---

## Casos de Prueba

### CASO 1: Configuración de 20 Preguntas (Valor por Defecto)

**Objetivo:** Verificar que el modo Duel funciona con 20 preguntas (10 rondas)

**Pasos:**
1. **Jugador A** (Creador del Reto):
   - Navegar a Panel de Jugadores
   - Seleccionar modo "Competición" → "Duelo"
   - Configurar bloques de preguntas
   - **VERIFICAR:** Selector muestra "20 preguntas" por defecto
   - **VERIFICAR:** Texto helper muestra "Cada jugador responderá 10 preguntas (10 rondas)"
   - Seleccionar oponente (Jugador B)
   - Enviar reto

2. **Verificación de Logs - Jugador A:**
   ```
   📊 [CHALLENGE] Total questions collected: <X>
   🎯 [CHALLENGE] Configured question count: 20
   🔀 [CHALLENGE] Questions shuffled: 20 IDs (limited to 20)
   ✅ [CHALLENGE] Enhanced config with shuffledQuestionIds: {...}
   ```

3. **Jugador B** (Receptor del Reto):
   - Navegar a Panel de Jugadores
   - Ver reto pendiente
   - Aceptar reto
   - **VERIFICAR:** Juego carga correctamente

4. **Verificación de Logs - Jugador B:**
   ```
   🔍 [DUEL] ==================== VALIDACIÓN DE ORDEN ====================
   🆔 [DUEL] Primeros 10 IDs de shuffledQuestionIds: [...]
   🆔 [DUEL] Primeros 10 IDs de preguntas ordenadas: [...]
   📋 [DUEL] Primera pregunta texto: "..."
   🎯 [DUEL] Using 20 rounds (10 questions per player) from 20 total questions
   ```

5. **Ambos Jugadores - Durante el Juego:**
   - **VERIFICAR:** Header muestra "Ronda 1/20", "Ronda 2/20", etc.
   - **VERIFICAR:** Ambos jugadores ven la misma pregunta en cada ronda
   - **VERIFICAR:** Comparar textos de preguntas en pantalla (tomar screenshots si es necesario)
   - Completar al menos 5 rondas

6. **Validación de Sincronización:**
   - **CRÍTICO:** Copiar los logs de "VALIDACIÓN DE ORDEN" de ambos jugadores
   - **VERIFICAR:** Los IDs de preguntas deben ser idénticos
   - **VERIFICAR:** Los textos de preguntas deben coincidir

**Resultado Esperado:**
- ✅ Juego se crea con 20 preguntas
- ✅ Ambos jugadores ven las mismas preguntas en el mismo orden
- ✅ No hay mensajes de error
- ✅ No hay re-renders excesivos (no más de 2-3 "Restoring saved game state")

---

### CASO 2: Configuración de 30 Preguntas

**Objetivo:** Verificar que el selector funciona correctamente con 30 preguntas

**Pasos:**
1. **Jugador A:**
   - Configurar modo Duelo
   - **CAMBIAR selector a "30 preguntas"**
   - **VERIFICAR:** Texto helper muestra "Cada jugador responderá 15 preguntas (15 rondas)"
   - Enviar reto

2. **Verificación de Logs:**
   ```
   🎯 [CHALLENGE] Configured question count: 30
   🔀 [CHALLENGE] Questions shuffled: 30 IDs (limited to 30)
   ```

3. **Ambos Jugadores:**
   - **VERIFICAR:** Header muestra "/30" en el contador de rondas
   - Jugar al menos 3 rondas
   - **VERIFICAR:** Sincronización de preguntas

**Resultado Esperado:**
- ✅ Juego usa 30 preguntas (15 rondas)
- ✅ Sincronización correcta entre jugadores

---

### CASO 3: Configuración de 40 Preguntas

**Pasos:**
1. **Jugador A:**
   - Configurar modo Duelo
   - **CAMBIAR selector a "40 preguntas"**
   - **VERIFICAR:** Texto helper muestra "Cada jugador responderá 20 preguntas (20 rondas)"
   - Enviar reto

2. **Verificación de Logs:**
   ```
   🎯 [CHALLENGE] Configured question count: 40
   🔀 [CHALLENGE] Questions shuffled: 40 IDs (limited to 40)
   ```

**Resultado Esperado:**
- ✅ Juego usa 40 preguntas (20 rondas)

---

### CASO 4: Configuración de 50 Preguntas

**Pasos:**
1. **Jugador A:**
   - Configurar modo Duelo
   - **CAMBIAR selector a "50 preguntas"**
   - **VERIFICAR:** Texto helper muestra "Cada jugador responderá 25 preguntas (25 rondas)"
   - Enviar reto

2. **Verificación de Logs:**
   ```
   🎯 [CHALLENGE] Configured question count: 50
   🔀 [CHALLENGE] Questions shuffled: 50 IDs (limited to 50)
   ```

**Resultado Esperado:**
- ✅ Juego usa 50 preguntas (25 rondas)

---

### CASO 5: Reto Aleatorio

**Objetivo:** Verificar que los retos aleatorios también usan la configuración de preguntas

**Pasos:**
1. **Jugador A:**
   - Configurar modo Duelo
   - Seleccionar número de preguntas (ej: 30)
   - Hacer clic en "Reto Aleatorio"
   - **VERIFICAR:** Reto se envía con la configuración correcta

---

### CASO 6: Finalización Completa del Juego

**Objetivo:** Verificar que el juego se completa correctamente hasta el final

**Pasos:**
1. Configurar juego con 20 preguntas
2. Jugar todas las 20 rondas (ambos jugadores)
3. **VERIFICAR:** Al llegar a la ronda 20, el botón cambia a "Ver Resultados"
4. **VERIFICAR:** Pantalla final muestra:
   - Ganador correcto
   - Puntuaciones finales
   - Estadísticas del duelo

**Verificación de Logs al Finalizar:**
```
📊 [DUEL] Processing stats for both players from allRoundsHistory: [...]
📝 [DUEL] Player 1 (...) answers: [...]
📝 [DUEL] Player 2 (...) answers: [...]
💾 [DUEL] Updating stats for ...: {...}
```

---

## Checklist de Validación Global

### Interfaz de Usuario
- [ ] Selector de número de preguntas aparece solo en modo Duelo
- [ ] Selector tiene opciones: 20, 30, 40, 50
- [ ] Valor por defecto es 20
- [ ] Texto helper se actualiza según la selección
- [ ] Configuración se envía correctamente con el reto

### Lógica de Juego
- [ ] shuffledQuestionIds se crea al enviar el reto
- [ ] Ambos jugadores reciben el mismo shuffledQuestionIds
- [ ] Número de preguntas coincide con la configuración
- [ ] DUEL_ROUNDS = questions.length (no hay límite de 10)
- [ ] Contador de rondas muestra el total correcto

### Sincronización
- [ ] Ambos jugadores ven las mismas preguntas
- [ ] El orden de preguntas es idéntico
- [ ] Logs de validación muestran IDs idénticos
- [ ] No hay race conditions

### Rendimiento
- [ ] No hay re-renders excesivos
- [ ] useEffect solo se ejecuta una vez por juego
- [ ] localStorage se limpia al finalizar
- [ ] Polling funciona correctamente cuando no es mi turno

### Finalización
- [ ] Juego termina después de todas las rondas
- [ ] Estadísticas se guardan correctamente para ambos jugadores
- [ ] Puntuación se registra en rankings
- [ ] Game state se limpia del localStorage

---

## Problemas Conocidos Resueltos

### ✅ Race Condition en Shuffling
**Antes:** Cada jugador mezclaba preguntas independientemente
**Ahora:** Solo el creador mezcla al enviar el reto, ambos usan el mismo orden

### ✅ Re-renders Excesivos
**Antes:** 14+ "Restoring saved game state" consecutivos
**Ahora:** Solo 1-2 restauraciones por sesión

### ✅ Límite Hardcoded
**Antes:** Siempre 10 rondas, sin importar configuración
**Ahora:** Dinámico según selección (20/30/40/50 preguntas)

---

## Reporte de Bugs

Si encuentras algún problema durante las pruebas, reporta:

1. **Número de caso de prueba**
2. **Paso donde ocurrió el error**
3. **Logs de consola de ambos jugadores**
4. **Screenshots si es posible**
5. **Comportamiento esperado vs observado**

---

## Logs Importantes a Capturar

### Al Crear el Reto (Jugador A):
```
📊 [CHALLENGE] Total questions collected: <X>
🎯 [CHALLENGE] Configured question count: <N>
🔀 [CHALLENGE] Questions shuffled: <N> IDs (limited to <N>)
```

### Al Aceptar el Reto (Jugador B):
```
🔍 [DUEL] ==================== VALIDACIÓN DE ORDEN ====================
🆔 [DUEL] Primeros 10 IDs de shuffledQuestionIds: [...]
🆔 [DUEL] Primeros 10 IDs de preguntas ordenadas: [...]
```

### Durante el Juego (Ambos):
```
🎯 [DUEL] Using <N> rounds (<N/2> questions per player) from <N> total questions
```

---

## Conclusión

Una vez completados todos los casos de prueba, verifica que:
1. Todas las opciones de configuración funcionan (20/30/40/50)
2. La sincronización entre jugadores es perfecta
3. No hay errores en la consola
4. El rendimiento es aceptable
5. El juego se completa correctamente

**Estado:** 🟡 Pendiente de Ejecución
