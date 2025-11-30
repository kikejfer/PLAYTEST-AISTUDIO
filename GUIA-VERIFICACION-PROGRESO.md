# 🧪 Guía de Verificación - Sistema de Progreso Académico

Esta guía te llevará paso a paso para verificar todas las nuevas funcionalidades del Sistema de Progreso Académico.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener:

- [ ] Backend corriendo en `https://playtest-backend.onrender.com`
- [ ] Base de datos con datos de prueba (estudiantes, bloques, progreso)
- [ ] Navegador moderno (Chrome, Firefox, Safari, Edge)
- [ ] Consola del navegador abierta (F12) para ver logs

---

## 🎮 PARTE 1: Verificar Panel de Estudiantes

### Paso 1: Preparación y Login

1. **Abrir el panel de estudiantes**
   ```
   Archivo: jugadores-panel-gaming.html
   ```

2. **Iniciar sesión como estudiante**
   - Ir al selector de roles
   - Elegir "Jugador"
   - Ingresar credenciales de un estudiante de prueba
   - Verificar que aparece el token en localStorage:
     - Abrir consola (F12)
     - Ejecutar: `localStorage.getItem('playtest_auth_token')`
     - Debe devolver un token JWT

### Paso 2: Verificar Nueva Pestaña "Mi Progreso"

3. **Localizar la nueva pestaña**
   - ✅ Buscar en la barra de pestañas superior
   - ✅ Debe aparecer: **"📈 Mi Progreso"**
   - ✅ Debe estar junto a: Partidas, Marketplace, Mis Clases, Histórico

4. **Hacer clic en "Mi Progreso"**
   - Click en la pestaña
   - Verificar que cambia el contenido de la página
   - NO debe redirigir a otra página

### Paso 3: Verificar Dashboard de Estadísticas

5. **Verificar las 5 tarjetas de métricas**

   Debe aparecer una fila con 5 tarjetas mostrando:

   | Tarjeta | Qué verificar |
   |---------|---------------|
   | **Bloques Totales** | Número total de bloques asignados |
   | **Completados** | Bloques al 100% |
   | **En Progreso** | Bloques entre 1-99% |
   | **Minutos Totales** | Suma de tiempo dedicado |
   | **Puntuación Media** | Promedio de mejores puntuaciones |

   **Qué buscar:**
   - ✅ Números grandes y visibles
   - ✅ Etiquetas descriptivas debajo
   - ✅ Fondo con gradiente turquesa
   - ✅ Borde con brillo turquesa
   - ✅ Hover hace que la tarjeta se eleve ligeramente

### Paso 4: Verificar Filtro por Oposición

6. **Probar el dropdown de filtrado**

   En la esquina superior derecha, buscar:
   ```
   [Todas las Oposiciones ▼] [🔄 Actualizar]
   ```

   **Pruebas:**
   - ✅ Click en el dropdown
   - ✅ Debe mostrar lista de oposiciones inscritas
   - ✅ Seleccionar una oposición específica
   - ✅ Las tarjetas de abajo deben actualizarse
   - ✅ Solo se muestran bloques de esa oposición
   - ✅ Las estadísticas se recalculan

   **Volver a "Todas las Oposiciones":**
   - ✅ Seleccionar "Todas las Oposiciones"
   - ✅ Debe mostrar todos los bloques de nuevo

### Paso 5: Verificar Tarjetas de Bloques

7. **Revisar cada tarjeta de bloque**

   Cada bloque debe mostrar:

   **Encabezado:**
   - ✅ Nombre del bloque (grande, en blanco)
   - ✅ Nombre de la oposición (pequeño, gris, debajo)
   - ✅ Badge de estado a la derecha:
     - 🟢 Verde "Completado" si 100%
     - 🔵 Azul "En Progreso" si 1-99%
     - ⚫ Gris "Sin Iniciar" si 0%

   **Barra de Progreso:**
   - ✅ Barra horizontal con gradiente turquesa
   - ✅ Porcentaje centrado en la barra
   - ✅ Ancho de la barra = porcentaje (ej: 50% de ancho si 50% de progreso)
   - ✅ Animación suave al cargar

   **Métricas (3 columnas):**
   - ✅ ⏱️ Minutos dedicados
   - ✅ 🔄 Número de intentos
   - ✅ ⭐ Mejor puntuación

   **Fechas:**
   - ✅ 📅 Fecha de inicio
   - ✅ ✅ Fecha de finalización (o "En curso")

   **Hover sobre tarjeta:**
   - ✅ Borde cambia a turquesa brillante
   - ✅ Sombra turquesa aparece
   - ✅ Tarjeta se eleva ligeramente

### Paso 6: Verificar Gráfica de Evolución

