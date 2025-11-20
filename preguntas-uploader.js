/**
 * MÓDULO: Carga y Gestión de Preguntas
 * Funcionalidad completa para subir archivos de preguntas
 * Compatible con el Panel de Profesor - Oposiciones
 */

// Helper function to get authentication token
function getTokenPreguntas() {
    return localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

const PreguntasUploader = {
    API_URL: 'https://playtest-backend.onrender.com/api',

    // Estado del uploader
    currentBloqueId: null,
    currentTemaId: null,
    fileQueue: [],
    selectedBatchFiles: new Set(),
    reviewedQuestions: [],
    excludedIndices: new Set(),
    editingIndex: null,
    isLoading: false,
    isBatchMode: false,

    /**
     * Parsear preguntas desde texto de archivo
     *
     * Soporta DOS formatos:
     *
     * FORMATO 1 (Separador ##):
     * Pregunta##Respuesta A##@@Respuesta Correcta##Respuesta C##Respuesta D
     * Siguiente línea: Explicación (opcional)
     *
     * FORMATO 2 (Numerado con letras):
     * ¿Pregunta?
     * A) Respuesta 1
     * B) Respuesta 2
     * C) Respuesta 3
     * D) Respuesta 4
     * Correct: C (o Correcta: C)
     * Explicación (opcional)
     */
    parseQuestionsFromFile(text, tema) {
        if (!tema || tema.trim() === '') {
            throw new Error('El tema es obligatorio para parsear preguntas');
        }

        const cleanTema = tema.trim();
        console.log(`📝 Parseando preguntas con tema: "${cleanTema}"`);

        const questions = [];
        const lines = text.replace(/\r\n/g, '\n').split('\n');
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            // FORMATO 1: Pregunta##Respuesta##@@Correcta##Respuesta
            if (line.includes('##')) {
                const parts = line.split('##');
                const questionText = parts[0].trim();
                const answerParts = parts.slice(1);

                if (!questionText || answerParts.length < 2) {
                    i++;
                    continue;
                }

                const respuestas = answerParts.map(answerText => {
                    const trimmedText = answerText.trim();
                    return {
                        textoRespuesta: trimmedText.startsWith('@@') ? trimmedText.substring(2).trim() : trimmedText,
                        esCorrecta: trimmedText.startsWith('@@')
                    };
                });

                // Validar que hay exactamente una respuesta correcta
                if (respuestas.filter(r => r.esCorrecta).length !== 1) {
                    console.warn(`⚠️ Pregunta sin respuesta correcta única: "${questionText.substring(0, 50)}..."`);
                    i++;
                    continue;
                }

                // Buscar explicación en la siguiente línea
                let explicacionRespuesta = "";
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine.length > 0 && !nextLine.includes('##')) {
                        explicacionRespuesta = nextLine;
                        i++;
                    }
                }

                questions.push({
                    textoPregunta: questionText,
                    dificultad: 1,
                    respuestas: respuestas,
                    explicacionRespuesta: explicacionRespuesta,
                    tema: cleanTema
                });
            }
            // FORMATO 2: Pregunta con respuestas A), B), C), D)
            else if (line.length > 0 && !line.match(/^[A-Za-z]\)/)) {
                // Esta es una pregunta potencial
                const questionText = line;
                const answers = [];
                let j = i + 1;
                let correctLetter = null;
                let explicacion = "";

                // Recoger respuestas A), B), C), D), etc.
                const answerPattern = /^([A-Za-z])\)\s*(.+)$/;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();

                    // Verificar si es una respuesta con formato A), B), etc.
                    const answerMatch = nextLine.match(answerPattern);
                    if (answerMatch) {
                        const letter = answerMatch[1].toUpperCase();
                        const answerText = answerMatch[2].trim();
                        answers.push({ letter, text: answerText });
                        j++;
                    }
                    // Verificar si indica la respuesta correcta
                    else if (nextLine.match(/^(Correct|Correcta|Respuesta correcta):\s*([A-Za-z])/i)) {
                        const match = nextLine.match(/^(Correct|Correcta|Respuesta correcta):\s*([A-Za-z])/i);
                        correctLetter = match[2].toUpperCase();
                        j++;

                        // La siguiente línea podría ser la explicación
                        if (j < lines.length) {
                            const explLine = lines[j].trim();
                            if (explLine.length > 0 && !explLine.match(answerPattern) && !explLine.match(/^(Correct|Correcta)/i)) {
                                explicacion = explLine;
                                j++;
                            }
                        }
                        break;
                    }
                    // Línea vacía o fin de pregunta
                    else if (nextLine.length === 0) {
                        j++;
                        break;
                    }
                    else {
                        break;
                    }
                }

                // Validar que tenemos al menos 2 respuestas y una letra correcta
                if (answers.length >= 2 && correctLetter) {
                    const respuestas = answers.map(ans => ({
                        textoRespuesta: ans.text,
                        esCorrecta: ans.letter === correctLetter
                    }));

                    // Validar que la letra correcta existe en las respuestas
                    if (respuestas.some(r => r.esCorrecta)) {
                        questions.push({
                            textoPregunta: questionText,
                            dificultad: 1,
                            respuestas: respuestas,
                            explicacionRespuesta: explicacion,
                            tema: cleanTema
                        });
                        i = j;
                        continue;
                    } else {
                        console.warn(`⚠️ Letra correcta ${correctLetter} no coincide con las respuestas: "${questionText.substring(0, 50)}..."`);
                    }
                }
            }
            i++;
        }

        console.log(`✅ Parseadas ${questions.length} preguntas`);
        return questions;
    },

    /**
     * Abrir modal de carga de preguntas
     */
    openModal(bloqueId, bloqueName, temas = []) {
        this.currentBloqueId = bloqueId;
        this.resetState();

        // Actualizar título del modal
        const titleEl = document.getElementById('modal-preguntas-title');
        if (titleEl) {
            titleEl.textContent = `📤 Cargar Preguntas - ${bloqueName}`;
        }

        // Poblar selector de temas con los temas recibidos
        const select = document.getElementById('select-tema-preguntas');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar tema...</option>' +
                temas.map(t => `<option value="${t.id}" data-nombre="${t.nombre}">${t.nombre}</option>`).join('');
        }

        // Mostrar modal
        const modal = document.getElementById('modal-cargar-preguntas');
        if (modal) modal.classList.add('active');
    },

    /**
     * Cerrar modal
     */
    closeModal() {
        const modal = document.getElementById('modal-cargar-preguntas');
        if (modal) modal.classList.remove('active');
        this.resetState();
    },

    /**
     * Resetear estado completo
     */
    resetState() {
        this.fileQueue = [];
        this.selectedBatchFiles = new Set();
        this.reviewedQuestions = [];
        this.excludedIndices = new Set();
        this.editingIndex = null;
        this.isLoading = false;
        this.isBatchMode = false;

        // Limpiar inputs
        const fileInput = document.getElementById('preguntas-file-input');
        const folderInput = document.getElementById('preguntas-folder-input');
        const temaSelect = document.getElementById('select-tema-preguntas');

        if (fileInput) fileInput.value = '';
        if (folderInput) folderInput.value = '';
        if (temaSelect) temaSelect.value = '';

        // Mostrar vista inicial
        this.renderInitialView();
    },

    /**
     * Manejar selección de archivo individual
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.isBatchMode = false;
        const select = document.getElementById('select-tema-preguntas');
        const temaOption = select.selectedOptions[0];

        if (!temaOption || !temaOption.value) {
            alert('Por favor, selecciona un tema primero');
            event.target.value = '';
            return;
        }

        const temaNombre = temaOption.dataset.nombre || temaOption.textContent;
        this.currentTemaId = temaOption.value;

        this.processFile(file, temaNombre);
        event.target.value = '';
    },

    /**
     * Manejar selección de carpeta (batch)
     */
    handleFolderSelect(event) {
        if (!event.target.files) return;

        this.resetState();
        this.isBatchMode = true;

        const files = Array.from(event.target.files);
        const fileRegex = /^([^_]+)_([^_\.]+)\.txt$/i;

        const newQueue = files.map(file => {
            const match = file.name.match(fileRegex);
            if (match) {
                const blockName = match[1].replace(/-/g, ' ').trim();
                const topicName = match[2].replace(/-/g, ' ').trim();

                if (!blockName || !topicName) {
                    console.warn(`⚠️ Archivo con formato inválido: ${file.name}`);
                    return null;
                }

                console.log(`📂 Archivo detectado: ${file.name} -> Bloque: "${blockName}", Tema: "${topicName}"`);
                return { file, blockName, topicName };
            }
            console.warn(`⚠️ Archivo "${file.name}" no coincide con formato "Bloque_Tema.txt"`);
            return null;
        }).filter(Boolean);

        if (newQueue.length > 0) {
            this.fileQueue = newQueue;
            this.renderBatchFileList();
        } else {
            alert('No se encontraron archivos con el formato correcto.\nFormato esperado: Bloque_Tema.txt');
        }

        event.target.value = '';
    },

    /**
     * Procesar archivo individual
     */
    async processFile(file, temaNombre) {
        this.isLoading = true;
        this.updateStatus('Procesando archivo...');

        try {
            const text = await file.text();
            if (!text) throw new Error('El archivo está vacío');

            const parsedQuestions = this.parseQuestionsFromFile(text, temaNombre);

            if (parsedQuestions.length === 0) {
                throw new Error('No se encontraron preguntas válidas en el archivo');
            }

            this.reviewedQuestions = parsedQuestions;
            this.renderReviewView();
            this.updateStatus(`✅ ${parsedQuestions.length} preguntas cargadas`, 'success');

        } catch (error) {
            console.error('Error procesando archivo:', error);
            this.updateStatus(`❌ ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Procesar archivos seleccionados en batch
     */
    async processSelectedBatchFiles() {
        if (this.selectedBatchFiles.size === 0) {
            alert('Selecciona al menos un archivo');
            return;
        }

        this.isLoading = true;
        let allQuestions = [];

        const filesToProcess = this.fileQueue.filter(f => this.selectedBatchFiles.has(f.file.name));
        const totalFiles = filesToProcess.length;
        let currentFile = 0;

        try {
            for (const fileInfo of filesToProcess) {
                currentFile++;
                this.updateStatus(`Procesando ${currentFile}/${totalFiles}: ${fileInfo.file.name}`);

                const text = await fileInfo.file.text();
                if (!text) continue;

                const parsedQuestions = this.parseQuestionsFromFile(text, fileInfo.topicName)
                    .map(q => ({
                        ...q,
                        blockName: fileInfo.blockName
                    }));

                console.log(`✅ ${fileInfo.file.name}: ${parsedQuestions.length} preguntas`);
                allQuestions.push(...parsedQuestions);
            }

            if (allQuestions.length === 0) {
                throw new Error('No se encontraron preguntas válidas');
            }

            this.reviewedQuestions = allQuestions;
            this.renderReviewView();
            this.updateStatus(`✅ ${allQuestions.length} preguntas de ${totalFiles} archivos`, 'success');

        } catch (error) {
            console.error('Error procesando archivos:', error);
            this.updateStatus(`❌ ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Guardar todas las preguntas
     */
    async saveAllQuestions() {
        const questionsToSave = this.reviewedQuestions.filter((_, index) => !this.excludedIndices.has(index));

        if (questionsToSave.length === 0) {
            alert('No hay preguntas para guardar');
            return;
        }

        this.isLoading = true;
        this.updateStatus('Guardando preguntas...');

        try {
            if (this.isBatchMode) {
                // Agrupar por bloque
                const questionsByBlock = questionsToSave.reduce((acc, q) => {
                    const blockKey = q.blockName.toLowerCase();
                    if (!acc[blockKey]) acc[blockKey] = { originalName: q.blockName, questions: [] };
                    acc[blockKey].questions.push(q);
                    return acc;
                }, {});

                const blockKeys = Object.keys(questionsByBlock);
                let currentBlock = 0;

                for (const blockKey of blockKeys) {
                    currentBlock++;
                    const { originalName, questions } = questionsByBlock[blockKey];
                    this.updateStatus(`Guardando bloque ${currentBlock}/${blockKeys.length}: ${originalName}`);

                    // Crear bloque si no existe y guardar preguntas
                    await this.saveQuestionsToBlock(originalName, questions);
                }
            } else {
                // Modo individual - guardar al bloque actual
                await this.saveQuestionsToBlockById(this.currentBloqueId, questionsToSave);
            }

            this.updateStatus(`✅ ${questionsToSave.length} preguntas guardadas correctamente`, 'success');

            // Cerrar modal y recargar bloques después de un momento
            setTimeout(() => {
                this.closeModal();
                if (typeof BloquesManager !== 'undefined' && BloquesManager.oposicionActual) {
                    BloquesManager.cargarBloques(BloquesManager.oposicionActual);
                }
            }, 1500);

        } catch (error) {
            console.error('Error guardando preguntas:', error);
            this.updateStatus(`❌ ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Guardar preguntas a un bloque por ID
     */
    async saveQuestionsToBlockById(bloqueId, questions) {
        const formattedQuestions = questions.map(q => ({
            textoPregunta: q.textoPregunta,
            tema: q.tema,
            respuestas: q.respuestas,
            difficulty: q.dificultad || 1,
            explicacionRespuesta: q.explicacionRespuesta || null
        }));

        const response = await fetch(`${this.API_URL}/blocks/${bloqueId}/questions/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getTokenPreguntas()}`
            },
            body: JSON.stringify({ questions: formattedQuestions })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error guardando preguntas');
        }

        return await response.json();
    },

    /**
     * Guardar preguntas a un bloque (crearlo si no existe)
     */
    async saveQuestionsToBlock(blockName, questions) {
        // Primero intentar encontrar el bloque existente
        // Por ahora, crear nuevo bloque para cada batch
        const blockData = {
            name: blockName,
            description: `Bloque ${blockName}`,
            isPublic: true
        };

        // Crear bloque
        const createResponse = await fetch(`${this.API_URL}/blocks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getTokenPreguntas()}`
            },
            body: JSON.stringify(blockData)
        });

        if (!createResponse.ok) {
            throw new Error('Error creando bloque');
        }

        const createdBlock = await createResponse.json();
        const bloqueId = createdBlock.block?.id || createdBlock.id;

        // Guardar preguntas
        await this.saveQuestionsToBlockById(bloqueId, questions);
    },

    /**
     * Toggle selección de archivo en batch
     */
    toggleBatchFileSelection(fileName) {
        if (this.selectedBatchFiles.has(fileName)) {
            this.selectedBatchFiles.delete(fileName);
        } else {
            this.selectedBatchFiles.add(fileName);
        }
        this.renderBatchFileList();
    },

    /**
     * Seleccionar/deseleccionar todos los archivos
     */
    toggleSelectAll() {
        if (this.selectedBatchFiles.size === this.fileQueue.length) {
            this.selectedBatchFiles.clear();
        } else {
            this.fileQueue.forEach(f => this.selectedBatchFiles.add(f.file.name));
        }
        this.renderBatchFileList();
    },

    /**
     * Toggle exclusión de pregunta
     */
    toggleExclude(index) {
        if (this.excludedIndices.has(index)) {
            this.excludedIndices.delete(index);
        } else {
            this.excludedIndices.add(index);
        }
        this.renderReviewView();
    },

    /**
     * Iniciar edición de pregunta
     */
    editQuestion(index) {
        this.editingIndex = index;
        this.renderReviewView();
    },

    /**
     * Cancelar edición
     */
    cancelEdit() {
        this.editingIndex = null;
        this.renderReviewView();
    },

    /**
     * Guardar edición de pregunta
     */
    saveEdit(index) {
        const questionTextEl = document.getElementById(`edit-question-text-${index}`);
        const difficultyEl = document.getElementById(`edit-difficulty-${index}`);
        const explanationEl = document.getElementById(`edit-explanation-${index}`);

        if (questionTextEl) {
            this.reviewedQuestions[index].textoPregunta = questionTextEl.value;
        }
        if (difficultyEl) {
            this.reviewedQuestions[index].dificultad = parseInt(difficultyEl.value);
        }
        if (explanationEl) {
            this.reviewedQuestions[index].explicacionRespuesta = explanationEl.value;
        }

        // Actualizar respuestas
        for (let i = 0; i < this.reviewedQuestions[index].respuestas.length; i++) {
            const answerEl = document.getElementById(`edit-answer-${index}-${i}`);
            const correctEl = document.getElementById(`edit-correct-${index}-${i}`);

            if (answerEl) {
                this.reviewedQuestions[index].respuestas[i].textoRespuesta = answerEl.value;
            }
            if (correctEl) {
                this.reviewedQuestions[index].respuestas[i].esCorrecta = correctEl.checked;
            }
        }

        this.editingIndex = null;
        this.renderReviewView();
    },

    /**
     * Actualizar estado visual
     */
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('preguntas-upload-status');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = 'upload-status';

        if (type === 'success') {
            statusEl.style.color = '#10B981';
        } else if (type === 'error') {
            statusEl.style.color = '#EF4444';
        } else {
            statusEl.style.color = '#778DA9';
        }
    },

    /**
     * Renderizar vista inicial
     */
    renderInitialView() {
        const container = document.getElementById('preguntas-upload-content');
        if (!container) return;

        container.innerHTML = `
            <!-- Carga Individual -->
            <div class="upload-section">
                <h4 style="color: #E0E1DD; margin-bottom: 15px;">📄 Carga Individual</h4>

                <div class="form-group">
                    <label class="form-label">Tema *</label>
                    <select id="select-tema-preguntas" class="form-input">
                        <option value="">Seleccionar tema...</option>
                    </select>
                </div>

                <div class="file-drop-zone" onclick="document.getElementById('preguntas-file-input').click()">
                    <div style="font-size: 32px; margin-bottom: 10px;">📄</div>
                    <p style="color: #E0E1DD; font-weight: 600;">Seleccionar archivo</p>
                    <p style="font-size: 12px; color: #778DA9;">Formato .txt</p>
                </div>
                <input type="file" id="preguntas-file-input" accept=".txt" style="display: none;" onchange="PreguntasUploader.handleFileSelect(event)">
            </div>

            <div style="text-align: center; padding: 15px; color: #778DA9;">— o —</div>

            <!-- Carga Múltiple -->
            <div class="upload-section">
                <h4 style="color: #E0E1DD; margin-bottom: 15px;">📁 Carga Múltiple (Carpeta)</h4>

                <div class="file-drop-zone" onclick="document.getElementById('preguntas-folder-input').click()">
                    <div style="font-size: 32px; margin-bottom: 10px;">📁</div>
                    <p style="color: #E0E1DD; font-weight: 600;">Seleccionar carpeta</p>
                    <p style="font-size: 12px; color: #778DA9;">Formato: Bloque_Tema.txt</p>
                </div>
                <input type="file" id="preguntas-folder-input" webkitdirectory directory style="display: none;" onchange="PreguntasUploader.handleFolderSelect(event)">
            </div>

            <!-- Guía de formato -->
            <div style="background: rgba(65, 90, 119, 0.2); padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h5 style="color: #60A5FA; margin-bottom: 10px;">📋 Formatos soportados</h5>

                <!-- Formato 1 -->
                <div style="margin-bottom: 15px;">
                    <h6 style="color: #E0E1DD; margin-bottom: 8px; font-size: 14px;">Formato 1 - Separador ##</h6>
                    <ul style="font-size: 13px; color: #778DA9; padding-left: 20px; line-height: 1.8;">
                        <li>Cada pregunta y sus respuestas separadas por <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">##</code></li>
                        <li>Marca la respuesta correcta con <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">@@</code></li>
                        <li>La explicación va en la línea siguiente (opcional)</li>
                    </ul>
                    <div style="background: #0D1B2A; padding: 10px; border-radius: 6px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #E0E1DD;">
                        Pregunta##Respuesta A##@@Respuesta B##Respuesta C##Respuesta D<br>
                        Esta es la explicación de la pregunta
                    </div>
                </div>

                <!-- Formato 2 -->
                <div>
                    <h6 style="color: #E0E1DD; margin-bottom: 8px; font-size: 14px;">Formato 2 - Numerado con letras</h6>
                    <ul style="font-size: 13px; color: #778DA9; padding-left: 20px; line-height: 1.8;">
                        <li>Pregunta en la primera línea</li>
                        <li>Respuestas con formato <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">A)</code>, <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">B)</code>, <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">C)</code>, <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">D)</code></li>
                        <li>Línea <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">Correct: X</code> o <code style="background: #0D1B2A; padding: 2px 6px; border-radius: 4px;">Correcta: X</code></li>
                        <li>Explicación en línea siguiente (opcional)</li>
                    </ul>
                    <div style="background: #0D1B2A; padding: 10px; border-radius: 6px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #E0E1DD;">
                        ¿Cuál es la capital de Francia?<br>
                        A) Londres<br>
                        B) Berlín<br>
                        C) París<br>
                        D) Madrid<br>
                        Correct: C<br>
                        París es la capital y mayor ciudad de Francia.
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar lista de archivos batch
     */
    renderBatchFileList() {
        const container = document.getElementById('preguntas-upload-content');
        if (!container) return;

        const allSelected = this.selectedBatchFiles.size === this.fileQueue.length;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #E0E1DD; margin: 0;">📁 Archivos detectados (${this.fileQueue.length})</h4>
                <button class="btn btn-secondary btn-sm" onclick="PreguntasUploader.resetState()">
                    ← Volver
                </button>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #E0E1DD;">
                    <input type="checkbox" ${allSelected ? 'checked' : ''} onchange="PreguntasUploader.toggleSelectAll()">
                    Seleccionar todos
                </label>
            </div>

            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
                ${this.fileQueue.map((fileInfo, index) => `
                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(13, 27, 42, 0.5); border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        <input type="checkbox"
                               ${this.selectedBatchFiles.has(fileInfo.file.name) ? 'checked' : ''}
                               onchange="PreguntasUploader.toggleBatchFileSelection('${fileInfo.file.name}')">
                        <div style="flex: 1;">
                            <div style="color: #E0E1DD; font-size: 14px;">${fileInfo.file.name}</div>
                            <div style="font-size: 12px; color: #778DA9;">
                                Bloque: ${fileInfo.blockName} | Tema: ${fileInfo.topicName}
                            </div>
                        </div>
                    </label>
                `).join('')}
            </div>

            <button class="btn btn-primary" style="width: 100%;"
                    onclick="PreguntasUploader.processSelectedBatchFiles()"
                    ${this.selectedBatchFiles.size === 0 || this.isLoading ? 'disabled' : ''}>
                ${this.isLoading ? 'Procesando...' : `Cargar ${this.selectedBatchFiles.size} archivo(s)`}
            </button>
        `;
    },

    /**
     * Renderizar vista de revisión de preguntas
     */
    renderReviewView() {
        const container = document.getElementById('preguntas-upload-content');
        if (!container) return;

        const activeCount = this.reviewedQuestions.length - this.excludedIndices.size;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #E0E1DD; margin: 0;">📝 Revisar preguntas (${activeCount}/${this.reviewedQuestions.length})</h4>
                <button class="btn btn-secondary btn-sm" onclick="PreguntasUploader.resetState()">
                    ← Volver
                </button>
            </div>

            <div style="max-height: 400px; overflow-y: auto; margin-bottom: 15px;">
                ${this.reviewedQuestions.map((q, index) => this.editingIndex === index
                    ? this.renderEditForm(q, index)
                    : this.renderQuestionCard(q, index)
                ).join('')}
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-danger" onclick="PreguntasUploader.resetState()" ${this.isLoading ? 'disabled' : ''}>
                    🗑️ Descartar
                </button>
                <button class="btn btn-success" onclick="PreguntasUploader.saveAllQuestions()"
                        ${this.isLoading || activeCount === 0 ? 'disabled' : ''}>
                    ${this.isLoading ? 'Guardando...' : `💾 Guardar ${activeCount} preguntas`}
                </button>
            </div>
        `;
    },

    /**
     * Renderizar tarjeta de pregunta
     */
    renderQuestionCard(question, index) {
        const isExcluded = this.excludedIndices.has(index);

        return `
            <div style="background: ${isExcluded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(13, 27, 42, 0.5)'};
                        padding: 15px; border-radius: 8px; margin-bottom: 10px;
                        opacity: ${isExcluded ? '0.5' : '1'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <span style="color: #60A5FA; font-weight: 600;">${index + 1}.</span>
                        <span style="color: #E0E1DD;"> ${question.textoPregunta}</span>
                        ${question.blockName ? `
                            <div style="font-size: 11px; color: #778DA9; margin-top: 4px;">
                                Bloque: ${question.blockName} | Tema: ${question.tema}
                            </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 10px;">
                        <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #778DA9; cursor: pointer;">
                            <input type="checkbox" ${isExcluded ? 'checked' : ''} onchange="PreguntasUploader.toggleExclude(${index})">
                            Excluir
                        </label>
                        <button class="btn btn-secondary btn-sm" onclick="PreguntasUploader.editQuestion(${index})" style="padding: 4px 8px; font-size: 11px;">
                            ✏️
                        </button>
                    </div>
                </div>

                <div style="padding-left: 20px;">
                    ${question.respuestas.map(r => `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 13px;">
                            <span style="color: ${r.esCorrecta ? '#10B981' : '#778DA9'};">
                                ${r.esCorrecta ? '✓' : '○'}
                            </span>
                            <span style="color: ${r.esCorrecta ? '#10B981' : '#E0E1DD'};">
                                ${r.textoRespuesta}
                            </span>
                        </div>
                    `).join('')}

                    ${question.explicacionRespuesta ? `
                        <div style="font-size: 12px; color: #778DA9; font-style: italic; margin-top: 8px; padding-left: 20px; border-left: 2px solid #415A77;">
                            <strong>Explicación:</strong> ${question.explicacionRespuesta}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Renderizar formulario de edición
     */
    renderEditForm(question, index) {
        return `
            <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 2px solid #3B82F6;">
                <div class="form-group">
                    <label class="form-label">Pregunta</label>
                    <textarea id="edit-question-text-${index}" class="form-input" rows="2">${question.textoPregunta}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Respuestas (marca la correcta)</label>
                    ${question.respuestas.map((r, i) => `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <input type="radio" name="correct-${index}" id="edit-correct-${index}-${i}" ${r.esCorrecta ? 'checked' : ''}>
                            <input type="text" id="edit-answer-${index}-${i}" class="form-input" value="${r.textoRespuesta}" style="flex: 1;">
                        </div>
                    `).join('')}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label">Dificultad</label>
                        <select id="edit-difficulty-${index}" class="form-input">
                            <option value="1" ${question.dificultad === 1 ? 'selected' : ''}>1 - Muy fácil</option>
                            <option value="2" ${question.dificultad === 2 ? 'selected' : ''}>2 - Fácil</option>
                            <option value="3" ${question.dificultad === 3 ? 'selected' : ''}>3 - Media</option>
                            <option value="4" ${question.dificultad === 4 ? 'selected' : ''}>4 - Difícil</option>
                            <option value="5" ${question.dificultad === 5 ? 'selected' : ''}>5 - Muy difícil</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Explicación</label>
                    <textarea id="edit-explanation-${index}" class="form-input" rows="2">${question.explicacionRespuesta || ''}</textarea>
                </div>

                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-secondary btn-sm" onclick="PreguntasUploader.cancelEdit()">Cancelar</button>
                    <button class="btn btn-success btn-sm" onclick="PreguntasUploader.saveEdit(${index})">Guardar</button>
                </div>
            </div>
        `;
    }
};

// Exportar para uso global
window.PreguntasUploader = PreguntasUploader;
