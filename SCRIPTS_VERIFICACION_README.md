# 🤖 SCRIPTS DE VERIFICACIÓN AUTOMÁTICA

## 📋 Descripción

Estos scripts verifican automáticamente que las partidas guardaron datos correctamente en la base de datos.

---

## 🚀 INSTALACIÓN Y CONFIGURACIÓN

### 1. Instalar dependencias

```bash
# Si no tienes node_modules instalado, instala las dependencias necesarias
npm install pg dotenv
```

### 2. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus credenciales de Aiven
# Usa tu editor favorito (notepad, nano, vim, etc.)
notepad .env
```

**Contenido del archivo `.env`:**
```env
DB_HOST=tu-host.aiven.com
DB_PORT=5432
DB_NAME=playtest
DB_USER=avnadmin
DB_PASSWORD=tu-password-de-aiven
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu-host.aiven.com` con tu host real de Aiven
- Reemplaza `tu-password-de-aiven` con tu contraseña real
- NO subas el archivo `.env` a git (ya está en .gitignore)

---

## 📊 SCRIPTS DISPONIBLES

### 🔹 Script 1: `verify-game-data.js`
**Verificación detallada de UNA partida específica**

#### Uso:
```bash
node verify-game-data.js <game_id> [user_id]
```

#### Ejemplo:
```bash
# Verificar solo la partida
node verify-game-data.js 123

# Verificar partida y perfil de usuario
node verify-game-data.js 123 45
```

#### ¿Qué verifica?
- ✅ Tabla `games`: game_type, created_by, status, config, game_state
- ✅ Tabla `game_players`: jugadores registrados, player_index, nicknames
- ✅ Tabla `game_scores`: score_data con estructura correcta
- ✅ Tabla `user_profiles`: answer_history, stats (si proporcionas user_id)
- ✅ Tabla `user_game_configurations`: configuración guardada

#### Output de ejemplo:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 VERIFICACIÓN DE PARTIDA: ID 123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. Verificando tabla GAMES...
✅ Partida existe en tabla games
✅ Campo game_type: "classic"
✅ Campo created_by: 45
✅ Campo status: "completed"
✅ Campo config (JSONB): 3 keys
✅ Campo game_state (JSONB): 5 keys

👥 2. Verificando tabla GAME_PLAYERS...
✅ 1 jugador(es) registrado(s)
   👤 Jugador 1:
   ✅ - user_id: 45
   ✅ - player_index: 0
   ✅ - nickname: "TestUser"

🏆 3. Verificando tabla GAME_SCORES...
✅ 1 score(s) registrado(s)
   🎯 Score 1:
   ✅ - game_type coincide: "classic"
   ✅ - score_data es JSONB válido
   - score: 85
   - correct: 8
   - incorrect: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERIFICACIÓN EXITOSA - Todos los checks pasaron
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 🔹 Script 2: `verify-all-recent-games.js`
**Verificación rápida de MÚLTIPLES partidas recientes**

#### Uso:
```bash
node verify-all-recent-games.js [limit] [hours]
```

#### Parámetros:
- `limit`: Número máximo de partidas a verificar (default: 10)
- `hours`: Horas hacia atrás para buscar (default: 24)

#### Ejemplos:
```bash
# Verificar las últimas 10 partidas de las últimas 24 horas
node verify-all-recent-games.js

# Verificar las últimas 20 partidas de las últimas 48 horas
node verify-all-recent-games.js 20 48

