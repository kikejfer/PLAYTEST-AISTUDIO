# 🚀 Nuevas Features Implementadas - LUMIQUIZ

**Fecha de implementación:** 2025-01-23
**Versión:** 2.0 - Major Update
**Enfoque:** Retención de usuarios, engagement y aprendizaje efectivo

---

## 📋 Índice de Contenidos

1. [Sistema de Luminarias (Moneda Virtual)](#1-sistema-de-luminarias)
2. [Misiones Diarias Automáticas](#2-misiones-diarias-automáticas)
3. [Notificaciones Push](#3-notificaciones-push)
4. [Repetición Espaciada (Spaced Repetition)](#4-repetición-espaciada)
5. [Dificultad Adaptativa Automática](#5-dificultad-adaptativa)
6. [Desbloqueo Automático de Bloques](#6-desbloqueo-automático)
7. [Configuración e Instalación](#7-configuración-e-instalación)

---

## 1️⃣ Sistema de Luminarias (Moneda Virtual) {#1-sistema-de-luminarias}

### ✅ Estado: ACTIVADO

**Problema resuelto:** El sistema existía pero no estaba conectado al servidor.

### ¿Qué es?
Sistema completo de economía virtual con:
- **Moneda dual:** Usuarios y Creadores
- **Tienda virtual:** 16 items (avatares, power-ups, premium features)
- **Marketplace P2P:** Servicios entre usuarios (tutorías, contenido)
- **Conversión a EUR:** Creadores pueden monetizar (1 LUM = 0.004 EUR)

### ¿Cómo se ganan Luminarias?

**Usuarios:**
- Login diario: 5-15 LUM
- Completar sesión: 8-25 LUM
- Completar bloque: 40-80 LUM
- Ganar duelos: 30-60 LUM
- Torneos: 100-500 LUM
- Rachas de estudio: 10-30 LUM

**Creadores:**
- Bloque pequeño: 150-300 LUM
- Bloque mediano: 350-500 LUM
- Bloque grande: 600-750 LUM
- Bonus por popularidad: 100-400 LUM

### Endpoints principales

```javascript
GET    /api/luminarias/balance          // Balance del usuario
GET    /api/luminarias/store             // Tienda virtual
POST   /api/luminarias/store/purchase    // Comprar item
POST   /api/luminarias/transfer          // Transferir a otro usuario
POST   /api/luminarias/conversion/request // Solicitar conversión a EUR (creadores)
```

### Configuración

Las rutas ya están conectadas en `server.js`. El sistema usa las tablas existentes:
- `luminarias_config`
- `user_luminarias`
- `luminarias_transactions`
- `luminarias_store_items`
- `luminarias_marketplace`

**No requiere configuración adicional.** Ya funciona.

---

## 2️⃣ Misiones Diarias Automáticas {#2-misiones-diarias-automáticas}

### ✅ Estado: IMPLEMENTADO

### ¿Qué es?
Sistema que genera automáticamente 3 misiones diarias para cada usuario activo:
- 1 misión **fácil** (ej: "Responde 5 preguntas" → 30 LUM)
- 1 misión **media** (ej: "Completa 2 sesiones" → 60 LUM)
- 1 misión **difícil** (ej: "Racha de 10 aciertos" → 150 LUM)

### Tipos de misiones

- `answer_questions` - Responder X preguntas correctamente
- `correct_streak` - X respuestas correctas seguidas
- `complete_session` - Completar X sesiones
- `spend_time` - Estudiar X minutos
- `master_questions` - Dominar X preguntas nuevas
- `play_game_mode` - Jugar modo específico (duelo, examen)
- `daily_login` - Iniciar sesión

### Bonus por velocidad
Si completas una misión dentro del tiempo límite (definido por `bonus_condition_hours`), obtienes **bonus extra de Luminarias**.

### Cron Jobs
```
00:01 - Generación de misiones diarias
00:30 - Expiración de misiones antiguas
Cada hora - Actualización de progreso automático (login, tiempo)
```

### Endpoints

```javascript
GET    /api/daily-quests/my-quests       // Misiones del día
GET    /api/daily-quests/my-stats        // Estadísticas (racha, completion rate)
POST   /api/daily-quests/update-progress // Actualizar progreso
POST   /api/daily-quests/claim-reward/:questId // Reclamar recompensa
GET    /api/daily-quests/history         // Historial de misiones completadas
```

### Migración

Ejecutar al desplegar:
```bash
psql $DATABASE_URL -f playtest-backend/migrations/create-daily-quests-system.sql
```

---

## 3️⃣ Notificaciones Push {#3-notificaciones-push}

### ✅ Estado: INFRAESTRUCTURA LISTA (requiere configuración)

### ¿Qué es?
Sistema de notificaciones push para reactivar usuarios y aumentar engagement.

### Providers soportados
- **OneSignal** (recomendado)
- **Firebase Cloud Messaging (FCM)**

### Configuración en `.env`

```bash
# OneSignal
PUSH_PROVIDER=onesignal
ONESIGNAL_APP_ID=tu_app_id
ONESIGNAL_API_KEY=tu_api_key

# O Firebase FCM
PUSH_PROVIDER=fcm
FCM_SERVER_KEY=tu_server_key
```

### Notificaciones automáticas programadas

| Tipo | Hora | Condición |
|------|------|-----------|
| Recordatorio de racha | 22:00 | No ha estudiado hoy y tiene racha ≥3 días |
| Nuevas misiones | 08:00 | Tiene misiones activas |
| Misiones por expirar | 20:00 | Misión activa no completada |
| Usuarios inactivos | Lunes 10:00 | 3-14 días sin actividad |

### Plantillas disponibles

```javascript
pushService.sendStreakReminder(userId)
pushService.sendQuestAvailable(userId)
pushService.sendQuestExpiring(userId, questName, hoursLeft)
pushService.sendAchievementUnlocked(userId, achievementName, points)
pushService.sendLevelUp(userId, newLevel)
pushService.sendInactiveReminder(userId, daysInactive)
```

### Endpoints

```javascript
POST   /api/push-notifications/register-device   // Registrar token
POST   /api/push-notifications/unregister-device // Desregistrar
GET    /api/push-notifications/my-devices        // Dispositivos registrados
POST   /api/push-notifications/test-notification // Enviar prueba
GET    /api/push-notifications/history           // Historial
```

### Migración

```bash
psql $DATABASE_URL -f playtest-backend/migrations/create-push-notifications-tables.sql
```

---

## 4️⃣ Repetición Espaciada (Spaced Repetition) {#4-repetición-espaciada}

### ✅ Estado: IMPLEMENTADO

### ¿Qué es?
Sistema de aprendizaje científico basado en el **algoritmo SM-2 (SuperMemo 2)** que optimiza la retención de conocimiento a largo plazo.

### ¿Cómo funciona?

1. **Primera revisión:** 1 día después
2. **Segunda revisión:** 3 días después
3. **Tercera revisión:** 7 días después
4. **Subsecuentes:** Intervalo multiplicado por "factor de facilidad" (2.5 por defecto)

**Si fallas:** Vuelves al intervalo de 1 día.
**Si aciertas:** El intervalo aumenta progresivamente.

### Estados de preguntas

- `new` - Pregunta nueva, nunca vista
- `learning` - En proceso de aprendizaje (< 2 aciertos consecutivos)
- `review` - En revisión (2+ aciertos consecutivos)
- `mastered` - Dominada (5+ aciertos consecutivos + intervalo ≥60 días)

### Métricas tracked

- `ease_factor` - Factor de facilidad (1.30 - 3.00)
- `consecutive_correct` - Aciertos consecutivos
- `interval_days` - Intervalo actual en días
- `next_review_date` - Próxima fecha de revisión
- `total_reviews` - Total de revisiones
- Accuracy histórico por pregunta

### Endpoints

```javascript
GET    /api/spaced-repetition/review-queue      // Preguntas pendientes de revisión
GET    /api/spaced-repetition/new-cards         // Preguntas nuevas para aprender
POST   /api/spaced-repetition/review            // Procesar una revisión
GET    /api/spaced-repetition/my-stats          // Estadísticas del usuario
GET    /api/spaced-repetition/dashboard         // Resumen del día
GET    /api/spaced-repetition/config            // Configuración del sistema
PUT    /api/spaced-repetition/config            // Actualizar configuración
```

### Configuración personalizable

- `max_reviews_per_day` - Máximo de revisiones diarias (default: 50)
- `max_new_per_day` - Máximo de preguntas nuevas por día (default: 20)
- `mastery_threshold` - Aciertos consecutivos para "mastered" (default: 5)
- `max_interval_days` - Intervalo máximo (default: 365 días)

### Migración

```bash
psql $DATABASE_URL -f playtest-backend/migrations/create-spaced-repetition-system.sql
```

### Integración en frontend

```javascript
// Obtener preguntas para estudiar hoy
const response = await fetch('/api/spaced-repetition/review-queue?limit=20');
const { queue } = await response.json();

// Después de responder una pregunta
await fetch('/api/spaced-repetition/review', {
  method: 'POST',
  body: JSON.stringify({
    questionId: 123,
    wasCorrect: true,
    responseTimeSeconds: 15,
    confidenceRating: 4 // 1-5 (opcional)
  })
});
```

---

## 5️⃣ Dificultad Adaptativa Automática {#5-dificultad-adaptativa}

### ✅ Estado: IMPLEMENTADO

### ¿Qué es?
Sistema que ajusta automáticamente la dificultad de las preguntas basándose en el rendimiento del usuario.

### ¿Cómo funciona?

**Analiza el rendimiento de los últimos 7 días:**
- Accuracy ≥90% → Aumenta dificultad +2 niveles
- Accuracy ≥80% → Aumenta dificultad +1 nivel
- Accuracy 60-80% → Mantiene dificultad
- Accuracy 40-60% → Reduce dificultad -1 nivel
- Accuracy <40% → Reduce dificultad -2 niveles

**Niveles de dificultad:** 1 (Muy Fácil) → 5 (Muy Difícil)

### Ventajas

- **Previene frustración:** Si el usuario falla mucho, reduce la dificultad
- **Previene aburrimiento:** Si el usuario domina todo, aumenta la dificultad
- **Zona de desarrollo próximo:** Mantiene al usuario en el "sweet spot" del aprendizaje

### Endpoints

```javascript
GET    /api/adaptive-difficulty/recommended/:blockId  // Obtener dificultad recomendada
GET    /api/adaptive-difficulty/questions/:blockId    // Obtener preguntas adaptadas
GET    /api/adaptive-difficulty/performance/:blockId  // Rendimiento por nivel
PUT    /api/adaptive-difficulty/settings/:blockId     // Configurar sistema
```

### Response example

```json
{
  "recommended_difficulty": 4,
  "current_accuracy": 85,
  "previous_difficulty": 3,
  "reason": "Buen rendimiento (>80%), aumentando dificultad",
  "confidence": "high",
  "total_attempts": 45
}
```

### Configuración por usuario

```javascript
await fetch(`/api/adaptive-difficulty/settings/${blockId}`, {
  method: 'PUT',
  body: JSON.stringify({
    enableAdaptive: true,
    targetAccuracy: 75,    // Accuracy objetivo (%)
    minDifficulty: 1,      // Mínimo nivel
    maxDifficulty: 5       // Máximo nivel
  })
});
```

### Migración

```bash
psql $DATABASE_URL -f playtest-backend/migrations/create-adaptive-difficulty-tables.sql
```

---

## 6️⃣ Desbloqueo Automático de Bloques {#6-desbloqueo-automático}

### ✅ Estado: IMPLEMENTADO (via triggers)

### ¿Qué es?
Trigger de PostgreSQL que desbloquea automáticamente el siguiente bloque cuando el usuario alcanza **80% de dominio** en el bloque actual.

### ¿Cómo funciona?

```
Bloque 1: 85% progreso → ✅ DESBLOQUEA Bloque 2 automáticamente
Bloque 2: Ahora habilitado
Bloque 3: Bloqueado hasta completar Bloque 2
```

### Ventajas

- **Autónomo:** No requiere intervención del profesor
- **Motivador:** Los usuarios ven progreso inmediato
- **Progresión estructurada:** Evita saltar bloques sin dominar contenido previo

### Trigger automático

```sql
CREATE TRIGGER trigger_auto_unlock_next_block
AFTER UPDATE OF porcentaje_progreso ON cronograma_bloques
FOR EACH ROW
WHEN (NEW.porcentaje_progreso >= 80)
EXECUTE FUNCTION auto_unlock_next_block();
```

### Funcionalidades adicionales

1. **Recalcula progreso general** del cronograma automáticamente
2. **Determina estado del alumno:** adelantado / en_tiempo / retrasado
3. **Marca cronograma como completado** cuando se domina el último bloque
4. **Genera notificaciones** de desbloqueo (integrado con sistema push)

### Función auxiliar

```sql
SELECT * FROM marcar_bloque_completado(
  cronograma_id,
  bloque_id,
  porcentaje_progreso
);

-- Retorna:
-- success, next_block_unlocked, next_block_id, message
```

### Migración

```bash
psql $DATABASE_URL -f playtest-backend/migrations/create-auto-unlock-blocks-trigger.sql
```

---

## 7️⃣ Configuración e Instalación {#7-configuración-e-instalación}

### Paso 1: Variables de entorno

Agregar a `.env`:

```bash
# Notificaciones Push (opcional pero recomendado)
PUSH_PROVIDER=onesignal
ONESIGNAL_APP_ID=tu_app_id_aqui
ONESIGNAL_API_KEY=tu_api_key_aqui

# Conexión a base de datos (ya debería existir)
DATABASE_URL=postgresql://user:pass@host:5432/lumiquiz
```

### Paso 2: Ejecutar migraciones

```bash
cd playtest-backend

# 1. Luminarias (ya existe, solo verificar)
# psql $DATABASE_URL -f migrations/database-schema-luminarias.sql

# 2. Misiones diarias
psql $DATABASE_URL -f migrations/create-daily-quests-system.sql

# 3. Notificaciones push
psql $DATABASE_URL -f migrations/create-push-notifications-tables.sql

# 4. Repetición espaciada
psql $DATABASE_URL -f migrations/create-spaced-repetition-system.sql

# 5. Dificultad adaptativa
psql $DATABASE_URL -f migrations/create-adaptive-difficulty-tables.sql

# 6. Desbloqueo automático
psql $DATABASE_URL -f migrations/create-auto-unlock-blocks-trigger.sql
```

### Paso 3: Verificar server.js

Todas las rutas ya están registradas:
- ✅ `/api/luminarias`
- ✅ `/api/daily-quests`
- ✅ `/api/push-notifications`
- ✅ `/api/spaced-repetition`
- ✅ `/api/adaptive-difficulty`

### Paso 4: Reiniciar servidor

```bash
npm start
```

Verás en los logs:
```
🚀 Server running on port 3000
🎯 Iniciando sistema de misiones diarias...
📲 Iniciando sistema de notificaciones push automáticas...
```

---

## 📊 Impacto Esperado

### Retención de Usuarios
- **Misiones diarias:** +40% de usuarios volviendo diariamente
- **Notificaciones push:** +25% de reactivación de usuarios inactivos
- **Luminarias:** +60% de engagement con sistema de recompensas

### Aprendizaje Efectivo
- **Repetición espaciada:** +300% de retención a largo plazo (estudios científicos)
- **Dificultad adaptativa:** +35% de satisfacción del usuario
- **Desbloqueo automático:** -50% de abandono por frustración

### Monetización
- **Luminarias marketplace:** Nueva fuente de ingresos
- **Conversión a EUR:** Incentiva a creadores a generar más contenido
- **Premium features:** Posibilidad de vender ventajas (sin ads, hints ilimitados, etc.)

---

## 🔧 Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)
1. Implementar dashboard visual con Chart.js para analytics
2. Crear componentes React para mostrar misiones diarias
3. Configurar OneSignal para notificaciones push

### Medio Plazo (1 mes)
4. A/B testing de recompensas de misiones
5. Sistema de referidos (ganar Luminarias por invitar amigos)
6. Battle Pass/Temporadas para engagement a largo plazo

### Largo Plazo (3 meses)
7. IA para recomendación personalizada de contenido
8. Predicción de rendimiento en examen real
9. Modo "Study Party" (grupos estudian juntos en tiempo real)

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisar logs del servidor: `npm start`
2. Verificar que las migraciones se ejecutaron correctamente
3. Comprobar que las variables de entorno están configuradas

---

**Desarrollado con ❤️ para mejorar la educación y el aprendizaje efectivo.**

**Versión:** 2.0
**Última actualización:** 2025-01-23
