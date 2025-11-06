/**
 * MÓDULO: Seguimiento de Alumnos
 * Funcionalidad para la Pestaña 3 del Panel de Profesor
 */

// Helper function to get authentication token
function getTokenAlumnos() {
    return localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

const AlumnosManager = {
    oposicionActual: null,
    alumnos: [],
    alumnoSeleccionado: null,
    API_URL: 'https://playtest-backend.onrender.com/api',

    /**
     * Cargar alumnos de una oposición
     */
    async cargarAlumnos(oposicionId) {
        this.oposicionActual = oposicionId;
        const container = document.getElementById('alumnos-content');
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const response = await fetch(`${this.API_URL}/oposiciones/${oposicionId}/alumnos`, {
                headers: {
                    'Authorization': `Bearer ${getTokenAlumnos()}`
                }
            });

            if (!response.ok) throw new Error('Error cargando alumnos');

            const data = await response.json();
            this.alumnos = data.alumnos || [];

            this.renderAlumnos();

        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3 class="empty-title">Error al cargar alumnos</h3>
                    <p class="empty-description">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renderizar tabla de alumnos
     */
    renderAlumnos() {
        const container = document.getElementById('alumnos-content');

        if (this.alumnos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3 class="empty-title">No hay alumnos inscritos</h3>
                    <p class="empty-description">Los alumnos pueden inscribirse usando el código de la oposición</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>Fecha Objetivo</th>
                            <th>Progreso Global</th>
                            <th>Estado</th>
                            <th>Última Actividad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.alumnos.forEach(alumno => {
            const progreso = alumno.progreso_global || 0;
            const estado = alumno.estado_cronograma || 'sin_cronograma';
            const diff = alumno.diferencia_porcentual || 0;

            // Determinar clase de estado
            let estadoBadge = '';
            switch (estado) {
                case 'adelantado':
                    estadoBadge = '<span class="badge badge-success">🔥 Adelantado</span>';
                    break;
                case 'en_tiempo':
                    estadoBadge = '<span class="badge badge-info">✅ En tiempo</span>';
                    break;
                case 'retrasado':
                    estadoBadge = '<span class="badge badge-warning">⚠️ Retrasado</span>';
                    break;
                case 'inactivo':
                    estadoBadge = '<span class="badge badge-danger">⏸️ Inactivo</span>';
                    break;
                default:
                    estadoBadge = '<span class="badge badge-info">➖ Sin cronograma</span>';
            }

            // Clase del progress bar
            let progressClass = 'medium';
            if (progreso >= 70) progressClass = 'high';
            else if (progreso < 40) progressClass = 'low';

            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="user-avatar" style="width: 36px; height: 36px;">
                                ${alumno.nickname ? alumno.nickname.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                                <div style="color: #E0E1DD; font-weight: 500;">${alumno.nickname || 'Alumno'}</div>
                                <div style="font-size: 12px; color: #778DA9;">${alumno.email || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td>${alumno.fecha_objetivo ? new Date(alumno.fecha_objetivo).toLocaleDateString('es-ES') : '-'}</td>
                    <td>
                        <div style="min-width: 120px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 12px; color: #778DA9;">${alumno.preguntas_dominadas || 0}/${alumno.total_preguntas_oposicion || 0}</span>
                                <span style="font-size: 12px; font-weight: 600; color: #60A5FA;">${Math.round(progreso)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${progressClass}" style="width: ${progreso}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${estadoBadge}
                        ${diff !== 0 ? `<div style="font-size: 11px; color: #778DA9; margin-top: 4px;">${diff > 0 ? '+' : ''}${Math.round(diff)}%</div>` : ''}
                    </td>
                    <td style="font-size: 13px;">${alumno.last_activity ? this.formatFechaRelativa(alumno.last_activity) : '-'}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="AlumnosManager.verDetalleAlumno(${alumno.alumno_id})">
                            📊 Ver Detalle
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
    },

    /**
     * Ver detalle de un alumno
     */
    async verDetalleAlumno(alumnoId) {
        this.alumnoSeleccionado = alumnoId;
        const modal = document.getElementById('modal-detalle-alumno');
        modal.classList.add('active');

        const modalContent = document.getElementById('modal-detalle-content');
        modalContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            // Obtener cronograma del alumno
            const response = await fetch(`${this.API_URL}/oposiciones/${this.oposicionActual}/cronogramas`, {
                headers: {
                    'Authorization': `Bearer ${getTokenAlumnos()}`
                }
            });

            if (!response.ok) throw new Error('Error cargando cronograma');

            const data = await response.json();
            const cronogramas = data.cronogramas || [];
            const alumno = cronogramas.find(c => c.alumno_id === alumnoId);

            if (!alumno) {
                modalContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <h3 class="empty-title">Sin cronograma</h3>
                        <p class="empty-description">Este alumno aún no ha configurado su cronograma</p>
                    </div>
                `;
                return;
            }

            // Obtener detalle del cronograma con bloques
            const cronogramaResponse = await fetch(`${this.API_URL}/oposiciones/${this.oposicionActual}/cronograma?alumno_id=${alumnoId}`, {
                headers: {
                    'Authorization': `Bearer ${getTokenAlumnos()}`
                }
            });

            let cronogramaDetalle = null;
            if (cronogramaResponse.ok) {
                const cronogramaData = await cronogramaResponse.json();
                cronogramaDetalle = cronogramaData.cronograma;
            }

            this.renderDetalleAlumno(alumno, cronogramaDetalle);

        } catch (error) {
            console.error('Error:', error);
            modalContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3 class="empty-title">Error al cargar detalle</h3>
                    <p class="empty-description">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renderizar detalle del alumno
     */
    renderDetalleAlumno(alumno, cronogramaDetalle) {
        const modalContent = document.getElementById('modal-detalle-content');

        const progreso = alumno.porcentaje_progreso || 0;
        const estado = alumno.estado || 'sin_cronograma';
        const diff = alumno.diferencia_porcentual || 0;

        let estadoBadge = '';
        switch (estado) {
            case 'adelantado':
                estadoBadge = '<span class="badge badge-success">🔥 Adelantado</span>';
                break;
            case 'en_tiempo':
                estadoBadge = '<span class="badge badge-info">✅ En tiempo</span>';
                break;
            case 'retrasado':
                estadoBadge = '<span class="badge badge-warning">⚠️ Retrasado</span>';
                break;
            case 'inactivo':
                estadoBadge = '<span class="badge badge-danger">⏸️ Inactivo</span>';
                break;
            default:
                estadoBadge = '<span class="badge badge-info">➖ Sin cronograma</span>';
        }

        let html = `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 16px;">
                    <div class="user-avatar" style="width: 60px; height: 60px; font-size: 24px;">
                        ${alumno.nickname ? alumno.nickname.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div style="flex: 1;">
                        <h3 style="color: #E0E1DD; margin: 0; margin-bottom: 4px;">${alumno.nickname || 'Alumno'}</h3>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            ${estadoBadge}
                            ${diff !== 0 ? `<span style="font-size: 13px; color: #778DA9;">${diff > 0 ? '+' : ''}${Math.round(diff)}% ${diff > 0 ? 'adelantado' : 'retrasado'}</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="card-stats" style="margin-top: 16px;">
                    <div class="stat-item">
                        <div class="stat-label">Fecha Objetivo</div>
                        <div class="stat-value" style="font-size: 16px;">${alumno.fecha_objetivo ? new Date(alumno.fecha_objetivo).toLocaleDateString('es-ES') : '-'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Progreso Global</div>
                        <div class="stat-value">${Math.round(progreso)}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Preguntas Dominadas</div>
                        <div class="stat-value">${alumno.preguntas_dominadas || 0}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Total Preguntas</div>
                        <div class="stat-value">${alumno.total_preguntas_oposicion || 0}</div>
                    </div>
                </div>

                <div style="margin-top: 16px;">
                    <div class="progress-bar" style="height: 12px;">
                        <div class="progress-fill ${progreso >= 70 ? 'high' : progreso >= 40 ? 'medium' : 'low'}" style="width: ${progreso}%"></div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 24px;">
                <h4 style="color: #E0E1DD; margin-bottom: 12px;">Progreso por Bloques</h4>
        `;

        if (cronogramaDetalle && cronogramaDetalle.bloques_cronograma) {
            cronogramaDetalle.bloques_cronograma.forEach(bloque => {
                const bloqueProgreso = bloque.porcentaje_progreso || 0;
                const habilitado = bloque.habilitado;
                const completado = bloque.completado;

                let statusIcon = '🔒';
                let statusText = 'Bloqueado';
                if (completado) {
                    statusIcon = '✅';
                    statusText = 'Completado';
                } else if (habilitado) {
                    statusIcon = '🔓';
                    statusText = 'En progreso';
                }

                html += `
                    <div class="card" style="margin-bottom: 12px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 20px;">${statusIcon}</span>
                                    <span style="color: #E0E1DD; font-weight: 500;">${bloque.bloque_nombre}</span>
                                    <span class="badge badge-info" style="font-size: 11px;">${bloque.bloque_orden}</span>
                                </div>
                                <div style="font-size: 12px; color: #778DA9; margin-top: 4px; margin-left: 32px;">
                                    ${statusText} | ${bloque.preguntas_dominadas || 0}/${bloque.total_preguntas_bloque || 0} preguntas
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 18px; font-weight: 600; color: #60A5FA;">${Math.round(bloqueProgreso)}%</div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; font-size: 12px;">
                            <div style="color: #778DA9;">
                                📅 Previsto: ${bloque.fecha_inicio_prevista ? new Date(bloque.fecha_inicio_prevista).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : '-'} -
                                ${bloque.fecha_fin_prevista ? new Date(bloque.fecha_fin_prevista).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : '-'}
                            </div>
                            ${bloque.fecha_inicio_real ? `
                                <div style="color: #778DA9;">
                                    ⏱️ Real: ${new Date(bloque.fecha_inicio_real).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'})}
                                    ${bloque.fecha_fin_real ? ' - ' + new Date(bloque.fecha_fin_real).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : ''}
                                </div>
                            ` : ''}
                        </div>

                        <div class="progress-bar" style="margin-top: 8px;">
                            <div class="progress-fill ${bloqueProgreso >= 70 ? 'high' : bloqueProgreso >= 40 ? 'medium' : 'low'}" style="width: ${bloqueProgreso}%"></div>
                        </div>

                        <div style="margin-top: 12px;">
                            <button class="btn btn-secondary btn-sm" onclick="AlumnosManager.abrirComentarios(${alumno.alumno_id}, ${bloque.bloque_id})">
                                💬 Añadir Comentario
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="empty-state" style="padding: 20px;">
                    <p style="color: #778DA9; margin: 0;">No hay información de bloques disponible</p>
                </div>
            `;
        }

        html += `</div>`;

        modalContent.innerHTML = html;
    },

    /**
     * Abrir formulario de comentarios
     */
    abrirComentarios(alumnoId, bloqueId) {
        const modal = document.getElementById('modal-comentario');
        modal.classList.add('active');
        modal.dataset.alumnoId = alumnoId;
        modal.dataset.bloqueId = bloqueId;
        document.getElementById('form-comentario').reset();
    },

    /**
     * Crear comentario
     */
    async crearComentario(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const modal = document.getElementById('modal-comentario');
        const alumnoId = modal.dataset.alumnoId;
        const bloqueId = modal.dataset.bloqueId;

        const data = {
            alumno_id: parseInt(alumnoId),
            bloque_id: parseInt(bloqueId),
            comentario: formData.get('comentario')
        };

        try {
            const response = await fetch(`${this.API_URL}/comentarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getTokenAlumnos()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error creando comentario');

            alert('✅ Comentario añadido exitosamente');
            this.closeModal('modal-comentario');
            form.reset();
            // Recargar detalle del alumno
            this.verDetalleAlumno(parseInt(alumnoId));

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al crear comentario: ' + error.message);
        }
    },

    /**
     * Formatear fecha relativa
     */
    formatFechaRelativa(fecha) {
        const ahora = new Date();
        const fechaObj = new Date(fecha);
        const diffMs = ahora - fechaObj;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHoras < 24) return `Hace ${diffHoras}h`;
        if (diffDias < 7) return `Hace ${diffDias} días`;
        return fechaObj.toLocaleDateString('es-ES');
    },

    /**
     * Cerrar modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
};

// Exportar para uso global
window.AlumnosManager = AlumnosManager;
