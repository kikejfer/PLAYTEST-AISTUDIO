# 📋 PLAN MAESTRO DE DESARROLLO PLAYTEST
## Versión 1.0 - Implementación Incremental y Controlada

**Fecha de inicio:** 7 de Octubre de 2025
**Última actualización:** 7 de Octubre de 2025 - 15:30
**Estado general:** 🟡 INICIADO - Fase 1 en curso

---

## 📊 PROGRESO GENERAL

```
FASE 1: Infraestructura y Persistencia    [██████░░░░] 60% - EN CURSO
FASE 2: Estadísticas y Consolidación      [░░░░░░░░░░]  0% - PENDIENTE
FASE 3: Soporte Técnico y Comunicación    [░░░░░░░░░░]  0% - PENDIENTE
FASE 4: Funcionalidades de Creadores      [░░░░░░░░░░]  0% - PENDIENTE
FASE 5: Funcionalidades de Profesores     [░░░░░░░░░░]  0% - PENDIENTE
FASE 6: Sistema de Luminarias             [░░░░░░░░░░]  0% - PENDIENTE
FASE 7: Sistema de Torneos                [░░░░░░░░░░]  0% - PENDIENTE
```

**Progreso total:** 18% completado (actualizado 15:30 - BD verificada)

---

## 🎯 ÍNDICE DE FASES

