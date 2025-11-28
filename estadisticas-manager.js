/**
 * MÓDULO: Estadísticas y Analytics
 * Funcionalidad para la Pestaña 4 del Panel de Profesor
 */

// Helper function to get authentication token
function getTokenEstadisticas() {
    return localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

const EstadisticasManager = {
    oposicionActual: null,
    API_URL: 'https://playtest-backend.onrender.com/api',

    /**
     * Cargar estadísticas de una oposición
     */
    async cargarEstadisticas(oposicionId) {
        this.oposicionActual = oposicionId;
        const container = document.getElementById('estadisticas-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            // Obtener cronogramas de todos los alumnos
            const cronogramasResponse = await fetch(`${this.API_URL}/oposiciones/${oposicionId}/cronogramas`, {
                headers: {
                    'Authorization': `Bearer ${getTokenEstadisticas()}`
                }
            });

            if (!cronogramasResponse.ok) throw new Error('Error cargando estadísticas');

            const cronogramasData = await cronogramasResponse.json();
            const cronogramas = cronogramasData.cronogramas || [];

            // Obtener detalle de oposición
            const oposicionResponse = await fetch(`${this.API_URL}/oposiciones/${oposicionId}`, {
                headers: {
                    'Authorization': `Bearer ${getTokenEstadisticas()}`
                }
            });

            let oposicion = null;
            if (oposicionResponse.ok) {
                const oposicionData = await oposicionResponse.json();
                oposicion = oposicionData.oposicion;
            }

            this.renderEstadisticas(cronogramas, oposicion);

        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3 class="empty-title">Error al cargar estadísticas</h3>
                    <p class="empty-description">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renderizar estadísticas
     */
    renderEstadisticas(cronogramas, oposicion) {
        const container = document.getElementById('estadisticas-content');

        if (cronogramas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3 class="empty-title">Sin datos suficientes</h3>
                    <p class="empty-description">No hay alumnos con cronograma para mostrar estadísticas</p>
                </div>
            `;
            return;
        }

        // Calcular métricas
        const totalAlumnos = cronogramas.length;
        const progresoPromedio = cronogramas.reduce((sum, c) => sum + (c.porcentaje_progreso || 0), 0) / totalAlumnos;

        const alumnosAdelantados = cronogramas.filter(c => c.estado === 'adelantado').length;
        const alumnosEnTiempo = cronogramas.filter(c => c.estado === 'en_tiempo').length;
        const alumnosRetrasados = cronogramas.filter(c => c.estado === 'retrasado').length;
        const alumnosInactivos = cronogramas.filter(c => c.estado === 'inactivo').length;

        const bloquesMedio = cronogramas.reduce((sum, c) => sum + (c.bloques_habilitados || 0), 0) / totalAlumnos;
        const bloquesCompletadosMedio = cronogramas.reduce((sum, c) => sum + (c.bloques_completados || 0), 0) / totalAlumnos;

        let html = `
            <!-- Resumen Global -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #E0E1DD; margin-bottom: 16px; font-size: 20px;">📊 Resumen Global</h3>
                <div class="cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="card">
                        <div class="stat-item">
                            <div class="stat-label">👥 Alumnos Activos</div>
                            <div class="stat-value">${totalAlumnos}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="stat-item">
                            <div class="stat-label">📈 Progreso Promedio</div>
                            <div class="stat-value">${Math.round(progresoPromedio)}%</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="stat-item">
                            <div class="stat-label">📦 Bloques Habilitados (Media)</div>
                            <div class="stat-value">${bloquesMedio.toFixed(1)}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="stat-item">
                            <div class="stat-label">✅ Bloques Completados (Media)</div>
                            <div class="stat-value">${bloquesCompletadosMedio.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Distribución por Estado -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #E0E1DD; margin-bottom: 16px; font-size: 20px;">🎯 Distribución por Estado</h3>
                <div class="cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                    <div class="card" style="border-color: ${alumnosAdelantados > 0 ? '#10B981' : '#415A77'};">
                        <div class="stat-item">
                            <div class="stat-label">🔥 Adelantados</div>
                            <div class="stat-value" style="color: #10B981;">${alumnosAdelantados}</div>
                            <div style="font-size: 12px; color: #778DA9; margin-top: 4px;">
                                ${totalAlumnos > 0 ? Math.round((alumnosAdelantados / totalAlumnos) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div class="card" style="border-color: ${alumnosEnTiempo > 0 ? '#60A5FA' : '#415A77'};">
                        <div class="stat-item">
                            <div class="stat-label">✅ En Tiempo</div>
                            <div class="stat-value" style="color: #60A5FA;">${alumnosEnTiempo}</div>
                            <div style="font-size: 12px; color: #778DA9; margin-top: 4px;">
                                ${totalAlumnos > 0 ? Math.round((alumnosEnTiempo / totalAlumnos) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div class="card" style="border-color: ${alumnosRetrasados > 0 ? '#F59E0B' : '#415A77'};">
                        <div class="stat-item">
                            <div class="stat-label">⚠️ Retrasados</div>
                            <div class="stat-value" style="color: #F59E0B;">${alumnosRetrasados}</div>
                            <div style="font-size: 12px; color: #778DA9; margin-top: 4px;">
                                ${totalAlumnos > 0 ? Math.round((alumnosRetrasados / totalAlumnos) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div class="card" style="border-color: ${alumnosInactivos > 0 ? '#EF4444' : '#415A77'};">
                        <div class="stat-item">
                            <div class="stat-label">⏸️ Inactivos</div>
                            <div class="stat-value" style="color: #EF4444;">${alumnosInactivos}</div>
                            <div style="font-size: 12px; color: #778DA9; margin-top: 4px;">
                                ${totalAlumnos > 0 ? Math.round((alumnosInactivos / totalAlumnos) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alertas -->
            ${this.renderAlertas(cronogramas)}

            <!-- Top Alumnos -->
            ${this.renderTopAlumnos(cronogramas)}

            <!-- Alumnos que necesitan atención -->
            ${this.renderAlumnosAtencion(cronogramas)}
        `;

        container.innerHTML = html;
    },

    /**
     * Renderizar alertas
     */
    renderAlertas(cronogramas) {
        const alertas = [];

        // Alumnos inactivos >7 días
        const inactivos = cronogramas.filter(c => c.estado === 'inactivo');
        if (inactivos.length > 0) {
            alertas.push({
                tipo: 'danger',
                icono: '⏸️',
                titulo: `${inactivos.length} alumno(s) inactivo(s)`,
                descripcion: 'No han tenido actividad en más de 7 días'
            });
        }

        // Alumnos muy retrasados (>20%)
        const muyRetrasados = cronogramas.filter(c => (c.diferencia_porcentual || 0) < -20);
        if (muyRetrasados.length > 0) {
            alertas.push({
                tipo: 'warning',
                icono: '⚠️',
                titulo: `${muyRetrasados.length} alumno(s) muy retrasado(s)`,
                descripcion: 'Llevan más del 20% de retraso respecto al cronograma'
            });
        }

        // Alumnos con bajo progreso (<20%)
        const bajoProgreso = cronogramas.filter(c => (c.porcentaje_progreso || 0) < 20);
        if (bajoProgreso.length > 0) {
            alertas.push({
                tipo: 'info',
                icono: '📉',
                titulo: `${bajoProgreso.length} alumno(s) con bajo progreso`,
                descripcion: 'Menos del 20% de preguntas dominadas'
            });
        }

        if (alertas.length === 0) {
            return `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #E0E1DD; margin-bottom: 16px; font-size: 20px;">🔔 Alertas</h3>
                    <div class="card" style="border-color: #10B981;">
                        <div style="text-align: center; padding: 20px; color: #10B981;">
                            ✅ No hay alertas - Todos los alumnos van bien
                        </div>
                    </div>
                </div>
            `;
        }

        let html = `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #E0E1DD; margin-bottom: 16px; font-size: 20px;">🔔 Alertas</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        alertas.forEach(alerta => {
            const colorMap = {
                danger: { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
                warning: { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
                info: { border: '#60A5FA', bg: 'rgba(96, 165, 250, 0.1)' }
            };

            const colors = colorMap[alerta.tipo];

            html += `
                <div class="card" style="border-color: ${colors.border}; background: ${colors.bg};">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 32px;">${alerta.icono}</div>
                        <div style="flex: 1;">
                            <div style="color: #E0E1DD; font-weight: 600; margin-bottom: 4px;">${alerta.titulo}</div>
                            <div style="color: #778DA9; font-size: 13px;">${alerta.descripcion}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Renderizar top alumnos
     */
    renderTopAlumnos(cronogramas) {
        const topAlumnos = [...cronogramas]
            .sort((a, b) => (b.porcentaje_progreso || 0) - (a.porcentaje_progreso || 0))
            .slice(0, 5);

        let html = `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #E0E1DD; margin-bottom: 16px; font-size: 20px;">🏆 Top 5 Alumnos</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        topAlumnos.forEach((alumno, index) => {
            const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            const progreso = alumno.porcentaje_progreso || 0;

            html += `
                <div class="card">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 32px;">${medallas[index]}</div>
                        <div class="user-avatar" style="width: 40px; height: 40px;">
                            ${alumno.nickname ? alumno.nickname.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: #E0E1DD; font-weight: 500; margin-bottom: 4px;">${alumno.nickname || 'Alumno'}</div>
                            <div style="color: #778DA9; font-size: 12px;">
                                ${alumno.preguntas_dominadas || 0}/${alumno.total_preguntas_oposicion || 0} preguntas dominadas
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: 700; color: #60A5FA;">${Math.round(progreso)}%</div>
                            <div class="progress-bar" style="width: 100px; margin-top: 4px;">
                                <div class="progress-fill high" style="width: ${progreso}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Renderizar alumnos que necesitan atención
     */
    renderAlumnosAtencion(cronogramas) {
        const necesitanAtencion = cronogramas.filter(c =>
            c.estado === 'inactivo' ||
            c.estado === 'retrasado' ||
            (c.diferencia_porcentual || 0) < -15
        ).slice(0, 5);

        if (necesitanAtencion.length === 0) {
            return '';
        }

        let html = `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #E0E1DD; margin-bottom: 16px; font-size: 20px;">⚠️ Alumnos que Necesitan Atención</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        necesitanAtencion.forEach(alumno => {
            const progreso = alumno.porcentaje_progreso || 0;
            const diff = alumno.diferencia_porcentual || 0;

            let razon = '';
            if (alumno.estado === 'inactivo') {
                razon = '⏸️ Sin actividad >7 días';
            } else if (diff < -20) {
                razon = `⚠️ ${Math.abs(Math.round(diff))}% de retraso`;
            } else if (alumno.estado === 'retrasado') {
                razon = '⏰ Retrasado en cronograma';
            }

            html += `
                <div class="card" style="border-color: #F59E0B;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="user-avatar" style="width: 40px; height: 40px;">
                            ${alumno.nickname ? alumno.nickname.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: #E0E1DD; font-weight: 500; margin-bottom: 4px;">${alumno.nickname || 'Alumno'}</div>
                            <div style="color: #F59E0B; font-size: 12px; font-weight: 500;">${razon}</div>
                            <div style="color: #778DA9; font-size: 12px; margin-top: 2px;">
                                ${alumno.preguntas_dominadas || 0}/${alumno.total_preguntas_oposicion || 0} preguntas (${Math.round(progreso)}%)
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="switchTab('alumnos'); setTimeout(() => AlumnosManager.cargarAlumnos(${this.oposicionActual}), 100);">
                            Ver Alumno
                        </button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }
};

// Exportar para uso global
window.EstadisticasManager = EstadisticasManager;