8. **Localizar la gráfica Chart.js**

   Debajo de todas las tarjetas de bloques, debe aparecer:

   ```
   📈 Evolución de Progreso
   [Gráfica de barras]
   ```

   **Verificar:**
   - ✅ Título "📈 Evolución de Progreso"
   - ✅ Gráfica de barras con Chart.js
   - ✅ Una barra por cada bloque
   - ✅ Altura de barra = porcentaje de progreso
   - ✅ Colores de barras:
     - 🟢 Verde para bloques completados (100%)
     - 🔵 Azul para bloques en progreso (1-99%)
     - ⚫ Gris para bloques sin iniciar (0%)
   - ✅ Eje Y va de 0 a 100
   - ✅ Etiquetas de bloques en eje X (inclinadas 45°)
   - ✅ Hover sobre barra muestra tooltip con valor

### Paso 7: Verificar Botón de Actualización

9. **Probar actualización manual**

   - ✅ Click en botón "🔄 Actualizar"
   - ✅ Debe recargar los datos
   - ✅ Consola del navegador debe mostrar petición GET
   - ✅ Datos se actualizan sin recargar la página

### Paso 8: Verificar Estados Especiales

10. **Si NO hay progreso (estudiante nuevo)**

    Debe aparecer:
    ```
    📭 No tienes progreso registrado aún
    Comienza a estudiar bloques asignados para ver tu progreso aquí.
    ```

11. **Si NO está autenticado**

    Debe aparecer:
    ```
    🔒 Debes iniciar sesión
    Inicia sesión como estudiante para ver tu progreso académico.
    ```

### Paso 9: Verificar Responsive (Móvil)

12. **Probar en vista móvil**

    - Abrir DevTools (F12)
    - Click en el ícono de móvil
    - Seleccionar "iPhone 12 Pro" o similar

    **Verificar:**
    - ✅ Tarjetas de métricas se reorganizan en 2-3 columnas
    - ✅ Filtro y botón se apilan verticalmente
    - ✅ Tarjetas de bloques son full-width
    - ✅ Métricas se reorganizan en 3 columnas
    - ✅ Gráfica se ajusta al ancho

---

## 👨‍🏫 PARTE 2: Verificar Panel de Profesores

### Paso 1: Preparación y Login

13. **Abrir el panel de profesores**
    ```
    Archivo: teachers-panel-students.html
    ```

14. **Iniciar sesión como profesor**
    - Usar credenciales de profesor
    - Verificar token en localStorage

### Paso 2: Localizar Sección de Estudiantes

15. **Ir a la sección "📊 Rendimiento Académico"**

    - Scroll hacia abajo en la página
    - Buscar la sección con título "📊 Rendimiento Académico"
    - Debe aparecer una lista de estudiantes

### Paso 3: Verificar Botón "📊 Progreso"

16. **Localizar el botón en cada estudiante**

    Cada tarjeta de estudiante debe tener 3 botones:
    ```
    [📋 Perfil] [📊 Progreso] [🎯 Intervención]
    ```

    **Verificar:**
    - ✅ Botón "📊 Progreso" está visible
    - ✅ Color verde del botón
    - ✅ Hover cambia el color ligeramente

### Paso 4: Abrir Modal de Progreso

17. **Click en "📊 Progreso" de un estudiante**

    **Qué debe pasar:**
    - ✅ Fondo oscuro semi-transparente cubre toda la pantalla
    - ✅ Modal aparece centrado con animación de deslizamiento
    - ✅ Resto de la página se oscurece (backdrop blur)
    - ✅ Modal tiene encabezado morado con gradiente

### Paso 5: Verificar Encabezado del Modal

