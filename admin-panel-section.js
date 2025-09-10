/**
 * Módulo genérico para secciones Profesor/Creador en paneles PAP y PAS
 * 
 * Parámetros de invocación:
 * - rolAdministrador: 'Principal' | 'Secundario'
 * - rolAdministrado: 'Profesor' | 'Creador'
 * 
 * Funcionalidades:
 * - Detección automática del tipo de panel (PAP/PAS)
 * - Renderizado genérico de tabla con características específicas
 * - Desplegables de bloques y temas con cálculos correctos
 * - Adaptación automática de filtros según el tipo de administrador
 */

class AdminPanelSection {
    constructor() {
        this.panelType = this.detectPanelType();
        this.expandedRows = new Set();
        this.expandedBlocks = new Set();
        this.apiService = window.apiDataService;
    }

    /**
     * Detecta el tipo de panel basado en los metadatos
     * @returns {string} 'PAP' | 'PAS'
     */
    detectPanelType() {
        const panelTypeMeta = document.querySelector('meta[name="panel-type"]');
        return panelTypeMeta ? panelTypeMeta.content : 'PAP';
    }

    /**
     * Obtiene los registros según el tipo de administrador y rol
     * @param {string} rolAdministrador - 'Principal' | 'Secundario' 
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @returns {Promise<Array>} Array de registros filtrados
     */
    async obtenerRegistros(rolAdministrador, rolAdministrado) {
        try {
            console.log(`🔍 Obteniendo registros para ${rolAdministrador} - ${rolAdministrado} en ${this.panelType}`);
            
            let endpoint;
            if (this.panelType === 'PAP') {
                // PAP: todos los assigned_user_id especificando su admin_id con el rol correspondiente
                endpoint = `/roles-updated/admin-principal-panel`;
            } else {
                // PAS: los assigned_user_id asignados al admin_id con el rol correspondiente
                endpoint = `/roles-updated/admin-secundario-panel`;
            }

            const result = await this.apiService.apiCall(endpoint);
            
            // Filtrar por el rol específico
            const rolKey = rolAdministrado.toLowerCase() + 's'; // 'profesores' o 'creadores'
            const registros = result[rolKey] || [];
            
            console.log(`📊 Encontrados ${registros.length} registros de ${rolAdministrado}s`);
            return registros;
            
        } catch (error) {
            console.error('Error obteniendo registros:', error);
            return [];
        }
    }

    /**
     * Calcula las características de un registro según las especificaciones
     * @param {Object} registro - El registro de usuario
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @returns {Object} Características calculadas
     */
    calcularCaracteristicas(registro, rolAdministrado) {
        return {
            // Nickname/Nombre del assigned_user_id
            nickname: registro.nickname || 'Sin nickname',
            nombreCompleto: [registro.first_name, registro.last_name].filter(Boolean).join(' ') || 'No especificado',
            
            // Email del assigned_user_id
            email: registro.email || 'Sin email',
            
            // Bloques Creados por el assigned_user_id (filtrados de tabla blocks por user_role_id)
            bloquesCreados: registro.blocks_created || registro.bloques_creados || 0,
            
            // Temas totales de los bloques (de tabla topic_answers contando registros por block_id)
            totalTemas: registro.total_topics || registro.total_temas || registro.num_temas || 0,
            
            // Preguntas totales (total_questions de tabla block_answers)
            totalPreguntas: registro.total_questions || registro.total_preguntas || registro.preguntas_totales || 0,
            
            // Alumnos/Estudiantes que tienen cargados estos bloques (de user_loaded_blocks)
            totalUsuarios: registro.estudiantes || registro.alumnos || registro.total_usuarios || 0,
            
            // Administrador asignado (solo en PAP)
            administradorAsignado: this.panelType === 'PAP' ? (registro.assigned_admin_nickname || 'Sin asignar') : null,
            adminId: registro.assigned_admin_id || null,
            
            // ID del usuario para operaciones
            userId: registro.id || registro.user_id
        };
    }

