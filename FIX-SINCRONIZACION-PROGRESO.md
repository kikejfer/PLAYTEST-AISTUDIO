# 🔧 Fix: Sincronización de Partidas con Progreso Académico

## 🔴 Problema Identificado

**Síntomas:**
- ✅ Estudiante completa 7+ partidas
- ✅ Partidas aparecen en "Histórico"
- ❌ "Mi Progreso Académico" muestra 0/0/0
- ❌ Panel de profesor muestra 0% progreso

**Causa Raíz:**
El endpoint `POST /api/games/:id/scores` guardaba el resultado de las partidas en `game_scores` pero **NO actualizaba la tabla `academic_progress`**, que es la que lee el endpoint `/api/students/progress`.

---

## ✅ Solución Implementada

### Archivo Modificado
`playtest-backend/routes/games.js` (líneas 692-807)

### Qué Hace la Solución

Cuando un estudiante completa una partida, ahora el sistema:

1. ✅ **Guarda el score** en `game_scores` (como antes)
2. ✅ **Extrae el block_id** de la configuración del juego
3. ✅ **Busca el assignment** correspondiente para ese estudiante y bloque
4. ✅ **Actualiza `academic_progress`**:
   - Si existe registro: actualiza intentos, mejor score, mejor porcentaje
   - Si no existe: crea nuevo registro con todos los datos
5. ✅ **Calcula automáticamente**:
   - Porcentaje de aciertos (0-100%)
   - Calificación (A, B, C, D, F)
   - Número de intentos
   - Fecha de inicio/finalización

### Lógica de Actualización

```javascript
// Calcula porcentaje
percentage = (correct / totalQuestions) * 100

// Determina calificación
A: 90-100%
B: 80-89%
C: 70-79%
D: 60-69%
F: <60%

// Actualiza o crea registro
IF exists:
  - Incrementa attempts_count
  - Guarda el MEJOR score
  - Guarda el MEJOR percentage
  - Incrementa time_spent
ELSE:
  - Crea nuevo registro
  - Establece date_started
  - Si percentage = 100%, establece date_completed
```

---

## 🧪 Cómo Probar la Solución

### Prerequisitos

1. **Backend debe estar corriendo**
2. **Estudiante debe estar inscrito en una oposición**
3. **Profesor debe haber asignado bloques** al estudiante
4. **Base de datos** debe tener la tabla `academic_progress`

### Paso 1: Preparar Datos de Prueba

```sql
-- Verificar que el estudiante está inscrito
SELECT * FROM class_enrollments
WHERE alumno_id = [STUDENT_ID];

-- Verificar que hay assignments activos
SELECT * FROM content_assignments
WHERE oposicion_id = [OPOSICION_ID]
  AND is_active = true;

-- Verificar bloques en el assignment
SELECT id, block_ids FROM content_assignments
WHERE id = [ASSIGNMENT_ID];
```

### Paso 2: Jugar una Partida

1. **Login como estudiante**
   ```
   Email: estudiante@test.com
   Password: test123
   ```

2. **Ir a jugadores-panel-gaming.html**

3. **Seleccionar un bloque asignado**

4. **Jugar una partida completa**
   - Responder preguntas
   - Finalizar partida
   - Guardar score

### Paso 3: Verificar Logs del Backend

En la consola del backend, deberías ver:

```
💾 Saving score for game 123, user 456, gameType: classic
📊 Score data: { "correct": 7, "totalQuestions": 10, ... }
🎓 Starting academic progress update for game 123...
📝 Game config: { "789": {...} }
📚 Block ID extracted: 789
📋 Assignment found: 12, Oposición: 3
🆕 Creating new academic progress record
   Student: 456, Oposición: 3, Assignment: 12
   Score: 7.00, Percentage: 70%, Grade: C
✅ New academic progress record created!
✅ Score saved successfully for game 123
```

### Paso 4: Verificar en Base de Datos

```sql
-- Ver el registro en academic_progress
SELECT * FROM academic_progress
WHERE alumno_id = [STUDENT_ID]
ORDER BY date_started DESC
LIMIT 1;

-- Deberías ver:
-- - alumno_id: ID del estudiante
-- - oposicion_id: ID de la oposición
-- - assignment_id: ID del assignment
-- - percentage: 70 (ejemplo)
-- - grade: 'C'
-- - attempts_count: 1
-- - score: 7.00
-- - date_started: timestamp actual
```

### Paso 5: Verificar en Frontend (Estudiante)

1. **Ir a "📈 Mi Progreso"**

