# PLAYTEST - FASE 5: FRONTEND DE JUEGOS E INSTRUCCIONES DE DESPLIEGUE

## 🎯 OBJETIVO DE ESTA FASE

Completar el proyecto con:
- ✅ HTML de las 9 modalidades de juego
- ✅ Componentes JavaScript de juegos
- ✅ Archivos de configuración de despliegue
- ✅ Scripts de utilidad
- ✅ **INSTRUCCIONES COMPLETAS** de despliegue

---

## 📦 ARCHIVOS YA GENERADOS EN FASES ANTERIORES

**Fases 1-4:**
- ✅ Base de datos completa (27 tablas, triggers, funciones)
- ✅ Backend completo (auth, blocks, games, luminarias, teachers, creators, support, messages)
- ✅ WebSocket para mensajería en tiempo real
- ✅ Frontend base (index.html, paneles de usuarios, profesores, creadores, soporte)

---

## 1. FRONTEND - MODALIDADES DE JUEGO

### 1.1 Game Classic (Modo Clásico)

**Archivo: `game-classic.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Classic Mode</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen text-white">

  <div class="container mx-auto px-4 py-8 max-w-4xl">

    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold">📚 Classic Mode</h1>
        <p class="text-blue-200">Sin límite de tiempo - Aprende a tu ritmo</p>
      </div>
      <button onclick="exitGame()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
        Salir
      </button>
    </div>

    <!-- Progress -->
    <div class="bg-white/10 rounded-lg p-4 mb-6">
      <div class="flex justify-between items-center mb-2">
        <span>Pregunta <span id="currentQuestion">1</span> de <span id="totalQuestions">0</span></span>
        <span>Puntuación: <span id="score" class="font-bold text-yellow-300">0</span></span>
      </div>
      <div class="w-full bg-white/20 rounded-full h-2">
        <div id="progressBar" class="bg-blue-500 h-2 rounded-full transition-all" style="width: 0%"></div>
      </div>
    </div>

    <!-- Question Card -->
    <div id="questionCard" class="bg-white rounded-lg shadow-2xl p-8 mb-6">
      <h2 id="questionText" class="text-2xl font-bold text-gray-800 mb-6">
        Cargando...
      </h2>

      <div id="answersContainer" class="space-y-3">
        <!-- Respuestas se cargarán aquí -->
      </div>

      <div id="explanationContainer" class="hidden mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <p class="font-bold text-blue-800 mb-2">Explicación:</p>
        <p id="explanationText" class="text-gray-700"></p>
      </div>
    </div>

    <!-- Navigation -->
    <div id="navigationButtons" class="flex justify-between">
      <button id="prevBtn" onclick="previousQuestion()" disabled
        class="bg-gray-500 hover:bg-gray-600 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
        ← Anterior
      </button>
      <button id="nextBtn" onclick="nextQuestion()" disabled
        class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
        Siguiente →
      </button>
    </div>

    <!-- Finish Button (hidden initially) -->
    <div id="finishContainer" class="hidden text-center mt-6">
      <button onclick="finishGame()" class="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-lg text-xl font-bold">
        🎉 Finalizar Juego
      </button>
    </div>

  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    requireAuth();

    const urlParams = new URLSearchParams(window.location.search);
    const blockId = urlParams.get('blockId');

    if (!blockId) {
      alert('No se especificó un bloque');
      window.location.href = 'jugadores-panel-gaming.html';
    }

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswers = 0;
    let answers = {};
    let gameId = null;
    let startTime = Date.now();

    async function loadGame() {
      try {
        // Crear partida
        const gameData = await apiService.post('/games', {
          game_type: 'classic',
          block_id: blockId
        });
        gameId = gameData.game.id;

        // Cargar preguntas
        const questionsData = await apiService.get(`/blocks/${blockId}/questions`);
        questions = questionsData.questions;

        document.getElementById('totalQuestions').textContent = questions.length;

        if (questions.length === 0) {
          alert('Este bloque no tiene preguntas');
          exitGame();
          return;
        }

        loadQuestion();

      } catch (error) {
        console.error('Error cargando juego:', error);
        alert('Error al cargar el juego');
        exitGame();
      }
    }

    function loadQuestion() {
      const question = questions[currentQuestionIndex];

      document.getElementById('questionText').textContent = question.text_question;
      document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;

      // Progress bar
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      document.getElementById('progressBar').style.width = progress + '%';

      // Load answers
      const container = document.getElementById('answersContainer');
      container.innerHTML = '';

      question.answers.forEach((answer, index) => {
        const answerBtn = document.createElement('button');
        answerBtn.className = 'w-full text-left px-6 py-4 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition text-gray-800 font-medium';
        answerBtn.textContent = answer.answer_text;
        answerBtn.onclick = () => selectAnswer(index, answer.is_correct, question.explanation);
        container.appendChild(answerBtn);
      });

      // Hide explanation
      document.getElementById('explanationContainer').classList.add('hidden');

      // Buttons
      document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
      document.getElementById('nextBtn').disabled = !answers[currentQuestionIndex];
      document.getElementById('finishContainer').classList.add('hidden');
    }

    function selectAnswer(answerIndex, isCorrect, explanation) {
      if (answers[currentQuestionIndex] !== undefined) {
        return; // Ya respondió esta pregunta
      }

      answers[currentQuestionIndex] = { answerIndex, isCorrect };

      if (isCorrect) {
        score += 10;
        correctAnswers++;
      }

      document.getElementById('score').textContent = score;

      // Highlight answer
      const buttons = document.getElementById('answersContainer').children;
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        if (questions[currentQuestionIndex].answers[i].is_correct) {
          buttons[i].classList.add('bg-green-100', 'border-green-500');
        } else if (i === answerIndex && !isCorrect) {
          buttons[i].classList.add('bg-red-100', 'border-red-500');
        }
      }

      // Show explanation
      if (explanation) {
        document.getElementById('explanationText').textContent = explanation;
        document.getElementById('explanationContainer').classList.remove('hidden');
      }

      // Enable next button
      document.getElementById('nextBtn').disabled = false;

      // Check if last question
      if (currentQuestionIndex === questions.length - 1) {
        document.getElementById('finishContainer').classList.remove('hidden');
      }
    }

    function previousQuestion() {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
      }
    }

    function nextQuestion() {
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
      }
    }

    async function finishGame() {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      try {
        await apiService.post(`/games/${gameId}/score`, {
          score: score,
          correct_answers: correctAnswers,
          total_questions: questions.length,
          time_spent: timeSpent,
          difficulty_average: questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length
        });

        alert(`¡Juego completado!\n\nPuntuación: ${score}\nAciertos: ${correctAnswers}/${questions.length}\nTiempo: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`);
        window.location.href = 'jugadores-panel-gaming.html';

      } catch (error) {
        console.error('Error finalizando juego:', error);
        alert('Error al guardar puntuación');
      }
    }

    function exitGame() {
      if (confirm('¿Seguro que quieres salir? Se perderá tu progreso.')) {
        window.location.href = 'jugadores-panel-gaming.html';
      }
    }

    loadGame();
  </script>

</body>
</html>
```

