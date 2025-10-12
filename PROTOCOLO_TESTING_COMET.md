# 🧪 PROTOCOLO DE TESTING MANUAL - ETAPA 1.3
## Para: Comet (Asistente de Perplexity)
## Fecha: 12 de Octubre de 2025
## Usuario de prueba: JaiGon / Contraseña: 1003

---

## 📋 OBJETIVO

Necesito que juegues **9 modalidades de juego** en PLAYTEST para verificar que guardan datos correctamente en la base de datos. Por cada modalidad, debes capturar información específica y proporcionarme los resultados.

**URL de la aplicación:** https://playtest-frontend.onrender.com

---

## 🎯 MODALIDADES A TESTEAR (EN ORDEN)

### **GRUPO 1: MODALIDADES DE ENTRENAMIENTO** (Testear primero)
1. ✅ **Classic Mode** (Modo Clásico)
2. ✅ **Time Trial Mode** (Contrarreloj)
3. ✅ **Lives Mode** (Vidas)

### **GRUPO 2: MODALIDADES DE COMPETICIÓN**
4. ✅ **Streak Mode** (Racha)
5. ✅ **By Levels Mode** (Por Niveles)
6. ✅ **Marathon Mode** (Maratón)
7. ✅ **Exam Mode** (Examen)

### **GRUPO 3: MODALIDADES MULTIPLAYER** (Testear al final)
8. ✅ **Duel Mode** (Duelo) - Requiere 2 jugadores
9. ✅ **Trivial Mode** (Trivial) - Requiere 2+ jugadores

---

## 📝 PROTOCOLO POR CADA MODALIDAD

### **PASO 1: PREPARACIÓN** (Solo la primera vez)

1. Abre https://playtest-frontend.onrender.com
2. Login con:
   - **Usuario:** JaiGon
   - **Contraseña:** 1003
3. Abre Developer Tools (F12)
4. Ve a la pestaña **Network**
5. Activa el filtro "**Fetch/XHR**" (para ver solo llamadas a API)
6. Deja el Developer Tools abierto durante todas las pruebas

### **PASO 2: JUGAR LA MODALIDAD**

1. **Navega a la modalidad** correspondiente desde el menú principal
2. **Selecciona cualquier bloque** de preguntas disponible
3. **Juega la partida completa** hasta que termine (intenta responder al menos 5-10 preguntas)
4. **NO CIERRES** la ventana cuando termine la partida

### **PASO 3: CAPTURAR INFORMACIÓN**

#### A. Screenshot de la pantalla final
- Toma una **captura de pantalla** de la pantalla de finalización de la partida
- Debe verse el mensaje de "Partida completada" o similar
- Guárdala con nombre: `[modalidad]_final.png`
  - Ejemplo: `classic_final.png`, `time-trial_final.png`

#### B. Capturar Request/Response del Network Tab

En el Developer Tools (pestaña Network):

1. **Busca** las llamadas que contengan `/games/` en la URL
2. Las más importantes son:
   - `POST /api/games` (crear partida)
   - `POST /api/games/{id}/end` o `/api/games/{id}/complete` (finalizar partida)
   - `POST /api/games/{id}/score` (guardar puntuación)

3. Para **CADA** una de estas llamadas, haz clic y copia:
   - **Request Headers** (pestaña Headers, sección Request Headers)
   - **Request Payload** (pestaña Payload o Request)
   - **Response** (pestaña Response o Preview)
   - **Status Code** (debe ser 200, 201 o 204 si funciona bien)

4. Pega todo en un archivo de texto:
   ```
   =================================
   MODALIDAD: [Nombre]
   =================================

   --- CREATE GAME ---
   URL: POST /api/games
   Status: [código]
   Request:
   [pegar aquí]

   Response:
   [pegar aquí]

   --- END GAME ---
   URL: POST /api/games/[ID]/end
   Status: [código]
   Request:
   [pegar aquí]

   Response:
   [pegar aquí]

   --- SAVE SCORE ---
   URL: POST /api/games/[ID]/score
   Status: [código]
   Request:
   [pegar aquí]

   Response:
   [pegar aquí]
   ```

#### C. Capturar Console Logs

En el Developer Tools (pestaña Console):

1. **Busca** mensajes que contengan:
   - "Game ended"
   - "Saving score"
   - "Game saved"
   - Cualquier **error** (aparecen en rojo)

2. Copia **TODO** el contenido de la consola
3. Pégalo en el mismo archivo de texto bajo una sección:
   ```
   --- CONSOLE LOGS ---
   [pegar aquí todos los logs]
   ```

#### D. Anotar Observaciones

Responde estas preguntas para cada modalidad:

```
1. ¿Apareció un mensaje de "Partida completada con éxito" o similar?
   [ ] Sí  [ ] No

2. ¿Se mostró la puntuación final?
   [ ] Sí  [ ] No
   Puntuación: _______

3. ¿Hubo algún error visible en pantalla?
   [ ] Sí  [ ] No
   Descripción: _______________________

4. ¿Las llamadas a la API retornaron status 200/201?
   [ ] Sí  [ ] No
   Errores: _______________________

5. ¿Viste algún error en la consola (texto rojo)?
   [ ] Sí  [ ] No
   Errores: _______________________
```

---

## 📦 FORMATO DE ENTREGA

Para **CADA MODALIDAD**, proporcióname:

### Archivo de texto: `[modalidad]_test_results.txt`