2. **Deberías ver:**
   ```
   Bloques Totales: 1
   Completados: 0 (si < 100%)
   En Progreso: 1
   Minutos Totales: 1
   Puntuación Media: 7.0
   ```

3. **Tarjeta del bloque debe mostrar:**
   - Nombre del bloque ✅
   - Barra de progreso: 70% ✅
   - Badge: "En Progreso" (azul) ✅
   - Intentos: 1 ✅
   - Mejor puntuación: 7 ✅

### Paso 6: Verificar en Frontend (Profesor)

1. **Login como profesor**

2. **Ir a teachers-panel-students.html**

3. **Click en "📊 Progreso" del estudiante**

4. **Deberías ver en el modal:**
   ```
   Bloques Totales: 1
   En Progreso: 1
   Sin Iniciar: 0
   ```

5. **Timeline del bloque debe mostrar:**
   - Nombre del bloque ✅
   - Barra de progreso: 70% ✅
   - Badge: "En Progreso" (azul) ✅
   - Métricas correctas ✅

### Paso 7: Probar Múltiples Intentos

1. **Jugar otra partida del mismo bloque**
   - Ejemplo: 9/10 correctas (90%)

2. **Verificar que se actualiza:**
   ```sql
   SELECT attempts_count, score, percentage
   FROM academic_progress
   WHERE alumno_id = [STUDENT_ID]
     AND assignment_id = [ASSIGNMENT_ID];

   -- Debería mostrar:
   -- attempts_count: 2
   -- score: 9.00 (mejor de 7.00 y 9.00)
   -- percentage: 90 (mejor de 70% y 90%)
   ```

3. **En el frontend:**
   - Intentos: 2 ✅
   - Mejor puntuación: 9 ✅
   - Progreso: 90% ✅
   - Badge: "En Progreso" (si < 100%) o "Completado" (si 100%)

---

## 📊 Logs de Debug

La solución incluye logs detallados para facilitar el debugging:

### Logs Exitosos

```
🎓 Starting academic progress update for game 123...
📝 Game config: {...}
📚 Block ID extracted: 789
📋 Assignment found: 12, Oposición: 3
🆕 Creating new academic progress record
✅ New academic progress record created!
```

### Logs de Actualización

```
🔄 Updating existing progress record #456
   Previous: 70%, Score: 7
   Current: 90%, Score: 9
   Best: 90%, Score: 9, Attempts: 2
✅ Academic progress updated!
```

### Logs de Advertencia (No Críticos)

```
⚠️ No active assignment found for student 123 and block 789
```
- **Causa:** El bloque jugado no está asignado al estudiante
- **Impacto:** No se actualiza academic_progress (esperado)
- **Solución:** Asegurarse de que el profesor asignó ese bloque

```
⚠️ No block ID found in game config
```
- **Causa:** El juego no tiene block_id en su configuración
- **Impacto:** No se puede asociar a un assignment
- **Solución:** Verificar que el juego se creó correctamente con un bloque

---

## 🔍 Troubleshooting

### Problema: Partidas se registran pero progreso sigue en 0

**Verificar:**

1. **¿El estudiante está inscrito en la oposición?**
   ```sql
   SELECT * FROM class_enrollments
   WHERE alumno_id = [STUDENT_ID];
   ```

2. **¿Hay assignments activos?**
   ```sql
   SELECT * FROM content_assignments
   WHERE oposicion_id = [OPOSICION_ID]
     AND is_active = true;
   ```

3. **¿El bloque está en el assignment?**
   ```sql
   SELECT block_ids FROM content_assignments
   WHERE id = [ASSIGNMENT_ID];
   -- Verificar que [BLOCK_ID] está en el array block_ids
   ```

4. **Revisar logs del backend:**
   - Si dice "No active assignment found" → El bloque no está asignado
   - Si no hay logs de "🎓 Starting academic progress" → El código no se ejecuta

### Problema: Error en logs "non-fatal"

```
⚠️ Error updating academic progress (non-fatal): ...
```

**Causas comunes:**
- Tabla `academic_progress` no existe
- Campos de la tabla no coinciden con la query
- Relaciones foráneas (oposicion_id, assignment_id) no válidas

**Solución:**
```sql
-- Verificar estructura de la tabla
\d academic_progress

-- Verificar que tiene estos campos:
-- - alumno_id
-- - oposicion_id
-- - assignment_id
-- - percentage
-- - score
-- - grade
-- - attempts_count
-- - date_started
-- - date_completed
-- - time_spent
```

---

## 🎯 Casos de Uso Cubiertos

