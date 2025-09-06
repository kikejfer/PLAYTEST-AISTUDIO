# Fix del Conteo Doble en Creación de Preguntas

## Problema Identificado
Las preguntas se estaban contando doble en las tablas `block_answers` y `topic_answers` debido a triggers automáticos que duplicaban la lógica manual de los endpoints.

## Causa Raíz
Existían triggers en la tabla `questions` que se ejecutaban automáticamente en cada INSERT/UPDATE/DELETE:

- `trg_block_answers` - Actualizaba `block_answers.total_questions`
- `trg_topic_answers` - Actualizaba `topic_answers.total_questions`
- `trigger_update_question_counts` - (ya eliminado previamente)

**Flujo problemático:**
1. Endpoint crea pregunta con `INSERT INTO questions`
2. Trigger se ejecuta automáticamente y actualiza contadores (+1)
3. Endpoint ejecuta lógica manual y actualiza contadores otra vez (+1)
4. **Resultado:** Conteo doble (3 preguntas = 6 en contadores)

## Solución Aplicada
**Fecha:** 2025-01-27

Eliminados todos los triggers automáticos de conteo:
```sql
DROP TRIGGER IF EXISTS trg_block_answers ON questions;
DROP TRIGGER IF EXISTS trg_topic_answers ON questions;
DROP TRIGGER IF EXISTS trigger_update_question_counts ON questions;
```

## Endpoints que Manejan Contadores Manualmente
Todos estos endpoints YA tenían lógica manual correcta:

- ✅ `POST /api/questions` (individual)
- ✅ `POST /api/questions/bulk`
- ✅ `DELETE /api/questions/:id`
- ✅ `PUT /api/questions/:id` (cuando cambia topic)
- ✅ `PUT /api/blocks/:blockId/questions/:questionId` (cuando cambia topic)
- ✅ `DELETE /api/blocks/:id` (limpieza completa)

## Verificación
Después del fix, los contadores deben funcionar correctamente:
- 3 preguntas = 3 en `block_answers.total_questions`
- 2 temas con 3 preguntas cada uno = 6 total en `topic_answers`

## Estado
🟢 **SOLUCIONADO** - Los triggers duplicados han sido eliminados y solo la lógica manual de endpoints maneja los contadores.