- [FASE 1: INFRAESTRUCTURA Y PERSISTENCIA DE JUEGOS](#fase-1-infraestructura-y-persistencia-de-juegos) ⬅️ **ESTAMOS AQUÍ**
- [FASE 2: ESTADÍSTICAS Y CONSOLIDACIÓN DE CONOCIMIENTO](#fase-2-estadísticas-y-consolidación-de-conocimiento)
- [FASE 3: SOPORTE TÉCNICO Y COMUNICACIÓN](#fase-3-soporte-técnico-y-comunicación)
- [FASE 4: FUNCIONALIDADES DE CREADORES DE CONTENIDO](#fase-4-funcionalidades-de-creadores-de-contenido)
- [FASE 5: FUNCIONALIDADES DE PROFESORES](#fase-5-funcionalidades-de-profesores)
- [FASE 6: SISTEMA DE LUMINARIAS](#fase-6-sistema-de-luminarias)
- [FASE 7: SISTEMA DE TORNEOS](#fase-7-sistema-de-torneos)

---

# FASE 1: INFRAESTRUCTURA Y PERSISTENCIA DE JUEGOS

**Objetivo:** Asegurar que todos los juegos guardan correctamente datos y que la BD tiene todas las tablas necesarias.

**Duración estimada:** 3-5 sesiones (6-10 horas)
**Progreso:** [██████░░░░] 60% completado
**Estado:** 🟡 EN CURSO

---

## ETAPA 1.1: Auditoría y Verificación de Base de Datos

**Estado:** ✅ **COMPLETADA**
**Fecha de inicio:** 7 Oct 2025 - 13:00
**Fecha de finalización:** 7 Oct 2025 - 14:30
**Responsable:** Claude + Usuario

### Descripción
Verificar qué tablas existen actualmente en Aiven y cuáles faltan según los endpoints del backend.

### Funcionalidad a desarrollar
- ✅ Lista completa de tablas existentes vs necesarias
- ✅ Identificación de columnas faltantes en tablas existentes
- ✅ Verificación de índices y constraints

### Cómo se va a hacer
1. ✅ Conectar a pgAdmin4 y exportar lista de tablas actuales
2. ✅ Revisar código backend para identificar tablas referenciadas
3. ✅ Comparar y crear lista de diferencias
4. ⏳ **PENDIENTE:** Consultar con usuario sobre estructura de tablas faltantes

### Hallazgos principales - ACTUALIZADO 7 Oct 2025 - 16:00

**📋 REFERENCIA COMPLETA:** Ver `DATABASE_SCHEMA_REFERENCE.md` para estructura detallada de todas las tablas y columnas.

#### ✅ Tablas CORE (todas existen):
- ✅ `users` - Usuarios del sistema
- ✅ `user_profiles` - Perfiles extendidos con stats y answer_history
- ✅ `roles` - Roles del sistema
- ✅ `user_roles` - Asignación de roles a usuarios
- ✅ `blocks` - Bloques de preguntas
- ✅ `questions` - Preguntas de los bloques
- ✅ `answers` - Respuestas de las preguntas
- ✅ `games` - Partidas
- ✅ `user_sessions` - Sesiones de usuario

#### ✅ Tablas de JUEGOS (todas existen - NO necesario crear):
- ✅ `game_players` - Jugadores en cada partida (6 columnas)
- ✅ `game_scores` - Puntuaciones finales
- ✅ `user_game_configurations` - Configuraciones guardadas

#### ✅ Sistema de SOPORTE (¡YA EXISTE!):
- ✅ `support_tickets` (19 columnas)
- ✅ `support_categories` (10 columnas)
- ✅ `support_messages` (7 columnas)
- ✅ `support_ticket_groups` (11 columnas)
- ✅ `support_templates` (7 columnas)
- ✅ `support_analytics` (11 columnas)
- ✅ `support_escalation_rules` (11 columnas)

#### ✅ Sistema de LUMINARIAS (¡YA EXISTE!):
- ✅ `user_luminarias` - Balance de luminarias
- ✅ `luminarias_transactions` - Transacciones
- ✅ `luminarias_config` - Configuración del sistema
- ✅ `user_wallets` - Billeteras de usuarios
- ✅ `wallet_transactions` - Transacciones de billetera

#### ✅ Tablas ADICIONALES encontradas (no documentadas previamente):
- ✅ `admin_assignments` - Asignaciones de administradores
- ✅ `badge_definitions` - Definiciones de insignias
- ✅ `user_badges` - Insignias de usuarios
- ✅ `level_definitions` - Definiciones de niveles
- ✅ `user_levels` - Niveles de usuarios
- ✅ `block_levels` - Niveles por bloque
- ✅ `block_types` - Tipos de bloques
- ✅ `block_states` - Estados de bloques
- ✅ `block_answers` - Respuestas de bloques
- ✅ `topic_answers` - Respuestas por tema
- ✅ `user_loaded_blocks` - Bloques cargados por usuario
- ✅ `communications` - Comunicaciones del sistema
- ✅ `feature_flags` - Flags de características
- ✅ `faq_articles` - Artículos de FAQ
- ✅ `escalation_rules` - Reglas de escalación
- ✅ `system_logs` - Logs del sistema
- ✅ `tickets` - Sistema de tickets alternativo
- ✅ `ticket_assignments` - Asignaciones de tickets
- ✅ `ticket_attachments` - Adjuntos de tickets
- ✅ `ticket_categories` - Categorías de tickets
- ✅ `ticket_messages` - Mensajes de tickets
- ✅ `ticket_notifications` - Notificaciones de tickets
- ✅ `ticket_states` - Estados de tickets

#### ❌ Sistema de TORNEOS (NO existe):
- ❌ `tournaments`
- ❌ `tournament_participants`
- ❌ `tournament_matches`
- ❌ `tournament_brackets`
- ❌ `tournament_prizes`

#### 🎉 CONCLUSIÓN IMPORTANTE:
**La base de datos está ~90% completa.** Solo falta el sistema de Torneos.
Las FASES 1, 2, 3 y 6 tienen TODA su infraestructura de BD lista.

### Partes críticas identificadas
- ⚠️ **CRÍTICO:** Foreign keys deben apuntar a tablas existentes
- ⚠️ **CRÍTICO:** `game_players` y `game_scores` son necesarias AHORA para modalidades multiplayer
- ⚠️ **IMPORTANTE:** Tablas de soporte y luminarias pueden esperar a sus fases respectivas

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Solo consultas de lectura realizadas

### Entregables
1. ✅ Documento con tablas existentes vs necesarias (este archivo)
2. ⏳ Propuesta de tablas a crear (en ETAPA 1.2)
3. ⏳ Scripts SQL preparados (sin ejecutar)

### Notas y comentarios
```
[7 Oct 2025 - 14:30] Claude:
Análisis completado. Hallazgo importante: Las 9 modalidades de juego tienen código de
guardado implementado, pero tablas game_players y game_scores probablemente faltan.
Necesario confirmar con usuario antes de crear tablas.

Siguiente paso: ETAPA 1.2 - Proponer estructura de tablas faltantes para aprobación.

[7 Oct 2025 - 15:30] Usuario + Claude:
🎉 HALLAZGO CRÍTICO: ¡La BD está ~90% completa!

Verificación mediante queries reveló que existen:
- ✅ Todas las tablas de JUEGOS (game_players, game_scores, user_game_configurations)
- ✅ Todas las tablas de SOPORTE (7 tablas)
- ✅ Todas las tablas de LUMINARIAS (5 tablas)
- ✅ Sistema de badges e insignias
- ✅ Sistema de niveles (level_definitions, user_levels, block_levels)
- ✅ Sistema de comunicaciones
- ✅ Feature flags
- ✅ FAQ articles
- ✅ System logs

SOLO FALTA:
- ❌ Sistema de Torneos (5 tablas)

IMPACTO EN EL PLAN:
- ETAPA 1.2 → INNECESARIA (tablas ya existen)
- FASE 3 (Soporte) → Infraestructura lista, saltar a testing
- FASE 6 (Luminarias) → Infraestructura lista, saltar a testing

Próximo paso REAL: ETAPA 1.3 - Verificar que modalidades guardan datos correctamente

[7 Oct 2025 - 16:00] Claude:
✅ ESQUEMA DE BASE DE DATOS DOCUMENTADO

Documento creado: DATABASE_SCHEMA_REFERENCE.md
Contiene estructura completa de las 46 tablas con:
- Nombres de todas las columnas
- Tipos de datos exactos
- Constraints (NOT NULL, DEFAULT, PRIMARY KEY, FOREIGN KEY)
- Ejemplos de campos JSONB más usados
- Referencias cruzadas entre tablas

Esta información es crítica para verificar que los endpoints guardan datos en los campos correctos.
```

---

## ETAPA 1.2: Creación de Tablas de Juegos Faltantes

**Estado:** ✅ **COMPLETADA** (tablas ya existían)
**Fecha de inicio:** 7 Oct 2025 - 14:45
**Fecha de finalización:** 7 Oct 2025 - 15:30
**Responsable:** N/A (verificación de existencia)

### Descripción
Crear las tablas `game_players` y `game_scores` si no existen, necesarias para el funcionamiento correcto de todas las modalidades.

### Funcionalidad a desarrollar
Persistencia completa de:
- Jugadores participantes en cada partida
- Puntuaciones finales por jugador y partida
- Métricas detalladas (tiempo, aciertos, errores)

### Cómo se va a hacer

**Paso 1:** Verificar en pgAdmin4 si existen:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('game_players', 'game_scores');
```

**Paso 2:** Propuesta de estructura (PENDIENTE DE APROBACIÓN):

#### Tabla `game_players`
```sql
CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_index INTEGER NOT NULL, -- 0, 1, 2... (orden de jugador en partida)
    nickname VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, player_index)
);

CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
```

**Campos propuestos:**
- `id`: Identificador único
- `game_id`: FK a tabla games
- `user_id`: FK a tabla users
- `player_index`: Orden del jugador (0, 1, 2...) para juegos multiplayer
- `nickname`: Snapshot del nickname en el momento del juego
- `joined_at`: Timestamp de unión a la partida

**Constraints:**
- UNIQUE(game_id, user_id): Un usuario no puede estar duplicado en la misma partida
- UNIQUE(game_id, player_index): No puede haber dos jugadores con el mismo índice

#### Tabla `game_scores`
```sql
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    score_data JSONB DEFAULT '{}',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

CREATE INDEX idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_game_scores_completed_at ON game_scores(completed_at);

COMMENT ON COLUMN game_scores.score_data IS 'JSON con: {correct, incorrect, blank, totalQuestions, timeSpent, averageResponseTime, ...}';
```

**Campos propuestos:**
- `id`: Identificador único
- `game_id`: FK a tabla games
- `user_id`: FK a tabla users
- `score`: Puntuación final (número entero)
- `score_data`: JSONB con datos detallados:
  ```json
  {
    "correct": 8,
    "incorrect": 2,
    "blank": 0,
    "totalQuestions": 10,
    "timeSpent": 245,
    "averageResponseTime": 24.5,
    "streak": 5,
    "lives": 3,
    "mode": "classic"
  }
  ```
- `completed_at`: Timestamp de finalización

**Constraints:**
- UNIQUE(game_id, user_id): Un usuario solo puede tener un score por partida

**Paso 3:** Tras aprobación del usuario, ejecutar en pgAdmin4

**Paso 4:** Verificar creación con:
```sql
\d game_players
\d game_scores
```

### Partes críticas
- 🔴 **MUY CRÍTICO:** Foreign keys deben apuntar a tablas existentes (`games`, `users`)
- ⚠️ **CRÍTICO:** Columnas JSONB deben tener DEFAULT para evitar NULLs
- ⚠️ **IMPORTANTE:** Índices en `game_id` y `user_id` para performance

### Preguntas para el usuario

**IMPORTANTE - RESPONDER ANTES DE PROCEDER:**

1. **¿La estructura propuesta de `game_players` es correcta?**
   - ¿Algún campo adicional necesario? (ej: status, left_at, etc.)
   - ¿El constraint UNIQUE(game_id, user_id) es adecuado?

2. **¿La estructura propuesta de `game_scores` es correcta?**
   - ¿El campo `score_data` JSONB es suficientemente flexible?
   - ¿Necesitas campos adicionales específicos fuera del JSONB?

3. **¿Existen ya estas tablas con otro nombre en tu BD?**
   - Verificar si hay tablas similares con nombres distintos

### Afecciones a otras funcionalidades
- ✅ **POSITIVA:** Historial de juegos funcionará mejor
- ✅ **POSITIVA:** Rankings podrán calcularse correctamente
- ⚠️ **SI FALLA:** Algunas llamadas a `/api/games/history` darán error SQL hasta que se creen

### Testing post-implementación
1. ⏳ Verificar tablas creadas en pgAdmin4
2. ⏳ Insertar registro de prueba manualmente:
   ```sql
   -- Prueba game_players
   INSERT INTO game_players (game_id, user_id, player_index, nickname)
   VALUES (1, 1, 0, 'TestUser');

   -- Prueba game_scores
   INSERT INTO game_scores (game_id, user_id, score, score_data)
   VALUES (1, 1, 8, '{"correct": 8, "incorrect": 2}');
   ```
3. ⏳ Verificar que endpoint `/api/games` no da errores
4. ⏳ **NO** testing de funcionalidad aún, solo que no rompe nada

### Entregables
1. ⏳ Tablas `game_players` y `game_scores` creadas en Aiven
2. ⏳ Verificación de foreign keys y constraints
3. ⏳ Documento de validación de creación

### Notas y comentarios
```
[7 Oct 2025 - 14:45] Claude:
Propuesta de tablas preparada. Esperando feedback del usuario sobre:
- Estructura de campos
- Nombres de tablas
- Constraints adicionales

Antes de ejecutar: confirmar que estas tablas NO existen ya con otro nombre.
```

---

## ETAPA 1.3: Verificación de Guardado en Modalidades

**Estado:** 🟡 **LISTA PARA COMENZAR**
**Fecha de inicio:** 7 Oct 2025 - 15:45
**Fecha de finalización:** Pendiente
**Responsable:** Usuario (testing manual) + Claude (análisis)
**Documento de referencia:** `PROTOCOLO_TESTING_MODALIDADES.md`

### Descripción
Aunque el análisis mostró que todas las modalidades tienen código de guardado, verificar que **realmente funciona end-to-end** con la BD.

### Funcionalidad a desarrollar
Testing exhaustivo de persistencia en las 9 modalidades.

### Cómo se va a hacer

#### Orden de testing (por prioridad):

**MODALIDADES DE ENTRENAMIENTO:**
1. ⏳ **Classic Mode** (`game-classic.html`)
2. ⏳ **Streak Mode** (`game-streak.html`)
3. ⏳ **By Levels Mode** (`game-by-levels.html`)

**MODALIDADES DE COMPETICIÓN INDIVIDUAL:**
4. ⏳ **Exam Mode** (`game-exam.html`)
5. ⏳ **Lives Mode** (`game-lives.html`)
6. ⏳ **Time Trial Mode** (`game-time-trial.html`)
7. ⏳ **Marathon Mode** (`game-marathon.html`)

**MODALIDADES DE COMPETICIÓN MULTIPLAYER:**
8. ✅ **Duel Mode** (`game-duel.html`) - Requiere 2 usuarios [FUNCIONAL - 2025-01-13]
9. ⏳ **Trivial Mode** (`game-trivial.html`) - Requiere 2+ usuarios

### Protocolo de testing por modalidad

Para CADA modalidad, ejecutar el siguiente checklist:

#### A. Testing en Render (producción/staging)

**Paso 1: Preparación**
- [ ] Login con usuario de prueba
- [ ] Abrir Developer Tools (F12)
- [ ] Ir a pestaña Network
- [ ] Activar filtro "Fetch/XHR"

**Paso 2: Ejecución**
- [ ] Iniciar partida de la modalidad
- [ ] Jugar hasta completar (o hasta condición de finalización)
- [ ] **CAPTURAR:**
  - Screenshot de pantalla final
  - Request/Response en Network tab
  - Mensajes en Console tab
  - Logs del backend en Render (Dashboard → Logs)

**Paso 3: Verificación en pgAdmin4**
```sql
-- 1. Ver última partida creada
SELECT * FROM games
ORDER BY created_at DESC
LIMIT 1;

-- 2. Ver score de esa partida (usar ID de arriba)
SELECT * FROM game_scores
WHERE game_id = [ID_PARTIDA];

-- 3. Ver jugadores de esa partida
SELECT * FROM game_players
WHERE game_id = [ID_PARTIDA];

-- 4. Ver si actualizó user_profiles
SELECT
  nickname,
  jsonb_array_length(answer_history) as num_respuestas,
  stats->'consolidation'->'byBlock' as consolidacion_bloques
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.id = [TU_USER_ID];
```

#### B. Checklist de validación

Para que una modalidad se considere **✅ FUNCIONAL**, debe cumplir:

- [ ] Partida aparece en tabla `games` con `status = 'completed'`
- [ ] Score aparece en `game_scores` con datos correctos en `score_data`
- [ ] Jugador(es) aparecen en `game_players`
- [ ] `user_profiles.answer_history` se actualiza (array crece)
- [ ] `user_profiles.stats.consolidation` se actualiza (si aplica)
- [ ] Historial muestra la partida (`GET /api/games/history`)
- [ ] Frontend muestra mensaje de éxito al finalizar

#### C. Categorías de estado

**✅ FUNCIONAL:** Todos los checks pasan
**⚠️ PARCIAL:** Algunos checks fallan pero la partida se crea
**❌ ROTO:** La partida no se guarda en absoluto
**❓ NO TESTEADO:** Aún no se ha probado

#### D. Registro de resultados

| Modalidad | Estado | Issues encontrados | Prioridad fix |
|-----------|--------|-------------------|---------------|
| Classic | ❓ | - | - |
| Streak | ❓ | - | - |
| By Levels | ❓ | - | - |
| Exam | ❓ | - | - |
| Lives | ❓ | - | - |
| Time Trial | ❓ | - | - |
| Marathon | ❓ | - | - |
| Duel | ✅ | Sistema de puntuación implementado y documentado | - |
| Trivial | ❓ | - | - |

### Partes críticas
- ⚠️ **CRÍTICO:** Modalidades multiplayer (Duel, Trivial) requieren 2 cuentas de prueba
- ⚠️ **CRÍTICO:** `apiDataService.saveXXXScore()` puede fallar si tablas no existen
- ⚠️ **IMPORTANTE:** Verificar que no se duplican registros al guardar
- ⚠️ **IMPORTANTE:** Testing debe hacerse en Render, no en local

### Si algo falla durante testing

**Protocolo de manejo de errores:**

1. **Capturar información:**
   - Error exacto en consola del navegador
   - Status code de la respuesta HTTP
   - Error en logs del backend (Render)
   - Query SQL que falló (si aplica)

2. **Identificar categoría:**
   - A. Frontend no envía datos → Problema en `game-*.html`
   - B. Backend rechaza request → Problema en `routes/games.js`
   - C. BD rechaza INSERT → Problema en estructura de tablas
   - D. Datos se guardan pero incorrectos → Problema en lógica

3. **Reportar al plan:**
   - Actualizar tabla de estado
   - Añadir nota en sección "Issues encontrados"
   - Marcar para corrección en ETAPA 1.4

4. **NO modificar código aún** - Solo documentar

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Solo testing de lectura
- ⚠️ **SI ENCONTRAMOS BUGS:** Algunas modalidades pueden no guardar, pero no rompen otras

### Entregables
1. ⏳ Tabla completa con estado de guardado por modalidad (✅/⚠️/❌)
2. ⏳ Lista detallada de bugs encontrados (si hay)
3. ⏳ Logs de errores capturados con screenshots
4. ⏳ Recomendaciones de corrección priorizadas

### Notas y comentarios
```
[7 Oct 2025 - 15:45] Claude:
✅ PROTOCOLO DE TESTING CREADO

Documento creado: PROTOCOLO_TESTING_MODALIDADES.md
Contiene:
- Instrucciones generales de preparación
- Queries SQL para verificación en pgAdmin4
- Checklist detallado para cada una de las 9 modalidades
- Categorización por tipo (Entrenamiento, Competición Individual, Multiplayer)
- Espacio para documentar resultados y problemas

Esta etapa requiere testing manual exhaustivo. Estimado: 3-4 horas.
Se recomienda hacer en sesiones separadas (3 modalidades por sesión).

✅ IMPORTANTE: Las tablas game_players y game_scores YA EXISTEN (verificado en ETAPA 1.1)
Por lo tanto, se puede proceder con el testing inmediatamente.

Próximo paso: Usuario debe ejecutar el protocolo de testing en cada modalidad.
```

---

## ETAPA 1.4: Corrección de Bugs de Guardado

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente (después de ETAPA 1.3)
**Fecha de finalización:** Pendiente
**Responsable:** Claude (código) + Usuario (testing)

### Descripción
Si en ETAPA 1.3 encontramos modalidades que NO guardan correctamente, corregirlas una por una.

**NOTA:** Esta etapa podría no ser necesaria si todas las modalidades pasan el testing.

### Funcionalidad a desarrollar
Dependiendo de qué modalidades fallen, implementar correcciones específicas.

### Cómo se va a hacer

**Proceso por modalidad rota:**

#### Paso 1: Análisis del fallo
Para cada modalidad que falló en ETAPA 1.3:

**A. Identificar tipo de fallo:**
- [ ] A. Falta llamada a API → Añadir código
- [ ] B. API devuelve error → Investigar backend
- [ ] C. BD rechaza INSERT → Revisar constraints/tipos de datos
- [ ] D. Datos incorrectos → Revisar formato de datos

**B. Localizar código problemático:**
```javascript
// Buscar en game-[modalidad].html:
// 1. Función de finalización (handleFinishGame, finishGame, etc.)
// 2. Llamadas a apiDataService
// 3. Formato de scoreData
```

#### Paso 2: Proponer solución

**ANTES de modificar código, documentar:**
1. Archivo a modificar
2. Líneas afectadas
3. Código actual (problemático)
4. Código propuesto (solución)
5. Justificación del cambio
6. Posibles efectos secundarios

**Ejemplo de propuesta:**
```
ARCHIVO: game-classic.html
LÍNEAS: 450-480
PROBLEMA: No se llama a apiDataService.saveClassicScore()
SOLUCIÓN: Añadir llamada en función handleFinishGame()

CÓDIGO ACTUAL:
```javascript
const handleFinishGame = () => {
  setGameStatus('finished');
  // Solo actualiza UI, no guarda en BD
};
```

CÓDIGO PROPUESTO:
```javascript
const handleFinishGame = async () => {
  try {
    // Preparar datos de puntuación
    const scoreData = {
      score: correctAnswers,
      totalAnswered: questionsAnswered,
      totalQuestions: questions.length,
      correct: correctAnswers,
      incorrect: incorrectAnswers,
      blank: questions.length - questionsAnswered,
      timeSpent: totalTimeSpent,
      averageResponseTime: calculateAvgTime()
    };

    // Guardar score
    await apiDataService.saveClassicScore(gameId, scoreData);

    // Actualizar estadísticas de usuario
    await apiDataService.updateUserStats(userId, gameId, answerHistory, 'classic');

    setGameStatus('finished');
  } catch (error) {
    console.error('Error saving game:', error);
    // Mostrar error al usuario pero permitir ver resultados
  }
};
```

EFECTOS SECUNDARIOS:
- Función ahora es async, puede afectar a código que la llama
- Añade delay al finalizar juego (por llamadas a API)
- Si API falla, usuario verá error pero podrá ver resultados

REQUIERE TESTING:
- Verificar que datos se guardan en BD
- Verificar que UI responde correctamente
- Verificar manejo de errores
```

#### Paso 3: Implementar corrección

**Solo después de aprobación del usuario:**

1. Modificar archivo correspondiente
2. Commit con mensaje descriptivo:
   ```
   git commit -m "Fix: Classic mode now saves score to database

   - Added saveClassicScore call in handleFinishGame
   - Added updateUserStats for consolidation tracking
   - Added error handling for API failures

   Refs: PLAN_MAESTRO.md - FASE 1, ETAPA 1.4"
   ```
3. Deploy a Render (si aplica)
4. Esperar a que deploy termine

#### Paso 4: Testing de corrección

**Testing específico de modalidad corregida:**

- [ ] Jugar 3 partidas completas
- [ ] Verificar que las 3 se guardan en BD
- [ ] Verificar que datos son correctos
- [ ] Verificar que stats se actualizan
- [ ] Verificar que historial muestra las partidas

**Testing de regresión (otras modalidades):**

- [ ] Jugar 1 partida de 2-3 modalidades que YA funcionaban
- [ ] Verificar que siguen funcionando correctamente
- [ ] Verificar que no hay efectos secundarios

#### Paso 5: Actualizar registro

Actualizar tabla de estado en ETAPA 1.3:

```
| Modalidad | Estado | Issues encontrados | Prioridad fix | Fix aplicado |
|-----------|--------|-------------------|---------------|--------------|
| Classic   | ✅ CORREGIDO | No guardaba score | Alta | 8 Oct 2025 |
```

### Partes críticas
- 🔴 **MUY CRÍTICO:** Testing de regresión después de cada corrección
- ⚠️ **CRÍTICO:** No modificar lógica de juego, solo añadir guardado
- ⚠️ **IMPORTANTE:** Mantener consistencia en formato de `scoreData`
- ⚠️ **IMPORTANTE:** Un commit por modalidad corregida

### Patrones comunes de corrección

#### Patrón 1: Añadir guardado básico
```javascript
// Al final del juego
const scoreData = {
  score: points,
  correct: correctCount,
  incorrect: incorrectCount,
  totalQuestions: totalQuestions
};
await apiDataService.saveXXXScore(gameId, scoreData);
```

#### Patrón 2: Actualizar estadísticas
```javascript
// Preparar historial de respuestas
const answerHistory = questions.map(q => ({
  questionId: q.id,
  blockId: q.block_id,
  topicName: q.topic,
  result: q.wasCorrect ? 'correct' : 'incorrect',
  responseTime: q.timeSpent
}));

await apiDataService.updateUserStats(userId, gameId, answerHistory, gameMode);
```

#### Patrón 3: Manejo de errores
```javascript
try {
  await saveGameData();
} catch (error) {
  console.error('Error saving game:', error);
  // Mostrar mensaje al usuario pero no bloquear
  showNotification('Partida completada pero no se pudo guardar. Intenta de nuevo.', 'warning');
}
```

### Afecciones a otras funcionalidades
- ⚠️ **POTENCIAL:** Cambios en una modalidad pueden afectar otras si comparten código
- ⚠️ **POTENCIAL:** Cambios en `apiDataService` afectan TODAS las modalidades
- ✅ **POSITIVA:** Mejora general de confiabilidad del sistema

### Testing post-implementación

**Por cada modalidad corregida:**

1. **Testing funcional:**
   - [ ] 3 partidas completas
   - [ ] Verificar guardado en BD
   - [ ] Verificar stats actualizadas
   - [ ] Verificar historial

2. **Testing de regresión:**
   - [ ] 1 partida de Classic (si no fue corregido)
   - [ ] 1 partida de Duel (más complejo)
   - [ ] Verificar que siguen funcionando

3. **Testing de edge cases:**
   - [ ] Partida abandonada a mitad (debe NO guardarse)
   - [ ] Sin conexión a internet (manejo de error)
   - [ ] Partida muy corta (1 pregunta)

### Entregables
1. ⏳ Código corregido en repositorio
2. ⏳ Commits descriptivos por modalidad
3. ⏳ Tabla actualizada con estado de correcciones
4. ⏳ Documento de testing de regresión

### Notas y comentarios
```
[Pendiente de inicio]

Esta etapa es CONDICIONAL - solo se ejecuta si encontramos bugs en ETAPA 1.3.

Si todas las modalidades pasan el testing, esta etapa se marca como COMPLETADA
sin necesidad de hacer cambios.

Recordatorio: Una corrección a la vez, con testing completo entre cada una.
```

---

## RESUMEN DE FASE 1

**Estado general:** 🟡 EN CURSO
**Progreso:** [████░░░░░░] 40%

**Etapas completadas:** 2/4
**Etapas en curso:** 1/4
**Etapas pendientes:** 1/4

**Próximo paso:** ETAPA 1.3 - Testing de guardado en modalidades

**Bloqueadores actuales:**
- ✅ NINGUNO - Infraestructura de BD completa

**Decisiones pendientes:**
- ✅ Ninguna - Tablas verificadas como existentes

---

# FASE 2: ESTADÍSTICAS Y CONSOLIDACIÓN DE CONOCIMIENTO

**Objetivo:** Sistema robusto de cálculo y visualización de estadísticas de aprendizaje.

**Duración estimada:** 4-6 sesiones (8-12 horas)
**Progreso:** [░░░░░░░░░░] 0%
**Estado:** ⏳ PENDIENTE (bloqueada por FASE 1)

---

## ETAPA 2.1: Auditoría de Sistema de Estadísticas Actual

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente
**Fecha de finalización:** Pendiente
**Responsable:** Claude (análisis) + Usuario (verificación)

### Descripción
Entender exactamente cómo se calculan y guardan las estadísticas de consolidación actualmente.

### Funcionalidad a desarrollar
Documentación completa del sistema actual de stats.

### Cómo se va a hacer

**1. Revisar estructura de `user_profiles.stats`:**

Según `routes/users.js:150-163`, tiene esta estructura:
```json
{
  "consolidation": {
    "byQuestion": {
      "123": {
        "attempts": 5,
        "correct": 3,
        "lastAttempt": "2025-01-15T10:30:00Z",
        "consolidationLevel": 0.6
      }
    },
    "byTopic": {
      "Matemáticas": {
        "attempts": 20,
        "correct": 15,
        "consolidationLevel": 0.75
      }
    },
    "byBlock": {
      "1": {
        "attempts": 50,
        "correct": 38,
        "consolidationLevel": 0.76
      }
    }
  }
}
```

**2. Revisar función de actualización:**
- Analizar `routes/users.js:134-280` (función POST /stats)
- Documentar algoritmo de cálculo de consolidación
- Identificar parámetros configurables (pesos, umbrales)

**3. Verificar qué modalidades actualizan stats:**
- Buscar llamadas a `apiDataService.updateUserStats()` en cada modalidad
- Verificar formato de datos enviados
- Identificar inconsistencias

**4. Testing actual del sistema:**

```sql
-- Query de verificación
SELECT
  u.nickname,
  u.id,
  up.stats->'consolidation'->'byQuestion' as questions,
  up.stats->'consolidation'->'byTopic' as topics,
  up.stats->'consolidation'->'byBlock' as blocks
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.nickname = '[USUARIO_PRUEBA]';
```

**5. Jugar partidas y observar:**
- Jugar 3 partidas de Classic Mode
- Verificar si `stats` cambia después de cada una
- Documentar qué cambia exactamente

### Partes críticas
- ⚠️ **IMPORTANTE:** Fórmula de consolidación debe ser consistente
- ⚠️ **IMPORTANTE:** Verificar que no se pierden datos al actualizar JSONB
- ⚠️ **IMPORTANTE:** Entender diferencia entre `answer_history` y `stats`

### Preguntas para el usuario

**IMPORTANTE - RESPONDER para esta etapa:**

1. **¿Qué representa exactamente `consolidationLevel`?**
   - ¿Es un porcentaje (0-1)?
   - ¿Cómo se calcula? (aciertos/intentos, algoritmo más complejo, etc.)
   - ¿Qué valor se considera "consolidado"? (ej: >0.8)

2. **¿Qué es más importante para el sistema?**
   - A) Consolidación por pregunta individual
   - B) Consolidación por tema
   - C) Consolidación por bloque completo

3. **¿El sistema actual funciona como esperas?**
   - ¿Te gustaría cambiar algo en cómo se calcula?

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Solo análisis y documentación

### Entregables
1. ⏳ Documento explicando algoritmo de consolidación actual
2. ⏳ Lista de modalidades que SÍ/NO actualizan stats
3. ⏳ Propuesta de mejoras (si usuario lo requiere)
4. ⏳ Ejemplos visuales de cómo cambian los datos

### Notas y comentarios
```
[Pendiente de inicio - Bloqueada por FASE 1]

Esta etapa requiere que las modalidades guarden datos correctamente (FASE 1).
No iniciar hasta completar FASE 1 totalmente.
```

---

## ETAPA 2.2: Implementación de Actualización de Stats en Todas las Modalidades

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente
**Fecha de finalización:** Pendiente
**Responsable:** Claude (código) + Usuario (testing)

### Descripción
Asegurar que TODAS las modalidades actualizan correctamente `user_profiles.stats` tras cada partida.

### Funcionalidad a desarrollar
Actualización consistente de:
- `consolidation.byQuestion` - Por cada pregunta respondida
- `consolidation.byTopic` - Por cada tema practicado
- `consolidation.byBlock` - Por cada bloque jugado

### Cómo se va a hacer

**Identificar modalidades que NO actualizan:**

Basándonos en ETAPA 2.1, crear lista:
- [ ] Classic Mode
- [ ] Streak Mode
- [ ] By Levels Mode
- [ ] Exam Mode
- [ ] Lives Mode
- [ ] Time Trial Mode
- [ ] Marathon Mode
- [x] Duel Mode ✅ [FUNCIONAL - 2025-01-13]
- [ ] Trivial Mode

**Por cada modalidad que NO actualice:**

#### Paso 1: Preparar datos de respuestas

```javascript
// Al finalizar juego, preparar historial
const answerHistory = questionsPlayed.map(q => ({
  questionId: q.id,
  blockId: q.block_id,
  topicName: q.topic,
  result: q.wasCorrect ? 'correct' : 'incorrect',
  responseTime: q.timeSpent,
  timestamp: new Date().toISOString()
}));
```

#### Paso 2: Llamar a updateUserStats

```javascript
// Enviar a backend
await apiDataService.updateUserStats(
  userId,
  gameId,
  answerHistory,
  gameMode // 'classic', 'exam', 'streak', etc.
);
```

#### Paso 3: Verificar en BD

```sql
-- Antes de la partida
SELECT stats->'consolidation'->'byQuestion'
FROM user_profiles
WHERE user_id = [USER_ID];

-- Jugar partida...

-- Después de la partida
SELECT stats->'consolidation'->'byQuestion'
FROM user_profiles
WHERE user_id = [USER_ID];

-- Debería haber más preguntas o valores actualizados
```

### Partes críticas
- 🔴 **MUY CRÍTICO:** Formato de `answerHistory` debe ser exacto
- ⚠️ **CRÍTICO:** No duplicar llamadas a `updateUserStats` (una vez por partida)
- ⚠️ **IMPORTANTE:** Manejar partidas abandonadas (no actualizar stats si no termina)
- ⚠️ **IMPORTANTE:** Performance si partidas muy largas (muchas preguntas)

### Casos especiales por modalidad

**Marathon Mode:**
- Preguntas que no se llegaron a ver NO cuentan

**Duel/Trivial Mode:**
- Stats se actualizan para AMBOS jugadores
- ✅ **Duel Mode:** Sistema de puntuación implementado (+1 acierto, +1 bonus velocidad) [2025-01-13]
- ⏳ **Trivial Mode:** Pendiente de implementación

**Exam Mode:**
- Preguntas en blanco NO cuentan como intento

### Afecciones a otras funcionalidades
- ✅ **POSITIVA:** Mejor tracking de aprendizaje
- ⚠️ **POTENCIAL:** Performance si partidas muy largas (>100 preguntas)
- ⚠️ **POTENCIAL:** JSONB puede crecer mucho con el tiempo

### Testing post-implementación

**Por cada modalidad implementada:**

1. **Testing básico:**
   - [ ] Jugar partida con 10 preguntas conocidas
   - [ ] Verificar que 10 preguntas aparecen en stats
   - [ ] Verificar que consolidación se calcula

2. **Testing de acumulación:**
   - [ ] Jugar 3 partidas con mismas preguntas
   - [ ] Verificar que `attempts` aumenta
   - [ ] Verificar que `consolidationLevel` cambia

3. **Testing de edge cases:**
   - [ ] Partida abandonada → NO actualizar
   - [ ] Partida con 1 pregunta → Actualizar correctamente
   - [ ] Partida con preguntas nuevas → Crear entradas nuevas

### Entregables
1. ⏳ Código actualizado en todas las modalidades
2. ⏳ Testing documentado por modalidad
3. ⏳ Tabla de estado de implementación
4. ⏳ Métricas de performance (si aplica)

### Notas y comentarios
```
[Pendiente de inicio]

Recordatorio: Verificar en ETAPA 2.1 cuáles modalidades YA actualizan stats
para no duplicar trabajo.
```

---

## ETAPA 2.3: Endpoint de Estadísticas Detalladas

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente
**Fecha de finalización:** Pendiente
**Responsable:** Claude (código backend)

### Descripción
Crear/mejorar endpoint que devuelva estadísticas procesadas y listas para mostrar en frontend.

### Funcionalidad a desarrollar
Endpoint `GET /api/users/stats/detailed` que devuelva:
- Preguntas más débiles (menor consolidación)
- Temas dominados vs pendientes
- Progreso por bloque
- Recomendaciones de estudio personalizadas
- Estadísticas globales del usuario

### Cómo se va a hacer

#### Paso 1: Crear endpoint en `routes/users.js`

```javascript
/**
 * GET /api/users/stats/detailed
 * Obtiene estadísticas detalladas y procesadas del usuario actual
 */
router.get('/stats/detailed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Obtener stats del usuario
    const result = await pool.query(`
      SELECT stats, answer_history
      FROM user_profiles
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        weakQuestions: [],
        topicProgress: [],
        blockProgress: [],
        overallConsolidation: 0,
        recommendations: [],
        totalAttempts: 0
      });
    }

    const stats = result.rows[0].stats || {};
    const answerHistory = result.rows[0].answer_history || [];
    const consolidation = stats.consolidation || {
      byQuestion: {},
      byTopic: {},
      byBlock: {}
    };

    // 2. Procesar preguntas débiles (consolidación < 0.5)
    const weakQuestions = Object.entries(consolidation.byQuestion || {})
      .filter(([qId, data]) => data.consolidationLevel < 0.5)
      .sort((a, b) => a[1].consolidationLevel - b[1].consolidationLevel)
      .slice(0, 20) // Top 20 más débiles
      .map(([qId, data]) => ({
        questionId: parseInt(qId),
        attempts: data.attempts,
        correct: data.correct,
        consolidationLevel: data.consolidationLevel,
        lastAttempt: data.lastAttempt
      }));

    // 3. Procesar progreso por tema
    const topicProgress = Object.entries(consolidation.byTopic || {})
      .map(([topic, data]) => ({
        topic,
        attempts: data.attempts,
        correct: data.correct,
        consolidationLevel: data.consolidationLevel,
        status: getTopicStatus(data.consolidationLevel)
      }))
      .sort((a, b) => a.consolidationLevel - b.consolidationLevel);

    // 4. Procesar progreso por bloque
    const blockProgress = Object.entries(consolidation.byBlock || {})
      .map(([blockId, data]) => ({
        blockId: parseInt(blockId),
        attempts: data.attempts,
        correct: data.correct,
        consolidationLevel: data.consolidationLevel,
        status: getTopicStatus(data.consolidationLevel)
      }))
      .sort((a, b) => b.consolidationLevel - a.consolidationLevel);

    // 5. Calcular consolidación general
    const overallConsolidation = calculateOverallConsolidation(consolidation);

    // 6. Generar recomendaciones
    const recommendations = generateRecommendations(
      weakQuestions,
      topicProgress,
      blockProgress,
      overallConsolidation
    );

    // 7. Estadísticas adicionales
    const totalAttempts = answerHistory.length;
    const correctAnswers = answerHistory.filter(a => a.result === 'correct').length;
    const overallAccuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) : 0;

    res.json({
      weakQuestions,
      topicProgress,
      blockProgress,
      overallConsolidation,
      recommendations,
      totalAttempts,
      overallAccuracy,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas detalladas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Funciones auxiliares
function getTopicStatus(level) {
  if (level >= 0.8) return 'mastered';
  if (level >= 0.6) return 'good';
  if (level >= 0.4) return 'learning';
  return 'weak';
}

function calculateOverallConsolidation(consolidation) {
  const allQuestions = Object.values(consolidation.byQuestion || {});
  if (allQuestions.length === 0) return 0;

  const sum = allQuestions.reduce((acc, q) => acc + q.consolidationLevel, 0);
  return sum / allQuestions.length;
}

function generateRecommendations(weak, topics, blocks, overall) {
  const recs = [];

  // Recomendación 1: Preguntas débiles
  if (weak.length > 0) {
    recs.push({
      type: 'weak_questions',
      priority: 'high',
      message: `Tienes ${weak.length} preguntas con baja consolidación. Practica con modo Classic.`,
      action: 'practice_weak',
      data: weak.slice(0, 5).map(q => q.questionId)
    });
  }

  // Recomendación 2: Temas pendientes
  const weakTopics = topics.filter(t => t.consolidationLevel < 0.6);
  if (weakTopics.length > 0) {
    recs.push({
      type: 'weak_topics',
      priority: 'medium',
      message: `Enfócate en los temas: ${weakTopics.slice(0, 3).map(t => t.topic).join(', ')}`,
      action: 'practice_topic',
      data: weakTopics.slice(0, 3).map(t => t.topic)
    });
  }

  // Recomendación 3: Bloques a repasar
  const blocksNeedReview = blocks.filter(b => b.consolidationLevel < 0.7);
  if (blocksNeedReview.length > 0) {
    recs.push({
      type: 'block_review',
      priority: 'medium',
      message: `Repasa ${blocksNeedReview.length} bloques para mejorar tu consolidación`,
      action: 'review_block',
      data: blocksNeedReview.map(b => b.blockId)
    });
  }

  // Recomendación 4: Consolidación general baja
  if (overall < 0.5) {
    recs.push({
      type: 'general_practice',
      priority: 'high',
      message: 'Tu consolidación general es baja. Te recomendamos practicar regularmente.',
      action: 'daily_practice',
      data: null
    });
  }

  // Recomendación 5: Consolidación alta - mantener
  if (overall >= 0.8) {
    recs.push({
      type: 'maintain',
      priority: 'low',
      message: '¡Excelente! Mantén tu práctica para no perder consolidación.',
      action: 'maintain_level',
      data: null
    });
  }

  return recs;
}
```

#### Paso 2: Testing del endpoint

```bash
# Testing en local
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:3000/api/users/stats/detailed

# Testing en Render
curl -H "Authorization: Bearer [TOKEN]" \
  https://playtest-backend.onrender.com/api/users/stats/detailed
```

**Respuesta esperada:**
```json
{
  "weakQuestions": [
    {
      "questionId": 123,
      "attempts": 5,
      "correct": 1,
      "consolidationLevel": 0.2,
      "lastAttempt": "2025-10-07T10:00:00Z"
    }
  ],
  "topicProgress": [
    {
      "topic": "Matemáticas",
      "attempts": 20,
      "correct": 15,
      "consolidationLevel": 0.75,
      "status": "good"
    }
  ],
  "blockProgress": [
    {
      "blockId": 1,
      "attempts": 50,
      "correct": 40,
      "consolidationLevel": 0.8,
      "status": "mastered"
    }
  ],
  "overallConsolidation": 0.65,
  "recommendations": [
    {
      "type": "weak_questions",
      "priority": "high",
      "message": "Tienes 5 preguntas con baja consolidación...",
      "action": "practice_weak",
      "data": [123, 456, 789]
    }
  ],
  "totalAttempts": 150,
  "overallAccuracy": 0.73,
  "generatedAt": "2025-10-07T14:30:00Z"
}
```

### Partes críticas
- ⚠️ **CRÍTICO:** Validar que `stats.consolidation` existe antes de procesar
- ⚠️ **IMPORTANTE:** Performance con muchas preguntas (limitar a top N)
- ⚠️ **IMPORTANTE:** Manejar caso de usuario nuevo (sin datos)

### Preguntas para el usuario

1. **¿Qué umbrales prefieres para los estados?**
   - Actual propuesto:
     - Mastered: ≥ 0.8
     - Good: 0.6-0.79
     - Learning: 0.4-0.59
     - Weak: < 0.4

2. **¿Cuántas recomendaciones máximo quieres mostrar?**
   - Propuesta: Top 5 más importantes

3. **¿Qué otras estadísticas te gustaría ver?**
   - Racha actual/máxima
   - Tiempo total estudiado
   - Preguntas favoritas
   - Etc.

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Nuevo endpoint, no modifica existentes
- ✅ **POSITIVA:** Frontend puede consumirlo fácilmente

### Testing post-implementación
1. ⏳ Verificar respuesta tiene estructura correcta
2. ⏳ Verificar cálculos con casos conocidos
3. ⏳ Testing con usuario sin datos (nuevo)
4. ⏳ Testing con usuario con muchos datos (performance)
5. ⏳ Verificar recomendaciones son coherentes

### Entregables
1. ⏳ Endpoint implementado y funcional
2. ⏳ Documentación de API
3. ⏳ Tests unitarios (opcional pero recomendado)
4. ⏳ Ejemplos de respuestas

### Notas y comentarios
```
[Pendiente de inicio]

Este endpoint es clave para el frontend de estadísticas.
Asegurar que devuelve datos útiles y procesados, no raw data.
```

---

## ETAPA 2.4: Frontend de Visualización de Estadísticas

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente
**Fecha de finalización:** Pendiente
**Responsable:** Claude (código HTML/JS) + Usuario (diseño/UX)

### Descripción
Crear/mejorar panel de estadísticas para que usuario vea su progreso de consolidación de forma clara e intuitiva.

### Funcionalidad a desarrollar
Panel con:
- 📊 Gráfico de consolidación por tema (barras)
- 📋 Lista de preguntas débiles (tabla interactiva)
- 🎯 Progreso por bloque (circular/radial)
- 💡 Recomendaciones personalizadas (cards)
- 📈 Estadísticas globales (resumen)

### Cómo se va a hacer

#### Paso 1: Crear/mejorar archivo HTML

**Opciones:**
- A) Crear nuevo `statistics-dashboard.html`
- B) Mejorar existente si hay alguno

#### Paso 2: Estructura base del panel

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi Progreso - PlayTest</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-brand-primary text-brand-light">
    <!-- Header con navegación -->
    <div id="header-container"></div>

    <div class="container mx-auto px-4 py-8">
        <!-- Resumen general -->
        <section id="summary-section" class="mb-8">
            <h2 class="text-3xl font-bold mb-4">📊 Tu Progreso</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Cards de estadísticas globales -->
                <div id="overall-stats"></div>
            </div>
        </section>

        <!-- Recomendaciones -->
        <section id="recommendations-section" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">💡 Recomendaciones</h2>
            <div id="recommendations-container"></div>
        </section>

        <!-- Gráfico de temas -->
        <section id="topics-section" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">📚 Progreso por Tema</h2>
            <canvas id="topicsChart"></canvas>
        </section>

        <!-- Preguntas débiles -->
        <section id="weak-questions-section" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">⚠️ Preguntas a Repasar</h2>
            <div id="weak-questions-table"></div>
        </section>

        <!-- Progreso por bloque -->
        <section id="blocks-section" class="mb-8">
            <h2 class="text-2xl font-bold mb-4">📦 Progreso por Bloque</h2>
            <div id="blocks-grid"></div>
        </section>
    </div>

    <script src="./api-data-service.js"></script>
    <script>
        // JavaScript aquí...
    </script>
</body>
</html>
```

#### Paso 3: Consumir endpoint de estadísticas

```javascript
const API_BASE_URL = window.location.hostname.includes('onrender.com')
  ? 'https://playtest-backend.onrender.com'
  : 'http://localhost:3000';

let currentStats = null;

async function loadStatistics() {
  try {
    const token = localStorage.getItem('playtest_auth_token');
    if (!token) {
      window.location.href = 'index.html';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/users/stats/detailed`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error cargando estadísticas');

    currentStats = await response.json();

    // Renderizar todas las secciones
    renderOverallStats(currentStats);
    renderRecommendations(currentStats.recommendations);
    renderTopicsChart(currentStats.topicProgress);
    renderWeakQuestions(currentStats.weakQuestions);
    renderBlocksProgress(currentStats.blockProgress);

  } catch (error) {
    console.error('Error:', error);
    showError('No se pudieron cargar las estadísticas');
  }
}

// Llamar al cargar página
document.addEventListener('DOMContentLoaded', loadStatistics);
```

#### Paso 4: Renderizar sección de resumen

```javascript
function renderOverallStats(stats) {
  const container = document.getElementById('overall-stats');

  const cards = [
    {
      title: 'Consolidación General',
      value: `${(stats.overallConsolidation * 100).toFixed(0)}%`,
      icon: '📊',
      color: getColorForLevel(stats.overallConsolidation)
    },
    {
      title: 'Total Intentos',
      value: stats.totalAttempts,
      icon: '🎯',
      color: 'blue'
    },
    {
      title: 'Precisión Global',
      value: `${(stats.overallAccuracy * 100).toFixed(0)}%`,
      icon: '✓',
      color: stats.overallAccuracy >= 0.7 ? 'green' : 'yellow'
    },
    {
      title: 'Preguntas a Repasar',
      value: stats.weakQuestions.length,
      icon: '⚠️',
      color: stats.weakQuestions.length > 10 ? 'red' : 'blue'
    }
  ];

  container.innerHTML = cards.map(card => `
    <div class="bg-brand-secondary rounded-lg p-6 border-l-4 border-${card.color}-500">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-brand-accent mb-1">${card.title}</p>
          <p class="text-3xl font-bold">${card.value}</p>
        </div>
        <div class="text-4xl">${card.icon}</div>
      </div>
    </div>
  `).join('');
}

function getColorForLevel(level) {
  if (level >= 0.8) return 'green';
  if (level >= 0.6) return 'blue';
  if (level >= 0.4) return 'yellow';
  return 'red';
}
```

#### Paso 5: Renderizar recomendaciones

```javascript
function renderRecommendations(recommendations) {
  const container = document.getElementById('recommendations-container');

  if (recommendations.length === 0) {
    container.innerHTML = `
      <div class="bg-green-900/20 border border-green-500 rounded-lg p-6 text-center">
        <p class="text-xl">🎉 ¡No tienes recomendaciones pendientes!</p>
        <p class="text-brand-accent mt-2">Sigue practicando para mantener tu nivel</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recommendations.map(rec => {
    const priorityColors = {
      high: 'red',
      medium: 'yellow',
      low: 'blue'
    };
    const color = priorityColors[rec.priority] || 'blue';

    return `
      <div class="bg-brand-secondary rounded-lg p-6 mb-4 border-l-4 border-${color}-500">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <span class="inline-block px-3 py-1 text-xs font-bold uppercase rounded-full
                       bg-${color}-500 text-white mb-2">
              ${rec.priority}
            </span>
            <p class="text-lg">${rec.message}</p>
          </div>
          <button
            onclick="handleRecommendationAction('${rec.action}', '${JSON.stringify(rec.data)}')"
            class="ml-4 px-4 py-2 bg-brand-cta hover:bg-brand-cta-hover rounded-lg">
            Practicar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function handleRecommendationAction(action, dataStr) {
  const data = JSON.parse(dataStr);

  // Redirigir según la acción
  switch (action) {
    case 'practice_weak':
      // Ir a juego con preguntas débiles filtradas
      window.location.href = `game-classic.html?weakQuestions=${data.join(',')}`;
      break;
    case 'practice_topic':
      // Ir a juego con tema específico
      window.location.href = `game-classic.html?topic=${data[0]}`;
      break;
    case 'review_block':
      // Ir a juego con bloque específico
      window.location.href = `game-classic.html?blockId=${data[0]}`;
      break;
    default:
      // Ir a selección de juego
      window.location.href = 'all-games.html';
  }
}
```

#### Paso 6: Renderizar gráfico de temas (Chart.js)

```javascript
let topicsChart = null;

function renderTopicsChart(topicProgress) {
  const ctx = document.getElementById('topicsChart').getContext('2d');

  // Destruir chart anterior si existe
  if (topicsChart) {
    topicsChart.destroy();
  }

  // Preparar datos
  const labels = topicProgress.map(t => t.topic);
  const data = topicProgress.map(t => t.consolidationLevel * 100);
  const colors = topicProgress.map(t => {
    const level = t.consolidationLevel;
    if (level >= 0.8) return 'rgba(34, 197, 94, 0.8)'; // green
    if (level >= 0.6) return 'rgba(59, 130, 246, 0.8)'; // blue
    if (level >= 0.4) return 'rgba(234, 179, 8, 0.8)'; // yellow
    return 'rgba(239, 68, 68, 0.8)'; // red
  });

  topicsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nivel de Consolidación (%)',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Consolidación: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
}
```

#### Paso 7: Renderizar tabla de preguntas débiles

```javascript
async function renderWeakQuestions(weakQuestions) {
  const container = document.getElementById('weak-questions-table');

  if (weakQuestions.length === 0) {
    container.innerHTML = `
      <div class="bg-green-900/20 border border-green-500 rounded-lg p-8 text-center">
        <p class="text-xl">✅ ¡Excelente! No tienes preguntas débiles</p>
      </div>
    `;
    return;
  }

  // Obtener textos de preguntas (requiere llamada adicional a API)
  const questionsWithText = await fetchQuestionsText(weakQuestions.map(q => q.questionId));

  container.innerHTML = `
    <div class="bg-brand-secondary rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-brand-tertiary">
          <tr>
            <th class="px-4 py-3 text-left">Pregunta</th>
            <th class="px-4 py-3 text-center">Intentos</th>
            <th class="px-4 py-3 text-center">Aciertos</th>
            <th class="px-4 py-3 text-center">Consolidación</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${questionsWithText.map(q => `
            <tr class="border-t border-brand-tertiary hover:bg-brand-tertiary/30">
              <td class="px-4 py-3">
                ${truncateText(q.text, 60)}
              </td>
              <td class="px-4 py-3 text-center">${q.attempts}</td>
              <td class="px-4 py-3 text-center">${q.correct}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block px-3 py-1 rounded-full text-sm font-bold
                           ${getClassForLevel(q.consolidationLevel)}">
                  ${(q.consolidationLevel * 100).toFixed(0)}%
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  onclick="practiceQuestion(${q.questionId})"
                  class="px-3 py-1 bg-brand-cta hover:bg-brand-cta-hover rounded text-sm">
                  Practicar
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function fetchQuestionsText(questionIds) {
  // Llamar a API para obtener textos de preguntas
  const token = localStorage.getItem('playtest_auth_token');
  const response = await fetch(`${API_BASE_URL}/api/questions/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: questionIds })
  });

  return await response.json();
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getClassForLevel(level) {
  if (level >= 0.8) return 'bg-green-500 text-white';
  if (level >= 0.6) return 'bg-blue-500 text-white';
  if (level >= 0.4) return 'bg-yellow-500 text-black';
  return 'bg-red-500 text-white';
}

function practiceQuestion(questionId) {
  // Redirigir a juego con esa pregunta específica
  window.location.href = `game-classic.html?questionId=${questionId}`;
}
```

#### Paso 8: Renderizar progreso por bloque

```javascript
async function renderBlocksProgress(blockProgress) {
  const container = document.getElementById('blocks-grid');

  // Obtener nombres de bloques
  const blocksWithNames = await fetchBlocksNames(blockProgress.map(b => b.blockId));

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${blocksWithNames.map(block => `
        <div class="bg-brand-secondary rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">${block.name}</h3>
            <span class="text-2xl">${getEmojiForLevel(block.consolidationLevel)}</span>
          </div>

          <!-- Barra de progreso -->
          <div class="w-full bg-brand-tertiary rounded-full h-4 mb-2">
            <div
              class="h-4 rounded-full ${getBarColorForLevel(block.consolidationLevel)}"
              style="width: ${block.consolidationLevel * 100}%">
            </div>
          </div>

          <div class="flex justify-between text-sm text-brand-accent">
            <span>${(block.consolidationLevel * 100).toFixed(0)}% consolidado</span>
            <span>${block.correct}/${block.attempts} aciertos</span>
          </div>

          <button
            onclick="practiceBlock(${block.blockId})"
            class="mt-4 w-full px-4 py-2 bg-brand-cta hover:bg-brand-cta-hover rounded">
            Practicar
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

async function fetchBlocksNames(blockIds) {
  const token = localStorage.getItem('playtest_auth_token');
  const response = await fetch(`${API_BASE_URL}/api/blocks/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids: blockIds })
  });

  return await response.json();
}

function getEmojiForLevel(level) {
  if (level >= 0.8) return '🏆'; // Mastered
  if (level >= 0.6) return '✅'; // Good
  if (level >= 0.4) return '📚'; // Learning
  return '⚠️'; // Weak
}

function getBarColorForLevel(level) {
  if (level >= 0.8) return 'bg-green-500';
  if (level >= 0.6) return 'bg-blue-500';
  if (level >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

function practiceBlock(blockId) {
  window.location.href = `game-classic.html?blockId=${blockId}`;
}
```

### Partes críticas
- ⚠️ **CRÍTICO:** Manejar caso de usuario nuevo sin estadísticas
- ⚠️ **IMPORTANTE:** Performance con muchos datos (limitar visualización)
- ⚠️ **IMPORTANTE:** Chart.js debe cargarse correctamente
- ⚠️ **IMPORTANTE:** Responsive design para móviles

### Nuevos endpoints necesarios

Para que el frontend funcione completamente, necesitamos:

**1. Endpoint para obtener textos de preguntas por IDs:**
```javascript
POST /api/questions/batch
Body: { ids: [1, 2, 3, ...] }
Response: [{ id: 1, text_question: "...", ...}, ...]
```

**2. Endpoint para obtener nombres de bloques por IDs:**
```javascript
POST /api/blocks/batch
Body: { ids: [1, 2, 3, ...] }
Response: [{ id: 1, name: "...", ...}, ...]
```

### Preguntas para el usuario

1. **¿Qué diseño prefieres para el dashboard?**
   - A) Todo en una página (scroll vertical)
   - B) Pestañas (resumen, temas, preguntas, bloques)
   - C) Sidebar con navegación

2. **¿Qué gráficos son más importantes?**
   - Barras de temas (propuesto)
   - Líneas de evolución temporal
   - Radar/spider de múltiples dimensiones
   - Circular/donut de distribución

3. **¿Necesitas exportar estadísticas?**
   - PDF
   - CSV
   - Imágenes

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Nueva página/sección
- ⚠️ **REQUIERE:** Endpoints nuevos de /batch

### Testing post-implementación
1. ⏳ Verificar que todos los componentes se renderizan
2. ⏳ Probar con usuario nuevo (sin datos)
3. ⏳ Probar con usuario con muchos datos
4. ⏳ Verificar responsive (móvil, tablet, desktop)
5. ⏳ Verificar que botones de "Practicar" funcionan
6. ⏳ Verificar que gráficos son interactivos

### Entregables
1. ⏳ Archivo HTML completo y funcional
2. ⏳ Endpoints `/batch` implementados
3. ⏳ Screenshots del dashboard funcionando
4. ⏳ Documentación de uso para usuario final

### Notas y comentarios
```
[Pendiente de inicio]

Esta es la parte más visible para el usuario. Requiere especial atención al diseño
y UX. Considerar feedback del usuario sobre disposición de elementos.

Posible mejora futura: Actualización en tiempo real con WebSockets.
```

---

## RESUMEN DE FASE 2

**Estado general:** ⏳ PENDIENTE (bloqueada por FASE 1)
**Progreso:** [░░░░░░░░░░] 0%

**Etapas completadas:** 0/4
**Etapas en curso:** 0/4
**Etapas pendientes:** 4/4

**Próximo paso:** Completar FASE 1 totalmente

**Bloqueadores actuales:**
- ⏳ FASE 1 debe completarse primero

**Dependencias:**
- Requiere que modalidades guarden datos correctamente (FASE 1)
- Requiere tablas `user_profiles` con estructura correcta

---

# FASE 3: SOPORTE TÉCNICO Y COMUNICACIÓN

**Objetivo:** Sistema funcional de tickets de soporte y comunicación interna.

**Duración estimada:** 3-4 sesiones (6-8 horas)
**Progreso:** [░░░░░░░░░░] 0%
**Estado:** ⏳ PENDIENTE

---

## ETAPA 3.1: Creación de Tablas de Soporte

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente
**Fecha de finalización:** Pendiente
**Responsable:** Usuario (ejecutar script) + Claude (preparar/revisar)

### Descripción
Ejecutar script que crea todas las tablas del sistema de soporte técnico.

### Funcionalidad a desarrollar
Infraestructura de BD para:
- Tickets de soporte con estados y prioridades
- Categorías de problemas predefinidas
- Comentarios/conversaciones en tickets
- Agrupación inteligente de tickets similares
- Base de conocimiento (KB) con artículos
- Plantillas de respuestas rápidas
- Sistema de escalación automática
- Métricas y dashboard para agentes

### Cómo se va a hacer

#### Paso 1: Revisar script existente

Archivo: `playtest-backend/update-support-schema.js`

**Verificar qué crea:**
- ⏳ Listar todas las tablas que creará
- ⏳ Revisar estructura de cada tabla
- ⏳ Identificar foreign keys y dependencias

#### Paso 2: Consultar al usuario

**PREGUNTAS IMPORTANTES - RESPONDER ANTES DE EJECUTAR:**

1. **¿Quiénes pueden crear tickets de soporte?**
   - A) Todos los usuarios
   - B) Solo usuarios con rol específico
   - C) Solo usuarios verificados/pagados

2. **¿Quiénes serán agentes de soporte?**
   - A) Administradores (principal y secundario)
   - B) Rol específico "soporte" (crear nuevo rol)
   - C) Creadores de contenido también

3. **¿Qué categorías de tickets necesitas?**
   Propuesta inicial:
   - Problema técnico (bug)
   - Pregunta sobre funcionalidad
   - Sugerencia/mejora
   - Problema con contenido
   - Problema de cuenta
   - Otro

4. **¿Qué prioridades de tickets?**
   Propuesta:
   - Crítica (sistema caído, pérdida de datos)
   - Alta (funcionalidad no disponible)
   - Media (inconveniente menor)
   - Baja (pregunta, sugerencia)

5. **¿Escalación automática?**
   - ¿Después de cuántas horas sin respuesta?
   - ¿A quién escalar? (admin principal, etc.)

#### Paso 3: Modificar script si necesario

Basándose en respuestas del usuario, ajustar:
- Categorías predefinidas
- Roles con permisos
- Reglas de escalación
- Plantillas iniciales

#### Paso 4: Ejecutar script

```bash
cd playtest-backend
node update-support-schema.js
```

**O ejecutar SQL manualmente en pgAdmin4 si se prefiere.**

#### Paso 5: Verificar creación

```sql
-- Verificar todas las tablas de soporte
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'support_%'
ORDER BY table_name;

-- Debería retornar:
-- support_categories
-- support_comments
-- support_dashboard_metrics
-- support_escalations
-- support_knowledge_base
-- support_templates
-- support_ticket_groups
-- support_tickets
```

**Verificar estructura de cada tabla:**
```sql
\d support_tickets
\d support_categories
-- etc.
```

#### Paso 6: Insertar datos iniciales

```sql
-- Categorías predefinidas
INSERT INTO support_categories (name, description, color, icon) VALUES
  ('bug', 'Problema técnico o error', '#EF4444', '🐛'),
  ('question', 'Pregunta sobre funcionalidad', '#3B82F6', '❓'),
  ('feature', 'Sugerencia de mejora', '#10B981', '💡'),
  ('content', 'Problema con contenido/preguntas', '#F59E0B', '📝'),
  ('account', 'Problema con cuenta de usuario', '#8B5CF6', '👤'),
  ('other', 'Otro tipo de consulta', '#6B7280', '📋')
ON CONFLICT (name) DO NOTHING;

-- Plantillas de respuestas
INSERT INTO support_templates (title, content, category_id, is_active) VALUES
  (
    'Bienvenida inicial',
    'Gracias por contactarnos. Hemos recibido tu ticket y lo revisaremos pronto.',
    NULL,
    true
  ),
  (
    'Solicitar más información',
    'Para ayudarte mejor, necesitamos más detalles:\n- ¿Qué navegador usas?\n- ¿Cuándo ocurrió el problema?\n- ¿Puedes enviar una captura de pantalla?',
    (SELECT id FROM support_categories WHERE name = 'bug'),
    true
  ),
  (
    'Problema resuelto',
    'Hemos resuelto tu problema. Por favor confirma que todo funciona correctamente.',
    NULL,
    true
  )
ON CONFLICT DO NOTHING;
```

### Estructura de tablas (propuesta)

**1. support_tickets**
```sql
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- Ej: "SUP-2025-0001"
    user_id INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id), -- Agente asignado
    category_id INTEGER REFERENCES support_categories(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, waiting_user, resolved, closed
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    escalation_level INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    group_id INTEGER REFERENCES support_ticket_groups(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. support_categories**
```sql
CREATE TABLE support_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color
    icon VARCHAR(10), -- Emoji
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**3. support_comments**
```sql
CREATE TABLE support_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Solo visible para agentes
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4. support_ticket_groups**
```sql
CREATE TABLE support_ticket_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255),
    similarity_score DECIMAL(3,2),
    total_tickets INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**5. support_knowledge_base**
```sql
CREATE TABLE support_knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id INTEGER REFERENCES support_categories(id),
    tags TEXT[], -- Array de tags para búsqueda
    views INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**6. support_templates**
```sql
CREATE TABLE support_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id INTEGER REFERENCES support_categories(id),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**7. support_escalations**
```sql
CREATE TABLE support_escalations (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    reason TEXT,
    escalation_level INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**8. support_dashboard_metrics**
```sql
CREATE TABLE support_dashboard_metrics (
    id SERIAL PRIMARY KEY,
    total_tickets INTEGER DEFAULT 0,
    open_tickets INTEGER DEFAULT 0,
    in_progress_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    closed_tickets INTEGER DEFAULT 0,
    avg_resolution_time_hours DECIMAL(10,2),
    avg_first_response_time_hours DECIMAL(10,2),
    tickets_created_today INTEGER DEFAULT 0,
    tickets_resolved_today INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Partes críticas
- 🔴 **MUY CRÍTICO:** Foreign keys a `users` deben existir
- ⚠️ **CRÍTICO:** Rol de soporte debe existir en tabla `roles` (o crear agentes con rol admin)
- ⚠️ **IMPORTANTE:** Triggers de escalación automática (si se implementan)
- ⚠️ **IMPORTANTE:** Índices en campos de búsqueda frecuente

### Índices recomendados
```sql
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_comments_ticket_id ON support_comments(ticket_id);
CREATE INDEX idx_support_kb_tags ON support_knowledge_base USING GIN(tags);
```

### Triggers recomendados

**1. Auto-actualizar updated_at:**
```sql
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**2. Auto-generar ticket_number:**
```sql
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'SUP-' ||
                         TO_CHAR(NOW(), 'YYYY') || '-' ||
                         LPAD(NEW.id::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
AFTER INSERT ON support_tickets
FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();
```

**3. Actualizar métricas dashboard:**
```sql
CREATE OR REPLACE FUNCTION update_support_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular métricas cuando cambia un ticket
    UPDATE support_dashboard_metrics SET
        total_tickets = (SELECT COUNT(*) FROM support_tickets),
        open_tickets = (SELECT COUNT(*) FROM support_tickets WHERE status = 'open'),
        in_progress_tickets = (SELECT COUNT(*) FROM support_tickets WHERE status = 'in_progress'),
        resolved_tickets = (SELECT COUNT(*) FROM support_tickets WHERE status = 'resolved'),
        closed_tickets = (SELECT COUNT(*) FROM support_tickets WHERE status = 'closed'),
        last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_on_ticket_change
AFTER INSERT OR UPDATE ON support_tickets
FOR EACH STATEMENT EXECUTE FUNCTION update_support_metrics();
```

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Tablas nuevas, sistema independiente
- ✅ **POSITIVA:** Infraestructura lista para sistema de soporte

### Testing post-implementación
1. ⏳ Verificar todas las tablas creadas en pgAdmin4
2. ⏳ Verificar foreign keys y constraints:
   ```sql
   SELECT
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_name LIKE 'support_%';
   ```
3. ⏳ Insertar ticket de prueba manualmente:
   ```sql
   INSERT INTO support_tickets (user_id, category_id, subject, description)
   VALUES (
     [USER_ID],
     (SELECT id FROM support_categories WHERE name = 'bug'),
     'Test ticket',
     'This is a test ticket'
   );
   ```
4. ⏳ Verificar que triggers funcionan (ticket_number se genera)
5. ⏳ Verificar que métricas se actualizan

### Entregables
1. ⏳ Todas las tablas de soporte creadas en Aiven
2. ⏳ Categorías predefinidas insertadas
3. ⏳ Plantillas iniciales insertadas
4. ⏳ Documento de verificación con queries y resultados
5. ⏳ Rol "soporte" creado (si aplica)

### Notas y comentarios
```
[Pendiente de inicio]

Sistema de soporte es completamente independiente. Puede implementarse en paralelo
con otras fases si se desea.

Backend de soporte (routes/support.js) ya está completamente implementado con
896 líneas de código. Solo falta crear las tablas.
```

---

## ETAPA 3.2: Testing de Endpoints de Soporte

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente (después de ETAPA 3.1)
**Fecha de finalización:** Pendiente
**Responsable:** Claude + Usuario

### Descripción
Verificar que los endpoints de `routes/support.js` funcionan correctamente con las tablas creadas.

### Funcionalidad a desarrollar
Testing exhaustivo de:
- Creación de tickets
- Listado con filtros múltiples
- Sistema de comentarios
- Asignación de agentes
- Cambios de estado y prioridad
- Búsqueda y agrupación
- Base de conocimiento
- Plantillas
- Métricas dashboard

### Cómo se va a hacer

#### Testing con herramientas API

**Opciones:**
1. Postman (recomendado - permite guardar colecciones)
2. cURL (más rápido para tests simples)
3. Thunder Client (extensión VSCode)
4. Insomnia

#### Preparación

**1. Obtener token de autenticación:**
```bash
# Login
curl -X POST https://playtest-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "[TU_USUARIO]",
    "password": "[TU_PASSWORD]"
  }'

# Respuesta:
# { "token": "eyJhbGc...", "user": {...} }
```

**2. Guardar token en variable:**
```bash
TOKEN="eyJhbGc..."
```

#### Suite de tests

**TEST 1: Crear ticket básico**
```bash
curl -X POST https://playtest-backend.onrender.com/api/support/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "No puedo guardar mi progreso en Classic Mode",
    "description": "Cuando termino una partida en modo Classic, no aparece en mi historial. He probado 3 veces y siempre pasa lo mismo.",
    "category_id": 1,
    "priority": "high"
  }'

# Verificar respuesta:
# - Status 201
# - Ticket creado con ID
# - ticket_number generado
```

**TEST 2: Listar todos los tickets**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://playtest-backend.onrender.com/api/support/tickets

# Verificar:
# - Array de tickets
# - Incluye el ticket recién creado
# - Campos completos (usuario, categoría, etc.)
```

**TEST 3: Listar tickets con filtros**
```bash
# Por status
curl -H "Authorization: Bearer $TOKEN" \
  "https://playtest-backend.onrender.com/api/support/tickets?status=open"

# Por prioridad
curl -H "Authorization: Bearer $TOKEN" \
  "https://playtest-backend.onrender.com/api/support/tickets?priority=high"

# Por categoría
curl -H "Authorization: Bearer $TOKEN" \
  "https://playtest-backend.onrender.com/api/support/tickets?category_id=1"

# Búsqueda de texto
curl -H "Authorization: Bearer $TOKEN" \
  "https://playtest-backend.onrender.com/api/support/tickets?search=progreso"

# Combinación de filtros
curl -H "Authorization: Bearer $TOKEN" \
  "https://playtest-backend.onrender.com/api/support/tickets?status=open&priority=high"
```

**TEST 4: Obtener detalles de un ticket**
```bash
TICKET_ID=1  # Usar ID real del ticket creado

curl -H "Authorization: Bearer $TOKEN" \
  https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID

# Verificar:
# - Detalles completos del ticket
# - Comentarios incluidos
# - Tickets relacionados (si aplica)
```

**TEST 5: Añadir comentario a ticket**
```bash
curl -X POST https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Gracias por reportar. Estamos investigando el problema.",
    "is_internal": false
  }'

# Verificar:
# - Comentario creado
# - Asociado al ticket correcto
# - Usuario correcto
```

**TEST 6: Cambiar estado del ticket**
```bash
curl -X PATCH https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'

# Verificar:
# - Status actualizado
# - updated_at cambiado
```

**TEST 7: Cambiar prioridad**
```bash
curl -X PATCH https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID/priority \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "critical"
  }'
```

**TEST 8: Asignar ticket a agente**
```bash
AGENT_ID=2  # ID de un usuario con rol de agente/admin

curl -X PATCH https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": '$AGENT_ID'
  }'
```

**TEST 9: Buscar en base de conocimiento**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://playtest-backend.onrender.com/api/support/knowledge-base?search=guardar"

# Verificar:
# - Artículos relevantes
# - Ordenados por relevancia
```

**TEST 10: Obtener plantillas**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://playtest-backend.onrender.com/api/support/templates

# Verificar:
# - Plantillas predefinidas
# - Por categoría si aplica
```

**TEST 11: Dashboard de métricas**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://playtest-backend.onrender.com/api/support/dashboard/metrics

# Verificar:
# - Total de tickets
# - Por estado
# - Tiempo promedio de resolución
# - Tendencias
# - Alertas
```

**TEST 12: Resolver y cerrar ticket**
```bash
# Cambiar a resolved
curl -X PATCH https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolution": "Problema corregido en última actualización"
  }'

# Esperar confirmación del usuario...

# Cambiar a closed
curl -X PATCH https://playtest-backend.onrender.com/api/support/tickets/$TICKET_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed"
  }'
```

#### Checklist de validación

Para cada endpoint, verificar:

**Checklist general:**
- [ ] Status code correcto (200, 201, 400, 403, 500)
- [ ] Respuesta JSON válida
- [ ] Campos esperados presentes
- [ ] Tipos de datos correctos
- [ ] Sin errores en logs del servidor

**Checklist de permisos:**
- [ ] Usuario normal puede crear tickets
- [ ] Usuario normal puede ver sus propios tickets
- [ ] Usuario normal NO puede ver tickets de otros
- [ ] Agente/Admin puede ver todos los tickets
- [ ] Agente/Admin puede asignar y cambiar estados
- [ ] Solo Admin puede acceder a configuración

**Checklist de validación de datos:**
- [ ] Subject vacío → Error 400
- [ ] Category inválido → Error 400
- [ ] Priority inválido → Error 400
- [ ] Status inválido → Error 400
- [ ] ID no existente → Error 404

**Checklist de BD:**
- [ ] Datos se guardan correctamente en BD
- [ ] Foreign keys mantienen integridad
- [ ] Timestamps se actualizan
- [ ] Triggers funcionan (ticket_number, métricas)

### Tabla de resultados de testing

| Endpoint | Método | Status | Issues | Notas |
|----------|--------|--------|--------|-------|
| `/tickets` (crear) | POST | ⏳ | - | - |
| `/tickets` (listar) | GET | ⏳ | - | - |
| `/tickets` (filtros) | GET | ⏳ | - | - |
| `/tickets/:id` | GET | ⏳ | - | - |
| `/tickets/:id/comments` | POST | ⏳ | - | - |
| `/tickets/:id/status` | PATCH | ⏳ | - | - |
| `/tickets/:id/priority` | PATCH | ⏳ | - | - |
| `/tickets/:id/assign` | PATCH | ⏳ | - | - |
| `/knowledge-base` | GET | ⏳ | - | - |
| `/templates` | GET | ⏳ | - | - |
| `/dashboard/metrics` | GET | ⏳ | - | - |

### Partes críticas
- ⚠️ **CRÍTICO:** Verificar permisos (usuarios normales vs agentes)
- ⚠️ **IMPORTANTE:** Validación de datos en endpoints
- ⚠️ **IMPORTANTE:** Testing con usuario sin permisos de agente
- ⚠️ **IMPORTANTE:** Verificar que métricas se actualizan en tiempo real

### Si algo falla

**Protocolo:**

1. **Capturar error completo:**
   - Status code
   - Respuesta JSON de error
   - Logs del servidor en Render
   - Query SQL que falló (si aplica)

2. **Identificar categoría:**
   - A. Tabla no existe → Volver a ETAPA 3.1
   - B. Foreign key inválido → Revisar datos de entrada
   - C. Permisos incorrectos → Revisar middleware de auth
   - D. Validación falla → Revisar lógica de endpoint

3. **Documentar y reportar:**
   - Actualizar tabla de resultados
   - Marcar endpoint como ❌
   - Añadir en columna "Issues"
   - No intentar arreglar aún, solo documentar

### Afecciones a otras funcionalidades
- ✅ **NINGUNA** - Sistema independiente
- ✅ **POSITIVA:** Valida que backend está correctamente implementado

### Testing post-implementación
1. ⏳ Todos los endpoints básicos funcionan
2. ⏳ Filtros y búsqueda funcionan
3. ⏳ Permisos correctos
4. ⏳ BD se actualiza correctamente
5. ⏳ Métricas dashboard actualizadas

### Entregables
1. ⏳ Tabla completa de resultados de testing
2. ⏳ Colección Postman (opcional pero recomendado)
3. ⏳ Lista de issues encontrados
4. ⏳ Screenshots de respuestas exitosas
5. ⏳ Queries de verificación en BD

### Notas y comentarios
```
[Pendiente de inicio]

Esta etapa es puramente de testing. No se modifica código.

Recomendación: Crear colección Postman con todos los tests para poder
repetirlos fácilmente después de cambios futuros.

Considerar crear script de testing automatizado con Jest o similar.
```

---

## ETAPA 3.3: Integración Frontend de Soporte

**Estado:** ⏳ **PENDIENTE**
**Fecha de inicio:** Pendiente (después de ETAPA 3.2)
**Fecha de finalización:** Pendiente
**Responsable:** Claude (código) + Usuario (testing/UX)

### Descripción
Conectar archivos HTML de soporte con el backend funcional. Crear flujos completos para usuarios y agentes.

### Funcionalidad a desarrollar
Frontend completo de:
- `support-form.html` - Formulario para crear ticket (usuarios)
- `support-tickets.html` - Lista y gestión de tickets (usuarios + agentes)
- `support-dashboard.html` - Dashboard para agentes
- `support-knowledge.html` - Base de conocimiento (público)
- Integración en header/menú principal

### Cómo se va a hacer

*(Se continuará detallando cuando se llegue a esta etapa)*

### Notas y comentarios
```
[Pendiente de inicio]

Esta etapa se detallará completamente cuando estemos cerca de implementarla.
```

---

## RESUMEN DE FASE 3

**Estado general:** ⏳ PENDIENTE
**Progreso:** [░░░░░░░░░░] 0%

**Etapas completadas:** 0/3
**Etapas en curso:** 0/3
**Etapas pendientes:** 3/3

**Próximo paso:** Esperar a completar FASE 1 y 2

**Bloqueadores actuales:**
- ⏳ No hay bloqueadores técnicos, puede iniciarse en paralelo con FASE 2

**Decisiones pendientes:**
- Responder preguntas de ETAPA 3.1 sobre permisos y configuración

---

# FASES SIGUIENTES (4-7)

Las siguientes fases serán detalladas completamente cuando estemos cerca de implementarlas:

## FASE 4: FUNCIONALIDADES DE CREADORES DE CONTENIDO
- Gestión avanzada de bloques y preguntas
- Panel de analytics para creadores
- Sistema de valoraciones de contenido
- Marketplace de bloques (conexión con Luminarias)

## FASE 5: FUNCIONALIDADES DE PROFESORES
- Gestión de alumnos/grupos
- Asignación de bloques/tareas
- Seguimiento de progreso de alumnos
- Reportes y estadísticas de clase

## FASE 6: SISTEMA DE LUMINARIAS
- Configuración de valores y reglas
- Tienda de items/servicios
- Marketplace entre usuarios
- Sistema de conversión a dinero real
- Panel administrativo de Luminarias

## FASE 7: SISTEMA DE TORNEOS
- Creación y configuración de torneos
- Inscripción y gestión de participantes
- Sistema de brackets/eliminatorias
- Seguimiento en tiempo real
- Distribución de premios

---

# GESTIÓN DEL PLAN

## Cómo usar este documento

### Para consultar progreso:
1. Ir a sección "PROGRESO GENERAL" al inicio
2. Ver barra de progreso de cada fase
3. Buscar "⬅️ ESTAMOS AQUÍ" para ver dónde estamos

### Para trabajar en una etapa:
1. Localizar la etapa actual (buscar "EN CURSO")
2. Leer "Descripción" y "Cómo se va a hacer"
3. Ejecutar pasos en orden
4. Actualizar checkboxes [ ] a [x] al completar
5. Añadir comentarios en "Notas y comentarios"
6. Cambiar estado a "COMPLETADA" al terminar

### Para reportar problemas:
1. En la etapa correspondiente, sección "Notas y comentarios"
2. Añadir entrada con formato:
   ```
   [FECHA - HORA] Usuario/Claude:
   PROBLEMA: Descripción del problema
   CONTEXTO: Qué se estaba haciendo
   ERROR: Mensaje de error exacto (si aplica)
   SOLUCIÓN APLICADA: (si se resolvió)
   PENDIENTE: (si queda algo por hacer)
   ```

### Para actualizar progreso:
1. Cambiar estado de etapa de "EN CURSO" a "COMPLETADA"
2. Actualizar fecha de finalización
3. Actualizar barra de progreso de la fase ([████░░] añadir más █)
4. Actualizar "PROGRESO GENERAL" al inicio
5. Commit cambios con mensaje descriptivo

## Convenciones

### Estados:
- ✅ **COMPLETADA** - Terminada y verificada
- 🟢 **COMPLETADA CON OBSERVACIONES** - Terminada pero con notas
- 🟡 **EN CURSO** - Trabajando actualmente
- ⏳ **PENDIENTE** - No iniciada aún
- 🔴 **BLOQUEADA** - No puede iniciarse por dependencias
- ⚠️ **CON PROBLEMAS** - Iniciada pero con issues

### Prioridades:
- 🔴 **MUY CRÍTICO** - Puede romper todo el sistema
- ⚠️ **CRÍTICO** - Puede causar pérdida de datos o bugs graves
- ⚠️ **IMPORTANTE** - Debe hacerse bien pero no rompe sistema
- ℹ️ **INFO** - Información relevante pero no crítica

### Símbolos de progreso:
- █ - Completado
- ░ - Pendiente
- ⬅️ - Estamos aquí

---

# REGISTRO DE CAMBIOS DEL PLAN

## 2025-10-07 14:45 - Creación inicial
- **Autor:** Claude
- **Cambios:**
  - Creación del documento PLAN_MAESTRO_DESARROLLO.md
  - Definición completa de FASE 1 (4 etapas)
  - Definición completa de FASE 2 (4 etapas)
  - Definición completa de FASE 3 (3 etapas)
  - Esquemas de FASES 4-7 (a detallar)
  - ETAPA 1.1 marcada como completada (40%)
  - ETAPA 1.2 preparada con propuestas de tablas
- **Próximo paso:** Esperar aprobación de usuario para estructura de tablas game_players y game_scores

## 2025-10-07 15:30 - Actualización crítica: BD ~90% completa
- **Autor:** Usuario + Claude
- **Cambios:**
  - 🎉 **HALLAZGO IMPORTANTE:** Base de datos está ~90% completa
  - Verificadas 46 tablas existentes mediante queries SQL
  - Actualizado ETAPA 1.1 con inventario completo de tablas
  - ETAPA 1.2 marcada como COMPLETADA (tablas ya existían)
  - Progreso FASE 1: 40% → 60%
  - Progreso total: 6% → 18%
  - Descubiertos sistemas adicionales: badges, niveles, comunicaciones, feature flags
  - Confirmado: Solo falta sistema de Torneos (FASE 7)
- **Tablas verificadas como existentes:**
  - ✅ game_players, game_scores, user_game_configurations
  - ✅ 7 tablas de soporte (support_*)
  - ✅ 5 tablas de luminarias
  - ✅ 25 tablas adicionales de sistemas avanzados
- **Próximo paso:** ETAPA 1.3 - Testing de guardado en modalidades (sin necesidad de crear tablas)

## 2025-10-07 15:45 - ETAPA 1.3 lista para comenzar
- **Autor:** Claude
- **Cambios:**
  - ✅ Creado documento PROTOCOLO_TESTING_MODALIDADES.md
  - ETAPA 1.3 actualizada con referencia al protocolo
  - Estado cambiado a "LISTA PARA COMENZAR"
  - Añadidas notas sobre el protocolo de testing
- **Protocolo incluye:**
  - Instrucciones generales de preparación
  - Queries SQL para verificación en pgAdmin4
  - Checklist detallado para las 9 modalidades
  - Categorización: Entrenamiento (3), Competición Individual (4), Multiplayer (2)
  - Espacio para documentar resultados y problemas encontrados
- **Próximo paso:** Usuario ejecuta testing manual siguiendo el protocolo

## 2025-10-07 16:00 - Esquema de base de datos documentado
- **Autor:** Usuario + Claude
- **Cambios:**
  - ✅ Creado documento DATABASE_SCHEMA_REFERENCE.md
  - Documentadas todas las columnas de las 46 tablas
  - Actualizado PROTOCOLO_TESTING_MODALIDADES.md con queries correctas
  - Actualizado PLAN_MAESTRO_DESARROLLO.md con referencia al esquema
  - Añadidas notas en ETAPA 1.1 sobre el esquema documentado
- **Esquema incluye:**
  - Estructura completa de todas las tablas (nombre, tipo, nullable, default, keys)
  - Ejemplos de campos JSONB más importantes
  - Referencias de foreign keys entre tablas
  - Notas sobre uso de cada tabla principal
- **Próximo paso:** Usuario ejecuta testing con información correcta de columnas

---

# NOTAS IMPORTANTES

## Para el usuario

Este plan es un **documento vivo**. Debe actualizarse constantemente conforme avanzamos.

**Recuerda:**
1. ✅ Siempre revisar la sección "Preguntas para el usuario" antes de cada etapa
2. ✅ Reportar cualquier problema en "Notas y comentarios" de la etapa
3. ✅ Hacer commit del plan después de cada sesión de trabajo
4. ✅ No saltar etapas sin completar las anteriores (excepto fases independientes)

**Ventajas de este enfoque:**
- 📊 Visibilidad total del progreso
- 🔄 Trazabilidad de cambios
- 📝 Documentación automática del desarrollo
- ⚠️ Identificación temprana de problemas
- ✅ Validación paso a paso (menos bugs)

## Para Claude

Al actualizar este plan:
1. Mantener formato markdown consistente
2. Actualizar progreso visual (barras [████░░])
3. Añadir timestamps en comentarios
4. Ser específico en "Cómo se va a hacer"
5. Documentar decisiones importantes
6. No eliminar información, solo marcar como obsoleta si aplica

---

**Fin del Plan Maestro de Desarrollo PlayTest v1.0**

*Última actualización: 7 de Octubre de 2025 - 15:30*
*Próxima revisión: Después de completar ETAPA 1.3*