# Verificar las últimas 50 partidas de la última hora
node verify-all-recent-games.js 50 1
```

#### ¿Qué verifica?
- ✅ Si la partida tiene jugadores en `game_players`
- ✅ Si la partida tiene scores en `game_scores`
- ✅ Si el status es 'completed'
- 📊 Estadísticas agregadas de todas las partidas
- 📋 Resumen por modalidad

#### Output de ejemplo:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 VERIFICACIÓN BATCH DE PARTIDAS RECIENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Parámetros:
   - Límite: 10 partidas
   - Rango: Últimas 24 horas

✅ Encontradas 10 partidas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ID  | Tipo          | Estado      | Jugador        | Players | Scores | Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 150 | classic       | completed   | TestUser       |    ✓    |   ✓    | ✅
 149 | streak        | completed   | TestUser       |    ✓    |   ✓    | ✅
 148 | exam          | completed   | TestUser       |    ✓    |   ✓    | ✅
 147 | lives         | in_progress | TestUser       |    ✓    |   ✗    | ⚠️
 146 | time_trial    | completed   | TestUser       |    ✓    |   ✓    | ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESUMEN ESTADÍSTICO:
   Total partidas:        10
   Completadas:           9 (90%)
   Con jugadores:         10 (100%)
   Con scores:            9 (90%)
   ✅ Totalmente válidas: 9 (90%)

📋 MODALIDADES TESTEADAS:
   classic        : 3 partida(s)
   streak         : 2 partida(s)
   exam           : 2 partida(s)
   lives          : 2 partida(s)
   time_trial     : 1 partida(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ EXCELENTE: Todas las partidas guardaron datos correctamente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

### Paso 1: Jugar partidas de prueba
1. Abre la aplicación web
2. Inicia sesión con tu usuario de prueba
3. Juega una partida completa de cada modalidad

### Paso 2: Obtener el game_id
**Opción A - Desde pgAdmin4:**
```sql
SELECT id, game_type, status, created_at
FROM games
ORDER BY created_at DESC
LIMIT 10;
```

**Opción B - Desde consola del navegador (F12):**
- Busca en Network tab por `/api/games`
- Anota el `id` de la partida creada

### Paso 3: Verificar partidas
```bash
# Verificación rápida de todas las recientes
node verify-all-recent-games.js

# Si encuentras problemas, verifica en detalle
node verify-game-data.js <game_id> <user_id>
```

### Paso 4: Documentar resultados
Actualiza `PROTOCOLO_TESTING_MODALIDADES.md` con los resultados:
- ✅ Modalidades que funcionan
- ⚠️ Modalidades con problemas parciales
- ❌ Modalidades completamente rotas

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot find module 'pg'"
```bash
npm install pg
```

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Error: "DB_PASSWORD not configured"
- Asegúrate de haber creado el archivo `.env`
- Verifica que tiene las credenciales correctas de Aiven

### Error: "Connection refused" o "ECONNREFUSED"
- Verifica que `DB_HOST` es correcto
- Verifica que tu IP está en la lista blanca de Aiven
- Verifica que el puerto es 5432

### Error: "password authentication failed"
- Verifica `DB_PASSWORD` en el archivo `.env`
- Verifica `DB_USER` (usualmente 'avnadmin')

---

## 📝 NOTAS ADICIONALES

### ¿Qué NO verifica el script?
❌ Funcionamiento del frontend (visual)
❌ Interacción de usuario (responder preguntas)
❌ Socket.io para juegos multiplayer en tiempo real

**Esas verificaciones las debes hacer manualmente** siguiendo el `PROTOCOLO_TESTING_MODALIDADES.md`

### ¿Cuándo usar cada script?

**`verify-game-data.js`** - Usar cuando:
- Quieres verificar una partida específica en detalle
- Encontraste un problema y necesitas investigar
- Quieres ver la estructura completa de los datos JSONB

**`verify-all-recent-games.js`** - Usar cuando:
- Acabas de jugar varias partidas y quieres verificarlas todas
- Quieres un resumen rápido del estado general
- Quieres ver estadísticas de qué modalidades funcionan mejor

---

## 🎉 EJEMPLO COMPLETO DE USO

```bash
# 1. Configurar entorno (solo la primera vez)
npm install pg dotenv
cp .env.example .env
notepad .env  # Editar con tus credenciales

# 2. Jugar partidas de prueba en el navegador
# (Classic, Streak, Exam, Lives, etc.)

# 3. Verificar todas las partidas recientes
node verify-all-recent-games.js 20 2
# Output: ✅ 18 de 20 partidas válidas

# 4. Si hay problemas, investigar partida específica
node verify-game-data.js 147 45
# Output: ❌ No hay scores en game_scores

# 5. Documentar en PROTOCOLO_TESTING_MODALIDADES.md:
# Lives Mode: ⚠️ No guarda scores
```

---

## 📞 AYUDA

Si tienes problemas con los scripts:
1. Verifica que las credenciales en `.env` son correctas
2. Ejecuta `node verify-all-recent-games.js` para un test rápido
3. Si persiste el error, consulta la sección TROUBLESHOOTING

---

**Última actualización:** 7 de Octubre de 2025 - 16:30