Contenido:
```
=================================
MODALIDAD: [Nombre Completo]
FECHA: [DD/MM/YYYY HH:MM]
USUARIO: JaiGon
=================================

1. OBSERVACIONES GENERALES
- Mensaje de éxito visible: [Sí/No]
- Puntuación mostrada: [Sí/No - Valor: X]
- Errores visuales: [Descripción o "Ninguno"]

2. NETWORK TAB - LLAMADAS A API
[Pegar todas las llamadas como se indicó arriba]

3. CONSOLE LOGS
[Pegar todos los logs de la consola]

4. CUESTIONARIO
[Respuestas a las 5 preguntas]

5. NOTAS ADICIONALES
[Cualquier cosa extraña que hayas notado]
```

### Captura de pantalla: `[modalidad]_final.png`

---

## 🚨 CASOS ESPECIALES

### Para DUEL MODE y TRIVIAL MODE:

Estas modalidades requieren **2 jugadores**. Si no puedes conseguir un segundo jugador:

**Opción 1:** Usa dos navegadores diferentes (Chrome y Firefox, por ejemplo):
- Navegador 1: Login con JaiGon
- Navegador 2: Login con otro usuario (si lo tienes)
- Inicia el juego desde uno y únete desde el otro

**Opción 2:** Si no puedes probarlas, indícamelo y las probaremos de otra forma.

---

## ⚠️ SI ALGO SALE MAL

Si una modalidad **NO funciona** (error, no guarda, se queda colgada):

1. ✅ **NO TE PREOCUPES** - Es normal, estamos detectando bugs
2. ✅ **CAPTURA TODO** - Screenshots, logs, errores
3. ✅ **DOCUMÉNTALO** - Describe exactamente qué pasó
4. ✅ **CONTINÚA** con la siguiente modalidad

**NO intentes arreglar nada**, solo documenta lo que ves.

---

## 📊 EJEMPLO DE RESULTADO IDEAL

```
=================================
MODALIDAD: Classic Mode
FECHA: 12/10/2025 16:30
USUARIO: JaiGon
=================================

1. OBSERVACIONES GENERALES
- Mensaje de éxito visible: Sí ("¡Partida completada!")
- Puntuación mostrada: Sí - Valor: 8.5/10
- Errores visuales: Ninguno

2. NETWORK TAB - LLAMADAS A API

--- CREATE GAME ---
URL: POST https://playtest-backend.onrender.com/api/games
Status: 201
Request:
{
  "userId": 123,
  "gameType": "classic",
  "config": {...}
}

Response:
{
  "id": 456,
  "status": "active",
  "gameType": "classic",
  ...
}

--- END GAME ---
URL: POST https://playtest-backend.onrender.com/api/games/456/end
Status: 200
Request:
{
  "score": 8.5,
  "correct": 17,
  "incorrect": 3
}

Response:
{
  "success": true,
  "gameId": 456,
  "status": "completed"
}

3. CONSOLE LOGS
[12:30:45] Game started: 456
[12:32:10] Question answered: correct
[12:33:05] Question answered: incorrect
...
[12:35:20] Game ended - Score: 8.5
[12:35:21] Saving score...
[12:35:22] ✅ Score saved successfully

4. CUESTIONARIO
1. ¿Mensaje de éxito? ✅ Sí
2. ¿Puntuación mostrada? ✅ Sí - 8.5/10
3. ¿Errores visuales? ❌ No
4. ¿API retornó 200/201? ✅ Sí
5. ¿Errores en consola? ❌ No

5. NOTAS ADICIONALES
Todo funcionó perfectamente. La partida se guardó sin problemas.
```

---

## ✅ CHECKLIST FINAL

Antes de enviarme los resultados, verifica que tienes:

- [ ] 9 archivos de texto (uno por modalidad)
- [ ] 9 capturas de pantalla (una por modalidad)
- [ ] Cada archivo contiene:
  - [ ] Observaciones generales
  - [ ] Network tab con llamadas API
  - [ ] Console logs
  - [ ] Cuestionario respondido
  - [ ] Notas adicionales

---

## 📬 CÓMO ENVIARME LOS RESULTADOS

Una vez tengas todo:

1. **Comprímelo** en un archivo ZIP llamado `testing_results_PLAYTEST.zip`
2. **Súbelo** a Google Drive, Dropbox o similar
3. **Compárteme el enlace** de descarga

O si prefieres, puedes ir enviándome los resultados **modalidad por modalidad** conforme las completes.

---

## 🎯 PRIORIDAD DE TESTING

Si tienes tiempo limitado, **prioriza este orden**:

1. **Classic Mode** ⭐⭐⭐ (Más importante)
2. **Time Trial Mode** ⭐⭐⭐
3. **Lives Mode** ⭐⭐⭐
4. **Marathon Mode** ⭐⭐
5. **Exam Mode** ⭐⭐
6. **Streak Mode** ⭐
7. **By Levels Mode** ⭐
8. **Duel Mode** (solo si puedes)
9. **Trivial Mode** (solo si puedes)

---

## ❓ DUDAS

Si tienes cualquier duda o problema:
1. Documenta el problema
2. Toma screenshots
3. Pregúntame lo que necesites

---

## 🙏 IMPORTANTE

- **Tómate tu tiempo** - Es mejor hacer 3 modalidades bien que 9 mal
- **Documenta TODO** - Incluso cosas que parezcan insignificantes
- **No te frustres** - Si algo no funciona, es EXACTAMENTE lo que queremos descubrir

¡Gracias por tu ayuda! 🚀
