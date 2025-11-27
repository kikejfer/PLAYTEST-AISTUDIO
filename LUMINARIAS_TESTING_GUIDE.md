# 🧪 Guía de Pruebas del Sistema de Luminarias

## 🎯 Opciones para Probar el Sistema

### **Opción 1: Demo Standalone (MÁS RÁPIDA) ⚡**

He creado una página de demostración completa que funciona **sin necesidad de backend**.

#### **Cómo Usarla:**

1. **Abre el archivo** `luminarias-demo.html` en tu navegador
   - Haz doble clic en el archivo, o
   - Arrastra el archivo a una pestaña del navegador, o
   - Desde la terminal: `open luminarias-demo.html` (macOS) / `xdg-open luminarias-demo.html` (Linux)

2. **Explora la demo interactiva:**
   - ✅ Contador de balance en el header (empieza en 1000 LUM)
   - ✅ Simulador de recompensas con controles
   - ✅ Tabla de recompensas base
   - ✅ Información de multiplicadores y bonus

3. **Prueba el cálculo:**
   - Cambia el **modo de juego** (cada uno tiene su multiplicador)
   - Ajusta **respuestas correctas** y **total de preguntas**
   - Marca si **ganaste** (en modo Duelo da +10 bonus)
   - Haz clic en **"Calcular Recompensa"** para ver los resultados

4. **Simula el fin de partida:**
   - Haz clic en **"Simular Fin de Partida"**
   - Verás la **animación completa** de la notificación
   - El balance en el header se actualizará automáticamente
   - Escucharás el sonido de recompensa

#### **Características de la Demo:**
- ✨ Notificación animada (igual que en el juego real)
- 🔊 Sonido de recompensa
- 📊 Cálculo preciso de Luminarias
- 🎮 Todos los modos de juego
- 💰 Actualización del balance en tiempo real

---

### **Opción 2: En tu Aplicación de Render 🌐**

Si ya tienes PLAYTEST desplegado en Render, puedes probar el sistema completo:

#### **Paso 1: Desplegar los Archivos Nuevos**

1. **Hacer commit y push de los cambios:**
   ```bash
   git add .
   git commit -m "feat: Add Luminarias virtual currency system"
   git push origin main
   ```

2. **Render detectará los cambios** y hará el deploy automáticamente

#### **Paso 2: Verificar en Render**

1. Abre tu aplicación en Render
2. Ve a cualquier modo de juego
3. Completa una partida
4. Deberías ver:
   - ✅ La notificación animada de Luminarias
   - ✅ El contador en el header actualizado
   - ✅ La transacción guardada en la base de datos

#### **Paso 3: Verificar el Backend**

Desde Render Dashboard:

```bash
# Conectar a tu shell de Render
# Verificar que la ruta de Luminarias está activa
curl https://tu-app.onrender.com/api/luminarias/balance \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### **Opción 3: Testing con el Código Directamente 🔧**

Puedes probar el gestor de Luminarias desde la consola del navegador:

#### **Paso 1: Abre cualquier página HTML del proyecto**

```bash
# Desde tu directorio del proyecto
open game-classic.html  # macOS
xdg-open game-classic.html  # Linux
start game-classic.html  # Windows
```

#### **Paso 2: En la Consola del Navegador (F12):**

```javascript
// Verificar que el gestor está cargado
console.log(window.luminariasManager);

// Simular una partida perfecta (10/10 correctas)
await window.luminariasManager.rewardGameCompletion({
    gameMode: 'classic',
    correctAnswers: 10,
    totalQuestions: 10,
    score: 1000,
    victory: false
});
// Deberías ver: +40 Luminarias (25 base + 15 bonus por perfecta)

// Simular una partida buena (8/10 correctas)
await window.luminariasManager.rewardGameCompletion({
    gameMode: 'time_trial',
    correctAnswers: 8,
    totalQuestions: 10,
    score: 800,
    victory: false
});
// Deberías ver: +24 Luminarias (20 base × 1.2 multiplicador)

// Ver balance actual
console.log('Balance:', window.luminariasManager.getBalance());

// Probar solo la notificación visual
window.luminariasManager.showRewardNotification(50);
```

---

## 📊 Casos de Prueba Recomendados

### **Caso 1: Partida Perfecta en Modo Clásico**
```javascript
Datos:
- Modo: Clásico (×1.0)
- Correctas: 10/10 (100%)
- Victoria: No

