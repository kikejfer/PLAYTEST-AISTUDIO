/**
 * Componente compartido para mostrar la sección "Bloques Creados"
 * Utilizable en PPF (Profesores) y PCC (Creadores de Contenido)
 */

class BloquesCreados {
    constructor(containerId, userType = 'jugadores', displayMode = 'created') {
        this.containerId = containerId;
        this.userType = userType; // 'alumnos', 'jugadores', or 'estudiantes'
        this.displayMode = displayMode; // 'created' or 'loaded'
        this.blocksData = [];
        this.currentUser = null;
        
        // Labels según el tipo de usuario
        this.labels = {
            'alumnos': 'Alumnos',
            'jugadores': 'Jugadores',
            'estudiantes': 'Estudiantes'
        };
    }

    async initialize() {
        try {
            await this.loadUserData();
            this.render();
            
            // Para 'available' mode, no cargar bloques - se va directo al editor
            if (this.displayMode !== 'available') {
                if (this.displayMode === 'loaded') {
                    await this.loadLoadedBlocks();
                } else {
                    await this.loadCreatedBlocks();
                }
            }
            
            if (this.displayMode !== 'loaded' && this.displayMode !== 'available') {
                await this.loadMetadataFilters();
            }
        } catch (error) {
            console.error('Error initializing BloquesCreados:', error);
            this.showError('Error al inicializar la sección: ' + error.message);
        }
    }

    async loadUserData() {
        try {
            const sessionData = localStorage.getItem('playtest_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                this.currentUser = {
                    id: session.userId,
                    nickname: session.nickname
                };
                console.log('Current user for BloquesCreados:', this.currentUser);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            throw new Error('Usuario no autenticado');
        }
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Container not found:', this.containerId);
            return;
        }

        container.innerHTML = `
            <div class="bloques-creados-section">
                ${this.displayMode !== 'available' ? `
                <h2 class="section-title">
                    ${this.displayMode === 'loaded' 
                        ? '<img src="./Imagenes/Cargados.png" alt="Cargados" style="height: 24px; width: 24px; display: inline-block; margin-right: 8px;"> Bloques Cargados' 
                        : '📦 Bloques Creados'
                    }
                </h2>
                ` : ''}
                
                <!-- Filtros de Metadata - Solo para bloques creados, no para cargados ni disponibles -->
                ${this.displayMode !== 'loaded' && this.displayMode !== 'available' ? `
                <div class="bc-filters">
                    <div class="bc-filter-group">
                        <label for="bc-filter-tipo-${this.containerId}">Tipo de Bloque:</label>
                        <select id="bc-filter-tipo-${this.containerId}" onchange="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.applyFilters()">
                            <option value="">Todos los tipos</option>
                        </select>
                    </div>
                    
                    <div class="bc-filter-group">
                        <label for="bc-filter-nivel-${this.containerId}">Nivel:</label>
                        <select id="bc-filter-nivel-${this.containerId}" onchange="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.applyFilters()">
                            <option value="">Todos los niveles</option>
                        </select>
                    </div>
                    
                    <div class="bc-filter-group">
                        <label for="bc-filter-caracter-${this.containerId}">Carácter:</label>
                        <select id="bc-filter-caracter-${this.containerId}" onchange="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.applyFilters()">
                            <option value="">Todos los caracteres</option>
                        </select>
                    </div>
                    
                    <button onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.clearFilters()" class="bc-clear-filters">
                        🗑️ Limpiar Filtros
                    </button>
                </div>
                ` : ''}
                
                <div id="bc-loading-${this.containerId}" class="bc-loading" style="display: none;">
                    <p>Cargando bloques...</p>
                </div>
                
                <div id="bc-error-${this.containerId}" class="bc-error" style="display: none;"></div>
                
                ${this.displayMode !== 'available' ? `
                <div id="bc-blocks-container-${this.containerId}">
                    <div id="bc-empty-state-${this.containerId}" class="bc-empty-state" style="display: none;">
                        <h3>${this.displayMode === 'loaded' ? 'No tienes bloques cargados aún' : 'No has creado ningún bloque aún'}</h3>
                        <p>${this.displayMode === 'loaded' ? 'Los bloques que cargues aparecerán aquí con estadísticas detalladas' : 'Los bloques que crees aparecerán aquí con estadísticas detalladas'}</p>
                    </div>
                    
