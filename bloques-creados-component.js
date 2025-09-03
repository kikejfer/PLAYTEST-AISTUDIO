/**
 * Componente compartido para mostrar la sección "Bloques Creados"
 * Utilizable en PPF (Profesores) y PCC (Creadores de Contenido)
 */

class BloquesCreados {
    constructor(containerId, userType = 'jugadores') {
        this.containerId = containerId;
        this.userType = userType; // 'alumnos' o 'jugadores'
        this.blocksData = [];
        this.currentUser = null;
        
        // Labels según el tipo de usuario
        this.labels = {
            'alumnos': 'Alumnos',
            'jugadores': 'Jugadores'
        };
    }

    async initialize() {
        try {
            await this.loadUserData();
            this.render();
            await this.loadCreatedBlocks();
            await this.loadMetadataFilters();
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
                <h2 class="section-title">📦 Bloques Creados</h2>
                
                <!-- Filtros de Metadata -->
                <div class="bc-filters">
                    <div class="bc-filter-group">
                        <label for="bc-filter-tipo-${this.containerId}">Tipo de Bloque:</label>
                        <select id="bc-filter-tipo-${this.containerId}" onchange="window.bloquesCreados_${this.containerId}?.applyFilters()">
                            <option value="">Todos los tipos</option>
                        </select>
                    </div>
                    
                    <div class="bc-filter-group">
                        <label for="bc-filter-nivel-${this.containerId}">Nivel:</label>
                        <select id="bc-filter-nivel-${this.containerId}" onchange="window.bloquesCreados_${this.containerId}?.applyFilters()">
                            <option value="">Todos los niveles</option>
                        </select>
                    </div>
                    
                    <div class="bc-filter-group">
                        <label for="bc-filter-caracter-${this.containerId}">Carácter:</label>
                        <select id="bc-filter-caracter-${this.containerId}" onchange="window.bloquesCreados_${this.containerId}?.applyFilters()">
                            <option value="">Todos los caracteres</option>
                        </select>
                    </div>
                    
                    <button onclick="window.bloquesCreados_${this.containerId}?.clearFilters()" class="bc-clear-filters">
                        🗑️ Limpiar Filtros
                    </button>
                </div>
                
                <div id="bc-loading-${this.containerId}" class="bc-loading" style="display: none;">
                    <p>Cargando bloques...</p>
                </div>
                
                <div id="bc-error-${this.containerId}" class="bc-error" style="display: none;"></div>
                
                <div id="bc-blocks-container-${this.containerId}">
                    <div id="bc-empty-state-${this.containerId}" class="bc-empty-state" style="display: none;">
                        <h3>No has creado ningún bloque aún</h3>
                        <p>Los bloques que crees aparecerán aquí con estadísticas detalladas</p>
                        <a href="add-question.html" class="bc-btn-primary">Crear tu primer bloque</a>
                    </div>
                    
                    <div id="bc-blocks-grid-${this.containerId}" class="bc-blocks-grid" style="display: none;"></div>
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
            
            this.displayBlocks();
        } catch (error) {
            console.error('❌ Error loading created blocks:', error);
            this.showError('Error al cargar los bloques: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayBlocks() {
        const blocksGrid = document.getElementById(`bc-blocks-grid-${this.containerId}`);
        const emptyState = document.getElementById(`bc-empty-state-${this.containerId}`);

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
        
        card.innerHTML = `
            <div class="bc-block-header">
                <h3 class="bc-block-title">${this.escapeHtml(block.name)}</h3>
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
                <div class="bc-stat-item">
                    <span class="bc-stat-number">${block.stats?.totalUsers || 0}</span>
                    <span class="bc-stat-label">${userLabel}</span>
                </div>
            </div>
            
            <div class="bc-block-actions">
                <button class="bc-action-btn bc-btn-view" onclick="bloquesCreados_${this.containerId}.viewBlock(${block.id})">Ver</button>
                <button class="bc-action-btn bc-btn-edit" onclick="bloquesCreados_${this.containerId}.editBlock(${block.id})">Editar</button>
                <button class="bc-action-btn bc-btn-delete" onclick="bloquesCreados_${this.containerId}.deleteBlock(${block.id}, '${this.escapeHtml(block.name)}')">Eliminar</button>
            </div>
        `;
        
        return card;
    }

    viewBlock(blockId) {
        console.log('Viewing block:', blockId);
        window.location.href = `block-questions.html?blockId=${blockId}`;
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
            
            // Poblar filtros
            this.populateFilterSelect(`bc-filter-tipo-${this.containerId}`, metadata.types);
            this.populateFilterSelect(`bc-filter-nivel-${this.containerId}`, metadata.levels);
            this.populateFilterSelect(`bc-filter-caracter-${this.containerId}`, metadata.states);
            
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
        
        if (!this.blocksData) return;
        
        let filteredBlocks = this.blocksData;
        
        // Aplicar filtros
        if (tipoFilter) {
            filteredBlocks = filteredBlocks.filter(block => block.tipo_id == tipoFilter);
        }
        
        if (nivelFilter) {
            filteredBlocks = filteredBlocks.filter(block => block.nivel_id == nivelFilter);
        }
        
        if (caracterFilter) {
            filteredBlocks = filteredBlocks.filter(block => block.estado_id == caracterFilter);
        }
        
        console.log(`✅ Filtered ${filteredBlocks.length} blocks from ${this.blocksData.length} total`);
        
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
        await this.loadCreatedBlocks();
        await this.loadMetadataFilters();
    }
}

// Function to render Bloques Creados section
function renderBloquesCreados(containerId, userType = 'jugadores') {
    console.log(`🔧 Rendering BloquesCreados in ${containerId} for ${userType}`);
    
    const instance = new BloquesCreados(containerId, userType);
    
    // Make instance globally available for button callbacks
    window[`bloquesCreados_${containerId}`] = instance;
    
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