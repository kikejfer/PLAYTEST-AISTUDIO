/**
 * PRACTICA ADAPTATIVA MANAGER
 * Sistema de práctica adaptativo que prioriza preguntas según dominio
 */

// Helper function to get authentication token
function getToken() {
    return localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

const PracticaAdaptativaManager = {
    oposicion: null,
    cronograma: null,
    bloqueSeleccionado: null,
    bloquesDisponibles: [],
    preguntasActuales: [],
    sesionActual: {
        indiceActual: 0,
        respuestas: [],
        startTime: null
    },

    /**
     * Renderizar interfaz de práctica
     */
    render(oposicionData, cronogramaData, bloqueIdPreseleccionado = null) {
        this.oposicion = oposicionData;
        this.cronograma = cronogramaData;

        const container = document.getElementById('practica-container');

        if (!cronogramaData || !cronogramaData.bloques_cronograma) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        // Filtrar bloques habilitados
        this.bloquesDisponibles = cronogramaData.bloques_cronograma.filter(b => b.habilitado && !b.completado);

        if (this.bloquesDisponibles.length === 0) {
            container.innerHTML = this.renderNoBloques();
            return;
        }

        // Si hay un bloque preseleccionado, cargarlo
        if (bloqueIdPreseleccionado) {
            const bloque = this.bloquesDisponibles.find(b => b.bloque_id === bloqueIdPreseleccionado);
            if (bloque) {
                this.seleccionarBloque(bloque.bloque_id);
                return;
            }
        }

        // Mostrar selector de bloques
        container.innerHTML = this.renderSelectorBloques();
    },

    /**
     * Renderizar selector de bloques
     */
    renderSelectorBloques() {
        const bloquesHTML = this.bloquesDisponibles.map(bloque => {
            const progreso = bloque.porcentaje_progreso || 0;
            let progressClass = 'low';
            if (progreso >= 70) progressClass = 'high';
            else if (progreso >= 30) progressClass = 'medium';

            return `
                <div class="card" style="cursor: pointer; transition: all 0.3s;"
                     onclick="PracticaAdaptativaManager.seleccionarBloque(${bloque.bloque_id})"
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 40px rgba(0, 212, 255, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.3)'">

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: #00D4FF;">${bloque.bloque_nombre}</h3>
                        <span class="bloque-status enabled">🔓 Habilitado</span>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-size: 14px; color: #778DA9;">Progreso</span>
                            <span style="font-size: 14px; color: #E0E1DD; font-weight: 600;">
                                ${bloque.preguntas_dominadas || 0} / ${bloque.total_preguntas_bloque || 0} preguntas
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progressClass}" style="width: ${progreso}%">
                                ${progreso.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <button class="btn" style="width: 100%;">
                        ✍️ Comenzar Práctica
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div class="card">
                <h2>✍️ Selecciona un Bloque para Practicar</h2>
                <p style="color: #778DA9; margin-bottom: 30px;">
                    El sistema adaptativo priorizará las preguntas que más necesitas repasar
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${bloquesHTML}
                </div>
            </div>

            <div class="card">
                <h3>💡 Sistema Adaptativo</h3>
                <p style="color: #E0E1DD; line-height: 1.6; margin-bottom: 15px;">
                    Nuestro sistema adapta las preguntas según tu rendimiento:
                </p>
                <ul style="color: #778DA9; line-height: 1.8; padding-left: 20px;">
                    <li><strong style="color: #FF6B6B;">40%</strong> - Preguntas que has fallado (< 40% acierto)</li>
                    <li><strong style="color: #00D4FF;">30%</strong> - Preguntas nuevas (no practicadas)</li>
                    <li><strong style="color: #FFC107;">20%</strong> - Preguntas en aprendizaje (40-79% acierto)</li>
                    <li><strong style="color: #28A745;">10%</strong> - Preguntas dominadas (≥ 80% acierto) para repaso</li>
                </ul>
            </div>
        `;
    },

    /**
     * Seleccionar bloque y cargar preguntas
     */
    async seleccionarBloque(bloqueId) {
        const container = document.getElementById('practica-container');
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Preparando sesión de práctica...</p></div>';

        try {
            this.bloqueSeleccionado = this.bloquesDisponibles.find(b => b.bloque_id === bloqueId);

            // Obtener preguntas del bloque con su estado de dominio
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/oposiciones/bloques/${bloqueId}/preguntas-adaptativas`,
                {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Error al cargar preguntas');
            }

            const data = await response.json();
            this.preguntasActuales = data.preguntas || [];

            if (this.preguntasActuales.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❓</div>
                        <h3>No hay preguntas disponibles</h3>
                        <p>Este bloque aún no tiene preguntas asignadas</p>
                        <button class="btn" onclick="PracticaAdaptativaManager.render(currentOposicion, currentCronograma)">
                            ← Volver
                        </button>
                    </div>
                `;
                return;
            }

            // Iniciar sesión
            this.iniciarSesion();

        } catch (error) {
            console.error('Error al cargar preguntas:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <h3>Error al cargar preguntas</h3>
                    <p>${error.message}</p>
                    <button class="btn" onclick="PracticaAdaptativaManager.render(currentOposicion, currentCronograma)">
                        ← Volver
                    </button>
                </div>
            `;
        }
    },

    /**
     * Iniciar sesión de práctica
     */
    iniciarSesion() {
        this.sesionActual = {
            indiceActual: 0,
            respuestas: [],
            startTime: new Date()
        };

        // Mostrar pantalla de configuración
        const container = document.getElementById('practica-container');
        container.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 0 auto;">
                <h2>🎯 Configurar Sesión de Práctica</h2>
                <p style="color: #E0E1DD; margin-bottom: 30px;">
                    Bloque seleccionado: <strong style="color: #00D4FF;">${this.bloqueSeleccionado.bloque_nombre}</strong>
                </p>

                <div class="oposicion-info">
                    <div class="info-item">
                        <div class="label">Preguntas Disponibles</div>
                        <div class="value">${this.preguntasActuales.length}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Tu Progreso</div>
                        <div class="value">${(this.bloqueSeleccionado.porcentaje_progreso || 0).toFixed(1)}%</div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Número de preguntas en esta sesión</label>
                    <select id="num-preguntas" class="form-group input" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid #415A77; border-radius: 8px; color: #E0E1DD; font-size: 16px;">
                        <option value="10">10 preguntas (Rápido)</option>
                        <option value="20" selected>20 preguntas (Recomendado)</option>
                        <option value="30">30 preguntas (Intensivo)</option>
                        <option value="${this.preguntasActuales.length}">Todas (${this.preguntasActuales.length} preguntas)</option>
                    </select>
                </div>

                <button class="btn" style="width: 100%; margin-top: 20px;" onclick="PracticaAdaptativaManager.comenzarPractica()">
                    🚀 Comenzar Práctica
                </button>

                <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" onclick="PracticaAdaptativaManager.render(currentOposicion, currentCronograma)">
                    ← Volver
                </button>
            </div>
        `;
    },

    /**
     * Comenzar práctica con algoritmo adaptativo
     */
    comenzarPractica() {
        const numPreguntas = parseInt(document.getElementById('num-preguntas').value);

        // Aplicar algoritmo adaptativo para seleccionar preguntas
        const preguntasSeleccionadas = this.seleccionarPreguntasAdaptativas(numPreguntas);

        if (preguntasSeleccionadas.length === 0) {
            alert('No hay suficientes preguntas para practicar');
            return;
        }

        this.preguntasActuales = preguntasSeleccionadas;
        this.sesionActual.indiceActual = 0;
        this.sesionActual.respuestas = [];

        this.mostrarPregunta();
    },

    /**
     * Seleccionar preguntas usando algoritmo adaptativo
     * 40% falladas, 30% nuevas, 20% aprendizaje, 10% dominadas
     */
    seleccionarPreguntasAdaptativas(cantidad) {
        // Clasificar preguntas por dominio
        const falladas = [];      // < 40% acierto
        const nuevas = [];        // sin intentos
        const aprendizaje = [];   // 40-79% acierto
        const dominadas = [];     // >= 80% acierto

        this.preguntasActuales.forEach(p => {
            const dominio = p.porcentaje_acierto || 0;
            const intentos = p.intentos_totales || 0;

            if (intentos === 0) {
                nuevas.push(p);
            } else if (dominio < 40) {
                falladas.push(p);
            } else if (dominio < 80) {
                aprendizaje.push(p);
            } else {
                dominadas.push(p);
            }
        });

        // Calcular cantidad por categoría
        const cantFalladas = Math.ceil(cantidad * 0.4);
        const cantNuevas = Math.ceil(cantidad * 0.3);
        const cantAprendizaje = Math.ceil(cantidad * 0.2);
        const cantDominadas = Math.ceil(cantidad * 0.1);

        // Seleccionar preguntas
        const seleccionadas = [];

        // Mezclar cada categoría antes de seleccionar
        const shuffleFalladas = this.shuffle([...falladas]);
        const shuffleNuevas = this.shuffle([...nuevas]);
        const shuffleAprendizaje = this.shuffle([...aprendizaje]);
        const shuffleDominadas = this.shuffle([...dominadas]);

        seleccionadas.push(...shuffleFalladas.slice(0, cantFalladas));
        seleccionadas.push(...shuffleNuevas.slice(0, cantNuevas));
        seleccionadas.push(...shuffleAprendizaje.slice(0, cantAprendizaje));
        seleccionadas.push(...shuffleDominadas.slice(0, cantDominadas));

        // Si no llegamos a la cantidad, completar con cualquier pregunta
        if (seleccionadas.length < cantidad) {
            const restantes = this.preguntasActuales.filter(p => !seleccionadas.includes(p));
            const shuffleRestantes = this.shuffle(restantes);
            seleccionadas.push(...shuffleRestantes.slice(0, cantidad - seleccionadas.length));
        }

        // Mezclar orden final
        return this.shuffle(seleccionadas).slice(0, cantidad);
    },

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * Mostrar pregunta actual
     */
    mostrarPregunta() {
        const pregunta = this.preguntasActuales[this.sesionActual.indiceActual];
        const container = document.getElementById('practica-container');

        const progreso = ((this.sesionActual.indiceActual + 1) / this.preguntasActuales.length) * 100;

        container.innerHTML = `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">Pregunta ${this.sesionActual.indiceActual + 1} de ${this.preguntasActuales.length}</h2>
                    <span class="bloque-status enabled">${this.bloqueSeleccionado.bloque_nombre}</span>
                </div>

                <div class="progress-bar" style="margin-bottom: 30px;">
                    <div class="progress-fill" style="width: ${progreso}%">
                        ${progreso.toFixed(0)}%
                    </div>
                </div>

                <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; border-left: 4px solid #00D4FF; margin-bottom: 30px;">
                    <p style="color: #E0E1DD; font-size: 18px; line-height: 1.6; margin: 0;">
                        ${pregunta.question_text}
                    </p>
                </div>

                <div id="opciones-container" style="display: grid; gap: 15px;">
                    ${this.renderOpciones(pregunta)}
                </div>

                <div style="margin-top: 30px; display: flex; gap: 15px;">
                    <button class="btn btn-secondary" onclick="PracticaAdaptativaManager.abandonarSesion()">
                        ❌ Abandonar Sesión
                    </button>
                    <button class="btn" id="btn-confirmar" onclick="PracticaAdaptativaManager.confirmarRespuesta()" disabled style="flex: 1;">
                        ✓ Confirmar Respuesta
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar opciones de respuesta
     */
    renderOpciones(pregunta) {
        const opciones = [
            { id: 'a', texto: pregunta.option_a },
            { id: 'b', texto: pregunta.option_b },
            { id: 'c', texto: pregunta.option_c },
            { id: 'd', texto: pregunta.option_d }
        ].filter(op => op.texto && op.texto.trim() !== '');

        return opciones.map(opcion => `
            <div class="opcion-respuesta" onclick="PracticaAdaptativaManager.seleccionarOpcion('${opcion.id}')"
                 data-opcion="${opcion.id}"
                 style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid #415A77; border-radius: 12px; cursor: pointer; transition: all 0.3s;">
                <span style="display: inline-block; width: 35px; height: 35px; background: #415A77; border-radius: 50%; text-align: center; line-height: 35px; margin-right: 15px; font-weight: bold;">
                    ${opcion.id.toUpperCase()}
                </span>
                <span style="color: #E0E1DD; font-size: 16px;">
                    ${opcion.texto}
                </span>
            </div>
        `).join('');
    },

    /**
     * Seleccionar opción
     */
    seleccionarOpcion(opcionId) {
        // Remover selección anterior
        document.querySelectorAll('.opcion-respuesta').forEach(el => {
            el.style.border = '2px solid #415A77';
            el.style.background = 'rgba(255, 255, 255, 0.05)';
        });

        // Marcar nueva selección
        const opcion = document.querySelector(`[data-opcion="${opcionId}"]`);
        opcion.style.border = '2px solid #00D4FF';
        opcion.style.background = 'rgba(0, 212, 255, 0.1)';

        // Habilitar botón confirmar
        document.getElementById('btn-confirmar').disabled = false;

        // Guardar selección temporal
        this.sesionActual.opcionSeleccionada = opcionId;
    },

    /**
     * Confirmar respuesta
     */
    async confirmarRespuesta() {
        if (!this.sesionActual.opcionSeleccionada) return;

        const pregunta = this.preguntasActuales[this.sesionActual.indiceActual];
        const opcionCorrecta = pregunta.correct_answer.toLowerCase();
        const opcionSeleccionada = this.sesionActual.opcionSeleccionada;
        const esCorrecta = opcionSeleccionada === opcionCorrecta;

        // Guardar respuesta
        this.sesionActual.respuestas.push({
            pregunta_id: pregunta.id,
            respuesta: opcionSeleccionada,
            correcta: esCorrecta,
            tiempo_respuesta: (new Date() - this.sesionActual.startTime) / 1000
        });

        // Registrar en base de datos
        try {
            await fetch('https://playtest-backend.onrender.com/api/students/registrar-respuesta', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pregunta_id: pregunta.id,
                    oposicion_id: this.oposicion.id,
                    tema_id: pregunta.tema_id,
                    respuesta: opcionSeleccionada,
                    correcta: esCorrecta
                })
            });
        } catch (error) {
            console.error('Error al registrar respuesta:', error);
        }

        // Mostrar feedback
        this.mostrarFeedback(pregunta, opcionSeleccionada, esCorrecta);
    },

    /**
     * Mostrar feedback de respuesta
     */
    mostrarFeedback(pregunta, opcionSeleccionada, esCorrecta) {
        const opcionCorrecta = pregunta.correct_answer.toLowerCase();

        // Colorear opciones
        document.querySelectorAll('.opcion-respuesta').forEach(el => {
            el.style.pointerEvents = 'none';
            const opcionId = el.getAttribute('data-opcion');

            if (opcionId === opcionCorrecta) {
                el.style.border = '2px solid #28A745';
                el.style.background = 'rgba(40, 167, 69, 0.2)';
            } else if (opcionId === opcionSeleccionada && !esCorrecta) {
                el.style.border = '2px solid #DC3545';
                el.style.background = 'rgba(220, 53, 69, 0.2)';
            }
        });

        // Mostrar mensaje
        const feedbackHTML = `
            <div style="margin-top: 20px; padding: 20px; border-radius: 12px; border-left: 4px solid ${esCorrecta ? '#28A745' : '#DC3545'}; background: ${esCorrecta ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'};">
                <h3 style="color: ${esCorrecta ? '#28A745' : '#DC3545'}; margin-bottom: 10px;">
                    ${esCorrecta ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                </h3>
                ${pregunta.explanation ? `
                    <p style="color: #E0E1DD; line-height: 1.6; margin: 0;">
                        <strong>Explicación:</strong> ${pregunta.explanation}
                    </p>
                ` : ''}
            </div>
        `;

        document.getElementById('opciones-container').insertAdjacentHTML('afterend', feedbackHTML);

        // Cambiar botón
        const btnContainer = document.querySelector('[style*="margin-top: 30px"]');
        const esUltima = this.sesionActual.indiceActual === this.preguntasActuales.length - 1;

        btnContainer.innerHTML = `
            <button class="btn" onclick="PracticaAdaptativaManager.${esUltima ? 'finalizarSesion' : 'siguientePregunta'}()" style="width: 100%;">
                ${esUltima ? '🎉 Ver Resultados' : '➡️ Siguiente Pregunta'}
            </button>
        `;
    },

    /**
     * Siguiente pregunta
     */
    siguientePregunta() {
        this.sesionActual.indiceActual++;
        this.sesionActual.opcionSeleccionada = null;
        this.mostrarPregunta();
    },

    /**
     * Finalizar sesión y mostrar resultados
     */
    finalizarSesion() {
        const totalPreguntas = this.sesionActual.respuestas.length;
        const correctas = this.sesionActual.respuestas.filter(r => r.correcta).length;
        const porcentaje = (correctas / totalPreguntas) * 100;

        let mensaje = '';
        let colorMensaje = '';

        if (porcentaje >= 80) {
            mensaje = '¡Excelente trabajo! 🎉';
            colorMensaje = '#28A745';
        } else if (porcentaje >= 60) {
            mensaje = '¡Buen trabajo! Sigue así 💪';
            colorMensaje = '#00D4FF';
        } else if (porcentaje >= 40) {
            mensaje = 'Sigue practicando, vas mejorando 📚';
            colorMensaje = '#FFC107';
        } else {
            mensaje = 'Necesitas más práctica. ¡No te rindas! 💪';
            colorMensaje = '#FF6B6B';
        }

        const container = document.getElementById('practica-container');
        container.innerHTML = `
            <div class="card" style="max-width: 700px; margin: 0 auto; text-align: center;">
                <h2 style="color: ${colorMensaje}; font-size: 32px; margin-bottom: 10px;">
                    ${mensaje}
                </h2>
                <p style="color: #778DA9; margin-bottom: 40px;">
                    Has completado la sesión de práctica
                </p>

                <div class="stats-grid" style="margin-bottom: 40px;">
                    <div class="stat-card">
                        <div class="stat-value" style="color: ${colorMensaje};">${porcentaje.toFixed(1)}%</div>
                        <div class="stat-label">Porcentaje Acierto</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${correctas}</div>
                        <div class="stat-label">Respuestas Correctas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalPreguntas - correctas}</div>
                        <div class="stat-label">Respuestas Incorrectas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalPreguntas}</div>
                        <div class="stat-label">Total Preguntas</div>
                    </div>
                </div>

                <div class="progress-bar" style="height: 30px; margin-bottom: 40px;">
                    <div class="progress-fill ${porcentaje >= 70 ? 'high' : porcentaje >= 40 ? 'medium' : 'low'}"
                         style="width: ${porcentaje}%; font-size: 16px;">
                        ${correctas} / ${totalPreguntas}
                    </div>
                </div>

                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn" onclick="PracticaAdaptativaManager.seleccionarBloque(${this.bloqueSeleccionado.bloque_id})">
                        🔄 Practicar Otra Vez
                    </button>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        📊 Volver al Resumen
                    </button>
                </div>
            </div>
        `;

        // Recargar cronograma en background
        if (typeof loadCronograma === 'function') {
            setTimeout(() => loadCronograma(), 1000);
        }
    },

    /**
     * Abandonar sesión
     */
    abandonarSesion() {
        if (confirm('¿Estás seguro de que quieres abandonar esta sesión?')) {
            this.render(this.oposicion, this.cronograma);
        }
    },

    /**
     * Renderizar estado vacío
     */
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">✍️</div>
                <h3>No hay datos disponibles</h3>
                <p>Inscríbete en una oposición para comenzar a practicar</p>
            </div>
        `;
    },

    /**
     * Renderizar sin bloques disponibles
     */
    renderNoBloques() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <h3>No hay bloques habilitados</h3>
                <p>Los bloques se habilitarán automáticamente según tu cronograma</p>
                <button class="btn" onclick="switchTab('cronograma')">
                    📅 Ver Mi Cronograma
                </button>
            </div>
        `;
    }
};