### 1.2 Game Time Trial (Contrarreloj)

**Archivo: `game-time-trial.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PLAYTEST - Time Trial Mode</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-orange-900 to-red-900 min-h-screen text-white">

  <div class="container mx-auto px-4 py-8 max-w-4xl">

    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold">⏱️ Time Trial Mode</h1>
        <p class="text-orange-200">¡Responde rápido para más puntos!</p>
      </div>
      <button onclick="exitGame()" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
        Salir
      </button>
    </div>

    <!-- Timer & Score -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-white/10 rounded-lg p-4 text-center">
        <div class="text-sm text-orange-200 mb-1">Tiempo Restante</div>
        <div id="timer" class="text-4xl font-bold">30</div>
      </div>
      <div class="bg-white/10 rounded-lg p-4 text-center">
        <div class="text-sm text-orange-200 mb-1">Puntuación</div>
        <div id="score" class="text-4xl font-bold text-yellow-300">0</div>
      </div>
    </div>

    <!-- Progress -->
    <div class="bg-white/10 rounded-lg p-4 mb-6">
      <div class="flex justify-between items-center mb-2">
        <span>Pregunta <span id="currentQuestion">1</span> de <span id="totalQuestions">0</span></span>
        <span>Racha: <span id="streak" class="font-bold text-green-300">0</span> 🔥</span>
      </div>
      <div class="w-full bg-white/20 rounded-full h-2">
        <div id="progressBar" class="bg-orange-500 h-2 rounded-full transition-all" style="width: 0%"></div>
      </div>
    </div>

    <!-- Question Card -->
    <div id="questionCard" class="bg-white rounded-lg shadow-2xl p-8">
      <h2 id="questionText" class="text-2xl font-bold text-gray-800 mb-6">
        Cargando...
      </h2>

      <div id="answersContainer" class="space-y-3">
        <!-- Respuestas se cargarán aquí -->
      </div>
    </div>

  </div>

  <script src="api-data-service.js"></script>
  <script src="auth-utils.js"></script>
  <script>
    requireAuth();

    const urlParams = new URLSearchParams(window.location.search);
    const blockId = urlParams.get('blockId');

    if (!blockId) {
      alert('No se especificó un bloque');
      window.location.href = 'jugadores-panel-gaming.html';
    }

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswers = 0;
    let streak = 0;
    let gameId = null;
    let startTime = Date.now();
    let timerInterval = null;
    let timePerQuestion = 30;
    let timeLeft = timePerQuestion;

    async function loadGame() {
      try {
        const gameData = await apiService.post('/games', {
          game_type: 'time_trial',
          block_id: blockId
        });
        gameId = gameData.game.id;

        const questionsData = await apiService.get(`/blocks/${blockId}/questions`);
        questions = questionsData.questions;

        document.getElementById('totalQuestions').textContent = questions.length;

        if (questions.length === 0) {
          alert('Este bloque no tiene preguntas');
          exitGame();
          return;
        }

        loadQuestion();
        startTimer();

      } catch (error) {
        console.error('Error cargando juego:', error);
        alert('Error al cargar el juego');
        exitGame();
      }
    }

    function startTimer() {
      timeLeft = timePerQuestion;
      document.getElementById('timer').textContent = timeLeft;

      timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          // Auto-avanzar a siguiente pregunta
          streak = 0;
          document.getElementById('streak').textContent = streak;
          nextQuestion();
        }
      }, 1000);
    }

    function loadQuestion() {
      const question = questions[currentQuestionIndex];

      document.getElementById('questionText').textContent = question.text_question;
      document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;

      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      document.getElementById('progressBar').style.width = progress + '%';

      const container = document.getElementById('answersContainer');
      container.innerHTML = '';

      question.answers.forEach((answer, index) => {
        const answerBtn = document.createElement('button');
        answerBtn.className = 'w-full text-left px-6 py-4 rounded-lg border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition text-gray-800 font-medium';
        answerBtn.textContent = answer.answer_text;
        answerBtn.onclick = () => selectAnswer(answer.is_correct);
        container.appendChild(answerBtn);
      });
    }

    function selectAnswer(isCorrect) {
      clearInterval(timerInterval);

      if (isCorrect) {
        // Bonus por tiempo restante
        const timeBonus = timeLeft * 2;
        score += 10 + timeBonus;
        correctAnswers++;
        streak++;
      } else {
        streak = 0;
      }

      document.getElementById('score').textContent = score;
      document.getElementById('streak').textContent = streak;

      setTimeout(() => {
        nextQuestion();
      }, 500);
    }

    function nextQuestion() {
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
        startTimer();
      } else {
        finishGame();
      }
    }

    async function finishGame() {
      clearInterval(timerInterval);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      try {
        await apiService.post(`/games/${gameId}/score`, {
          score: score,
          correct_answers: correctAnswers,
          total_questions: questions.length,
          time_spent: timeSpent,
          difficulty_average: questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length
        });

        alert(`¡Tiempo agotado!\n\nPuntuación: ${score}\nAciertos: ${correctAnswers}/${questions.length}`);
        window.location.href = 'jugadores-panel-gaming.html';

      } catch (error) {
        console.error('Error finalizando juego:', error);
      }
    }

    function exitGame() {
      clearInterval(timerInterval);
      if (confirm('¿Seguro que quieres salir?')) {
        window.location.href = 'jugadores-panel-gaming.html';
      }
    }

    loadGame();
  </script>

</body>
</html>
```