    /**
     * Renderiza la sección completa
     * @param {string} containerId - ID del contenedor donde renderizar
     * @param {string} rolAdministrador - 'Principal' | 'Secundario'
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @param {Object} options - Opciones adicionales
     */
    async renderizarSeccion(containerId, rolAdministrador, rolAdministrado, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} no encontrado`);
            return;
        }

        try {
            // Obtener registros
            const registros = await this.obtenerRegistros(rolAdministrador, rolAdministrado);
            
            // Generar HTML de la tabla
            const tablaHtml = this.generarTablaHTML(registros, rolAdministrado, options);
            
            // Insertar en el contenedor
            container.innerHTML = tablaHtml;
            
            // Configurar event listeners
            this.configurarEventListeners(containerId, rolAdministrador, rolAdministrado);
            
            console.log(`✅ Sección ${rolAdministrado} renderizada en ${containerId}`);
            
        } catch (error) {
            console.error(`Error renderizando sección ${rolAdministrado}:`, error);
            container.innerHTML = `<p style="color: #EF4444;">Error al cargar la sección ${rolAdministrado}</p>`;
        }
    }

    /**
     * Genera el HTML de la tabla principal
     * @param {Array} registros - Array de registros
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @param {Object} options - Opciones de renderizado
     * @returns {string} HTML de la tabla
     */
    generarTablaHTML(registros, rolAdministrado, options) {
        const etiquetaUsuarios = rolAdministrado === 'Profesor' ? 'Alumnos' : 'Estudiantes';
        const mostrarAdmin = this.panelType === 'PAP';
        
        let html = `
            <div class="table-container">
                <table class="admin-section-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Nickname / Nombre</th>
                            <th>Email</th>
                            <th>Bloques Creados</th>
                            <th>Temas</th>
                            <th>Preguntas</th>
                            <th>${etiquetaUsuarios}</th>
                            ${mostrarAdmin ? '<th>Administrador</th>' : ''}
                            <th><img src="./Imagenes/1lum.png" alt="Luminarias" style="height: 20px; width: 20px;"></th>
                            <th>🗑️</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (registros.length === 0) {
            const colspan = mostrarAdmin ? 10 : 9;
            html += `
                <tr>
                    <td colspan="${colspan}" style="text-align: center; color: #778DA9; padding: 30px;">
                        <div style="padding: 20px;">
                            <div style="font-size: 18px; margin-bottom: 10px;">👥</div>
                            <div style="font-weight: bold; margin-bottom: 5px;">No hay ${rolAdministrado.toLowerCase()}s ${this.panelType === 'PAS' ? 'asignados' : 'disponibles'}</div>
                            <div style="font-size: 12px; color: #778DA9;">${this.panelType === 'PAS' ? 'Un administrador principal debe asignarte usuarios para gestionar.' : 'No se encontraron registros.'}</div>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            registros.forEach((registro, index) => {
                const caracteristicas = this.calcularCaracteristicas(registro, rolAdministrado);
                const isExpanded = this.expandedRows.has(`${rolAdministrado.toLowerCase()}-${caracteristicas.userId}`);
                
                html += `
                    <tr data-user-id="${caracteristicas.userId}" data-rol="${rolAdministrado.toLowerCase()}">
                        <td>
                            <button class="btn btn-expand" onclick="adminPanelSection.toggleExpansion('${rolAdministrado.toLowerCase()}', ${caracteristicas.userId})">
                                ${isExpanded ? '−' : '+'}
                            </button>
                        </td>
                        <td>
                            <strong>${caracteristicas.nickname}</strong><br>
                            <small style="color: #6B7280;">${caracteristicas.nombreCompleto}</small>
                        </td>
                        <td>${caracteristicas.email}</td>
                        <td><strong style="color: #3B82F6;">${caracteristicas.bloquesCreados}</strong></td>
                        <td><strong style="color: #10B981;">${caracteristicas.totalTemas}</strong></td>
                        <td><strong style="color: #8B5CF6;">${caracteristicas.totalPreguntas}</strong></td>
                        <td><strong style="color: #F59E0B;">${caracteristicas.totalUsuarios}</strong></td>
                        ${mostrarAdmin ? `
                            <td>
                                <select onchange="adminPanelSection.reasignarUsuario(${caracteristicas.userId}, this.value)" style="background: #1B263B; color: #E0E1DD; border: 1px solid #415A77; border-radius: 4px; padding: 4px 8px;">
                                    <option value="">${caracteristicas.administradorAsignado}</option>
                                    ${this.generarOpcionesAdmin(caracteristicas.adminId)}
                                </select>
                            </td>
                        ` : ''}
                        <td class="luminarias">
                            ${registro.luminarias_actuales || 0}
                        </td>
                        <td>
                            <button onclick="adminPanelSection.eliminarUsuario(${caracteristicas.userId}, '${caracteristicas.nickname}')" 
                                    style="background: #EF4444; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;

                // Fila expandible para bloques
                if (isExpanded) {
                    const colspan = mostrarAdmin ? 10 : 9;
                    html += `
                        <tr class="expandable-row show" data-user-id="${caracteristicas.userId}">
                            <td colspan="${colspan}">
                                <div id="${rolAdministrado.toLowerCase()}-blocks-${caracteristicas.userId}" class="blocks-container">
                                    <div class="loading">Cargando bloques...</div>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    /**
     * Genera opciones de administradores para el select
     * @param {number} currentAdminId - ID del admin actual
     * @returns {string} HTML de opciones
     */
    generarOpcionesAdmin(currentAdminId) {
        // Implementar según los administradores disponibles
        // Por ahora retornamos vacío, se implementará cuando se integre
        return '';
    }

    /**
     * Configura los event listeners para la sección
     * @param {string} containerId - ID del contenedor
     * @param {string} rolAdministrador - Rol del administrador
     * @param {string} rolAdministrado - Rol del administrado
     */
    configurarEventListeners(containerId, rolAdministrador, rolAdministrado) {
        // Event listeners se manejarán a través de los métodos de la clase
        // que serán llamados desde los onclick en el HTML
    }

    /**
     * Alterna la expansión de una fila
     * @param {string} tipo - 'profesor' | 'creador'
     * @param {number} userId - ID del usuario
     */
    async toggleExpansion(tipo, userId) {
        const key = `${tipo}-${userId}`;
        const isCurrentlyExpanded = this.expandedRows.has(key);
        
        if (isCurrentlyExpanded) {
            this.expandedRows.delete(key);
        } else {
            this.expandedRows.add(key);
        }
        
        // Re-renderizar para mostrar/ocultar la fila expandible
        const row = document.querySelector(`tr[data-user-id="${userId}"][data-rol="${tipo}"]`);
        if (row) {
            const button = row.querySelector('.btn-expand');
            button.textContent = isCurrentlyExpanded ? '+' : '−';
            
            const expandableRow = row.nextElementSibling;
            if (expandableRow && expandableRow.classList.contains('expandable-row')) {
                if (isCurrentlyExpanded) {
                    expandableRow.remove();
                } else {
                    // La fila ya existe, solo cargar bloques
                    await this.cargarBloques(userId, tipo);
                }
            } else if (!isCurrentlyExpanded) {
                // Crear nueva fila expandible
                await this.crearFilaExpandible(row, userId, tipo);
            }
        }
    }

    /**
     * Crea una fila expandible para mostrar bloques
     * @param {Element} parentRow - Fila padre
     * @param {number} userId - ID del usuario
     * @param {string} tipo - Tipo de usuario
     */
    async crearFilaExpandible(parentRow, userId, tipo) {
        const colspan = this.panelType === 'PAP' ? 10 : 9;
        const expandableRow = document.createElement('tr');
        expandableRow.className = 'expandable-row show';
        expandableRow.dataset.userId = userId;
        expandableRow.innerHTML = `
            <td colspan="${colspan}">
                <div id="${tipo}-blocks-${userId}" class="blocks-container">
                    <div class="loading">Cargando bloques...</div>
                </div>
            </td>
        `;
        
        parentRow.insertAdjacentElement('afterend', expandableRow);
        await this.cargarBloques(userId, tipo);
    }

    /**
     * Carga y renderiza los bloques de un usuario
     * @param {number} userId - ID del usuario
     * @param {string} tipo - 'profesor' | 'creador'
     */
    async cargarBloques(userId, tipo) {
        const containerId = `${tipo}-blocks-${userId}`;
        const container = document.getElementById(containerId);
        
        if (!container) return;

        try {
            console.log(`📚 Cargando bloques para ${tipo} ID: ${userId}`);
            
            const endpoint = `/roles-updated/${tipo}s/${userId}/bloques`;
            const result = await this.apiService.apiCall(endpoint);
            const bloques = result.bloques || [];
            
            if (bloques.length === 0) {
                container.innerHTML = '<p style="padding: 20px; text-align: center; color: #778DA9;">No tiene bloques públicos creados</p>';
                return;
            }

            const etiquetaUsuarios = tipo === 'profesor' ? 'Alumnos' : 'Estudiantes';
            let html = `
                <div style="padding: 10px; background: #0D1B2A;">
                    <h4>Bloques creados:</h4>
                    <table class="nested-table" style="margin-top: 10px;">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Bloque</th>
                                <th>Temas</th>
                                <th>Preguntas</th>
                                <th>${etiquetaUsuarios}</th>
                                <th>Fecha Creación</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            bloques.forEach(bloque => {
                const isBlockExpanded = this.expandedBlocks.has(`block-${bloque.id}`);
                html += `
                    <tr>
                        <td>
                            <button class="btn btn-expand" onclick="adminPanelSection.toggleBlockExpansion(${bloque.id})" 
                                    style="font-size: 18px; padding: 4px 8px;">
                                ${isBlockExpanded ? '−' : '+'}
                            </button>
                        </td>
                        <td><strong>${bloque.name}</strong></td>
                        <td>${bloque.num_temas || 0}</td>
                        <td>${bloque.total_preguntas || 0}</td>
                        <td>${bloque.usuarios_bloque || 0}</td>
                        <td>${bloque.created_at ? new Date(bloque.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                `;
                
                // Fila de temas si está expandido
                if (isBlockExpanded) {
                    html += `
                        <tr id="block-expansion-${bloque.id}" class="block-topics-row">
                            <td colspan="6">
                                <div id="block-topics-${bloque.id}">
                                    <div class="loading">Cargando temas...</div>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Cargar temas para bloques expandidos
            for (const bloque of bloques) {
                if (this.expandedBlocks.has(`block-${bloque.id}`)) {
                    await this.cargarTemas(bloque.id);
                }
            }
            
        } catch (error) {
            console.error('Error cargando bloques:', error);
            container.innerHTML = '<p style="color: #EF4444; padding: 20px;">Error al cargar los bloques</p>';
        }
    }

    /**
     * Alterna la expansión de un bloque para mostrar temas
     * @param {number} blockId - ID del bloque
     */
    async toggleBlockExpansion(blockId) {
        const key = `block-${blockId}`;
        const isExpanded = this.expandedBlocks.has(key);
        
        if (isExpanded) {
            this.expandedBlocks.delete(key);
            const expansionRow = document.getElementById(`block-expansion-${blockId}`);
            if (expansionRow) {
                expansionRow.remove();
            }
        } else {
            this.expandedBlocks.add(key);
            await this.crearFilaTemas(blockId);
        }
        
        // Actualizar botón
        const button = document.querySelector(`button[onclick="adminPanelSection.toggleBlockExpansion(${blockId})"]`);
        if (button) {
            button.textContent = isExpanded ? '+' : '−';
        }
    }

    /**
     * Crea una fila para mostrar los temas de un bloque
     * @param {number} blockId - ID del bloque
     */
    async crearFilaTemas(blockId) {
        const button = document.querySelector(`button[onclick="adminPanelSection.toggleBlockExpansion(${blockId})"]`);
        if (!button) return;
        
        const parentRow = button.closest('tr');
        const expansionRow = document.createElement('tr');
        expansionRow.id = `block-expansion-${blockId}`;
        expansionRow.className = 'block-topics-row';
        expansionRow.innerHTML = `
            <td colspan="6">
                <div id="block-topics-${blockId}">
                    <div class="loading">Cargando temas...</div>
                </div>
            </td>
        `;
        
        parentRow.insertAdjacentElement('afterend', expansionRow);
        await this.cargarTemas(blockId);
    }

    /**
     * Carga y renderiza los temas de un bloque
     * @param {number} blockId - ID del bloque
     */
    async cargarTemas(blockId) {
        const container = document.getElementById(`block-topics-${blockId}`);
        if (!container) return;
        
        try {
            console.log(`📝 Cargando temas para bloque ID: ${blockId}`);
            
            const result = await this.apiService.apiCall(`/roles-updated/bloques/${blockId}/topics`);
            const temas = result.topics || result.temas || [];
            
            if (temas.length === 0) {
                container.innerHTML = '<p style="padding: 10px;">No tiene temas creados</p>';
                return;
            }
            
            let html = `
                <div style="padding: 10px; background: #1B263B;">
                    <h5>Temas del bloque:</h5>
                    <table class="nested-table" style="margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Tema</th>
                                <th>Preguntas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            temas.forEach(tema => {
                // Nombre del tema (de columna topic de tabla topic_answers)
                const nombreTema = tema.topic || tema.name || 'Sin nombre';
                // Número de preguntas (de columna total_questions de tabla topic_answers)
                const numPreguntas = tema.total_questions || tema.num_preguntas || 0;
                
                html += `
                    <tr>
                        <td><strong>${nombreTema}</strong></td>
                        <td>${numPreguntas}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error cargando temas:', error);
            container.innerHTML = '<p style="color: #EF4444; padding: 10px;">Error al cargar los temas</p>';
        }
    }

    /**
     * Reasigna un usuario a otro administrador (solo PAP)
     * @param {number} userId - ID del usuario
     * @param {number} adminId - ID del nuevo administrador
     */
    async reasignarUsuario(userId, adminId) {
        if (this.panelType !== 'PAP') return;
        
        try {
            console.log(`🔄 Reasignando usuario ${userId} al administrador ${adminId}`);
            // Implementar la lógica de reasignación
            // Por ahora solo log
        } catch (error) {
            console.error('Error reasignando usuario:', error);
        }
    }

    /**
     * Elimina un usuario
     * @param {number} userId - ID del usuario
     * @param {string} nickname - Nickname del usuario
     */
    async eliminarUsuario(userId, nickname) {
        if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${nickname}?`)) {
            try {
                console.log(`🗑️ Eliminando usuario ${userId} (${nickname})`);
                // Implementar la lógica de eliminación
                // Por ahora solo log
            } catch (error) {
                console.error('Error eliminando usuario:', error);
            }
        }
    }
}

// Crear instancia global
window.adminPanelSection = new AdminPanelSection();

// Export para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelSection;
}