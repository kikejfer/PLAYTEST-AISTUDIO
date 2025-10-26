/**
 * Componente genérico de Gestión de Estudiantes/Jugadores
 * Reutilizable en Panel de Profesores (PPF) y Panel de Creadores (PCC)
 * 
 * Funciones:
 * - Listar estudiantes/jugadores con filtros avanzados
 * - Ver detalles de rendimiento y progreso
 * - Gestionar asignaciones de contenido
 * - Exportar reportes de progreso
 * - Comunicación con estudiantes
 */

const StudentsManagementComponent = (() => {
    
    // Estado del componente
    let currentRole = 'profesor'; // 'profesor' o 'creador'
    let currentUser = null;
    let studentsData = [];
    let filteredStudents = [];
    let selectedStudents = [];
    let availableClasses = []; // Available classes for filtering
    let currentFilters = {
        searchTerm: '',
        classId: '', // Filter by specific class
        institution: '',
        course: '',
        progressLevel: '',
        activityLevel: '',
        dateRange: 'all'
    };

    // Configuraciones por rol
    const roleConfig = {
        profesor: {
            title: 'Gestión de Alumnos',
            subtitle: 'Administra y supervisa el progreso académico de tus alumnos inscritos en tus clases',
            icon: '🎓',
            primaryColor: '#3B82F6',
            context: 'académico',
            userLabel: 'Alumnos',
            endpoints: {
                list: '/api/teachers-panel/students',
                progress: '/api/analytics/student-progress',
                assign: '/api/assignments/create',
                export: '/api/reports/students'
            },
            permissions: ['view_students', 'assign_content', 'export_reports', 'send_messages']
        },
        creador: {
            title: 'Gestión de Jugadores',
            subtitle: 'Administra jugadores que han cargado tu contenido del marketplace y analiza su engagement',
            icon: '🎮',
            primaryColor: '#10B981',
            context: 'marketplace',
            userLabel: 'Jugadores',
            endpoints: {
                list: '/api/users/players',
                progress: '/api/analytics/player-progress',
                assign: '/api/content/assign',
                export: '/api/reports/players'
            },
            permissions: ['view_players', 'manage_content', 'export_analytics', 'engagement_tools']
        }
    };

    // Inicializar componente
    const init = (config = {}) => {
        console.log('🎓 Inicializando componente de gestión de estudiantes...');
        
        // Configurar rol y usuario
        currentRole = config.role || detectRoleFromPage();
        currentUser = config.user || window.getCurrentUser();
        
        // Renderizar interfaz
        renderComponent(config.containerId || 'students-management-container');
        
        // Cargar datos iniciales
        loadStudentsData();
        
        // Configurar event listeners
        setupEventListeners();
        
        console.log(`✅ Componente iniciado en modo: ${currentRole}`);
    };

    // Detectar rol desde la página actual
    const detectRoleFromPage = () => {
        const panelType = document.querySelector('meta[name="panel-type"]')?.content;
        
        switch(panelType) {
            case 'PPF': return 'profesor';
            case 'PCC': return 'creador';
            default: 
                console.warn('⚠️ No se pudo detectar el rol, usando "profesor" por defecto');
                return 'profesor';
        }
    };

    // Use global getCurrentUser if available, otherwise define local fallback
    if (!window.getCurrentUser) {
        const getCurrentUser = () => {
            try {
                const session = localStorage.getItem('gameSession');
                if (session) {
                    return JSON.parse(session);
                }
                return null;
            } catch (error) {
                console.error('Error obteniendo usuario actual:', error);
                return null;
            }
        };
        window.getCurrentUser = getCurrentUser;
        console.log('📝 Local getCurrentUser (students-management) fallback defined');
    }

    // Renderizar componente principal
    const renderComponent = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} no encontrado`);
            return;
        }

        const config = roleConfig[currentRole];
        
        container.innerHTML = `
            <div class="students-management-wrapper">
                <!-- Header -->
                <div class="students-header">
                    <div class="header-content">
                        <div class="header-left">
                            <span class="header-icon">${config.icon}</span>
                            <div class="header-text">
                                <h2 class="header-title">${config.title}</h2>
                                <p class="header-subtitle">${config.subtitle}</p>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="btn-export" onclick="StudentsManagementComponent.exportData()">
                                <span>📊</span> Exportar Reporte
                            </button>
                            <button class="btn-bulk-actions" onclick="StudentsManagementComponent.showBulkActions()">
                                <span>⚙️</span> Acciones Masivas
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="students-filters">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label for="search-input">🔍 Buscar</label>
                            <input
                                type="text"
                                id="search-input"
                                placeholder="Nombre, email o institución..."
                                oninput="StudentsManagementComponent.updateFilter('searchTerm', this.value)"
                            >
                        </div>

                        <div class="filter-group">
                            <label for="class-filter">📚 Clase</label>
                            <select id="class-filter" onchange="StudentsManagementComponent.updateFilter('classId', this.value)">
                                <option value="">Todas las clases</option>
                                <!-- Opciones cargadas dinámicamente -->
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="institution-filter">🏫 Institución</label>
                            <select id="institution-filter" onchange="StudentsManagementComponent.updateFilter('institution', this.value)">
                                <option value="">Todas las instituciones</option>
                                <!-- Opciones cargadas dinámicamente -->
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="progress-filter">📈 Nivel de Progreso</label>
                            <select id="progress-filter" onchange="StudentsManagementComponent.updateFilter('progressLevel', this.value)">
                                <option value="">Todos los niveles</option>
                                <option value="beginner">Principiante (0-25%)</option>
                                <option value="intermediate">Intermedio (26-50%)</option>
                                <option value="advanced">Avanzado (51-75%)</option>
                                <option value="expert">Experto (76-100%)</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="activity-filter">⚡ Actividad</label>
                            <select id="activity-filter" onchange="StudentsManagementComponent.updateFilter('activityLevel', this.value)">
                                <option value="">Todos</option>
                                <option value="active">Activos (últimos 7 días)</option>
                                <option value="inactive">Inactivos (+7 días)</option>
                                <option value="new">Nuevos (últimos 30 días)</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="date-filter">📅 Período</label>
                            <select id="date-filter" onchange="StudentsManagementComponent.updateFilter('dateRange', this.value)">
                                <option value="all">Todo el tiempo</option>
                                <option value="week">Última semana</option>
                                <option value="month">Último mes</option>
                                <option value="semester">Este semestre</option>
                            </select>
                        </div>

                        <div class="filter-actions">
                            <button class="btn-clear-filters" onclick="StudentsManagementComponent.clearFilters()">
                                🔄 Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas rápidas -->
                <div class="students-stats">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <span class="stat-number" id="total-students">0</span>
                            <span class="stat-label">Total ${currentRole === 'profesor' ? 'Estudiantes' : 'Jugadores'}</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <span class="stat-number" id="avg-progress">0%</span>
                            <span class="stat-label">Progreso Promedio</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-content">
                            <span class="stat-number" id="active-students">0</span>
                            <span class="stat-label">Activos Esta Semana</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <span class="stat-number" id="completion-rate">0%</span>
                            <span class="stat-label">Tasa de Finalización</span>
                        </div>
                    </div>
                </div>

                <!-- Lista de estudiantes -->
                <div class="students-list">
                    <div class="list-header">
                        <div class="list-controls">
                            <label class="select-all">
                                <input type="checkbox" id="select-all-checkbox" onchange="StudentsManagementComponent.selectAll(this.checked)">
                                Seleccionar todos
                            </label>
                            <span class="selected-count" id="selected-count">0 seleccionados</span>
                        </div>
                        <div class="list-view-options">
                            <button class="view-btn active" data-view="card" onclick="StudentsManagementComponent.changeView('card')">
                                <span>🔲</span> Tarjetas
                            </button>
                            <button class="view-btn" data-view="table" onclick="StudentsManagementComponent.changeView('table')">
                                <span>📋</span> Tabla
                            </button>
                        </div>
                    </div>

                    <div id="students-content" class="students-content">
                        <!-- Contenido cargado dinámicamente -->
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Cargando estudiantes...</p>
                        </div>
                    </div>
                </div>

                <!-- Modal de detalles del estudiante -->
                <div id="student-details-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Detalles del ${currentRole === 'profesor' ? 'Estudiante' : 'Jugador'}</h3>
                            <button class="modal-close" onclick="StudentsManagementComponent.closeModal('student-details-modal')">&times;</button>
                        </div>
                        <div id="student-details-content" class="modal-body">
                            <!-- Contenido cargado dinámicamente -->
                        </div>
                    </div>
                </div>

                <!-- Modal de acciones masivas -->
                <div id="bulk-actions-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Acciones Masivas</h3>
                            <button class="modal-close" onclick="StudentsManagementComponent.closeModal('bulk-actions-modal')">&times;</button>
                        </div>
                        <div id="bulk-actions-content" class="modal-body">
                            <!-- Contenido cargado dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Aplicar estilos específicos del rol
        applyStyling(config.primaryColor);
    };

    // Aplicar estilos CSS
    const applyStyling = (primaryColor) => {
        const existingStyles = document.getElementById('students-management-styles');
        if (existingStyles) existingStyles.remove();

        const styles = document.createElement('style');
        styles.id = 'students-management-styles';
        styles.textContent = `
            .students-management-wrapper {
                background: #0D1B2A;
                color: #E0E1DD;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }

            /* Header */
            .students-header {
                background: linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}25 100%);
                border: 1px solid ${primaryColor}40;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 24px;
            }

            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 16px;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .header-icon {
                font-size: 2.5rem;
                padding: 12px;
                background: ${primaryColor}20;
                border-radius: 50%;
                border: 2px solid ${primaryColor}40;
            }

            .header-title {
                font-size: 1.8rem;
                font-weight: 700;
                color: #E0E1DD;
                margin: 0 0 4px 0;
            }

            .header-subtitle {
                font-size: 1rem;
                color: #778DA9;
                margin: 0;
            }

            .header-actions {
                display: flex;
                gap: 12px;
            }

            .btn-export, .btn-bulk-actions {
                background: ${primaryColor};
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-export:hover, .btn-bulk-actions:hover {
                background: ${primaryColor}dd;
                transform: translateY(-1px);
            }

            /* Filtros */
            .students-filters {
                background: #1B263B;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                border: 1px solid #415A77;
            }

            .filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                align-items: end;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .filter-group label {
                font-size: 14px;
                font-weight: 600;
                color: #E0E1DD;
            }

            .filter-group input, .filter-group select {
                background: #0D1B2A;
                border: 1px solid #415A77;
                border-radius: 6px;
                padding: 10px 12px;
                color: #E0E1DD;
                font-size: 14px;
                transition: border-color 0.3s ease;
            }

            .filter-group input:focus, .filter-group select:focus {
                outline: none;
                border-color: ${primaryColor};
                box-shadow: 0 0 0 2px ${primaryColor}20;
            }

            .btn-clear-filters {
                background: transparent;
                border: 1px solid #778DA9;
                color: #778DA9;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .btn-clear-filters:hover {
                background: #778DA9;
                color: #0D1B2A;
            }

            /* Estadísticas */
            .students-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }

            .stat-card {
                background: #1B263B;
                border: 1px solid #415A77;
                border-radius: 12px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                transition: all 0.3s ease;
            }

            .stat-card:hover {
                border-color: ${primaryColor};
                transform: translateY(-2px);
            }

            .stat-icon {
                font-size: 2rem;
                padding: 12px;
                background: ${primaryColor}20;
                border-radius: 50%;
            }

            .stat-content {
                display: flex;
                flex-direction: column;
            }

            .stat-number {
                font-size: 1.5rem;
                font-weight: 700;
                color: ${primaryColor};
                line-height: 1.2;
            }

            .stat-label {
                font-size: 0.875rem;
                color: #778DA9;
                line-height: 1.2;
            }

            /* Lista de estudiantes */
            .students-list {
                background: #1B263B;
                border-radius: 12px;
                border: 1px solid #415A77;
                overflow: hidden;
            }

            .list-header {
                background: #415A77;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #778DA9;
            }

            .list-controls {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .select-all {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-size: 14px;
                color: #E0E1DD;
            }

            .selected-count {
                font-size: 14px;
                color: #778DA9;
            }

            .list-view-options {
                display: flex;
                gap: 8px;
            }

            .view-btn {
                background: transparent;
                border: 1px solid #778DA9;
                color: #778DA9;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .view-btn.active {
                background: ${primaryColor};
                border-color: ${primaryColor};
                color: white;
            }

            .students-content {
                padding: 20px;
                min-height: 300px;
            }

            /* Loading state */
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #778DA9;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid ${primaryColor}20;
                border-top: 3px solid ${primaryColor};
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Modal */
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .modal.hidden {
                display: none;
            }

            .modal-content {
                background: #1B263B;
                border-radius: 12px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                border: 1px solid #415A77;
            }

            .modal-header {
                background: #415A77;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #778DA9;
            }

            .modal-header h3 {
                margin: 0;
                color: #E0E1DD;
            }

            .modal-close {
                background: none;
                border: none;
                color: #E0E1DD;
                font-size: 24px;
                cursor: pointer;
                padding: 4px;
            }

            .modal-body {
                padding: 20px;
                overflow-y: auto;
                max-height: calc(80vh - 80px);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .filters-grid {
                    grid-template-columns: 1fr;
                }
                
                .students-stats {
                    grid-template-columns: 1fr;
                }
                
                .header-content {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .list-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }
            }
        `;
        
        document.head.appendChild(styles);
    };

    // Configurar event listeners
    const setupEventListeners = () => {
        // Prevenir envío de formularios por Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.matches('.students-management-wrapper input[type="text"]')) {
                e.preventDefault();
            }
        });
    };

    // Cargar datos de estudiantes
    const loadStudentsData = async () => {
        try {
            console.log('📊 Cargando datos de estudiantes...');

            const config = roleConfig[currentRole];
            const endpoint = config.endpoints.list;

            // Add class filter to endpoint if selected
            const classFilter = currentFilters.classId ? `?class_id=${currentFilters.classId}` : '';

            // Realizar llamada real al API
            const response = await apiCall(endpoint + classFilter);
            studentsData = response.data || [];
            availableClasses = response.classes || [];

            // Populate class filter dropdown
            populateClassFilter();

            // Aplicar filtros iniciales
            applyFilters();

            // Actualizar estadísticas
            updateStatistics();

            // Renderizar lista
            renderStudentsList();

        } catch (error) {
            console.error('❌ Error cargando estudiantes:', error);
            studentsData = [];
            availableClasses = [];
            applyFilters();
            updateStatistics();
            renderStudentsList();
        }
    };

    // Populate class filter dropdown with available classes
    const populateClassFilter = () => {
        const classFilter = document.getElementById('class-filter');
        if (!classFilter) return;

        // Keep the current selection
        const currentSelection = classFilter.value;

        // Clear and rebuild options
        classFilter.innerHTML = '<option value="">Todas las clases</option>';

        availableClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = `${cls.class_name} - ${cls.subject}`;
            classFilter.appendChild(option);
        });

        // Restore selection
        if (currentSelection) {
            classFilter.value = currentSelection;
        }
    };

    // generateMockData removed - using real API data only

    // Aplicar filtros
    const applyFilters = () => {
        filteredStudents = studentsData.filter(student => {
            // Filtro de búsqueda
            if (currentFilters.searchTerm) {
                const searchLower = currentFilters.searchTerm.toLowerCase();
                const matches = student.name.toLowerCase().includes(searchLower) ||
                               student.email.toLowerCase().includes(searchLower) ||
                               student.institution.toLowerCase().includes(searchLower);
                if (!matches) return false;
            }

            // Filtro de institución
            if (currentFilters.institution && student.institution !== currentFilters.institution) {
                return false;
            }

            // Filtro de nivel de progreso
            if (currentFilters.progressLevel) {
                const progress = student.progress;
                switch (currentFilters.progressLevel) {
                    case 'beginner': if (progress > 25) return false; break;
                    case 'intermediate': if (progress < 26 || progress > 50) return false; break;
                    case 'advanced': if (progress < 51 || progress > 75) return false; break;
                    case 'expert': if (progress < 76) return false; break;
                }
            }

            // Filtro de actividad
            if (currentFilters.activityLevel) {
                const daysSinceActivity = Math.floor((Date.now() - student.lastActivity) / (1000 * 60 * 60 * 24));
                switch (currentFilters.activityLevel) {
                    case 'active': if (daysSinceActivity > 7) return false; break;
                    case 'inactive': if (daysSinceActivity <= 7) return false; break;
                    case 'new': 
                        const daysSinceJoin = Math.floor((Date.now() - student.joinDate) / (1000 * 60 * 60 * 24));
                        if (daysSinceJoin > 30) return false; 
                        break;
                }
            }

            return true;
        });

        console.log(`🔍 Filtros aplicados: ${filteredStudents.length}/${studentsData.length} estudiantes`);
    };

    // Actualizar estadísticas
    const updateStatistics = () => {
        const totalElement = document.getElementById('total-students');
        const avgProgressElement = document.getElementById('avg-progress');
        const activeStudentsElement = document.getElementById('active-students');
        const completionRateElement = document.getElementById('completion-rate');

        if (!totalElement) return;

        const total = filteredStudents.length;
        const avgProgress = total > 0 ? Math.round(filteredStudents.reduce((sum, s) => sum + s.progress, 0) / total) : 0;
        const activeCount = filteredStudents.filter(s => {
            const daysSince = Math.floor((Date.now() - s.lastActivity) / (1000 * 60 * 60 * 24));
            return daysSince <= 7;
        }).length;
        const completionRate = total > 0 ? Math.round((filteredStudents.filter(s => s.progress >= 100).length / total) * 100) : 0;

        // Animar números
        animateNumber(totalElement, 0, total);
        animateNumber(avgProgressElement, 0, avgProgress, '%');
        animateNumber(activeStudentsElement, 0, activeCount);
        animateNumber(completionRateElement, 0, completionRate, '%');
    };

    // Animar números en estadísticas
    const animateNumber = (element, start, end, suffix = '') => {
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(start + (end - start) * progress);
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    };

    // Renderizar lista de estudiantes
    const renderStudentsList = () => {
        const content = document.getElementById('students-content');
        if (!content) return;

        if (filteredStudents.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No se encontraron estudiantes</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        // Renderizar en vista de tarjetas por defecto
        renderCardView(content);
    };

    // Renderizar vista de tarjetas
    const renderCardView = (container) => {
        const cardsHTML = filteredStudents.map(student => {
            const progressColor = getProgressColor(student.progress);
            const activityStatus = getActivityStatus(student.lastActivity);
            
            return `
                <div class="student-card" data-student-id="${student.id}">
                    <div class="student-card-header">
                        <div class="student-avatar">
                            <img src="${student.avatar}" alt="${student.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="avatar-fallback" style="display: none;">${student.name.charAt(0)}</div>
                        </div>
                        <div class="student-basic-info">
                            <h4 class="student-name">${student.name}</h4>
                            <p class="student-email">${student.email}</p>
                            <span class="activity-status ${activityStatus.class}">${activityStatus.text}</span>
                        </div>
                        <div class="student-actions">
                            <label class="student-select">
                                <input type="checkbox" value="${student.id}" onchange="StudentsManagementComponent.toggleStudentSelection(${student.id}, this.checked)">
                            </label>
                        </div>
                    </div>
                    
                    <div class="student-card-body">
                        <div class="student-info-grid">
                            <div class="info-item">
                                <span class="info-label">🏫 Institución:</span>
                                <span class="info-value">${student.institution}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📚 Curso:</span>
                                <span class="info-value">${student.course}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">👥 Grupos:</span>
                                <span class="info-value">${getGroupsBadges(student.groups)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📅 Última actividad:</span>
                                <span class="info-value">${formatDate(student.lastActivity)}</span>
                            </div>
                        </div>

                        <div class="progress-section">
                            <div class="progress-header">
                                <span class="progress-label">Progreso General</span>
                                <span class="progress-percentage" style="color: ${progressColor}">${student.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${student.progress}%; background: ${progressColor}"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="student-card-footer">
                        <button class="btn-student-details" onclick="StudentsManagementComponent.showStudentDetails(${student.id})">
                            👁️ Ver Detalles
                        </button>
                        <button class="btn-assign-group" onclick="StudentsManagementComponent.assignToGroup(${student.id}, '${student.name.replace(/'/g, "\\'")}')">
                            👥 Asignar a Grupo
                        </button>
                        <button class="btn-assign-content" onclick="StudentsManagementComponent.assignContent(${student.id})">
                            📝 Asignar Contenido
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="students-grid">
                ${cardsHTML}
            </div>
        `;

        // Agregar estilos para las tarjetas
        addCardStyles();
    };

    // Agregar estilos para tarjetas
    const addCardStyles = () => {
        const cardStylesId = 'student-card-styles';
        if (document.getElementById(cardStylesId)) return;

        const styles = document.createElement('style');
        styles.id = cardStylesId;
        styles.textContent = `
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #778DA9;
            }
            
            .empty-icon {
                font-size: 4rem;
                margin-bottom: 16px;
            }
            
            .empty-state h3 {
                font-size: 1.5rem;
                margin-bottom: 8px;
                color: #E0E1DD;
            }

            .students-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                gap: 20px;
            }

            .student-card {
                background: #0D1B2A;
                border: 1px solid #415A77;
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .student-card:hover {
                border-color: ${roleConfig[currentRole].primaryColor};
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }

            .student-card-header {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                border-bottom: 1px solid #415A77;
            }

            .student-avatar {
                position: relative;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
            }

            .student-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .avatar-fallback {
                width: 100%;
                height: 100%;
                background: ${roleConfig[currentRole].primaryColor};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.5rem;
            }

            .student-basic-info {
                flex: 1;
            }

            .student-name {
                font-size: 1.1rem;
                font-weight: 600;
                color: #E0E1DD;
                margin: 0 0 4px 0;
            }

            .student-email {
                font-size: 0.875rem;
                color: #778DA9;
                margin: 0 0 8px 0;
            }

            .activity-status {
                font-size: 0.75rem;
                padding: 2px 8px;
                border-radius: 12px;
                font-weight: 600;
            }

            .activity-status.active {
                background: #10B98120;
                color: #10B981;
            }

            .activity-status.inactive {
                background: #EF444420;
                color: #EF4444;
            }

            .student-actions {
                display: flex;
                align-items: center;
            }

            .student-select input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }

            .student-card-body {
                padding: 20px;
            }

            .student-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }

            .info-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .info-label {
                font-size: 0.75rem;
                color: #778DA9;
                font-weight: 600;
            }

            .info-value {
                font-size: 0.875rem;
                color: #E0E1DD;
            }

            .progress-section {
                margin-top: 16px;
            }

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .progress-label {
                font-size: 0.875rem;
                font-weight: 600;
                color: #E0E1DD;
            }

            .progress-percentage {
                font-size: 0.875rem;
                font-weight: 700;
            }

            .progress-bar {
                height: 8px;
                background: #415A77;
                border-radius: 4px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                transition: width 0.5s ease;
                border-radius: 4px;
            }

            .student-card-footer {
                padding: 16px 20px;
                background: #1B263B;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .btn-student-details,
            .btn-send-message,
            .btn-assign-content {
                background: transparent;
                border: 1px solid #415A77;
                color: #E0E1DD;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                cursor: pointer;
                transition: all 0.3s ease;
                flex: 1;
                min-width: 100px;
            }

            .btn-student-details:hover {
                background: ${roleConfig[currentRole].primaryColor};
                border-color: ${roleConfig[currentRole].primaryColor};
            }

            .btn-send-message:hover {
                background: #10B981;
                border-color: #10B981;
            }

            .btn-assign-content:hover {
                background: #F59E0B;
                border-color: #F59E0B;
            }

            @media (max-width: 768px) {
                .students-grid {
                    grid-template-columns: 1fr;
                }
                
                .student-info-grid {
                    grid-template-columns: 1fr;
                }
                
                .student-card-footer {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(styles);
    };

    // Utilidades
    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10B981';
        if (progress >= 60) return '#F59E0B';
        if (progress >= 40) return '#3B82F6';
        return '#EF4444';
    };

    const getActivityStatus = (lastActivity) => {
        const daysSince = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));
        if (daysSince <= 7) return { class: 'active', text: 'Activo' };
        return { class: 'inactive', text: 'Inactivo' };
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const getGroupsBadges = (groups) => {
        if (!groups || groups.length === 0) {
            return '<span style="color: #778DA9; font-style: italic;">Sin grupo</span>';
        }

        return groups.map(group =>
            `<span style="background: #1B263B; color: #10B981; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 4px;">${group.name}</span>`
        ).join('');
    };

    // API Mock (reemplazar con implementación real)
    const apiCall = async (endpoint) => {
        // Get backend URL from environment or use default
        const API_URL = window.API_URL || 'https://playtest-backend.onrender.com';

        // Get user session
        const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');

        if (!session.token) {
            console.warn('⚠️ No authentication token found');
            return { data: [] };
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`,
                    'X-Current-Role': 'PPF'
                }
            });

            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                return { data: [] };
            }

            const data = await response.json();
            return { data: data.students || data.players || data.data || [] };

        } catch (error) {
            console.error('❌ Error calling API:', error);
            return { data: [] };
        }
    };

    // Métodos públicos
    return {
        init,
        
        // Métodos de filtrado
        updateFilter: (filterName, value) => {
            currentFilters[filterName] = value;

            // If class filter changed, reload data from server
            if (filterName === 'classId') {
                loadStudentsData();
                return;
            }

            applyFilters();
            updateStatistics();
            renderStudentsList();
        },
        
        clearFilters: () => {
            currentFilters = {
                searchTerm: '',
                classId: '',
                institution: '',
                course: '',
                progressLevel: '',
                activityLevel: '',
                dateRange: 'all'
            };
            
            // Limpiar inputs
            const inputs = document.querySelectorAll('.students-management-wrapper input, .students-management-wrapper select');
            inputs.forEach(input => {
                if (input.type === 'text') {
                    input.value = '';
                } else if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                }
            });

            // Reload data since classId filter was cleared
            loadStudentsData();
        },

        // Métodos de selección
        selectAll: (checked) => {
            selectedStudents = checked ? filteredStudents.map(s => s.id) : [];
            
            // Actualizar checkboxes
            const checkboxes = document.querySelectorAll('.student-select input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = checked);
            
            document.getElementById('selected-count').textContent = `${selectedStudents.length} seleccionados`;
        },

        toggleStudentSelection: (studentId, checked) => {
            if (checked) {
                if (!selectedStudents.includes(studentId)) {
                    selectedStudents.push(studentId);
                }
            } else {
                selectedStudents = selectedStudents.filter(id => id !== studentId);
            }
            
            document.getElementById('selected-count').textContent = `${selectedStudents.length} seleccionados`;
            
            // Actualizar checkbox "seleccionar todos"
            const selectAllCheckbox = document.getElementById('select-all-checkbox');
            selectAllCheckbox.checked = selectedStudents.length === filteredStudents.length;
            selectAllCheckbox.indeterminate = selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length;
        },

        // Métodos de vista
        changeView: (viewType) => {
            const buttons = document.querySelectorAll('.view-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === viewType);
            });

            const content = document.getElementById('students-content');
            if (viewType === 'table') {
                renderTableView(content);
            } else {
                renderCardView(content);
            }
        },

        // Métodos de acciones
        showStudentDetails: (studentId) => {
            console.log(`📊 Mostrando detalles del estudiante ${studentId}`);

            const student = studentsData.find(s => s.id === studentId);
            if (!student) {
                alert('Estudiante no encontrado');
                return;
            }

            const modal = document.getElementById('student-details-modal');
            if (!modal) return;

            const detailsContent = document.getElementById('student-details-content');
            detailsContent.innerHTML = `
                <div style="display: grid; gap: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
                        <img src="${student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}"
                             style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid white;">
                        <div>
                            <h3 style="color: white; margin: 0;">${student.name}</h3>
                            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${student.email || 'Sin email'}</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="background: #1B263B; padding: 15px; border-radius: 8px;">
                            <div style="color: #778DA9; font-size: 0.9rem;">Institución</div>
                            <div style="color: #E0E1DD; font-size: 1.1rem; margin-top: 5px;">${student.institution || 'N/A'}</div>
                        </div>
                        <div style="background: #1B263B; padding: 15px; border-radius: 8px;">
                            <div style="color: #778DA9; font-size: 0.9rem;">Curso</div>
                            <div style="color: #E0E1DD; font-size: 1.1rem; margin-top: 5px;">${student.course || 'N/A'}</div>
                        </div>
                        <div style="background: #1B263B; padding: 15px; border-radius: 8px;">
                            <div style="color: #778DA9; font-size: 0.9rem;">Progreso</div>
                            <div style="color: #10B981; font-size: 1.3rem; font-weight: 700; margin-top: 5px;">${student.progress}%</div>
                        </div>
                        <div style="background: #1B263B; padding: 15px; border-radius: 8px;">
                            <div style="color: #778DA9; font-size: 0.9rem;">Estado</div>
                            <div style="color: ${student.status === 'active' ? '#10B981' : '#EF4444'}; font-size: 1.1rem; margin-top: 5px;">
                                ${student.status === 'active' ? '✅ Activo' : '❌ Inactivo'}
                            </div>
                        </div>
                    </div>

                    <div style="background: #1B263B; padding: 20px; border-radius: 8px;">
                        <h4 style="color: #E0E1DD; margin-bottom: 15px;">📊 Estadísticas</h4>
                        <div style="display: grid; gap: 10px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #778DA9;">Actividades completadas:</span>
                                <span style="color: #E0E1DD;">${student.completedActivities || 0} / ${student.totalActivities || 0}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #778DA9;">Fecha de registro:</span>
                                <span style="color: #E0E1DD;">${student.joinDate ? new Date(student.joinDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #778DA9;">Última actividad:</span>
                                <span style="color: #E0E1DD;">${student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            ${student.group ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: #778DA9;">Grupo asignado:</span>
                                    <span style="color: #E0E1DD;">${student.group}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="StudentsManagementComponent.closeModal('student-details-modal')"
                                style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');
        },

        sendMessage: (studentId) => {
            console.log(`💬 Enviando mensaje al estudiante ${studentId}`);
            // Implementar funcionalidad de mensajería
        },

        assignContent: async (studentId) => {
            console.log(`📝 Asignando contenido al estudiante ${studentId}`);

            const student = studentsData.find(s => s.id === studentId);
            if (!student) {
                alert('Estudiante no encontrado');
                return;
            }

            // Get available blocks
            const API_URL = window.API_URL || 'https://playtest-backend.onrender.com';
            const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');

            try {
                const blocksResponse = await fetch(`${API_URL}/api/blocks`, {
                    headers: {
                        'Authorization': `Bearer ${session.token}`
                    }
                });

                if (!blocksResponse.ok) {
                    throw new Error('Error al cargar bloques');
                }

                const blocks = await blocksResponse.json();

                if (blocks.length === 0) {
                    alert('No hay bloques disponibles para asignar. Por favor crea bloques primero.');
                    return;
                }

                const blockOptions = blocks.map(b =>
                    `<option value="${b.id}">${b.name || b.title} - ${b.subject || 'Sin materia'}</option>`
                ).join('');

                const modalHTML = `
                    <div id="assign-content-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                        <div style="background: #1B263B; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
                            <h3 style="color: #E0E1DD; margin-bottom: 20px;">📝 Asignar Contenido</h3>
                            <p style="color: #778DA9; margin-bottom: 20px;">Selecciona el bloque para ${student.name}:</p>
                            <select id="block-select" style="width: 100%; padding: 10px; background: #0D1B2A; border: 1px solid #415A77; border-radius: 6px; color: #E0E1DD; margin-bottom: 20px;">
                                <option value="">Seleccionar bloque...</option>
                                ${blockOptions}
                            </select>
                            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                <button onclick="document.getElementById('assign-content-modal').remove()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancelar</button>
                                <button onclick="StudentsManagementComponent.confirmContentAssignment(${studentId})" style="padding: 10px 20px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer;">Asignar</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHTML);

            } catch (error) {
                console.error('Error al cargar bloques:', error);
                alert('Error al cargar los bloques disponibles');
            }
        },

        assignToGroup: async (studentId, studentName) => {
            console.log(`👥 Asignando estudiante ${studentId} a grupo`);

            // Get available groups
            const API_URL = window.API_URL || 'https://playtest-backend.onrender.com';
            const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');

            try {
                // Fetch available groups
                const groupsResponse = await fetch(`${API_URL}/api/groups`, {
                    headers: {
                        'Authorization': `Bearer ${session.token}`,
                        'X-Current-Role': 'PPF'
                    }
                });

                if (!groupsResponse.ok) {
                    throw new Error('Error al cargar grupos');
                }

                const groups = await groupsResponse.json();

                if (groups.length === 0) {
                    alert('No tienes grupos creados. Por favor crea un grupo primero en la pestaña "Gestión de Grupos".');
                    return;
                }

                // Create modal to select group
                const groupOptions = groups.map(g =>
                    `<option value="${g.id}">${g.name} (${g.member_count} miembros)</option>`
                ).join('');

                const modalHTML = `
                    <div id="assign-group-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                        <div style="background: #1B263B; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
                            <h3 style="color: #E0E1DD; margin-bottom: 20px;">👥 Asignar a Grupo</h3>
                            <p style="color: #778DA9; margin-bottom: 20px;">Selecciona el grupo para ${studentName}:</p>
                            <select id="group-select" style="width: 100%; padding: 10px; background: #0D1B2A; border: 1px solid #415A77; border-radius: 6px; color: #E0E1DD; margin-bottom: 20px;">
                                <option value="">Seleccionar grupo...</option>
                                ${groupOptions}
                            </select>
                            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                <button onclick="document.getElementById('assign-group-modal').remove()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancelar</button>
                                <button onclick="StudentsManagementComponent.confirmGroupAssignment(${studentId})" style="padding: 10px 20px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer;">Asignar</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHTML);

            } catch (error) {
                console.error('Error al cargar grupos:', error);
                alert('Error al cargar los grupos disponibles');
            }
        },

        confirmGroupAssignment: async (studentId) => {
            const groupSelect = document.getElementById('group-select');
            const groupId = groupSelect.value;

            if (!groupId) {
                alert('Por favor selecciona un grupo');
                return;
            }

            const API_URL = window.API_URL || 'https://playtest-backend.onrender.com';
            const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');

            try {
                const response = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.token}`,
                        'X-Current-Role': 'PPF',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_ids: [studentId]
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al asignar estudiante al grupo');
                }

                alert('✅ Estudiante asignado al grupo correctamente');
                document.getElementById('assign-group-modal').remove();

                // Reload students data to show updated group info
                loadStudentsData();

            } catch (error) {
                console.error('Error al asignar a grupo:', error);
                alert('❌ Error al asignar estudiante al grupo');
            }
        },

        confirmContentAssignment: async (studentId) => {
            const blockSelect = document.getElementById('block-select');
            const blockId = blockSelect.value;

            if (!blockId) {
                alert('Por favor selecciona un bloque');
                return;
            }

            const API_URL = window.API_URL || 'https://playtest-backend.onrender.com';
            const session = JSON.parse(localStorage.getItem('playtest_session') || '{}');

            try {
                // Asignar bloque al estudiante
                const response = await fetch(`${API_URL}/api/users/${studentId}/blocks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        block_id: parseInt(blockId)
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al asignar bloque al estudiante');
                }

                alert('✅ Contenido asignado correctamente');
                document.getElementById('assign-content-modal').remove();

                // Reload students data
                loadStudentsData();

            } catch (error) {
                console.error('Error al asignar contenido:', error);
                alert('❌ Error al asignar contenido al estudiante');
            }
        },

        exportData: () => {
            console.log('📊 Exportando datos de estudiantes');

            if (filteredStudents.length === 0) {
                alert('No hay estudiantes para exportar');
                return;
            }

            // Crear CSV
            const headers = ['ID', 'Nombre', 'Email', 'Institución', 'Curso', 'Progreso', 'Estado', 'Fecha Registro', 'Última Actividad'];
            const csvContent = [
                headers.join(','),
                ...filteredStudents.map(s => [
                    s.id,
                    `"${s.name}"`,
                    `"${s.email || ''}"`,
                    `"${s.institution || ''}"`,
                    `"${s.course || ''}"`,
                    s.progress,
                    s.status,
                    s.joinDate ? new Date(s.joinDate).toLocaleDateString() : '',
                    s.lastActivity ? new Date(s.lastActivity).toLocaleDateString() : ''
                ].join(','))
            ].join('\n');

            // Descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ Archivo CSV descargado');
        },

        showBulkActions: () => {
            console.log('⚙️ Mostrando acciones masivas');

            if (selectedStudents.length === 0) {
                alert('Por favor selecciona al menos un estudiante');
                return;
            }

            const modalHTML = `
                <div id="bulk-actions-modal-custom" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                    <div style="background: #1B263B; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%;">
                        <h3 style="color: #E0E1DD; margin-bottom: 20px;">⚙️ Acciones Masivas</h3>
                        <p style="color: #778DA9; margin-bottom: 20px;">${selectedStudents.length} estudiante(s) seleccionado(s)</p>

                        <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                            <button onclick="StudentsManagementComponent.bulkAssignToGroup()"
                                    style="padding: 15px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; text-align: left;">
                                👥 Asignar a Grupo
                            </button>
                            <button onclick="StudentsManagementComponent.bulkAssignContent()"
                                    style="padding: 15px; background: #764ba2; color: white; border: none; border-radius: 6px; cursor: pointer; text-align: left;">
                                📝 Asignar Contenido
                            </button>
                            <button onclick="StudentsManagementComponent.bulkExport()"
                                    style="padding: 15px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer; text-align: left;">
                                📊 Exportar Seleccionados
                            </button>
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button onclick="document.getElementById('bulk-actions-modal-custom').remove()"
                                    style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        bulkAssignToGroup: () => {
            document.getElementById('bulk-actions-modal-custom')?.remove();
            alert('Función de asignación masiva a grupo en desarrollo');
        },

        bulkAssignContent: () => {
            document.getElementById('bulk-actions-modal-custom')?.remove();
            alert('Función de asignación masiva de contenido en desarrollo');
        },

        bulkExport: () => {
            document.getElementById('bulk-actions-modal-custom')?.remove();

            if (selectedStudents.length === 0) {
                alert('No hay estudiantes seleccionados');
                return;
            }

            const studentsToExport = studentsData.filter(s => selectedStudents.includes(s.id));

            // Crear CSV
            const headers = ['ID', 'Nombre', 'Email', 'Institución', 'Curso', 'Progreso', 'Estado'];
            const csvContent = [
                headers.join(','),
                ...studentsToExport.map(s => [
                    s.id,
                    `"${s.name}"`,
                    `"${s.email || ''}"`,
                    `"${s.institution || ''}"`,
                    `"${s.course || ''}"`,
                    s.progress,
                    s.status
                ].join(','))
            ].join('\n');

            // Descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `estudiantes_seleccionados_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        closeModal: (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('hidden');
        }
    };

})();

// Hacer disponible globalmente
window.StudentsManagementComponent = StudentsManagementComponent;