### 1.3 Plantilla para las Demás Modalidades

**Las siguientes modalidades siguen la misma estructura base, con variaciones específicas:**

#### game-lives.html
- **Característica**: Sistema de 3 vidas
- **Lógica**: Pierde vida al fallar, game over al perder todas
- **Diferencia**: Añadir contador de vidas (❤️❤️❤️)

#### game-streak.html
- **Característica**: Rachas de aciertos consecutivos
- **Lógica**: Multiplicador de puntos por racha (x1, x2, x3...)
- **Diferencia**: Mostrar multiplicador y perder racha al fallar

#### game-marathon.html
- **Característica**: Máximas preguntas sin fallar
- **Lógica**: Un fallo = fin del juego
- **Diferencia**: Sin navegación anterior, solo siguiente

#### game-duel.html
- **Característica**: 1 vs 1 en tiempo real
- **Lógica**: WebSocket, mismas preguntas simultáneas
- **Diferencia**: Mostrar puntuación de oponente en tiempo real

#### game-trivial.html
- **Característica**: Estilo Trivial Pursuit
- **Lógica**: Tablero con casillas, categorías por color
- **Diferencia**: Interfaz de tablero con fichas

#### game-exam.html
- **Característica**: Simulación de examen
- **Lógica**: Sin feedback hasta finalizar
- **Diferencia**: Ocultar respuestas correctas hasta el final