                    <div id="bc-blocks-grid-${this.containerId}" class="bc-blocks-grid" style="display: none;"></div>
                </div>
                ` : `
                <div id="bc-blocks-container-${this.containerId}" style="display: none;">
                    <!-- Oculto para disponibles - se va directo al editor -->
                </div>
                `}
                
                <!-- Editor de Preguntas/Contenido del Bloque -->
                <div id="bc-questions-editor-${this.containerId}" class="bc-questions-editor" style="display: none;">
                    <div class="bc-editor-header">
                        <h3 id="bc-editor-title-${this.containerId}">Editor de Preguntas</h3>
                        <button onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.closeQuestionsEditor()" class="bc-btn-close">
                            ✕ Cerrar
                        </button>
                    </div>
                    
                    <div id="bc-editor-loading-${this.containerId}" class="bc-loading" style="display: none;">
                        <p>Cargando preguntas...</p>
                    </div>
                    
                    <!-- Características del Bloque -->
                    <div id="bc-block-characteristics-${this.containerId}" class="bc-block-characteristics">
                        <!-- Se cargarán las características aquí -->
                    </div>
                    
                    <div id="bc-questions-list-${this.containerId}" class="bc-questions-list">
                        <!-- Las preguntas se cargarán aquí -->
                    </div>
                </div>
            </div>

            <style>
                .bloques-creados-section {
                    background: #1E293B;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .section-title {
                    color: #3B82F6;
                    margin-bottom: 15px;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .bc-blocks-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .bc-block-card {
                    background: #0F172A;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    padding: 20px;
                    transition: all 0.3s ease;
                }

                .bc-block-card:hover {
                    border-color: #3B82F6;
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
                }

                .bc-block-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }

                .bc-block-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #E0E7FF;
                    margin: 0;
                    flex: 1;
                }

                .bc-block-status {
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    margin-left: 10px;
                }

                .bc-status-public {
                    background: #16A34A;
                    color: white;
                }

                .bc-status-private {
                    background: #DC2626;
                    color: white;
                }

                .bc-block-description {
                    color: #CBD5E1;
                    font-size: 14px;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }

                .bc-block-metadata {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 15px;
                    padding: 8px 12px;
                    background: #0F172A;
                    border: 1px solid #334155;
                    border-radius: 6px;
                }

                .bc-metadata-item {
                    font-size: 12px;
                    color: #94A3B8;
                }

                .bc-metadata-item strong {
                    color: #E0E7FF;
                    margin-right: 4px;
                }

                .bc-block-stats {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: #1E293B;
                    border-radius: 6px;
                    border: 1px solid #334155;
                }

                .bc-stat-item {
                    text-align: center;
                    flex: 1;
                }

                .bc-stat-number {
                    display: block;
                    font-size: 18px;
                    font-weight: 600;
                    color: #3B82F6;
                    margin-bottom: 2px;
                }

                .bc-stat-label {
                    font-size: 12px;
                    color: #94A3B8;
                }

                .bc-block-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .bc-action-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .bc-btn-edit {
                    background: #F59E0B;
                    color: white;
                }

                .bc-btn-edit:hover {
                    background: #D97706;
                }

                .bc-btn-view {
                    background: #3B82F6;
                    color: white;
                }

                .bc-btn-view:hover {
                    background: #2563EB;
                }

                .bc-btn-delete {
                    background: #DC2626;
                    color: white;
                }

                .bc-btn-delete:hover {
                    background: #B91C1C;
                }

                .bc-loading {
                    text-align: center;
                    padding: 40px;
                    color: #64748B;
                }

                .bc-error {
                    background: #7F1D1D;
                    color: #FECACA;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .bc-empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #64748B;
                }

                .bc-empty-state h3 {
                    color: #94A3B8;
                    margin-bottom: 10px;
                }

                .bc-empty-state p {
                    color: #64748B;
                    margin-bottom: 20px;
                }

                .bc-btn-primary {
                    background: #3B82F6;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    transition: background 0.3s ease;
                }

                .bc-btn-primary:hover {
                    background: #2563EB;
                }

                /* Estilos para filtros */
                .bc-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #0F172A;
                    border-radius: 8px;
                    border: 1px solid #334155;
                }

                .bc-filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .bc-filter-group label {
                    font-size: 12px;
                    color: #94A3B8;
                    font-weight: 500;
                }

                .bc-filter-group select {
                    background: #1E293B;
                    border: 1px solid #475569;
                    color: #E2E8F0;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.3s ease;
                }

                .bc-filter-group select:focus {
                    border-color: #3B82F6;
                }

                .bc-clear-filters {
                    background: #DC2626;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    height: fit-content;
                    margin-top: auto;
                    transition: background 0.3s ease;
                }

                .bc-clear-filters:hover {
                    background: #B91C1C;
                }
                
                .bc-clickable-title {
                    cursor: pointer;
                    transition: color 0.3s ease;
                }
                
                .bc-clickable-title:hover {
                    color: #3B82F6 !important;
                    text-decoration: underline;
                }
                
                /* Estilos del Editor de Preguntas */
                .bc-questions-editor {
                    background: #1E293B;
                    border-radius: 8px;
                    border: 1px solid #334155;
                    margin-top: 20px;
                    overflow: hidden;
                }
                
                .bc-editor-header {
                    background: #0F172A;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #334155;
                }
                
                .bc-editor-header h3 {
                    color: #3B82F6;
                    margin: 0;
                    font-size: 18px;
                }
                
                .bc-btn-close {
                    background: #DC2626;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.3s ease;
                }
                
                .bc-btn-close:hover {
                    background: #B91C1C;
                }
                
                .bc-questions-list {
                    padding: 20px;
                    max-height: 600px;
                    overflow-y: auto;
                }
                
                .bc-question-item {
                    background: #0F172A;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    font-size: 13px;
                }
                
                .bc-question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .bc-question-title {
                    color: #3B82F6;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .bc-question-meta {
                    color: #94A3B8;
                    font-weight: 400;
                    font-size: 12px;
                }
                
                .bc-question-actions {
                    display: flex;
                    gap: 5px;
                }
                
                .bc-question-text-display {
                    background: #1E293B;
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 12px;
                    color: #E2E8F0;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .bc-answers-display {
                    margin-bottom: 12px;
                }
                
                .bc-answer-display {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    margin-bottom: 6px;
                    padding: 6px;
                    background: #1E293B;
                    border-radius: 4px;
                }
                
                .bc-answer-indicator {
                    flex-shrink: 0;
                    font-weight: 600;
                    font-size: 14px;
                    margin-top: 1px;
                }
                
                .bc-answer-indicator.bc-correct {
                    color: #10B981;
                }
                
                .bc-answer-indicator.bc-incorrect {
                    color: #6B7280;
                }
                
                .bc-answer-text-display {
                    color: #E2E8F0;
                    font-size: 12px;
                    line-height: 1.3;
                }
                
                .bc-explanation-display {
                    background: #1E293B;
                    padding: 10px;
                    border-radius: 6px;
                    color: #E2E8F0;
                    font-size: 12px;
                    line-height: 1.4;
                    border-left: 3px solid #F59E0B;
                }
                
                .bc-no-answers {
                    color: #6B7280;
                    font-style: italic;
                    font-size: 12px;
                }
                
                .bc-question-text {
                    background: #1E293B;
                    border: 1px solid #475569;
                    color: #E2E8F0;
                    padding: 10px;
                    border-radius: 6px;
                    width: 100%;
                    min-height: 60px;
                    resize: vertical;
                    font-family: inherit;
                }
                
                .bc-question-text:focus {
                    outline: none;
                    border-color: #3B82F6;
                }
                
                .bc-answers-list {
                    margin-top: 10px;
                }
                
                .bc-answer-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                
                .bc-answer-checkbox {
                    width: 18px;
                    height: 18px;
                }
                
                .bc-answer-text {
                    background: #1E293B;
                    border: 1px solid #475569;
                    color: #E2E8F0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    flex: 1;
                    font-size: 13px;
                }
                
                .bc-answer-text:focus {
                    outline: none;
                    border-color: #3B82F6;
                }
                
                .bc-btn-edit, .bc-btn-save, .bc-btn-cancel {
                    background: #3B82F6;
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: background 0.3s ease;
                }
                
                .bc-btn-save {
                    background: #10B981;
                }
                
                .bc-btn-cancel {
                    background: #6B7280;
                }
                
                .bc-btn-edit:hover {
                    background: #2563EB;
                }
                
                .bc-btn-save:hover {
                    background: #059669;
                }
                
                .bc-btn-cancel:hover {
                    background: #4B5563;
                }
                
                /* Estilos para Características del Bloque */
                .bc-block-characteristics {
                    background: #0F172A;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                .bc-block-char-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #334155;
                }
                
                .bc-block-char-title {
                    color: #F59E0B;
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                
                .bc-block-char-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                .bc-block-char-left {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .bc-block-char-right {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .bc-char-field {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .bc-char-label {
                    color: #E2E8F0;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .bc-char-value {
                    color: #CBD5E1;
                    font-size: 13px;
                    background: #1E293B;
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px solid #475569;
                }
                
                .bc-char-textarea {
                    min-height: 60px;
                    resize: vertical;
                }
                
                .bc-topics-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    max-height: 120px;
                    overflow-y: auto;
                }
                
                .bc-topic-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #1E293B;
                    padding: 6px 10px;
                    border-radius: 4px;
                    border: 1px solid #475569;
                }
                
                .bc-topic-name {
                    color: #E2E8F0;
                    font-size: 12px;
                    flex: 1;
                }
                
                .bc-topic-count {
                    color: #3B82F6;
                    font-size: 11px;
                    font-weight: 600;
                    background: #1E40AF;
                    padding: 2px 6px;
                    border-radius: 3px;
                }
                
                .bc-char-edit-form {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                
                .bc-char-edit-field {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .bc-char-edit-input {
                    background: #1E293B;
                    border: 1px solid #475569;
                    color: #E2E8F0;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    outline: none;
                    transition: border-color 0.3s ease;
                }
                
                .bc-char-edit-input:focus {
                    border-color: #3B82F6;
                }
                
                .bc-char-edit-textarea {
                    min-height: 80px;
                    resize: vertical;
                    font-family: inherit;
                }
                
                .bc-char-edit-actions {
                    grid-column: 1 / -1;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 10px;
                }
            </style>
        `;
    }

    async loadCreatedBlocks() {
        this.showLoading(true);
        this.hideError();

        try {
            console.log('🔍 Loading created blocks with stats...');
            this.blocksData = await apiDataService.fetchCreatedBlocksStats();
            console.log('✅ Loaded blocks:', this.blocksData);
            console.log('🔍 First block metadata IDs:', this.blocksData[0] ? {
                tipo_id: this.blocksData[0].tipo_id,
                nivel_id: this.blocksData[0].nivel_id, 
                estado_id: this.blocksData[0].estado_id
            } : 'No blocks');
            
            this.displayBlocks();
        } catch (error) {
            console.error('❌ Error loading created blocks:', error);
            this.showError('Error al cargar los bloques: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadLoadedBlocks() {
        this.showLoading(true);
        this.hideError();

        try {
            console.log('🔍 Loading loaded blocks for user...');
            this.blocksData = await apiDataService.fetchLoadedBlocksStats();
            console.log('✅ Loaded blocks:', this.blocksData);
            
            this.displayBlocks();
        } catch (error) {
            console.error('❌ Error loading loaded blocks:', error);
            this.showError('Error al cargar los bloques cargados: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayBlocks() {
        // Para 'available' mode, no mostrar la lista de bloques - se va directo al editor
        if (this.displayMode === 'available') {
            console.log('📝 Skipping displayBlocks for available mode - goes direct to editor');
            return;
        }
        
        const blocksGrid = document.getElementById(`bc-blocks-grid-${this.containerId}`);
        const emptyState = document.getElementById(`bc-empty-state-${this.containerId}`);

        if (!blocksGrid || !emptyState) {
            console.error('❌ Required DOM elements not found for displayBlocks');
            return;
        }

        if (!this.blocksData || this.blocksData.length === 0) {
            emptyState.style.display = 'block';
            blocksGrid.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        blocksGrid.style.display = 'grid';
        
        blocksGrid.innerHTML = '';

        this.blocksData.forEach(block => {
            const blockCard = this.createBlockCard(block);
            blocksGrid.appendChild(blockCard);
        });
    }

    createBlockCard(block) {
        const card = document.createElement('div');
        card.className = 'bc-block-card';
        
        const statusClass = block.isPublic ? 'bc-status-public' : 'bc-status-private';
        const statusText = block.isPublic ? 'Público' : 'Privado';
        const userLabel = this.labels[this.userType] || 'Usuarios';
        
        // Diferentes acciones según el tipo de usuario
        const isTeacher = this.userType === 'alumnos'; // PPF (profesores)
        const isCreator = this.userType === 'jugadores'; // PCC (creadores)
        const isStudent = this.userType === 'estudiantes'; // PJG (estudiantes)
        const canEditQuestions = (isTeacher || isCreator) && this.displayMode === 'created'; // Only for created blocks
        const canViewContent = isStudent || (this.displayMode === 'loaded'); // Students can view content, and anyone can view loaded blocks
        
        card.innerHTML = `
            <div class="bc-block-header">
                <h3 class="bc-block-title ${canEditQuestions || canViewContent ? 'bc-clickable-title' : ''}" 
                    ${canEditQuestions ? `onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.loadQuestionsEditor(${block.id}, '${this.escapeHtml(block.name)}')"` : 
                      canViewContent ? `onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.loadBlockContentViewer(${block.id}, '${this.escapeHtml(block.name)}')"` : ''}>
                    ${this.escapeHtml(block.name)}
                </h3>
                <span class="bc-block-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="bc-block-description">
                ${block.description ? this.escapeHtml(block.description) : 'Sin descripción'}
            </div>
            
            ${block.metadata ? `
            <div class="bc-block-metadata">
                <span class="bc-metadata-item">
                    <strong>Tipo:</strong> ${this.escapeHtml(block.metadata.tipo)}
                </span>
                <span class="bc-metadata-item">
                    <strong>Nivel:</strong> ${this.escapeHtml(block.metadata.nivel)}
                </span>
                <span class="bc-metadata-item">
                    <strong>Estado:</strong> ${this.escapeHtml(block.metadata.estado)}
                </span>
            </div>
            ` : ''}
            
            <div class="bc-block-stats">
                <div class="bc-stat-item">
                    <span class="bc-stat-number">${block.stats?.totalTopics || 0}</span>
                    <span class="bc-stat-label">Temas</span>
                </div>
                <div class="bc-stat-item">
                    <span class="bc-stat-number">${block.stats?.totalQuestions || 0}</span>
                    <span class="bc-stat-label">Preguntas</span>
                </div>
                ${this.displayMode === 'loaded' ? `
                <div class="bc-stat-item">
                    <span class="bc-stat-number">${block.loadedAt ? new Date(block.loadedAt).toLocaleDateString('es-ES') : 'N/A'}</span>
                    <span class="bc-stat-label">Cargado</span>
                </div>
                ` : `
                <div class="bc-stat-item">
                    <span class="bc-stat-number">${block.stats?.totalUsers || 0}</span>
                    <span class="bc-stat-label">${userLabel}</span>
                </div>
                `}
            </div>
            
            <div class="bc-block-actions">
                ${this.displayMode === 'loaded' ? `
                    <button class="bc-action-btn bc-btn-delete" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.unloadBlock(${block.id}, '${this.escapeHtml(block.name)}')">Eliminar</button>
                ` : `
                    <button class="bc-action-btn bc-btn-delete" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.deleteBlock(${block.id}, '${this.escapeHtml(block.name)}')">Eliminar</button>
                `}
            </div>
        `;
        
        return card;
    }

    editBlock(blockId) {
        console.log('Editing block:', blockId);
        window.location.href = `add-question.html?blockId=${blockId}&mode=edit`;
    }

    async deleteBlock(blockId, blockName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el bloque "${blockName}"?\\n\\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            console.log('Deleting block:', blockId);
            await apiDataService.deleteBlock(blockId);
            
            // Remove from local data and refresh display
            this.blocksData = this.blocksData.filter(block => block.id !== blockId);
            this.displayBlocks();
            
            alert('Bloque eliminado correctamente');
        } catch (error) {
            console.error('Error deleting block:', error);
            alert('Error al eliminar el bloque: ' + error.message);
        }
    }

    async unloadBlock(blockId, blockName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el bloque "${blockName}" de tu lista?\n\nEsto solo lo eliminará de tus bloques cargados, el bloque original se mantendrá.`)) {
            return;
        }

        try {
            console.log('Removing block from loaded blocks:', blockId);
            await apiDataService.unloadBlockForUser(blockId);
            
            // Remove from local data and refresh display
            this.blocksData = this.blocksData.filter(block => block.id !== blockId);
            this.displayBlocks();
            
            // 🔄 También refrescar la sección "Bloques Disponibles" si existe
            console.log('🔄 [BloquesCreados] Refreshing Available Blocks after unload...');
            if (typeof refreshAvailableBlocksAfterUnload === 'function') {
                console.log('🔄 Calling refreshAvailableBlocksAfterUnload...');
                refreshAvailableBlocksAfterUnload();
            } else if (window.refreshAvailableBlocks) {
                console.log('🔄 Calling window.refreshAvailableBlocks...');
                window.refreshAvailableBlocks();
            } else {
                console.log('ℹ️ No available blocks refresh function found');
            }
            
            alert('Bloque eliminado de tu lista correctamente');
        } catch (error) {
            console.error('Error removing block from loaded blocks:', error);
            alert('Error al eliminar el bloque de tu lista: ' + error.message);
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById(`bc-loading-${this.containerId}`);
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById(`bc-error-${this.containerId}`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    hideError() {
        const errorDiv = document.getElementById(`bc-error-${this.containerId}`);
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadMetadataFilters() {
        try {
            console.log('🔍 Loading metadata for filters...');
            const metadata = await apiDataService.fetchBlockMetadata();
            console.log('✅ Loaded metadata:', metadata);
            console.log('🔍 Types:', metadata.types?.length || 0);
            console.log('🔍 Levels:', metadata.levels?.length || 0); 
            console.log('🔍 States:', metadata.states?.length || 0);
            
            // Poblar filtros
            this.populateFilterSelect(`bc-filter-tipo-${this.containerId}`, metadata.types);
            this.populateFilterSelect(`bc-filter-nivel-${this.containerId}`, metadata.levels);
            this.populateFilterSelect(`bc-filter-caracter-${this.containerId}`, metadata.states);
            
            console.log('✅ Filters populated successfully');
            
        } catch (error) {
            console.error('❌ Error loading metadata for filters:', error);
        }
    }

    populateFilterSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Limpiar opciones existentes (excepto la primera "Todos")
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Agregar nuevas opciones
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.id;
            optionElement.textContent = option.name;
            select.appendChild(optionElement);
        });
    }

    applyFilters() {
        const tipoFilter = document.getElementById(`bc-filter-tipo-${this.containerId}`)?.value;
        const nivelFilter = document.getElementById(`bc-filter-nivel-${this.containerId}`)?.value;
        const caracterFilter = document.getElementById(`bc-filter-caracter-${this.containerId}`)?.value;
        
        console.log('🔍 Applying filters:', { tipoFilter, nivelFilter, caracterFilter });
        console.log('🔍 Total blocks available for filtering:', this.blocksData?.length);
        console.log('🔍 Sample block data for filtering:', this.blocksData?.[0]);
        
        if (!this.blocksData) {
            console.log('❌ No blocks data available for filtering');
            return;
        }
        
        let filteredBlocks = [...this.blocksData];
        
        // Aplicar filtros
        if (tipoFilter) {
            console.log(`🔍 Filtering by tipo_id: ${tipoFilter}`);
            const beforeCount = filteredBlocks.length;
            filteredBlocks = filteredBlocks.filter(block => block.tipo_id == tipoFilter);
            console.log(`🔍 After tipo filter: ${beforeCount} → ${filteredBlocks.length}`);
        }
        
        if (nivelFilter) {
            console.log(`🔍 Filtering by nivel_id: ${nivelFilter}`);
            const beforeCount = filteredBlocks.length;
            filteredBlocks = filteredBlocks.filter(block => block.nivel_id == nivelFilter);
            console.log(`🔍 After nivel filter: ${beforeCount} → ${filteredBlocks.length}`);
        }
        
        if (caracterFilter) {
            console.log(`🔍 Filtering by estado_id: ${caracterFilter}`);
            const beforeCount = filteredBlocks.length;
            filteredBlocks = filteredBlocks.filter(block => block.estado_id == caracterFilter);
            console.log(`🔍 After caracter filter: ${beforeCount} → ${filteredBlocks.length}`);
        }
        
        console.log(`✅ Final filtered result: ${filteredBlocks.length} blocks from ${this.blocksData.length} total`);
        
        // Mostrar bloques filtrados
        this.displayFilteredBlocks(filteredBlocks);
    }

    displayFilteredBlocks(blocks) {
        const blocksGrid = document.getElementById(`bc-blocks-grid-${this.containerId}`);
        const emptyState = document.getElementById(`bc-empty-state-${this.containerId}`);

        if (!blocks || blocks.length === 0) {
            emptyState.style.display = 'block';
            blocksGrid.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        blocksGrid.style.display = 'grid';

        blocksGrid.innerHTML = blocks.map(block => this.createBlockCard(block)).join('');
    }

    clearFilters() {
        console.log('🗑️ Clearing all filters');
        
        document.getElementById(`bc-filter-tipo-${this.containerId}`).value = '';
        document.getElementById(`bc-filter-nivel-${this.containerId}`).value = '';
        document.getElementById(`bc-filter-caracter-${this.containerId}`).value = '';
        
        this.displayBlocks();
    }

    // Public method to refresh data
    async refresh() {
        console.log(`🔄 [BloquesCreados] Refreshing data for displayMode: ${this.displayMode}`);
        
        if (this.displayMode === 'loaded') {
            console.log('🔄 Refreshing loaded blocks...');
            await this.loadLoadedBlocks();
        } else {
            console.log('🔄 Refreshing created blocks...');
            await this.loadCreatedBlocks();
            await this.loadMetadataFilters();
        }
        
        console.log(`✅ [BloquesCreados] Refresh completed for displayMode: ${this.displayMode}`);
    }

    // Contenido del Bloque - Para estudiantes (PJG) y bloques cargados
    async loadBlockContentViewer(blockId, blockName) {
        console.log(`🔍 loadBlockContentViewer called:`, {
            blockId,
            blockName,
            userType: this.userType,
            displayMode: this.displayMode,
            hasAccess: this.userType === 'estudiantes' || this.displayMode === 'loaded'
        });
        
        // Permitir acceso a estudiantes o para bloques cargados
        if (this.userType !== 'estudiantes' && this.displayMode !== 'loaded') {
            console.log('❌ Access denied to loadBlockContentViewer');
            return;
        }
        
        console.log(`✅ Loading block content viewer for block: ${blockId} (${blockName})`);
        return this.loadBlockEditor(blockId, blockName, 'viewer');
    }

    // Editor de Preguntas - Para profesores (PPF) y creadores (PCC)
    async loadQuestionsEditor(blockId, blockName) {
        // Permitir acceso a profesores (alumnos) y creadores (jugadores)
        if (this.userType !== 'alumnos' && this.userType !== 'jugadores') return;
        
        console.log(`🔍 Loading questions editor for block: ${blockId} (${blockName})`);
        return this.loadBlockEditor(blockId, blockName, 'editor');
    }

    // Método unificado para cargar editor/viewer
    async loadBlockEditor(blockId, blockName, mode = 'editor') {
        // Limpiar cualquier estado previo
        this.currentBlockId = null;
        this.currentQuestions = [];
        this.currentBlockData = null;
        this.currentMode = mode;
        
        // Mostrar editor y ocultar lista de bloques
        const blocksContainer = document.getElementById(`bc-blocks-container-${this.containerId}`);
        const editorContainer = document.getElementById(`bc-questions-editor-${this.containerId}`);
        const loadingElement = document.getElementById(`bc-editor-loading-${this.containerId}`);
        const titleElement = document.getElementById(`bc-editor-title-${this.containerId}`);
        const questionsListElement = document.getElementById(`bc-questions-list-${this.containerId}`);
        
        // Verificar que todos los elementos existen
        if (!blocksContainer || !editorContainer || !loadingElement || !titleElement || !questionsListElement) {
            console.error('❌ Missing DOM elements for questions editor');
            alert('Error en la interfaz del editor de preguntas');
            return;
        }
        
        blocksContainer.style.display = 'none';
        editorContainer.style.display = 'block';
        
        // Actualizar título según el modo
        const title = mode === 'viewer' ? `Contenido Bloque - ${blockName}` : `Editor de Preguntas - ${blockName}`;
        titleElement.textContent = title;
        
        // Limpiar contenido anterior y mostrar loading
        questionsListElement.innerHTML = '';
        loadingElement.style.display = 'block';
        
        try {
            console.log('🔄 Fetching block data and questions...');
            
            // Determinar el límite de preguntas según el modo y el displayMode
            let questionLimit = null;
            if (mode === 'viewer') {
                // Para estudiantes: todas las preguntas en bloques cargados, 5 en disponibles
                questionLimit = this.displayMode === 'loaded' ? null : 5;
            }
            
            // Cargar datos del bloque y preguntas en paralelo
            const [blockData, questions] = await Promise.all([
                this.fetchBlockData(blockId),
                this.fetchBlockQuestions(blockId, questionLimit)
            ]);
            
            // Guardar el estado ANTES de mostrar
            this.currentBlockId = blockId;
            this.currentBlockData = blockData;
            
            console.log('✅ Block data and questions fetched, displaying...');
            this.displayBlockCharacteristics(blockData, mode);
            this.displayQuestions(questions, mode);
            
        } catch (error) {
            console.error('❌ Error loading block editor:', error);
            console.error('❌ Error details:', {
                blockId,
                blockName,
                mode,
                userType: this.userType,
                displayMode: this.displayMode,
                error: error.message,
                stack: error.stack
            });
            
            // Show more specific error message
            const errorMsg = error.message.includes('authentication') || error.message.includes('token') 
                ? 'Error de autenticación. Por favor, inicia sesión nuevamente.' 
                : error.message.includes('403') 
                    ? 'No tienes permisos para acceder a este contenido.'
                    : `Error al cargar el contenido del bloque: ${error.message}`;
                    
            alert(errorMsg);
            this.closeQuestionsEditor();
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    closeQuestionsEditor() {
        document.getElementById(`bc-questions-editor-${this.containerId}`).style.display = 'none';
        document.getElementById(`bc-blocks-container-${this.containerId}`).style.display = 'block';
        this.currentBlockId = null;
    }

    async fetchBlockQuestions(blockId, limit = null) {
        // Force Render backend for now since we're using Render+Aiven setup
        const API_BASE_URL = 'https://playtest-backend.onrender.com';
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');
        
        // Debug token information
        console.log('🔍 Token debug:', { 
            token: token ? `${token.substring(0, 20)}...` : token,
            type: typeof token,
            length: token ? token.length : 0,
            isNull: token === null,
            isStringNull: token === 'null',
            isUndefined: token === 'undefined',
            isEmpty: !token
        });
        
        // Validar que el token existe y no es la string "null"
        if (!token || token === 'null' || token === 'undefined') {
            console.error('❌ Token validation failed:', token);
            throw new Error('No valid authentication token found. Please login again.');
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        if (activeRole && activeRole !== 'null' && activeRole !== 'undefined') {
            headers['X-Current-Role'] = activeRole;
        }
        
        const url = limit ? `${API_BASE_URL}/api/blocks/${blockId}/questions?limit=${limit}` : `${API_BASE_URL}/api/blocks/${blockId}/questions`;
        const response = await fetch(url, {
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error fetching block questions:`, {
                status: response.status,
                statusText: response.statusText,
                url,
                headers,
                response: errorText
            });
            throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully fetched ${data.length || 0} questions for block ${blockId}`);
        return data;
    }

    async fetchBlockTopics(blockId) {
        // Force Render backend for now since we're using Render+Aiven setup
        const API_BASE_URL = 'https://playtest-backend.onrender.com';
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');
        
        // Validar que el token existe y no es la string "null"
        if (!token || token === 'null' || token === 'undefined') {
            throw new Error('No valid authentication token found. Please login again.');
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        if (activeRole && activeRole !== 'null' && activeRole !== 'undefined') {
            headers['X-Current-Role'] = activeRole;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/blocks/${blockId}/topics`, {
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch block topics');
        }

        const data = await response.json();
        // El endpoint ahora devuelve un array simple de strings con los nombres de los temas
        return Array.isArray(data) ? data : [];
    }

    async fetchBlockData(blockId) {
        // Force Render backend for now since we're using Render+Aiven setup
        const API_BASE_URL = 'https://playtest-backend.onrender.com';
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
        const activeRole = localStorage.getItem('activeRole');
        
        // Validar que el token existe y no es la string "null"
        if (!token || token === 'null' || token === 'undefined') {
            throw new Error('No valid authentication token found. Please login again.');
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        if (activeRole && activeRole !== 'null' && activeRole !== 'undefined') {
            headers['X-Current-Role'] = activeRole;
        }
        
        // Obtener datos completos del bloque incluyendo estadísticas
        const response = await fetch(`${API_BASE_URL}/api/blocks/${blockId}/complete-data`, {
            headers
        });

        if (!response.ok) {
            throw new Error('Failed to fetch block data');
        }

        return await response.json();
    }

    displayBlockCharacteristics(blockData, mode = 'editor') {
        const container = document.getElementById(`bc-block-characteristics-${this.containerId}`);
        
        if (!container) {
            console.error('❌ Block characteristics container not found');
            return;
        }

        console.log('✅ Displaying block characteristics:', blockData);

        // Preparar datos de temas y estadísticas
        const topics = blockData.topics || [];
        const totalQuestions = blockData.totalQuestions || 0;

        container.innerHTML = `
            <div class="bc-block-char-header">
                <h3 class="bc-block-char-title">📋 Características del Bloque</h3>
                ${mode === 'editor' ? `
                <div class="bc-question-actions">
                    <button class="bc-btn-edit" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.editBlockCharacteristics()">Editar</button>
                </div>
                ` : ''}
            </div>
            
            <div class="bc-block-char-content" id="bc-block-char-view-${this.containerId}">
                <div class="bc-block-char-left">
                    <div class="bc-char-field">
                        <label class="bc-char-label">Nombre del Bloque</label>
                        <div class="bc-char-value">${this.escapeHtml(blockData.name || 'Sin nombre')}</div>
                    </div>
                    
                    <div class="bc-char-field">
                        <label class="bc-char-label">Descripción</label>
                        <div class="bc-char-value bc-char-textarea">${this.escapeHtml(blockData.description || 'Sin descripción')}</div>
                    </div>
                    
                    <div class="bc-char-field">
                        <label class="bc-char-label">Observaciones</label>
                        <div class="bc-char-value bc-char-textarea">${this.escapeHtml(blockData.observaciones || 'Sin observaciones')}</div>
                    </div>
                </div>
                
                <div class="bc-block-char-right">
                    <div class="bc-char-field">
                        <label class="bc-char-label">Total de Preguntas</label>
                        <div class="bc-char-value" style="color: #3B82F6; font-weight: 600;">${totalQuestions}</div>
                    </div>
                    
                    <div class="bc-char-field">
                        <label class="bc-char-label">Temas y Preguntas por Tema</label>
                        <div class="bc-topics-list">
                            ${topics.length > 0 ? topics.map(topic => `
                                <div class="bc-topic-item">
                                    <span class="bc-topic-name">${this.escapeHtml(topic.topic || topic.name)}</span>
                                    <span class="bc-topic-count">${topic.total_questions || topic.count || 0}</span>
                                </div>
                            `).join('') : '<div class="bc-topic-item"><span class="bc-topic-name" style="color: #6B7280; font-style: italic;">No hay temas definidos</span></div>'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bc-block-char-edit" id="bc-block-char-edit-${this.containerId}" style="display: none;">
                <!-- Formulario de edición se carga aquí -->
            </div>
        `;
    }

    async editBlockCharacteristics() {
        if (!this.currentBlockData) {
            console.error('❌ No block data available');
            return;
        }

        const viewContainer = document.getElementById(`bc-block-char-view-${this.containerId}`);
        const editContainer = document.getElementById(`bc-block-char-edit-${this.containerId}`);
        
        if (!viewContainer || !editContainer) {
            console.error('❌ Block characteristics containers not found');
            return;
        }
        
        // Mostrar loading mientras se carga el formulario
        editContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6B7280;">Cargando formulario de edición...</div>';
        viewContainer.style.display = 'none';
        editContainer.style.display = 'block';
        
        try {
            const formHtml = await this.createBlockCharacteristicsEditForm(this.currentBlockData);
            editContainer.innerHTML = formHtml;
        } catch (error) {
            console.error('❌ Error creating block characteristics edit form:', error);
            editContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #DC2626;">Error al cargar el formulario de edición</div>';
        }
    }

    async createBlockCharacteristicsEditForm(blockData) {
        console.log('🔧 Creating block characteristics edit form for:', blockData);
        
        // Obtener metadata disponible desde el API
        let metadataOptions = {
            tipos: [],
            niveles: [],
            estados: []
        };
        
        try {
            const metadata = await this.fetchBlockMetadata();
            metadataOptions = metadata;
            console.log('✅ Metadata fetched for form:', metadataOptions);
            console.log('🔍 Types:', metadataOptions.types);
            console.log('🔍 Levels:', metadataOptions.levels);
            console.log('🔍 States:', metadataOptions.states);
        } catch (error) {
            console.error('❌ Error loading metadata:', error);
            console.error('❌ Metadata error details:', error.message);
        }

        return `
            <div class="bc-char-edit-form">
                <div class="bc-char-edit-field">
                    <label class="bc-char-label">Nombre del Bloque</label>
                    <input type="text" class="bc-char-edit-input" id="bc-edit-block-name-${this.containerId}" 
                           value="${this.escapeHtml(blockData.name || '')}" placeholder="Nombre del bloque">
                </div>
                
                <div class="bc-char-edit-field">
                    <label class="bc-char-label">Tipo</label>
                    <select class="bc-char-edit-input" id="bc-edit-block-tipo-${this.containerId}">
                        <option value="">Sin especificar</option>
                        ${metadataOptions.types?.map(tipo => `
                            <option value="${tipo.id}" ${blockData.tipo_id == tipo.id ? 'selected' : ''}>
                                ${this.escapeHtml(tipo.name)}
                            </option>
                        `).join('') || ''}
                    </select>
                </div>
                
                <div class="bc-char-edit-field">
                    <label class="bc-char-label">Nivel</label>
                    <select class="bc-char-edit-input" id="bc-edit-block-nivel-${this.containerId}">
                        <option value="">Sin especificar</option>
                        ${metadataOptions.levels?.map(nivel => `
                            <option value="${nivel.id}" ${blockData.nivel_id == nivel.id ? 'selected' : ''}>
                                ${this.escapeHtml(nivel.name)}
                            </option>
                        `).join('') || ''}
                    </select>
                </div>
                
                <div class="bc-char-edit-field">
                    <label class="bc-char-label">Estado</label>
                    <select class="bc-char-edit-input" id="bc-edit-block-estado-${this.containerId}">
                        <option value="">Sin especificar</option>
                        ${metadataOptions.states?.map(estado => `
                            <option value="${estado.id}" ${blockData.estado_id == estado.id ? 'selected' : ''}>
                                ${this.escapeHtml(estado.name)}
                            </option>
                        `).join('') || ''}
                    </select>
                </div>
                
                <div class="bc-char-edit-field" style="grid-column: 1 / -1;">
                    <label class="bc-char-label">Descripción</label>
                    <textarea class="bc-char-edit-input bc-char-edit-textarea" id="bc-edit-block-description-${this.containerId}" 
                              placeholder="Descripción del bloque">${this.escapeHtml(blockData.description || '')}</textarea>
                </div>
                
                <div class="bc-char-edit-field" style="grid-column: 1 / -1;">
                    <label class="bc-char-label">Observaciones</label>
                    <textarea class="bc-char-edit-input bc-char-edit-textarea" id="bc-edit-block-observaciones-${this.containerId}" 
                              placeholder="Observaciones adicionales">${this.escapeHtml(blockData.observaciones || '')}</textarea>
                </div>
                
                <div class="bc-char-edit-actions">
                    <button class="bc-btn-save" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.saveBlockCharacteristics()">Guardar</button>
                    <button class="bc-btn-cancel" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.cancelEditBlockCharacteristics()">Cancelar</button>
                </div>
            </div>
        `;
    }

    async fetchBlockMetadata() {
        // Force Render backend for now since we're using Render+Aiven setup
        const API_BASE_URL = 'https://playtest-backend.onrender.com';
        const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
        
        console.log('🔍 Fetching block metadata...');
        
        if (!token || token === 'null' || token === 'undefined') {
            throw new Error('No valid authentication token found');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/blocks/metadata`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('🔍 Metadata response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Metadata fetch failed:', response.status, errorText);
            throw new Error(`Failed to fetch block metadata: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 Raw metadata from server:', data);
        
        return data;
    }

    cancelEditBlockCharacteristics() {
        const viewContainer = document.getElementById(`bc-block-char-view-${this.containerId}`);
        const editContainer = document.getElementById(`bc-block-char-edit-${this.containerId}`);
        
        if (viewContainer && editContainer) {
            editContainer.style.display = 'none';
            viewContainer.style.display = 'block';
        }
    }

    async saveBlockCharacteristics() {
        if (!this.currentBlockId) {
            alert('Error: No hay un bloque seleccionado');
            return;
        }

        try {
            console.log('💾 Saving block characteristics for block:', this.currentBlockId);
            
            // Obtener datos del formulario
            const name = document.getElementById(`bc-edit-block-name-${this.containerId}`).value.trim();
            const description = document.getElementById(`bc-edit-block-description-${this.containerId}`).value.trim();
            const observaciones = document.getElementById(`bc-edit-block-observaciones-${this.containerId}`).value.trim();
            const tipoId = document.getElementById(`bc-edit-block-tipo-${this.containerId}`).value || null;
            const nivelId = document.getElementById(`bc-edit-block-nivel-${this.containerId}`).value || null;
            const estadoId = document.getElementById(`bc-edit-block-estado-${this.containerId}`).value || null;
            
            if (!name) {
                alert('El nombre del bloque es obligatorio');
                return;
            }

            // Force Render backend for now since we're using Render+Aiven setup
            const API_BASE_URL = 'https://playtest-backend.onrender.com';
            const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
            const activeRole = localStorage.getItem('activeRole');
            
            // Validar que el token existe y no es la string "null"
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('No valid authentication token found. Please login again.');
            }
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            if (activeRole && activeRole !== 'null' && activeRole !== 'undefined') {
                headers['X-Current-Role'] = activeRole;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/blocks/${this.currentBlockId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name,
                    description,
                    observaciones,
                    tipo_id: tipoId ? parseInt(tipoId) : null,
                    nivel_id: nivelId ? parseInt(nivelId) : null,
                    estado_id: estadoId ? parseInt(estadoId) : null,
                    isPublic: this.currentBlockData.isPublic // Mantener estado público
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar las características del bloque');
            }

            console.log('✅ Block characteristics saved successfully');
            alert('Características del bloque guardadas correctamente');
            
            // Cancelar edición y recargar datos del bloque
            this.cancelEditBlockCharacteristics();
            await this.reloadCurrentBlockData();
            
        } catch (error) {
            console.error('❌ Error saving block characteristics:', error);
            alert('Error al guardar las características del bloque: ' + error.message);
        }
    }

    async reloadCurrentBlockData() {
        if (!this.currentBlockId) return;
        
        try {
            const blockData = await this.fetchBlockData(this.currentBlockId);
            this.currentBlockData = blockData;
            this.displayBlockCharacteristics(blockData);
        } catch (error) {
            console.error('❌ Error reloading block data:', error);
        }
    }

    displayQuestions(questions, mode = 'editor') {
        const container = document.getElementById(`bc-questions-list-${this.containerId}`);
        
        // Guardar las preguntas ANTES de procesarlas
        this.currentQuestions = questions || [];
        
        // Verificar que el contenedor existe
        if (!container) {
            console.error('❌ Questions container not found:', `bc-questions-list-${this.containerId}`);
            return;
        }
        
        if (!questions || questions.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6B7280; padding: 40px;">No hay preguntas en este bloque</div>';
            return;
        }

        // Log para debugging
        console.log('✅ Displaying questions:', questions.length);
        console.log('✅ Sample question:', questions[0]);

        container.innerHTML = questions.map((question, index) => 
            this.createQuestionItem(question, index, mode)
        ).join('');
    }

    createQuestionItem(question, index, mode = 'editor') {
        // Manejo robusto de las respuestas con múltiples formatos posibles
        const answers = question.respuestas || question.answers || [];
        const tema = question.tema || question.topic || 'Sin tema';
        const dificultad = question.difficulty || 'No especificada';
        
        // Log para debugging de la estructura de datos
        console.log(`🔍 Creating question item ${index + 1}:`, {
            id: question.id,
            text: question.textoPregunta || question.text_question,
            answers: answers.length,
            sampleAnswer: answers[0]
        });
        
        return `
            <div class="bc-question-item" id="bc-question-${question.id}">
                <div class="bc-question-header">
                    <span class="bc-question-title">
                        Pregunta ${index + 1} - <span class="bc-question-meta">${this.escapeHtml(tema)} (Dificultad: ${dificultad})</span>
                    </span>
                    ${mode === 'editor' ? `
                    <div class="bc-question-actions">
                        <button class="bc-btn-edit" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.editQuestion(${question.id})">Editar</button>
                        <button class="bc-action-btn bc-btn-delete" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.deleteQuestion(${question.id})">Eliminar</button>
                    </div>
                    ` : ''}
                </div>
                
                <div class="bc-question-content" id="bc-content-${question.id}">
                    <div class="bc-question-view">
                        <!-- Texto de la pregunta -->
                        <div class="bc-question-text-display">
                            ${this.escapeHtml(question.textoPregunta || question.text_question || 'Sin texto de pregunta')}
                        </div>
                        
                        <!-- Respuestas -->
                        <div class="bc-answers-display">
                            ${answers.length > 0 ? answers.map(answer => `
                                <div class="bc-answer-display">
                                    <span class="bc-answer-indicator ${answer.is_correct || answer.esCorrecta ? 'bc-correct' : 'bc-incorrect'}">
                                        ${answer.is_correct || answer.esCorrecta ? '✓' : '○'}
                                    </span>
                                    <span class="bc-answer-text-display">${this.escapeHtml(answer.answer_text || answer.textoRespuesta || 'Sin texto de respuesta')}</span>
                                </div>
                            `).join('') : '<div class="bc-no-answers">No hay respuestas disponibles</div>'}
                        </div>
                        
                        <!-- Explicación (si existe) -->
                        ${(question.explicacionRespuesta || question.explanation) ? `
                        <div class="bc-explanation-display">
                            <strong>Explicación:</strong> ${this.escapeHtml(question.explicacionRespuesta || question.explanation)}
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="bc-question-edit" id="bc-edit-${question.id}" style="display: none;">
                        <!-- Formulario de edición se carga aquí -->
                    </div>
                </div>
            </div>
        `;
    }

    async editQuestion(questionId) {
        const question = this.getQuestionById(questionId);
        if (!question) {
            console.error('❌ Question not found:', questionId);
            return;
        }

        const editContainer = document.getElementById(`bc-edit-${questionId}`);
        const viewContainer = editContainer.previousElementSibling;
        
        if (!editContainer || !viewContainer) {
            console.error('❌ Edit containers not found for question:', questionId);
            return;
        }
        
        // Mostrar loading mientras se carga el formulario
        editContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6B7280;">Cargando formulario de edición...</div>';
        viewContainer.style.display = 'none';
        editContainer.style.display = 'block';
        
        try {
            const formHtml = await this.createQuestionEditForm(question);
            editContainer.innerHTML = formHtml;
        } catch (error) {
            console.error('❌ Error creating edit form:', error);
            editContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #DC2626;">Error al cargar el formulario de edición</div>';
        }
    }

    async createQuestionEditForm(question) {
        const answers = question.respuestas || question.answers || [];
        
        // Obtener temas disponibles del bloque actual
        let topicOptions = '<option value="">Sin tema</option>';
        try {
            const topics = await this.fetchBlockTopics(this.currentBlockId);
            console.log('🔍 Topics fetched for dropdown:', topics);
            
            if (topics && topics.length > 0) {
                const currentTopicValue = question.tema || question.topic || '';
                
                topicOptions = topics.map(topic => `
                    <option value="${this.escapeHtml(topic)}" ${currentTopicValue === topic ? 'selected' : ''}>
                        ${this.escapeHtml(topic)}
                    </option>
                `).join('');
                
                // Si el tema actual no está en la lista, agregarlo como primera opción
                if (currentTopicValue && !topics.includes(currentTopicValue)) {
                    topicOptions = `<option value="${this.escapeHtml(currentTopicValue)}" selected>${this.escapeHtml(currentTopicValue)}</option>` + topicOptions;
                }
                
                // Agregar opción "Sin tema" al inicio
                topicOptions = '<option value="">Sin tema</option>' + topicOptions;
            } else {
                console.log('⚠️ No topics found, using fallback');
                // Fallback: usar el tema actual si existe
                const currentTopic = question.tema || question.topic || '';
                if (currentTopic) {
                    topicOptions = `
                        <option value="">Sin tema</option>
                        <option value="${this.escapeHtml(currentTopic)}" selected>${this.escapeHtml(currentTopic)}</option>
                    `;
                }
            }
        } catch (error) {
            console.error('❌ Error loading topics:', error);
            // Fallback: usar el tema actual si existe
            const currentTopic = question.tema || question.topic || '';
            if (currentTopic) {
                topicOptions = `
                    <option value="">Sin tema</option>
                    <option value="${this.escapeHtml(currentTopic)}" selected>${this.escapeHtml(currentTopic)}</option>
                `;
            }
        }
        
        return `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #E2E8F0; font-size: 12px;">Pregunta:</label>
                    <textarea class="bc-question-text" id="bc-edit-text-${question.id}">${this.escapeHtml(question.textoPregunta || question.text_question || '')}</textarea>
                </div>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #E2E8F0; font-size: 12px;">Tema:</label>
                        <select class="bc-answer-text" id="bc-edit-topic-${question.id}" style="width: 100%;">
                            ${topicOptions || '<option value="">Sin tema</option>'}
                        </select>
                    </div>
                    
                    <div style="flex: 0 0 150px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #E2E8F0; font-size: 12px;">Dificultad:</label>
                        <select class="bc-answer-text" id="bc-edit-difficulty-${question.id}" style="width: 100%;">
                            <option value="1" ${question.difficulty == 1 ? 'selected' : ''}>1 - Fácil</option>
                            <option value="2" ${question.difficulty == 2 ? 'selected' : ''}>2 - Medio</option>
                            <option value="3" ${question.difficulty == 3 ? 'selected' : ''}>3 - Difícil</option>
                            <option value="4" ${question.difficulty == 4 ? 'selected' : ''}>4 - Muy Difícil</option>
                            <option value="5" ${question.difficulty == 5 ? 'selected' : ''}>5 - Experto</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #E2E8F0; font-size: 12px;">Explicación (opcional):</label>
                    <textarea class="bc-question-text" id="bc-edit-explanation-${question.id}" style="min-height: 60px;">${this.escapeHtml(question.explicacionRespuesta || question.explanation || '')}</textarea>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #E2E8F0; font-size: 12px;">Respuestas:</label>
                    <div class="bc-answers-list" id="bc-edit-answers-${question.id}">
                        ${answers.map((answer, index) => `
                            <div class="bc-answer-item" data-answer-id="${answer.id}">
                                <input type="checkbox" class="bc-answer-checkbox" ${answer.is_correct || answer.esCorrecta ? 'checked' : ''} 
                                       onchange="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.updateAnswerCorrect(${answer.id}, this.checked)">
                                <input type="text" class="bc-answer-text" value="${this.escapeHtml(answer.answer_text || answer.textoRespuesta || '')}" 
                                       data-answer-id="${answer.id}" placeholder="Respuesta ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
                    <button class="bc-btn-save" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.saveQuestion(${question.id})">Guardar</button>
                    <button class="bc-btn-cancel" onclick="window.bloquesCreados_${this.containerId.replace(/[-]/g, '_')}?.cancelEditQuestion(${question.id})">Cancelar</button>
                </div>
            </div>
        `;
    }

    getQuestionById(questionId) {
        // Implementar búsqueda en los datos cargados
        return this.currentQuestions?.find(q => q.id === questionId);
    }

    cancelEditQuestion(questionId) {
        const editContainer = document.getElementById(`bc-edit-${questionId}`);
        const viewContainer = editContainer.previousElementSibling;
        
        editContainer.style.display = 'none';
        viewContainer.style.display = 'block';
    }

    async saveQuestion(questionId) {
        if (!this.currentBlockId) {
            alert('Error: No hay un bloque seleccionado');
            return;
        }

        try {
            console.log('💾 Saving question:', questionId);
            
            // Obtener datos del formulario
            const textoPregunta = document.getElementById(`bc-edit-text-${questionId}`).value.trim();
            const tema = document.getElementById(`bc-edit-topic-${questionId}`).value;
            const difficulty = parseInt(document.getElementById(`bc-edit-difficulty-${questionId}`).value);
            const explicacionRespuesta = document.getElementById(`bc-edit-explanation-${questionId}`).value.trim();
            
            if (!textoPregunta) {
                alert('El texto de la pregunta es obligatorio');
                return;
            }

            // Obtener todas las respuestas
            const answersContainer = document.getElementById(`bc-edit-answers-${questionId}`);
            const answerItems = answersContainer.querySelectorAll('.bc-answer-item');
            
            const respuestas = Array.from(answerItems).map(item => {
                const checkbox = item.querySelector('.bc-answer-checkbox');
                const input = item.querySelector('.bc-answer-text');
                return {
                    textoRespuesta: input.value.trim(),
                    esCorrecta: checkbox.checked
                };
            }).filter(r => r.textoRespuesta); // Filtrar respuestas vacías

            if (respuestas.length === 0) {
                alert('Debe haber al menos una respuesta');
                return;
            }

            const hasCorrectAnswer = respuestas.some(r => r.esCorrecta);
            if (!hasCorrectAnswer) {
                alert('Debe marcar al menos una respuesta como correcta');
                return;
            }

            // Force Render backend for now since we're using Render+Aiven setup
            const API_BASE_URL = 'https://playtest-backend.onrender.com';
            const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
            const activeRole = localStorage.getItem('activeRole');
            
            // Validar que el token existe y no es la string "null"
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('No valid authentication token found. Please login again.');
            }
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            if (activeRole && activeRole !== 'null' && activeRole !== 'undefined') {
                headers['X-Current-Role'] = activeRole;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/blocks/${this.currentBlockId}/questions/${questionId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    textoPregunta,
                    tema,
                    difficulty,
                    explicacionRespuesta: explicacionRespuesta || null,
                    respuestas
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar la pregunta');
            }

            console.log('✅ Question saved successfully');
            alert('Pregunta guardada correctamente');
            
            // Cancelar edición y recargar preguntas
            this.cancelEditQuestion(questionId);
            await this.reloadCurrentBlockQuestions();
            
        } catch (error) {
            console.error('❌ Error saving question:', error);
            alert('Error al guardar la pregunta: ' + error.message);
        }
    }

    async deleteQuestion(questionId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
            return;
        }

        if (!this.currentBlockId) {
            alert('Error: No hay un bloque seleccionado');
            return;
        }

        try {
            console.log('🗑️ Deleting question:', questionId);
            
            // Force Render backend for now since we're using Render+Aiven setup
            const API_BASE_URL = 'https://playtest-backend.onrender.com';
            const token = localStorage.getItem('playtest_auth_token') || localStorage.getItem('token');
            const activeRole = localStorage.getItem('activeRole');
            
            // Validar que el token existe y no es la string "null"
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('No valid authentication token found. Please login again.');
            }
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            if (activeRole && activeRole !== 'null' && activeRole !== 'undefined') {
                headers['X-Current-Role'] = activeRole;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/blocks/${this.currentBlockId}/questions/${questionId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar la pregunta');
            }

            console.log('✅ Question deleted successfully');
            alert('Pregunta eliminada correctamente');
            
            // Recargar preguntas
            await this.reloadCurrentBlockQuestions();
            
        } catch (error) {
            console.error('❌ Error deleting question:', error);
            alert('Error al eliminar la pregunta: ' + error.message);
        }
    }

    async reloadCurrentBlockQuestions() {
        if (!this.currentBlockId) return;
        
        try {
            const questions = await this.fetchBlockQuestions(this.currentBlockId);
            this.displayQuestions(questions);
        } catch (error) {
            console.error('❌ Error reloading questions:', error);
        }
    }

    updateAnswerCorrect(answerId, isCorrect) {
        // Esta función se usa solo para la interfaz de edición local
        // Los cambios se guardan cuando se presiona "Guardar"
        console.log('🔄 Update answer correct (local):', answerId, isCorrect);
    }
}

// Function to render Bloques Creados section
function renderBloquesCreados(containerId, userType = 'jugadores') {
    console.log(`🔧 Rendering BloquesCreados in ${containerId} for ${userType}`);
    
    const instance = new BloquesCreados(containerId, userType);
    
    // Make instance globally available for button callbacks with valid JS identifier
    const globalName = `bloquesCreados_${containerId.replace(/[-]/g, '_')}`;
    window[globalName] = instance;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => instance.initialize());
    } else {
        instance.initialize();
    }
    
    return instance;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BloquesCreados, renderBloquesCreados };
} else if (typeof window !== 'undefined') {
    window.BloquesCreados = BloquesCreados;
    window.renderBloquesCreados = renderBloquesCreados;
}