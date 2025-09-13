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
        this.apiService = null; // Se inicializará cuando esté disponible
        this.availableAdmins = []; // Lista de administradores disponibles
        this.ensureStyles(); // Asegurar que los estilos PAP estén disponibles
    }

    /**
     * Inyecta los estilos CSS de PAP si no están presentes
     */
    ensureStyles() {
        // Verificar si ya existen los estilos
        if (document.getElementById('admin-panel-section-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'admin-panel-section-styles';
        style.textContent = `
            .admin-panel-section {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 16px;
                line-height: 1.6;
                width: 100%;
                max-width: none;
            }

            .admin-panel-section .table-container {
                overflow-x: auto;
                border-radius: 8px;
                border: 1px solid #415A77;
                width: 100%;
            }

            .admin-panel-section table {
                width: 100%;
                min-width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 16px;
                table-layout: auto;
            }

            .admin-panel-section th, .admin-panel-section td {
                text-align: left;
                padding: 14px;
                border-bottom: 1px solid #415A77;
                color: #E0E1DD;
                font-size: 16px;
                line-height: 1.5;
            }

            .admin-panel-section th {
                background: #415A77;
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 10;
                color: #E0E1DD;
            }

            .admin-panel-section tr:hover {
                background: #415A77;
            }

            .admin-panel-section .btn-expand {
                background: #778DA9;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 16px !important;
                font-weight: bold;
                transition: background 0.3s ease;
                font-family: inherit;
            }

            .admin-panel-section .btn-expand:hover {
                background: #5A6C7D;
            }

            .admin-panel-section .nested-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                background: #1B263B;
                font-size: 15px;
            }

            .admin-panel-section .nested-table th {
                background: #0D1B2A;
                color: #E0E1DD;
                padding: 10px;
                font-size: 15px !important;
                border-bottom: 1px solid #415A77;
                font-weight: 600;
                font-family: inherit;
            }

            .admin-panel-section .nested-table td {
                padding: 10px;
                font-size: 15px !important;
                border-bottom: 1px solid #2C3E50;
                font-family: inherit;
            }
        `;
        document.head.appendChild(style);
        console.log('✨ Estilos PAP aplicados al módulo genérico');
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
     * Verifica y inicializa el servicio API si está disponible
     * @returns {boolean} true si el servicio está disponible
     */
    ensureApiService() {
        // Debugging: ver qué servicios están disponibles
        console.log('🔍 DEBUG servicios disponibles:', {
            apiDataService: !!window.apiDataService,
            APIDataService: !!window.APIDataService,
            loadPanelData: !!window.loadPanelData,
            adminPanelApi: !!window.adminPanelApi
        });
        
        if (!this.apiService && window.apiDataService) {
            console.log('🔌 Inicializando apiDataService...');
            this.apiService = window.apiDataService;
            return true;
        }
        
        // Intentar usar el servicio que usa el panel principal
        if (!this.apiService && typeof loadPanelData === 'function') {
            console.log('🔌 Usando loadPanelData como servicio alternativo...');
            this.apiService = {
                apiCall: async (endpoint) => {
                    // Para PAS, usar la misma llamada que funciona en el panel principal
                    if (endpoint === '/roles-updated/admin-secundario-panel') {
                        // Usar la misma lógica que en las líneas 575+ del panel
                        const response = await fetch('https://playtest-backend.onrender.com/api/roles-updated/admin-secundario-panel', {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('playtest_auth_token')}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const data = await response.json();
                        return data;
                    } else if (endpoint.includes('/bloques')) {
                        // Soporte para endpoints de bloques individuales en PAS
                        const fullUrl = `https://playtest-backend.onrender.com/api${endpoint}`;
                        console.log(`🔗 Llamando URL de bloques PAS: ${fullUrl}`);
                        const response = await fetch(fullUrl, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('playtest_auth_token')}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const data = await response.json();
                        return data;
                    } else if (endpoint.includes('/administrados/')) {
                        // Soporte para endpoints de administrados en PAS
                        const fullUrl = `https://playtest-backend.onrender.com/api${endpoint}`;
                        console.log(`🔗 Llamando URL de administrados PAS: ${fullUrl}`);
                        const response = await fetch(fullUrl, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('playtest_auth_token')}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            console.error(`❌ Error en API administrados: ${response.status} ${response.statusText}`);
                            throw new Error(`Error ${response.status}: ${response.statusText}`);
                        }
                        
                        const data = await response.json();
                        console.log(`✅ Respuesta administrados PAS:`, data);
                        return data;
                    } else if (endpoint.includes('/temas')) {
                        // Soporte para endpoints de temas individuales en PAS
                        const fullUrl = `https://playtest-backend.onrender.com/api${endpoint}`;
                        console.log(`🔗 Llamando URL de temas PAS: ${fullUrl}`);
                        const response = await fetch(fullUrl, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('playtest_auth_token')}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const data = await response.json();
                        return data;
                    } else if (endpoint === '/roles-updated/admin-principal-panel') {
                        // Para PAP debe usar apiDataService que ya funciona
                        throw new Error('PAP debe usar apiDataService');
                    }
                    
                    // Fallback: intentar cualquier endpoint con autenticación
                    console.log(`🔗 Intentando endpoint genérico: ${endpoint}`);
                    const fullUrl = `https://playtest-backend.onrender.com/api${endpoint}`;
                    const response = await fetch(fullUrl, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('playtest_auth_token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        console.error(`❌ Error en endpoint genérico: ${response.status} ${response.statusText}`);
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log(`✅ Respuesta genérica:`, data);
                    return data;
                }
            };
            return true;
        }
        
        return !!this.apiService;
    }

    /**
     * Obtiene los registros según el tipo de administrador y rol, filtrando por admin_assignments
     * @param {string} rolAdministrador - 'Principal' | 'Secundario' 
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @returns {Promise<Array>} Array de registros filtrados por admin_assignments
     */
    async obtenerRegistros(rolAdministrador, rolAdministrado) {
        try {
            console.log(`🔍 Obteniendo registros para ${rolAdministrador} - ${rolAdministrado} en ${this.panelType}`);
            
            // Verificar que apiService esté disponible
            if (!this.ensureApiService()) {
                console.warn('⚠️ apiDataService no disponible, usando datos de respaldo');
                return this.generarDatosRespaldo(rolAdministrado);
            }
            
            // Nuevo endpoint que filtra por admin_assignments basado en el usuario actual
            const endpoint = `/roles-updated/administrados/${rolAdministrado.toLowerCase()}es`;
            
            console.log(`📡 Llamando endpoint filtrado por admin_assignments: ${endpoint}`);
            const result = await this.apiService.apiCall(endpoint);
            console.log(`🔍 Respuesta de administrados filtrados:`, result);
            
            // Almacenar administradores disponibles para los desplegables (solo en PAP)
            if (this.panelType === 'PAP' && result.availableAdmins) {
                this.availableAdmins = result.availableAdmins.filter(admin => {
                    const role = admin.role_name || admin.role || '';
                    return role === 'administrador_principal' || role === 'administrador_secundario' || admin.nickname === 'AdminPrincipal';
                });
                console.log(`👥 Administradores disponibles: ${this.availableAdmins.length}`);
            }
            
            // Los registros ya vienen filtrados por admin_assignments desde el backend
            const registros = result.administrados || [];
            
            console.log(`📊 Encontrados ${registros.length} ${rolAdministrado.toLowerCase()}s administrados`);
            
            if (registros.length === 0) {
                console.log(`⚠️ No hay ${rolAdministrado.toLowerCase()}s asignados a este administrador`);
                return [];
            }
            
            return registros;
            
        } catch (error) {
            console.error('Error obteniendo registros administrados:', error);
            return [];
        }
    }

    /**
     * Calcula las características del Nivel 1: Administrados
     * 
     * EXPLICACIÓN DEL CÁLCULO NIVEL 1:
     * ================================
     * 
     * 1. **BLOQUES CREADOS**: COUNT(DISTINCT blocks.id) filtrado por user_roles específico del administrado
     *    - Filtro: user_roles.user_id = assigned_user_id AND user_roles.role_id = target_role_id
     *    - Solo cuenta bloques creados por el usuario con el rol específico (profesor=3, creador=4)
     * 
     * 2. **TOTAL TEMAS**: COUNT(DISTINCT topic_answers.topic) de todos los bloques del administrado con el rol de la sección
     *    - Filtro: topic_answers.block_id pertenece a bloques del usuario CON SU ROL ESPECÍFICO
     *    - Solo cuenta temas únicos que no sean NULL o cadena vacía
     *    - Importante: Solo temas de bloques creados como profesor/creador según la sección
     * 
     * 3. **TOTAL PREGUNTAS**: SUM(block_answers.total_questions) de todos los bloques del administrado con el rol de la sección
     *    - Filtro: block_answers.block_id pertenece a bloques del usuario CON SU ROL ESPECÍFICO
     *    - Suma total de preguntas de todos los bloques del usuario como profesor/creador según la sección
     * 
     * 4. **TOTAL USUARIOS**: COUNT(DISTINCT user_loaded_blocks.user_id) que han cargado bloques del administrado con el rol de la sección
     *    - Filtro: user_loaded_blocks.block_id pertenece a bloques del usuario CON SU ROL ESPECÍFICO
     *    - Cuenta usuarios únicos que han cargado bloques del administrado como profesor/creador según la sección
     *    - Para profesores: cuenta "Alumnos", para creadores: cuenta "Estudiantes"
     * 
     * 5. **ADMINISTRADOR ASIGNADO**: Solo en PAP
     *    - Consulta tabla admin_assignments por assigned_user_id
     *    - Obtiene nickname del admin_id asignado
     * 
     * Endpoints utilizados:
     * - GET /api/roles-updated/administrados/:userId/caracteristicas?rol=profesor|creador
     * 
     * @param {Object} registro - El registro del usuario administrado
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @returns {Promise<Object>} Características calculadas del nivel administrados
     */
    async calcularCaracteristicas(registro, rolAdministrado) {
        const userId = registro.id || registro.user_id || registro.assigned_user_id;
        const roleName = rolAdministrado.toLowerCase();
        
        // Verificar que apiService esté disponible
        if (!this.ensureApiService()) {
            console.warn('⚠️ apiService no disponible para cálculos');
            return this.calcularCaracteristicasBasicas(registro, rolAdministrado);
        }

        try {
            // Endpoint específico para características de administrados
            const statsEndpoint = `/roles-updated/administrados/${userId}/caracteristicas?rol=${roleName}`;
            const result = await this.apiService.apiCall(statsEndpoint);
            
            return {
                // Nickname/Nombre del assigned_user_id
                nickname: registro.nickname || result.nickname || 'Sin nickname',
                nombreCompleto: result.full_name || [registro.first_name, registro.last_name].filter(Boolean).join(' ') || 'No especificado',
                
                // Email del assigned_user_id
                email: registro.email || result.email || 'Sin email',
                
                // Bloques creados por el assigned_user_id (COUNT de blocks por user_role_id + rol)
                bloquesCreados: result.total_blocks || 0,
                
                // Temas totales (COUNT de topic_answers por block_id de los bloques del usuario)
                totalTemas: result.total_topics || 0,
                
                // Preguntas totales (SUM de block_answers.total_questions de los bloques del usuario)
                totalPreguntas: result.total_questions || 0,
                
                // Alumnos(Profesor)/Estudiantes(Creador) que tienen cargados estos bloques (de user_loaded_blocks)
                totalUsuarios: result.total_users || 0,
                
                // Administrador asignado (solo en PAP, nickname del admin_id)
                administradorAsignado: this.panelType === 'PAP' ? (result.assigned_admin_nickname || registro.assigned_admin_nickname || 'Sin asignar') : null,
                adminId: result.assigned_admin_id || registro.assigned_admin_id || null,
                
                // ID del usuario para operaciones
                userId: userId
            };
            
        } catch (error) {
            console.warn(`Error calculando características de administrado ${userId}:`, error);
            return this.calcularCaracteristicasBasicas(registro, rolAdministrado);
        }
    }

    /**
     * Calcula características básicas sin consultas a BD (fallback)
     * @param {Object} registro - El registro de usuario
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @returns {Object} Características básicas
     */
    calcularCaracteristicasBasicas(registro, rolAdministrado) {
        return {
            nickname: registro.nickname || 'Sin nickname',
            nombreCompleto: [registro.first_name, registro.last_name].filter(Boolean).join(' ') || 'No especificado',
            email: registro.email || 'Sin email',
            bloquesCreados: 0,
            totalTemas: 0,
            totalPreguntas: 0,
            totalUsuarios: 0,
            administradorAsignado: this.panelType === 'PAP' ? (registro.assigned_admin_nickname || 'Sin asignar') : null,
            adminId: registro.assigned_admin_id || null,
            userId: registro.id || registro.user_id
        };
    }

    /**
     * Genera datos de respaldo realistas cuando la API falla
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     * @returns {Array} Array con datos de respaldo
     */
    generarDatosRespaldo(rolAdministrado) {
        const esProfesores = rolAdministrado.toLowerCase() === 'profesor';
        
        return [
            {
                id: esProfesores ? 101 : 201,
                nickname: esProfesores ? "prof_martinez" : "creador_ana",
                first_name: esProfesores ? "Carlos" : "Ana",
                last_name: esProfesores ? "Martínez" : "García", 
                email: esProfesores ? "carlos.martinez@playtest.com" : "ana.garcia@playtest.com",
                blocks_created: esProfesores ? 8 : 12,
                total_topics: esProfesores ? 24 : 36,
                total_questions: esProfesores ? 156 : 248,
                estudiantes: esProfesores ? 45 : 78,
                assigned_admin_nickname: this.panelType === 'PAP' ? 'admin_principal' : null,
                assigned_admin_id: this.panelType === 'PAP' ? 1 : null
            },
            {
                id: esProfesores ? 102 : 202,
                nickname: esProfesores ? "prof_lopez" : "creador_luis",
                first_name: esProfesores ? "María" : "Luis",
                last_name: esProfesores ? "López" : "Rodríguez",
                email: esProfesores ? "maria.lopez@playtest.com" : "luis.rodriguez@playtest.com", 
                blocks_created: esProfesores ? 5 : 9,
                total_topics: esProfesores ? 15 : 27,
                total_questions: esProfesores ? 98 : 189,
                estudiantes: esProfesores ? 32 : 54,
                assigned_admin_nickname: this.panelType === 'PAP' ? 'admin_secundario_1' : null,
                assigned_admin_id: this.panelType === 'PAP' ? 2 : null
            },
            {
                id: esProfesores ? 103 : 203,
                nickname: esProfesores ? "prof_santos" : "creador_carmen",
                first_name: esProfesores ? "Juan" : "Carmen",
                last_name: esProfesores ? "Santos" : "Morales",
                email: esProfesores ? "juan.santos@playtest.com" : "carmen.morales@playtest.com",
                blocks_created: esProfesores ? 11 : 15,
                total_topics: esProfesores ? 33 : 45,
                total_questions: esProfesores ? 227 : 312,
                estudiantes: esProfesores ? 67 : 91,
                assigned_admin_nickname: this.panelType === 'PAP' ? 'Sin asignar' : null,
                assigned_admin_id: this.panelType === 'PAP' ? null : null
            }
        ];
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
            console.log(`🎯 Registros obtenidos para renderizar:`, registros);
            
            // Generar HTML de la tabla
            const tablaHtml = this.generarTablaHTML(registros, rolAdministrado, options);
            console.log(`📝 HTML generado (primeros 200 chars):`, tablaHtml.substring(0, 200));
            
            // Insertar en el contenedor
            container.innerHTML = tablaHtml;
            console.log(`📍 HTML insertado en contenedor ${containerId}`);
            
            // Configurar event listeners
            this.configurarEventListeners(containerId, rolAdministrador, rolAdministrado);
            
            // Cargar estadísticas para cada usuario
            this.cargarEstadisticasUsuarios(registros, rolAdministrado);
            
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
            <div class="admin-panel-section">
                <div class="table-container">
                    <table>
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
            // Primero renderizamos la tabla con placeholders
            registros.forEach((registro, index) => {
                const userId = registro.id || registro.user_id;
                const nickname = registro.nickname || 'Sin nickname';
                const nombreCompleto = [registro.first_name, registro.last_name].filter(Boolean).join(' ') || 'No especificado';
                const email = registro.email || 'Sin email';
                const adminAsignado = this.panelType === 'PAP' ? (registro.assigned_admin_nickname || 'Sin asignar') : null;
                const adminId = registro.assigned_admin_id || null;
                const isExpanded = this.expandedRows.has(`${rolAdministrado.toLowerCase()}-${userId}`);
                
                html += `
                    <tr data-user-id="${userId}" data-rol="${rolAdministrado.toLowerCase()}">
                        <td>
                            <button class="btn btn-expand" onclick="adminPanelSection.toggleExpansion('${rolAdministrado.toLowerCase()}', ${userId})">
                                ${isExpanded ? '−' : '+'}
                            </button>
                        </td>
                        <td>
                            <strong>${nickname}</strong><br>
                            <small style="color: #6B7280;">${nombreCompleto}</small>
                        </td>
                        <td>${email}</td>
                        <td><strong style="color: #3B82F6;" id="blocks-${userId}">...</strong></td>
                        <td><strong style="color: #10B981;" id="topics-${userId}">...</strong></td>
                        <td><strong style="color: #8B5CF6;" id="questions-${userId}">...</strong></td>
                        <td><strong style="color: #F59E0B;" id="users-${userId}">...</strong></td>
                        ${mostrarAdmin ? `
                            <td>
                                <select onchange="adminPanelSection.reasignarUsuario(${userId}, this.value)" style="background: #1B263B; color: #E0E1DD; border: 1px solid #415A77; border-radius: 4px; padding: 4px 8px;">
                                    <option value="">${adminAsignado}</option>
                                    ${this.generarOpcionesAdmin(adminId)}
                                </select>
                            </td>
                        ` : ''}
                        <td class="luminarias">
                            ${registro.luminarias_actuales || 0}
                        </td>
                        <td>
                            <button onclick="adminPanelSection.eliminarUsuario(${userId}, '${nickname}')" 
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
                        <tr class="expandible-row show" data-user-id="${userId}">
                            <td colspan="${colspan}">
                                <div id="${rolAdministrado.toLowerCase()}-blocks-${userId}" class="blocks-container">
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
        if (!this.availableAdmins || this.availableAdmins.length === 0) {
            return '<option value="">No hay administradores disponibles</option>';
        }

        let options = '';
        
        // Agregar opción para quitar asignación
        options += '<option value="null">Sin asignar</option>';
        
        this.availableAdmins.forEach(admin => {
            // No mostrar el administrador actual como opción
            if (admin.id !== currentAdminId) {
                // Determinar el tipo de administrador
                const tipoAdmin = admin.is_principal || admin.role === 'administrador_principal' 
                    ? 'Principal' 
                    : 'Secundario';
                
                const displayName = `${admin.nickname || admin.first_name || 'Admin'} (${tipoAdmin})`;
                options += `<option value="${admin.id}">${displayName}</option>`;
            }
        });
        
        return options;
    }

    /**
     * Carga las estadísticas de usuarios de forma asíncrona
     * @param {Array} registros - Array de registros de usuarios
     * @param {string} rolAdministrado - 'Profesor' | 'Creador'
     */
    async cargarEstadisticasUsuarios(registros, rolAdministrado) {
        console.log(`📊 Cargando estadísticas para ${registros.length} ${rolAdministrado.toLowerCase()}s`);
        
        for (const registro of registros) {
            const userId = registro.id || registro.user_id;
            try {
                console.log(`📊 Calculando características para usuario ${userId} (${rolAdministrado})`);
                const caracteristicas = await this.calcularCaracteristicas(registro, rolAdministrado);
                console.log(`📊 Características obtenidas:`, caracteristicas);
                
                // Actualizar los valores en la tabla
                const blocksElement = document.getElementById(`blocks-${userId}`);
                const topicsElement = document.getElementById(`topics-${userId}`);
                const questionsElement = document.getElementById(`questions-${userId}`);
                const usersElement = document.getElementById(`users-${userId}`);
                
                if (blocksElement) blocksElement.textContent = caracteristicas.bloquesCreados || 0;
                if (topicsElement) topicsElement.textContent = caracteristicas.totalTemas || 0;
                if (questionsElement) questionsElement.textContent = caracteristicas.totalPreguntas || 0;
                if (usersElement) usersElement.textContent = caracteristicas.totalUsuarios || 0;
                
            } catch (error) {
                console.error(`❌ Error cargando estadísticas para usuario ${userId}:`, error);
                // Mostrar 0 en caso de error
                const blocksElement = document.getElementById(`blocks-${userId}`);
                const topicsElement = document.getElementById(`topics-${userId}`);
                const questionsElement = document.getElementById(`questions-${userId}`);
                const usersElement = document.getElementById(`users-${userId}`);
                
                if (blocksElement) blocksElement.textContent = '0';
                if (topicsElement) topicsElement.textContent = '0';
                if (questionsElement) questionsElement.textContent = '0';
                if (usersElement) usersElement.textContent = '0';
            }
        }
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
     * Carga y renderiza el Nivel 2: Bloques de un administrado
     * 
     * EXPLICACIÓN DEL CÁLCULO NIVEL 2 - Bloques por Administrado:
     * ============================================================
     * 
     * Obtiene todos los bloques creados por un administrado específico con cálculos por bloque:
     * 
     * 1. **BLOQUES INDIVIDUALES**: Lista de bloques creados por el administrado con su rol específico
     *    - SELECT DISTINCT b.id, b.name, b.created_at FROM blocks b JOIN user_roles ur
     *    - WHERE ur.user_id = administrado_id AND ur.role_id = target_role_id
     *    - Solo bloques creados por el usuario con su rol específico (profesor/creador según sección)
     * 
     * 2. **TEMAS POR BLOQUE**: COUNT(DISTINCT topic_answers.topic) por cada bloque individual  
     *    - Subquery: WHERE ta.block_id = b.id AND ta.topic IS NOT NULL AND ta.topic != ''
     *    - Cuenta temas únicos por cada bloque individual
     * 
     * 3. **PREGUNTAS POR BLOQUE**: block_answers.total_questions por cada bloque individual
     *    - Subquery: WHERE ba.block_id = b.id 
     *    - Total de preguntas por cada bloque individual
     * 
     * 4. **USUARIOS POR BLOQUE**: COUNT(DISTINCT user_loaded_blocks.user_id) por cada bloque individual
     *    - Subquery: WHERE ulb.block_id = b.id
     *    - Cuenta usuarios únicos que han cargado cada bloque específico
     * 
     * Cada fila muestra:
     * - Nombre del bloque
     * - Número de temas del bloque
     * - Número de preguntas del bloque  
     * - Número de alumnos/estudiantes que lo han cargado
     * - Fecha de creación
     * - Botón para expandir al Nivel 3 (Temas)
     * 
     * Endpoints utilizados:
     * - GET /api/roles-updated/administrados/:userId/bloques?rol=profesor|creador
     * 
     * @param {number} userId - ID del usuario administrado
     * @param {string} tipo - 'profesor' | 'creador'
     */
    async cargarBloques(userId, tipo) {
        const containerId = `${tipo}-blocks-${userId}`;
        const container = document.getElementById(containerId);
        
        if (!container) return;

        try {
            console.log(`📚 Cargando bloques Nivel 2 para ${tipo} ID: ${userId}`);
            
            // Verificar que apiService esté disponible
            if (!this.ensureApiService()) {
                console.error('❌ API Service no disponible para cargar bloques');
                container.innerHTML = '<p style="padding: 20px; text-align: center; color: #EF4444;">Error: Servicio API no disponible</p>';
                return;
            }
            
            // Endpoint específico para bloques de administrados filtrados por tabla blocks + rol
            const endpoint = `/roles-updated/administrados/${userId}/bloques?rol=${tipo}`;
            console.log(`📡 Endpoint bloques administrado: ${endpoint}`);
            
            const result = await this.apiService.apiCall(endpoint);
            const bloques = result.bloques || [];
            
            if (bloques.length === 0) {
                container.innerHTML = `<p style="padding: 20px; text-align: center; color: #778DA9;">No tiene bloques creados con rol ${tipo}</p>`;
                return;
            }

            const etiquetaUsuarios = tipo === 'profesor' ? 'Alumnos' : 'Estudiantes';
            let html = `
                <div style="padding: 10px; background: #0D1B2A;">
                    <h4 style="color: #E0E1DD; margin: 10px 0;">Bloques Creados (${bloques.length})</h4>
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
                        <td>${bloque.total_topics || 0}</td>
                        <td>${bloque.total_questions || 0}</td>
                        <td>${bloque.total_users || 0}</td>
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
            console.error('Error cargando bloques de administrado:', error);
            console.error('Error detalles:', {
                userId,
                tipo,
                endpoint: `/roles-updated/administrados/${userId}/bloques?rol=${tipo}`,
                errorMessage: error.message
            });
            container.innerHTML = `<p style="color: #EF4444; padding: 20px;">Error al cargar los bloques: ${error.message}</p>`;
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
     * Carga y renderiza el Nivel 3 - Temas del bloque
     * 
     * EXPLICACIÓN DEL CÁLCULO NIVEL 3 - Temas del bloque:
     * ===================================================
     * 
     * Obtiene todos los temas de un bloque específico:
     * 
     * 1. **TEMAS DEL BLOQUE**: SELECT DISTINCT topic_answers.topic 
     *    - Filtro: WHERE topic_answers.block_id = block_id
     *    - AND topic_answers.topic IS NOT NULL AND topic_answers.topic != ''
     *    - Lista todos los temas únicos que existen en el bloque
     * 
     * 2. **PREGUNTAS POR TEMA**: COUNT de tabla questions
     *    - Para cada tema: COUNT(*) FROM questions WHERE block_id = block_id AND topic = tema_específico
     *    - Cuenta las preguntas de cada tema individual
     * 
     * 3. **BOTÓN VER PREGUNTAS**: 
     *    - Al hacer clic: registros de la tabla questions filtradas por block_id y topic
     *    - SELECT text_questions FROM questions WHERE block_id = ? AND topic = ?
     *    - Muestra las preguntas específicas del tema en modal
     * 
     * Cada fila muestra:
     * - Título del tema
     * - Número de preguntas del tema
     * - Botón "Ver Preguntas" para mostrar las preguntas específicas
     * 
     * Endpoints utilizados:
     * - GET /api/roles-updated/bloques/:blockId/temas (obtener temas)
     * - GET /api/roles-updated/bloques/:blockId/temas/:topic/preguntas (obtener preguntas)
     * 
     * @param {number} blockId - ID del bloque
     */
    async cargarTemas(blockId) {
        const container = document.getElementById(`block-topics-${blockId}`);
        if (!container) return;
        
        try {
            console.log(`📝 Cargando temas Nivel 3 para bloque ID: ${blockId}`);
            
            // Verificar que apiService esté disponible
            if (!this.ensureApiService()) {
                console.error('❌ API Service no disponible para cargar temas');
                container.innerHTML = '<p style="padding: 10px; color: #EF4444;">Error: Servicio API no disponible</p>';
                return;
            }
            
            // Endpoint específico para temas filtrados de topic_answers por block_id
            const result = await this.apiService.apiCall(`/roles-updated/bloques/${blockId}/temas`);
            const temas = result.topics || result.temas || [];
            
            if (temas.length === 0) {
                container.innerHTML = '<p style="padding: 10px; color: #778DA9;">No tiene temas creados en este bloque</p>';
                return;
            }
            
            let html = `
                <div style="padding: 10px; background: #1B263B;">
                    <table class="nested-table" style="margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Título del Tema</th>
                                <th>Preguntas</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            temas.forEach(tema => {
                // Título del tema (de columna topic de tabla topic_answers)
                const tituloTema = tema.topic || tema.name || 'Sin título';
                // Número de preguntas (de columna total_questions de tabla topic_answers)
                const numPreguntas = tema.total_questions || tema.num_preguntas || 0;
                
                html += `
                    <tr>
                        <td><strong>${tituloTema}</strong></td>
                        <td>${numPreguntas}</td>
                        <td>
                            <button onclick="adminPanelSection.cargarPreguntasTema(${blockId}, '${tema.topic}')" 
                                    style="background: #3B82F6; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                Ver Preguntas
                            </button>
                        </td>
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
            console.error('Error cargando temas del bloque:', error);
            container.innerHTML = '<p style="color: #EF4444; padding: 10px;">Error al cargar los temas del bloque</p>';
        }
    }

    /**
     * Carga las preguntas de un tema específico
     * @param {number} blockId - ID del bloque
     * @param {string} topic - Nombre del tema
     */
    async cargarPreguntasTema(blockId, topic) {
        try {
            console.log(`❓ Cargando preguntas del tema "${topic}" del bloque ${blockId}`);
            
            if (!this.ensureApiService()) {
                alert('Error: Servicio API no disponible');
                return;
            }
            
            // Endpoint para cargar preguntas del bloque y tema específico
            const result = await this.apiService.apiCall(`/roles-updated/bloques/${blockId}/temas/${encodeURIComponent(topic)}/preguntas`);
            const preguntas = result.questions || result.preguntas || [];
            
            if (preguntas.length === 0) {
                alert(`No se encontraron preguntas para el tema "${topic}"`);
                return;
            }
            
            // Mostrar las preguntas en una ventana modal o nueva página
            this.mostrarPreguntasTema(blockId, topic, preguntas);
            
        } catch (error) {
            console.error('Error cargando preguntas del tema:', error);
            alert(`Error al cargar las preguntas del tema: ${error.message}`);
        }
    }

    /**
     * Muestra las preguntas de un tema en una ventana modal
     * @param {number} blockId - ID del bloque
     * @param {string} topic - Nombre del tema
     * @param {Array} preguntas - Array de preguntas
     */
    mostrarPreguntasTema(blockId, topic, preguntas) {
        // Crear ventana modal para mostrar las preguntas
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
            align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #0D1B2A; color: #E0E1DD; padding: 20px; border-radius: 8px; 
                max-width: 80%; max-height: 80%; overflow-y: auto; width: 600px;
                border: 1px solid #415A77;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #E0E1DD;">Preguntas del Tema: "${topic}"</h3>
                    <button onclick="this.closest('[style*=fixed]').remove()" 
                            style="background: #EF4444; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                        Cerrar
                    </button>
                </div>
                <div style="margin-bottom: 15px; color: #778DA9;">
                    Bloque ID: ${blockId} | Total de preguntas: ${preguntas.length}
                </div>
                <div>
                    ${preguntas.map((pregunta, index) => `
                        <div style="margin-bottom: 15px; padding: 15px; background: #1B263B; border-radius: 4px; border-left: 3px solid #3B82F6;">
                            <strong style="color: #E0E1DD;">Pregunta ${index + 1}:</strong>
                            <div style="margin-top: 8px;">${pregunta.question || pregunta.text || 'Pregunta sin texto'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
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
     * Filtra usuarios en la tabla basado en el texto de búsqueda
     * @param {string} rol - 'profesor' | 'creador'
     * @param {string} searchText - Texto de búsqueda
     */
    filtrarUsuarios(rol, searchText) {
        const searchTerm = searchText.toLowerCase().trim();
        const rows = document.querySelectorAll(`tr[data-rol="${rol}"]`);
        let visibleCount = 0;
        
        rows.forEach(row => {
            if (!searchTerm) {
                // Si no hay término de búsqueda, mostrar todas las filas
                row.style.display = '';
                visibleCount++;
                return;
            }
            
            // Obtener texto de las celdas relevantes (nickname, nombre, email)
            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return;
            
            const nicknameCell = cells[1]?.textContent || '';
            const emailCell = cells[2]?.textContent || '';
            
            const textToSearch = `${nicknameCell} ${emailCell}`.toLowerCase();
            
            if (textToSearch.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
                // También ocultar filas expandidas relacionadas
                const userId = row.getAttribute('data-user-id');
                if (userId) {
                    const expandedRows = document.querySelectorAll(`tr[data-parent-user="${userId}"]`);
                    expandedRows.forEach(expandedRow => expandedRow.style.display = 'none');
                }
            }
        });
        
        // Actualizar contadores (tanto en tabla como en header)
        const countElement = document.getElementById(`filter-count-${rol}`);
        const headerCountElement = document.getElementById(`filter-count-${rol}s-header`);
        
        const totalRows = rows.length;
        const countText = `${visibleCount} de ${totalRows} ${rol}s`;
        
        if (countElement) {
            countElement.textContent = countText;
        }
        if (headerCountElement) {
            headerCountElement.textContent = countText;
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