18. **Revisar el encabezado**

    **Debe mostrar:**
    - ✅ Título: "📊 Progreso del Estudiante #[ID]"
    - ✅ Subtítulo: "[N] bloques asignados"
    - ✅ Botón X en la esquina superior derecha
    - ✅ Fondo con gradiente morado (#667eea → #764ba2)

### Paso 6: Verificar Tarjetas de Resumen

19. **Revisar las 6 tarjetas de métricas**

    Primera fila (3 tarjetas normales):
    | Tarjeta | Color | Qué muestra |
    |---------|-------|-------------|
    | **Bloques Totales** | Turquesa | Total de bloques |
    | **✅ Completados** | Turquesa | Bloques al 100% |
    | **🔄 En Progreso** | 🟡 Amarillo | Bloques 1-99% |

    Segunda fila (3 tarjetas):
    | Tarjeta | Color | Qué muestra |
    |---------|-------|-------------|
    | **⏸️ Sin Iniciar** | 🔴 Rojo (si >0) | Bloques al 0% |
    | **⏱️ Minutos Totales** | Turquesa | Tiempo total |
    | **⭐ Puntuación Media** | Turquesa | Promedio de scores |

    **Alertas a verificar:**
    - ✅ Si hay bloques sin iniciar, la tarjeta es ROJA
    - ✅ Si hay bloques en progreso, la tarjeta es AMARILLA
    - ✅ Esto alerta visualmente al profesor

### Paso 7: Verificar Timeline de Bloques

20. **Revisar "📚 Progreso por Bloque"**

    Debajo de las tarjetas, debe aparecer una sección con:

    **Título:**
    - ✅ "📚 Progreso por Bloque" en turquesa

    **Cada bloque en timeline:**

    **Encabezado:**
    - ✅ Nombre del bloque (grande)
    - ✅ Nombre de la oposición (pequeño, gris)
    - ✅ Badge de estado:
      - 🟢 "Completado" si 100%
      - 🔵 "En Progreso" si 1-99%
      - ⚫ "Sin Iniciar" si 0%

    **Barra de Progreso:**
    - ✅ Barra horizontal
    - ✅ Color según estado:
      - 🟢 Verde (completado)
      - 🔵 Azul (en progreso)
      - ⚫ Gris (sin iniciar)
    - ✅ Borde izquierdo grueso del mismo color

    **Métricas (4 items en fila):**
    - ✅ 📊 XX% completado
    - ✅ ⏱️ XX minutos
    - ✅ 🔄 XX intentos
    - ✅ ⭐ XX puntuación

    **Fechas (si existen):**
    - ✅ 📅 Iniciado: [fecha]
    - ✅ ✅ Completado: [fecha] (o nada si en progreso)

    **Hover sobre bloque:**
    - ✅ Fondo se ilumina ligeramente
    - ✅ Se mueve 5px a la derecha

### Paso 8: Verificar Botones de Exportación

21. **Localizar botones al final del modal**

    ```
    [📄 Exportar PDF] [📊 Exportar CSV]
    ```

    **Verificar:**
    - ✅ Dos botones verdes con gradiente
    - ✅ Alineados a la derecha
    - ✅ Click muestra alert "En desarrollo" (placeholder)

### Paso 9: Verificar Cierre del Modal

22. **Probar las 2 formas de cerrar**

    **Opción 1: Botón X**
    - ✅ Click en X de la esquina superior derecha
    - ✅ Modal se cierra con animación
    - ✅ Fondo oscuro desaparece

    **Opción 2: Click fuera**
    - ✅ Abrir modal de nuevo
    - ✅ Click en el fondo oscuro (fuera del modal)
    - ✅ Modal se cierra

    **Opción 3: ESC (opcional)**
    - Si implementado, presionar ESC también cierra

### Paso 10: Verificar Estado Vacío

23. **Probar con estudiante sin progreso**

    Si el estudiante no tiene progreso registrado:
    ```
    📭 Sin progreso registrado
    Este estudiante aún no ha iniciado ningún bloque asignado.
    ```

---

## 🔍 PARTE 3: Pruebas Avanzadas

### Test de Rendimiento

24. **Verificar tiempos de carga**

    - Abrir DevTools → Network
    - Limpiar network log
    - Abrir pestaña "Mi Progreso" o modal
    - **Verificar:**
      - ✅ Request a `/api/students/progress` completa en <2 segundos
      - ✅ Gráfica se renderiza sin lag
      - ✅ No hay requests duplicados

### Test de Errores

25. **Simular errores de red**

    - DevTools → Network → Throttling → Offline
    - Intentar cargar progreso
    - **Debe mostrar:**
      ```
      ❌ Error al cargar progreso
      Hubo un problema al cargar tu progreso. Intenta de nuevo.
      [🔄 Reintentar]
      ```

26. **Test sin autenticación**

    - Borrar token: `localStorage.removeItem('playtest_auth_token')`
    - Refrescar pestaña "Mi Progreso"
    - **Debe mostrar:**
      ```
      🔒 Debes iniciar sesión
      Inicia sesión como estudiante para ver tu progreso académico.
      ```

### Test de Datos Reales

27. **Verificar con datos reales del backend**

    **En consola del navegador:**
    ```javascript
    // Ver datos crudos
    const token = localStorage.getItem('playtest_auth_token');
    fetch('https://playtest-backend.onrender.com/api/students/progress', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => console.table(data.progress));
    ```

    **Verificar:**
    - ✅ Los datos mostrados coinciden con los de la API
    - ✅ Cálculos son correctos (promedios, totales)
    - ✅ Fechas se formatean correctamente

### Test Cross-Browser

28. **Probar en diferentes navegadores**

    | Navegador | Versión Mínima | Qué verificar |
    |-----------|----------------|---------------|
    | Chrome | 90+ | Todo funciona |
    | Firefox | 88+ | Todo funciona |
    | Safari | 14+ | Todo funciona |
    | Edge | 90+ | Todo funciona |

---

## 📊 PARTE 4: Verificación de Consola

### Logs Esperados

29. **Abrir consola y verificar logs**

    **Al cargar "Mi Progreso":**
    ```
    > AcademicProgressComponent initialized
    > Loading progress...
    > Progress loaded: [N] blocks
    ```

    **Al cambiar filtro:**
    ```
    > Loading progress for class: [ID]
    > Progress filtered: [N] blocks
    ```

    **Al abrir modal de profesor:**
    ```
    > Loading student progress: [studentId]
    > Student progress loaded: [N] blocks
    ```

### Verificar No Hay Errores

30. **Revisar que NO aparezcan:**

    - ❌ 404 Not Found
    - ❌ 401 Unauthorized (si está logueado)
    - ❌ CORS errors
    - ❌ TypeError: Cannot read property...
    - ❌ Chart is not defined (si hay gráfica)

---

## ✅ Checklist Final de Verificación

### Estudiantes - Panel de Jugadores

- [ ] Pestaña "📈 Mi Progreso" aparece
- [ ] Dashboard muestra 5 métricas correctas
- [ ] Filtro por oposición funciona
- [ ] Tarjetas de bloques se muestran correctamente
- [ ] Barras de progreso son precisas
- [ ] Badges de estado tienen colores correctos
- [ ] Métricas (tiempo, intentos, score) son correctas
- [ ] Fechas se muestran bien
- [ ] Gráfica Chart.js se renderiza
- [ ] Gráfica tiene colores según estado
- [ ] Botón de actualización funciona
- [ ] Responsive funciona en móvil
- [ ] Estado vacío se muestra cuando no hay datos
- [ ] Error state funciona sin autenticación

### Profesores - Panel de Teachers

- [ ] Botón "📊 Progreso" está visible en cada estudiante
- [ ] Modal se abre con animación suave
- [ ] Encabezado muestra nombre/ID del estudiante
- [ ] 6 tarjetas de resumen muestran métricas correctas
- [ ] Alertas visuales funcionan (rojo para sin iniciar)
- [ ] Timeline muestra todos los bloques
- [ ] Barras de progreso son precisas
- [ ] Badges tienen colores correctos
- [ ] Métricas de cada bloque son correctas
- [ ] Botones de exportación están presentes
- [ ] Modal se cierra con X
- [ ] Modal se cierra con click fuera
- [ ] Estado vacío funciona sin progreso
- [ ] No hay errores en consola

### Funcionalidades Avanzadas

- [ ] Gráficas Chart.js funcionan
- [ ] Sistema de alertas visuales funciona
- [ ] Diseño responsive en móvil
- [ ] Filtrado dinámico funciona
- [ ] Actualización manual funciona
- [ ] Manejo de errores correcto
- [ ] Performance es buena (<2s de carga)
- [ ] Funciona en todos los navegadores

---

## 🐛 Problemas Comunes y Soluciones

### Problema: No aparece la pestaña "Mi Progreso"

**Solución:**
- Verificar que el archivo `jugadores-panel-gaming.html` tiene la línea:
  ```html
  <button class="tab-button" onclick="switchTab('progreso')">📈 Mi Progreso</button>
  ```
- Limpiar caché del navegador (Ctrl+Shift+R)

### Problema: Gráfica no se muestra

**Solución:**
- Verificar que Chart.js está cargado:
  ```javascript
  console.log(typeof Chart); // Debe ser "function"
  ```
- Verificar que hay datos de progreso

### Problema: Modal no se abre

**Solución:**
- Abrir consola y buscar errores
- Verificar que la función `viewStudentProgress` existe:
  ```javascript
  console.log(typeof viewStudentProgress); // Debe ser "function"
  ```

### Problema: No se cargan datos

**Solución:**
- Verificar autenticación:
  ```javascript
  console.log(localStorage.getItem('playtest_auth_token'));
  ```
- Verificar que el backend está corriendo
- Verificar endpoint en Network tab

---

## 📞 Contacto y Soporte

Si encuentras algún problema durante la verificación:

1. **Revisar consola del navegador** (F12) para errores
2. **Verificar Network tab** para requests fallidos
3. **Comprobar que el backend está corriendo**
4. **Verificar autenticación** (token en localStorage)

---

## 🎉 ¡Verificación Completa!

Si todos los checks están ✅, el sistema está funcionando correctamente y listo para producción.

**Commits relacionados:**
- `876ba92` - WIP: Integrate Academic Progress System into main panels
- `00c0a8f` - feat: Complete integration with advanced features

**Branch:** `claude/test-progress-tracking-012PYmH5KreyrgjLxXxEvzV3`

---

**¡Gracias por verificar el Sistema de Progreso Académico!** 🚀