Cálculo:
- Base: 25 (90-100%)
- Multiplicador: ×1.0
- Bonus perfecta: +15
- Total: 40 Luminarias ✅
```

### **Caso 2: Buen Rendimiento en Contrarreloj**
```javascript
Datos:
- Modo: Contrarreloj (×1.2)
- Correctas: 8/10 (80%)
- Victoria: No

Cálculo:
- Base: 20 (75-89%)
- Multiplicador: ×1.2 = 24
- Total: 24 Luminarias ✅
```

### **Caso 3: Victoria en Duelo**
```javascript
Datos:
- Modo: Duelo (×1.5)
- Correctas: 7/10 (70%)
- Victoria: Sí

Cálculo:
- Base: 15 (60-74%)
- Multiplicador: ×1.5 = 22
- Bonus victoria: +10
- Total: 32 Luminarias ✅
```

### **Caso 4: Participación en Maratón**
```javascript
Datos:
- Modo: Maratón (×1.6)
- Correctas: 3/10 (30%)
- Victoria: No

Cálculo:
- Base: 5 (0-39%)
- Multiplicador: ×1.6 = 8
- Total: 8 Luminarias ✅
```

---

## 🎨 Verificar las Notificaciones Visuales

### **Elementos a Comprobar:**

1. **Animación de Entrada:**
   - ✅ La notificación aparece desde el centro escalando
   - ✅ El icono de Luminarias gira 360°
   - ✅ Fondo dorado con gradiente
   - ✅ Sombra con glow dorado

2. **Contenido:**
   - ✅ Icono de Luminarias visible
   - ✅ Cantidad en grande (ej: "+25")
   - ✅ Texto "LUMINARIAS" debajo

3. **Animación de Salida:**
   - ✅ Vuela hacia arriba (hacia el header)
   - ✅ Se hace más pequeña mientras sube
   - ✅ Desaparece gradualmente

4. **Actualización del Balance:**
   - ✅ El contador en el header se actualiza
   - ✅ El nuevo balance es correcto

5. **Sonido:**
   - ✅ Se reproduce un sonido suave (opcional)

---

## 🔍 Debugging

### **Si la notificación no aparece:**

1. **Verifica que el script está cargado:**
   ```javascript
   console.log(window.luminariasManager);
   // Debería mostrar el objeto del gestor
   ```

2. **Comprueba errores en consola:**
   ```javascript
   // Abre DevTools (F12) > Console
   // Busca errores en rojo
   ```

3. **Forzar una notificación:**
   ```javascript
   window.luminariasManager.showRewardNotification(25);
   ```

### **Si el balance no se actualiza:**

1. **Verificar elemento del DOM:**
   ```javascript
   console.log(document.getElementById('user-luminarias'));
   // Debería mostrar el elemento <span>
   ```

2. **Forzar actualización:**
   ```javascript
   window.luminariasManager.loadBalance();
   ```

### **Si hay error de backend:**

1. **Verificar token de autenticación:**
   ```javascript
   console.log(localStorage.getItem('playtest_auth_token'));
   ```

2. **Comprobar URL del backend:**
   ```javascript
   // En luminarias-manager.js
   // this.API_BASE = '/api/luminarias';
   ```

---

## 📝 Checklist de Verificación

- [ ] **Demo standalone funciona** (`luminarias-demo.html`)
- [ ] **Notificación animada aparece correctamente**
- [ ] **Sonido de recompensa se reproduce**
- [ ] **Balance se actualiza en el header**
- [ ] **Cálculo de Luminarias es correcto**
- [ ] **Multiplicadores por modo funcionan**
- [ ] **Bonus por partida perfecta se aplica**
- [ ] **Bonus por victoria en duelo se aplica**
- [ ] **Rango está entre 5-50 Luminarias**

---

## 🚀 Siguiente Paso: Integrar en un Juego Real

Una vez que hayas probado la demo y estés satisfecho:

1. **Elige un modo de juego** para integrar primero (recomiendo `game-classic.html`)
2. **Sigue la guía** en `LUMINARIAS_EXAMPLE_INTEGRATION.md`
3. **Añade el script** y el código de recompensa
4. **Prueba en tu entorno** de Render
5. **Verifica** que todo funciona correctamente
6. **Repite** para los demás modos de juego

---

## 📞 Contacto

Si encuentras problemas o tienes preguntas:
- Revisa los logs de la consola del navegador
- Verifica que el backend en Render está activo
- Consulta `LUMINARIAS_INTEGRATION_GUIDE.md`

---

**¡El sistema está listo para usar!** 🎉