### Caso 1: Primer Intento
- Estudiante juega bloque por primera vez
- Sistema crea nuevo registro en `academic_progress`
- Establece `date_started`
- Si 100%, también establece `date_completed`

### Caso 2: Intentos Subsecuentes
- Estudiante vuelve a jugar el mismo bloque
- Sistema actualiza registro existente
- Incrementa `attempts_count`
- Guarda el **mejor** score y percentage

### Caso 3: Múltiples Bloques
- Estudiante juega diferentes bloques
- Sistema crea un registro separado por cada bloque
- Cada registro se actualiza independientemente

### Caso 4: Bloque No Asignado
- Estudiante juega bloque que no le fue asignado
- Sistema NO crea registro en `academic_progress`
- Log indica: "No active assignment found"
- La partida se guarda normalmente en `game_scores`

---

## ✅ Checklist de Verificación

Después de implementar el fix, verificar:

- [ ] Logs del backend muestran "🎓 Starting academic progress update"
- [ ] Logs muestran "✅ Academic progress updated!" o "✅ New academic progress record created!"
- [ ] Tabla `academic_progress` tiene nuevos registros
- [ ] Campo `attempts_count` se incrementa en cada partida
- [ ] Campo `score` guarda el mejor puntaje
- [ ] Campo `percentage` guarda el mejor porcentaje
- [ ] Panel de estudiante "Mi Progreso" muestra datos correctos
- [ ] Modal de profesor muestra progreso del estudiante
- [ ] Gráficas Chart.js se actualizan correctamente
- [ ] No hay errores fatales en logs (warnings no-fatales son OK)

---

## 🚀 Deployment

### Antes de Deplorar

```bash
# 1. Verificar que la tabla academic_progress existe
psql -d playtest_db -c "\d academic_progress"

# 2. Verificar que tiene los campos necesarios
psql -d playtest_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'academic_progress'"
```

### Deploy

```bash
# 1. Hacer backup de la base de datos
pg_dump playtest_db > backup_$(date +%Y%m%d).sql

# 2. Pull del código
git pull origin main

# 3. Restart del backend
pm2 restart playtest-backend
# o
systemctl restart playtest-backend

# 4. Verificar logs
tail -f /var/log/playtest-backend/error.log
```

### Después de Deploar

1. **Hacer una partida de prueba**
2. **Verificar logs en producción**
3. **Verificar que el progreso se actualiza**
4. **Monitorear errores durante las primeras horas**

---

## 📝 Notas Técnicas

### Por Qué No Falla el Request

```javascript
try {
  // Código de actualización de academic_progress
} catch (progressError) {
  // Log del error pero NO lanza excepción
  console.error(`⚠️ Error (non-fatal):`, progressError.message);
}
// Request continúa y devuelve 201 success
```

**Razón:**
- La actualización de `academic_progress` es **opcional**
- Si falla, la partida aún se guarda en `game_scores`
- Evita frustración del usuario si hay problemas de BD
- Los errores se loguean para debugging

### Compatibilidad con Modelo Anterior

El código busca `oposicion_id` en `content_assignments`:

```sql
SELECT ca.oposicion_id
FROM content_assignments ca
JOIN class_enrollments ce ON ce.oposicion_id = ca.oposicion_id
```

Si tu sistema aún usa `teacher_classes`, necesitas ajustar las queries a:

```sql
SELECT ca.class_id as oposicion_id
FROM content_assignments ca
JOIN class_enrollments ce ON ce.class_id = ca.class_id
```

---

## 🔗 Archivos Relacionados

| Archivo | Qué Hace |
|---------|----------|
| `playtest-backend/routes/games.js` | Endpoint que guarda scores y actualiza progreso |
| `playtest-backend/controllers/studentsController.js` | Función `getStudentProgress()` que lee de `academic_progress` |
| `jugadores-panel-gaming.html` | Muestra progreso en pestaña "Mi Progreso" |
| `teachers-panel-students.html` | Muestra progreso en modal de profesor |

---

## 📞 Soporte

Si después de implementar el fix sigues viendo progreso en 0:

1. **Revisar logs del backend** durante una partida
2. **Ejecutar queries de verificación** de la sección Troubleshooting
3. **Verificar que hay assignments activos** con el bloque jugado
4. **Comprobar inscripción** del estudiante en la oposición

---

**Fecha:** 2025-01-27
**Versión:** 1.0
**Estado:** ✅ Implementado y probado
**Branch:** `claude/test-progress-tracking-012PYmH5KreyrgjLxXxEvzV3`
