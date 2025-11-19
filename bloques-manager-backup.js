/**
 * MÓDULO: Gestión de Bloques y Temas
 * Funcionalidad para la Pestaña 2 del Panel de Profesor
 */

// Helper function to get authentication token
function getTokenBloques() {
    return localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

const BloquesManager = {
    oposicionActual: null,
    bloques: [],
    metadata: { types: [], levels: [], states: [] },
    API_URL: 'https://playtest-backend.onrender.com/api',

    /**
     * Cargar metadatos de bloques (tipos, niveles, estados)
     */
    async cargarMetadata() {
        try {
            const response = await fetch(`${this.API_URL}/blocks/metadata`, {
                headers: {
                    'Authorization': `Bearer ${getTokenBloques()}`
                }
            });

            if (!response.ok) throw new Error('Error cargando metadatos');

            this.metadata = await response.json();
            console.log('✅ Metadatos cargados:', this.metadata);

            // Poblar los selectores
            this.poblarSelectoresMetadata();

        } catch (error) {
            console.error('Error cargando metadatos:', error);
        }
    },

    /**
     * Poblar los selectores de metadatos en el modal
     */
    poblarSelectoresMetadata() {
        // Tipo de bloque
        const selectTipo = document.getElementById('select-tipo-bloque');
        if (selectTipo && this.metadata.types) {
            selectTipo.innerHTML = '<option value="">Seleccionar...</option>' +
                this.metadata.types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }

        // Nivel educativo
        const selectNivel = document.getElementById('select-nivel-bloque');
        if (selectNivel && this.metadata.levels) {
            selectNivel.innerHTML = '<option value="">Seleccionar...</option>' +
                this.metadata.levels.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        }

        // Carácter/Estado
        const selectEstado = document.getElementById('select-estado-bloque');
        if (selectEstado && this.metadata.states) {
            selectEstado.innerHTML = '<option value="">Seleccionar...</option>' +
                this.metadata.states.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    },

    /**
     * Cargar bloques de una oposición
     */
    async cargarBloques(oposicionId) {
        this.oposicionActual = oposicionId;
        const container = document.getElementById('bloques-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const response = await fetch(`${this.API_URL}/oposiciones/${oposicionId}/bloques`, {
                headers: {
                    'Authorization': `Bearer ${getTokenBloques()}`
                }
            });

            if (!response.ok) throw new Error('Error cargando bloques');

            const data = await response.json();
            this.bloques = data.bloques || [];

            this.renderBloques();

        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3 class="empty-title">Error al cargar bloques</h3>
                    <p class="empty-description">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renderizar bloques en la interfaz
     */
    renderBloques() {
        const container = document.getElementById('bloques-content');

        if (this.bloques.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3 class="empty-title">No hay bloques creados</h3>
                    <p class="empty-description">Crea tu primer bloque de temas para esta oposición</p>
                    <button class="btn btn-primary" onclick="BloquesManager.openModalCrearBloque()" style="margin-top: 20px;">
                        ➕ Crear Bloque
                    </button>
                </div>
            `;
            return;
        }

        // Botón para crear nuevo bloque
        let html = `
            <div style="margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="BloquesManager.openModalCrearBloque()">
                    ➕ Nuevo Bloque
                </button>
            </div>
        `;

        // Renderizar cada bloque
        this.bloques.forEach(bloque => {
            const temas = bloque.temas || [];

            html += `
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">📘 ${bloque.nombre}</h3>
                            <span class="badge badge-info">Orden: ${bloque.orden}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary btn-sm" onclick="PreguntasUploader.openModal(${bloque.id}, '${bloque.nombre.replace(/'/g, "\\'")}')">
                                📤 Cargar Preguntas
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="BloquesManager.openModalEditarBloque(${bloque.id})">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="BloquesManager.eliminarBloque(${bloque.id})">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-description">${bloque.descripcion || 'Sin descripción'}</p>

                        <div class="card-stats">
                            <div class="stat-item">
                                <div class="stat-label">Tiempo estimado</div>
                                <div class="stat-value">${bloque.tiempo_estimado_dias} días</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Total preguntas</div>
                                <div class="stat-value">${bloque.total_preguntas || 0}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Temas</div>
                                <div class="stat-value">${temas.length}</div>
                            </div>
                        </div>

                        <!-- Lista de temas -->
                        <div style="margin-top: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h4 style="color: #E0E1DD; font-size: 16px; margin: 0;">Temas del bloque:</h4>
                                <button class="btn btn-success btn-sm" onclick="BloquesManager.openModalCrearTema(${bloque.id})">
                                    ➕ Añadir Tema
                                </button>
                            </div>

                            ${temas.length > 0 ? `
                                <div style="background: rgba(13, 27, 42, 0.5); border-radius: 8px; padding: 12px;">
                                    ${temas.map(tema => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid rgba(65, 90, 119, 0.3);">
                                            <div style="flex: 1;">
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <span style="background: rgba(65, 90, 119, 0.4); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #60A5FA;">
                                                        ${tema.orden}
                                                    </span>
                                                    <span style="color: #E0E1DD; font-weight: 500;">${tema.nombre}</span>
                                                </div>
                                                <div style="font-size: 12px; color: #778DA9; margin-top: 4px; margin-left: 40px;">
                                                    ${tema.num_preguntas || 0} preguntas
                                                </div>
                                            </div>
                                            <div style="display: flex; gap: 6px;">
                                                <button class="btn btn-secondary btn-sm" onclick="BloquesManager.openModalEditarTema(${tema.id})" style="padding: 4px 8px; font-size: 12px;">
                                                    ✏️
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="BloquesManager.eliminarTema(${tema.id})" style="padding: 4px 8px; font-size: 12px;">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="empty-state" style="padding: 20px;">
                                    <p style="color: #778DA9; margin: 0;">No hay temas creados</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Abrir modal para crear bloque
     */
    async openModalCrearBloque() {
        // Cargar metadatos si no están cargados
        if (this.metadata.types.length === 0) {
            await this.cargarMetadata();
        } else {
            this.poblarSelectoresMetadata();
        }

        const modal = document.getElementById('modal-crear-bloque');
        modal.classList.add('active');
        document.getElementById('form-crear-bloque').reset();
    },

    /**
     * Crear nuevo bloque
     */
    async crearBloque(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            observaciones: formData.get('observaciones') || '',
            tiempo_estimado_dias: parseInt(formData.get('tiempo_estimado_dias')) || 14,
            tipo_id: formData.get('tipo_id') ? parseInt(formData.get('tipo_id')) : null,
            nivel_id: formData.get('nivel_id') ? parseInt(formData.get('nivel_id')) : null,
            estado_id: formData.get('estado_id') ? parseInt(formData.get('estado_id')) : null,
            isPublic: formData.get('is_public') === 'true'
        };

        try {
            const response = await fetch(`${this.API_URL}/oposiciones/${this.oposicionActual}/bloques`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getTokenBloques()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error creando bloque');

            alert('✅ Bloque creado exitosamente');
            this.closeModal('modal-crear-bloque');
            form.reset();
            this.cargarBloques(this.oposicionActual);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al crear bloque: ' + error.message);
        }
    },

    /**
     * Eliminar bloque
     */
    async eliminarBloque(bloqueId) {
        if (!confirm('¿Estás seguro de eliminar este bloque? Se eliminarán también todos sus temas.')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/bloques/${bloqueId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getTokenBloques()}`
                }
            });

            if (!response.ok) throw new Error('Error eliminando bloque');

            alert('✅ Bloque eliminado exitosamente');
            this.cargarBloques(this.oposicionActual);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al eliminar bloque: ' + error.message);
        }
    },

    /**
     * Abrir modal para crear tema
     */
    openModalCrearTema(bloqueId) {
        const modal = document.getElementById('modal-crear-tema');
        modal.classList.add('active');
        modal.dataset.bloqueId = bloqueId;
        document.getElementById('form-crear-tema').reset();
    },

    /**
     * Crear nuevo tema
     */
    async crearTema(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const bloqueId = document.getElementById('modal-crear-tema').dataset.bloqueId;

        const data = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion')
        };

        try {
            const response = await fetch(`${this.API_URL}/bloques/${bloqueId}/temas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getTokenBloques()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error creando tema');

            alert('✅ Tema creado exitosamente');
            this.closeModal('modal-crear-tema');
            form.reset();
            this.cargarBloques(this.oposicionActual);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al crear tema: ' + error.message);
        }
    },

    /**
     * Eliminar tema
     */
    async eliminarTema(temaId) {
        if (!confirm('¿Estás seguro de eliminar este tema?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/temas/${temaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getTokenBloques()}`
                }
            });

            if (!response.ok) throw new Error('Error eliminando tema');

            alert('✅ Tema eliminado exitosamente');
            this.cargarBloques(this.oposicionActual);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al eliminar tema: ' + error.message);
        }
    },

    /**
     * Cerrar modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    /**
     * Abrir modal para editar bloque
     */
    async openModalEditarBloque(bloqueId) {
        // TODO: Implementar edición de bloque
        alert('Función de edición de bloque en desarrollo. ID: ' + bloqueId);
    },

    /**
     * Abrir modal para editar tema
     */
    async openModalEditarTema(temaId) {
        // TODO: Implementar edición de tema
        alert('Función de edición de tema en desarrollo. ID: ' + temaId);
    }
};

// Exportar para uso global
window.BloquesManager = BloquesManager;