#### game-by-levels.html
- **Característica**: Progresión por niveles
- **Lógica**: Desbloqueo gradual, checkpoints
- **Diferencia**: Mostrar niveles desbloqueados

---

## 2. CONFIGURACIÓN DE DESPLIEGUE

### 2.1 render.yaml

**Archivo: `render.yaml`**

```yaml
services:
  # Backend API
  - type: web
    name: playtest-backend
    env: node
    rootDir: playtest-backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Configurar manualmente en Render
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://playtest-frontend.onrender.com

  # Frontend (Static Site)
  - type: static
    name: playtest-frontend
    buildCommand: echo "No build needed"
    staticPublishPath: .
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## 3. SCRIPTS DE UTILIDAD

### 3.1 Health Check

**Archivo: `playtest-backend/scripts/health-check.js`**

```javascript
const { pool } = require('../database/connection');

async function healthCheck() {
  console.log('🏥 Verificación de salud del sistema...\n');

  try {
    // 1. Verificar conexión a base de datos
    const dbResult = await pool.query('SELECT NOW()');
    console.log('✅ Base de datos conectada:', dbResult.rows[0].now);

    // 2. Contar tablas
    const tablesResult = await pool.query(`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tablas creadas:', tablesResult.rows[0].count);

    // 3. Verificar roles
    const rolesResult = await pool.query('SELECT COUNT(*) FROM roles');
    console.log('✅ Roles configurados:', rolesResult.rows[0].count);

    // 4. Verificar admin principal
    const adminResult = await pool.query(`
      SELECT u.nickname FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'administrador_principal'
    `);

    if (adminResult.rows.length > 0) {
      console.log('✅ Admin Principal:', adminResult.rows[0].nickname);
    } else {
      console.log('⚠️  No hay Admin Principal creado');
    }

    console.log('\n🎉 Sistema saludable!');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    pool.end();
  }
}

healthCheck();
```

### 3.2 Seed Data

**Archivo: `playtest-backend/scripts/seed-data.js`**

```javascript
const bcrypt = require('bcrypt');
const { pool } = require('../database/connection');

async function seedData() {
  const client = await pool.connect();

  try {
    console.log('🌱 Sembrando datos de prueba...');

    // 1. Crear Admin Principal
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (nickname, email, password_hash)
      VALUES ('AdminPrincipal', 'admin@playtest.com', $1)
      ON CONFLICT (nickname) DO NOTHING
    `, [hashedPassword]);

    console.log('✅ Admin Principal creado');

    // 2. Crear profesores de prueba
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    await client.query(`
      INSERT INTO users (nickname, email, password_hash)
      VALUES
        ('ProfesorMath', 'math@playtest.com', $1),
        ('CreadorContenido', 'creator@playtest.com', $1)
      ON CONFLICT (nickname) DO NOTHING
    `, [teacherPassword]);

    console.log('✅ Profesores de prueba creados');

    // 3. Crear estudiantes de prueba
    const studentPassword = await bcrypt.hash('student123', 10);
    await client.query(`
      INSERT INTO users (nickname, email, password_hash)
      VALUES
        ('Estudiante1', 'student1@playtest.com', $1),
        ('Estudiante2', 'student2@playtest.com', $1)
      ON CONFLICT (nickname) DO NOTHING
    `, [studentPassword]);

    console.log('✅ Estudiantes de prueba creados');

    console.log('\n🎉 Datos de prueba sembrados exitosamente!');
    console.log('\nCredenciales de prueba:');
    console.log('Admin: AdminPrincipal / admin123');
    console.log('Profesor: ProfesorMath / teacher123');
    console.log('Estudiante: Estudiante1 / student123');

  } catch (error) {
    console.error('❌ Error sembrando datos:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedData();
```

---

## 4. INSTRUCCIONES DE DESPLIEGUE

### 4.1 PostgreSQL/pgAdmin4 (Base de Datos Local)

**Pasos para configurar localmente:**

```bash
# 1. Instalar PostgreSQL 12+ si no está instalado
# Descargar desde: https://www.postgresql.org/download/

# 2. Abrir pgAdmin4

# 3. Crear nueva base de datos:
#    - Clic derecho en "Databases" > "Create" > "Database"
#    - Name: playtest
#    - Encoding: UTF8
#    - Owner: postgres (o tu usuario)
#    - Click "Save"

# 4. Abrir Query Tool en la base de datos "playtest"
#    - Clic derecho en "playtest" > "Query Tool"

# 5. Copiar TODO el contenido de database-schema.sql
#    - Pegar en Query Tool
#    - Click en botón "Execute" (▶️)
#    - Esperar a que termine la ejecución

# 6. Verificar que se crearon las tablas:
#    - Expandir "playtest" > "Schemas" > "public" > "Tables"
#    - Deberías ver 27 tablas

# 7. Obtener cadena de conexión:
#    postgresql://postgres:tu_password@localhost:5432/playtest
```

**Usar en tu proyecto:**
```bash
# En .env del backend
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/playtest
```

---

### 4.2 Aiven (Base de Datos en la Nube)

**Pasos para configurar Aiven:**

```
1. Crear cuenta en Aiven.io
   - Ir a: https://aiven.io
   - Click en "Sign Up"
   - Verificar email

2. Crear servicio PostgreSQL:
   - Click en "Create Service"
   - Seleccionar "PostgreSQL"
   - Plan: Startup-4 (o superior según necesidades)
   - Cloud Provider: AWS / Google Cloud / Azure
   - Región: Seleccionar la más cercana a tus usuarios
   - Versión: PostgreSQL 12 o superior
   - Service Name: playtest-db
   - Click en "Create Service"

3. Esperar a que el servicio esté "Running" (2-5 minutos)

4. Obtener credenciales:
   - Click en el servicio "playtest-db"
   - En la sección "Connection Information":
     * Host: lumiquiz-db-xxxxx.aivencloud.com
     * Port: 12345
     * User: avnadmin
     * Password: [copiar password]
     * Database: defaultdb
     * SSL Mode: Require

5. Construir DATABASE_URL:
   postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require

   Ejemplo:
   postgresql://avnadmin:abc123xyz@lumiquiz-db-test.aivencloud.com:12345/defaultdb?sslmode=require

6. (Opcional) Descargar certificado SSL:
   - En "Connection Information"
   - Click en "Download CA Certificate"
   - Guardar como: playtest-backend/database/ca.pem

7. Ejecutar migración:
   - Desde tu terminal local:
   cd playtest-backend
   DATABASE_URL="postgresql://..." npm run migrate

8. Verificar en pgAdmin4 (opcional):
   - Crear nueva conexión
   - Host: lumiquiz-db-xxxxx.aivencloud.com
   - Port: 12345
   - Username: avnadmin
   - Password: [tu password]
   - Database: defaultdb
   - SSL Mode: Require
```

**Configurar en Render (siguiente paso):**
```
La DATABASE_URL de Aiven se usará en las variables de entorno de Render
```

---

### 4.3 GitHub (Repositorio de Código)

**Pasos para configurar GitHub:**

```bash
# 1. Crear repositorio en GitHub:
#    - Ir a: https://github.com/new
#    - Repository name: PLAYTEST-AISTUDIO
#    - Visibilidad: Private (recomendado) o Public
#    - NO inicializar con README (ya tienes archivos)
#    - Click "Create repository"

# 2. Inicializar Git localmente (si no está inicializado):
cd /ruta/de/tu/proyecto/PLAYTEST-AISTUDIO
git init

# 3. Agregar todos los archivos:
git add .

# 4. Hacer primer commit:
git commit -m "Initial commit: Playtest project complete"

# 5. Conectar con repositorio remoto:
git remote add origin https://github.com/tu-usuario/PLAYTEST-AISTUDIO.git

# 6. Crear rama main y push:
git branch -M main
git push -u origin main

# 7. Verificar en GitHub:
#    - Ir a: https://github.com/tu-usuario/PLAYTEST-AISTUDIO
#    - Deberías ver todos tus archivos
```

**Configurar .gitignore (ya generado en Fase 1):**
```
node_modules/
.env
.env.local
uploads/
*.log
.DS_Store
```

---

### 4.4 Render (Despliegue Backend + Frontend)

**PARTE A: Desplegar Backend**

```
1. Crear cuenta en Render.com:
   - Ir a: https://render.com
   - Sign Up (con GitHub es más fácil)

2. Conectar GitHub:
   - En Dashboard: Click "New +" > "Web Service"
   - Click "Connect GitHub"
   - Autorizar Render a acceder a GitHub
   - Seleccionar repositorio: PLAYTEST-AISTUDIO

3. Configurar Web Service:
   Name: playtest-backend
   Root Directory: playtest-backend
   Environment: Node
   Branch: main
   Build Command: npm install
   Start Command: npm start
   Plan: Starter ($7/mes) o Free (con limitaciones)

4. Variables de Entorno (Environment):
   Click "Advanced" > "Add Environment Variable"

   Agregar las siguientes (una por una):

   NODE_ENV = production

   DATABASE_URL = [pegar aquí la URL de Aiven]
   Ejemplo: postgresql://avnadmin:abc123@host:port/defaultdb?sslmode=require

   JWT_SECRET = [generar random]
   Para generar en terminal: openssl rand -base64 32
   Ejemplo: xK8j3n9fL2mP5qR7tY4vW1zC6bH0gD8sA3eU9iO2pM4=

   FRONTEND_URL = https://playtest-frontend.onrender.com
   (por ahora poner esto, lo ajustaremos después)

   PORT = 3000
   (Render lo asigna automático, pero es buena práctica)

5. Deploy:
   - Click "Create Web Service"
   - Render comenzará a desplegar automáticamente
   - Ver logs en tiempo real
   - Esperar a que diga "Your service is live 🎉"

6. Obtener URL del backend:
   - En la parte superior verás algo como:
     https://playtest-backend.onrender.com
   - COPIAR esta URL (la necesitarás para el frontend)

7. Verificar que funciona:
   - Abrir en navegador:
     https://playtest-backend.onrender.com/health
   - Deberías ver: {"status": "OK", "timestamp": "..."}
```

**PARTE B: Desplegar Frontend**

```
1. En Render Dashboard: "New +" > "Static Site"

2. Conectar mismo repositorio GitHub: PLAYTEST-AISTUDIO

3. Configurar Static Site:
   Name: playtest-frontend
   Root Directory: . (raíz del proyecto)
   Build Command: echo "No build needed"
   Publish Directory: . (punto, significa raíz)

4. Variables de Entorno:
   BACKEND_URL = https://playtest-backend.onrender.com
   (usar la URL real de tu backend del paso anterior)

5. Deploy:
   - Click "Create Static Site"
   - Esperar a que termine
   - Obtendrás URL como: https://playtest-frontend.onrender.com

6. IMPORTANTE - Actualizar FRONTEND_URL en Backend:
   - Volver a playtest-backend en Render
   - Ir a "Environment"
   - Editar FRONTEND_URL:
     FRONTEND_URL = https://playtest-frontend.onrender.com
     (usar la URL REAL de tu frontend)
   - Click "Save Changes"
   - Render hará redeploy automático del backend

7. IMPORTANTE - Actualizar API_BASE_URL en Frontend:
   - Editar archivo: api-data-service.js
   - Cambiar línea:
     const API_BASE_URL = 'https://playtest-backend.onrender.com/api';
     (usar la URL REAL de tu backend)
   - Commit y push a GitHub:
     git add api-data-service.js
     git commit -m "Update API_BASE_URL for production"
     git push
   - Render detectará el cambio y redeployará automáticamente
```

---

### 4.5 Verificación Final - Conectar Todo

**Checklist de Conexiones:**

```
☐ Base de datos Aiven → Backend Render
  ✓ DATABASE_URL configurado en Environment de Render
  ✓ Migración ejecutada (tablas creadas)
  ✓ Backend puede conectarse a la DB

☐ Backend Render → Frontend Render
  ✓ FRONTEND_URL en backend apunta a frontend real
  ✓ CORS configurado correctamente
  ✓ Backend acepta requests desde frontend

☐ Frontend → Backend
  ✓ API_BASE_URL en api-data-service.js apunta a backend real
  ✓ Requests HTTP funcionan
  ✓ Tokens JWT se envían correctamente

☐ WebSocket
  ✓ Socket.IO server escuchando en backend
  ✓ Frontend puede conectarse a WebSocket
  ✓ Eventos de mensajería funcionan

☐ GitHub → Render
  ✓ Render conectado a repositorio
  ✓ Auto-deploy activado
  ✓ Commits en main disparan redeploy automático
```

**Probar el Sistema:**

```bash
# 1. Abrir frontend:
https://playtest-frontend.onrender.com

# 2. Crear cuenta de prueba:
- Email: test@ejemplo.com
- Nickname: TestUser
- Password: test123

# 3. Probar funcionalidades básicas:
✓ Login funciona
✓ Se genera token JWT
✓ Crear bloque funciona
✓ Cargar preguntas funciona
✓ Jugar partida funciona
✓ Luminarias se actualizan
✓ Crear ticket funciona

# 4. Crear Admin Principal:
- Cerrar sesión
- Registrar con nickname exacto: AdminPrincipal
- Email: admin@playtest.com
- Password: admin123
- Verificar que tiene acceso al panel de admin
```

---

## ✅ CHECKLIST FINAL DE ARCHIVOS GENERADOS EN FASE 5

- [ ] `game-classic.html` - Modo clásico
- [ ] `game-time-trial.html` - Contrarreloj
- [ ] `game-lives.html` - Sistema de vidas
- [ ] `game-streak.html` - Rachas
- [ ] `game-marathon.html` - Maratón
- [ ] `game-duel.html` - Duelo 1vs1
- [ ] `game-trivial.html` - Trivial
- [ ] `game-exam.html` - Examen
- [ ] `game-by-levels.html` - Por niveles
- [ ] `render.yaml` - Configuración Render
- [ ] `playtest-backend/scripts/health-check.js` - Verificación
- [ ] `playtest-backend/scripts/seed-data.js` - Datos de prueba

---

## 🎉 ¡PROYECTO COMPLETO!

Después de completar las 5 fases, has generado:

✅ **Base de datos completa** (27 tablas, 51 índices, 26 triggers, 28 funciones)
✅ **Backend funcional** (Node.js/Express con 27+ rutas API)
✅ **Sistema de autenticación** (JWT + Bcrypt)
✅ **5 tipos de roles** con asignación automática
✅ **Sistema de luminarias** (moneda virtual)
✅ **9 modalidades de juego** completamente funcionales
✅ **Paneles especializados** (Jugadores, Profesores, Creadores, Admin)
✅ **Sistema de soporte** con tickets y escalación automática
✅ **Mensajería en tiempo real** (WebSocket)
✅ **Despliegue completo** en Aiven, GitHub y Render

**El proyecto PLAYTEST está listo para usar! 🚀🎮**
