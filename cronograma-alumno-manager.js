/**
 * CRONOGRAMA ALUMNO MANAGER
 * Gestión de visualización del cronograma personalizado del alumno
 */

const CronogramaAlumnoManager = {
    cronograma: null,

    /**
     * Renderizar cronograma en el contenedor
     */
    render(cronogramaData) {
        this.cronograma = cronogramaData;
        const container = document.getElementById('cronograma-container');

        if (!cronogramaData || !cronogramaData.bloques_cronograma) {
            container.innerHTML = this.renderEmpty();
            return;
        }

        const bloques = cronogramaData.bloques_cronograma;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        container.innerHTML = `
            <div class="card">
                <h2>📅 Mi Cronograma Personalizado</h2>
                <p style="color: #778DA9; margin-bottom: 30px;">
                    Cronograma generado para tu fecha objetivo:
                    <strong style="color: #00D4FF;">${new Date(cronogramaData.fecha_objetivo).toLocaleDateString('es-ES')}</strong>
                </p>

                <div class="oposicion-info" style="margin-bottom: 30px;">
                    <div class="info-item">
                        <div class="label">Estado</div>
                        <div class="value">${this.getEstadoBadge(cronogramaData.estado)}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Progreso Global</div>
                        <div class="value">${(cronogramaData.porcentaje_progreso || 0).toFixed(1)}%</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Diferencia</div>
                        <div class="value" style="color: ${this.getDiferenciaColor(cronogramaData.diferencia_porcentual)}">
                            ${cronogramaData.diferencia_porcentual > 0 ? '+' : ''}${(cronogramaData.diferencia_porcentual || 0).toFixed(1)}%
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="label">Días Restantes</div>
                        <div class="value">${this.calcularDiasRestantes(cronogramaData.fecha_objetivo)}</div>
                    </div>
                </div>

                <h3 style="margin-bottom: 20px;">Bloques de Estudio</h3>
                <div class="timeline">
                    ${bloques.map((bloque, index) => this.renderBloque(bloque, index, today)).join('')}
                </div>

                <div style="margin-top: 30px; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; border-left: 4px solid #00D4FF;">
                    <strong style="color: #00D4FF;">💡 Consejo:</strong>
                    <p style="color: #E0E1DD; margin-top: 8px; line-height: 1.6;">
                        Los bloques se habilitarán automáticamente según tu cronograma.
                        Completa cada bloque antes de su fecha prevista para mantenerte adelantado.
                    </p>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar un bloque individual
     */
    renderBloque(bloque, index, today) {
        const fechaInicioPrevista = new Date(bloque.fecha_inicio_prevista);
        const fechaFinPrevista = new Date(bloque.fecha_fin_prevista);

        // Determinar estado visual
        let statusClass = 'locked';
        let statusText = '🔒 Bloqueado';
        let iconClass = 'locked';
        let iconText = index + 1;

        if (bloque.completado) {
            statusClass = 'completed';
            statusText = '✅ Completado';
            iconClass = 'completed';
            iconText = '✓';
        } else if (bloque.habilitado) {
            statusClass = 'enabled';
            statusText = '🔓 Habilitado';
            iconClass = 'enabled';
            iconText = index + 1;
        }

        // Calcular progreso
        const progreso = bloque.porcentaje_progreso || 0;
        let progressClass = 'low';
        if (progreso >= 70) progressClass = 'high';
        else if (progreso >= 30) progressClass = 'medium';

        // Fechas reales si existen
        const fechaInicioReal = bloque.fecha_inicio_real ? new Date(bloque.fecha_inicio_real) : null;
        const fechaFinReal = bloque.fecha_fin_real ? new Date(bloque.fecha_fin_real) : null;

        // Determinar si está retrasado
        const estaRetrasado = bloque.habilitado && !bloque.completado && today > fechaFinPrevista;

        return `
            <div class="timeline-item ${statusClass} ${estaRetrasado ? 'retrasado' : ''}">
                <div class="timeline-icon ${iconClass}">
                    ${iconText}
                </div>

                <div class="bloque-header">
                    <div class="bloque-title">
                        ${bloque.bloque_nombre}
                        ${estaRetrasado ? '<span style="color: #FF6B6B; margin-left: 10px;">⚠️</span>' : ''}
                    </div>
                    <span class="bloque-status ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                <div class="bloque-dates">
                    📅 Previsto: ${fechaInicioPrevista.toLocaleDateString('es-ES')} - ${fechaFinPrevista.toLocaleDateString('es-ES')}
                    ${fechaInicioReal ? `<br>✅ Iniciado: ${fechaInicioReal.toLocaleDateString('es-ES')}` : ''}
                    ${fechaFinReal ? `<br>🎉 Completado: ${fechaFinReal.toLocaleDateString('es-ES')}` : ''}
                </div>

                ${bloque.habilitado || bloque.completado ? `
                    <div style="margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-size: 12px; color: #778DA9;">Progreso</span>
                            <span style="font-size: 12px; color: #E0E1DD; font-weight: 600;">
                                ${bloque.preguntas_dominadas || 0} / ${bloque.total_preguntas_bloque || 0} preguntas
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progressClass}" style="width: ${progreso}%">
                                ${progreso.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    ${bloque.habilitado && !bloque.completado ? `
                        <div class="bloque-actions">
                            <button class="btn" onclick="irAPractica(${bloque.bloque_id})">
                                ✍️ Practicar Ahora
                            </button>
                        </div>
                    ` : ''}
                ` : `
                    <div style="margin-top: 15px; padding: 10px; background: rgba(108, 117, 125, 0.2); border-radius: 8px;">
                        <p style="color: #778DA9; font-size: 14px; margin: 0;">
                            Este bloque se habilitará el <strong>${fechaInicioPrevista.toLocaleDateString('es-ES')}</strong>
                        </p>
                    </div>
                `}
            </div>
        `;
    },

    /**
     * Obtener badge de estado
     */
    getEstadoBadge(estado) {
        switch (estado) {
            case 'adelantado':
                return '<span class="bloque-status completed">🔥 Adelantado</span>';
            case 'en_tiempo':
                return '<span class="bloque-status enabled">✅ En Tiempo</span>';
            case 'retrasado':
                return '<span class="bloque-status locked" style="background: rgba(255, 107, 107, 0.2); color: #FF6B6B;">⚠️ Retrasado</span>';
            case 'inactivo':
                return '<span class="bloque-status locked">⏸️ Inactivo</span>';
            default:
                return '<span class="bloque-status">-</span>';
        }
    },

    /**
     * Obtener color según diferencia porcentual
     */
    getDiferenciaColor(diferencia) {
        if (!diferencia) return '#778DA9';
        if (diferencia >= 10) return '#28A745';
        if (diferencia <= -10) return '#FF6B6B';
        return '#00D4FF';
    },

    /**
     * Calcular días restantes
     */
    calcularDiasRestantes(fechaObjetivo) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const objetivo = new Date(fechaObjetivo);
        objetivo.setHours(0, 0, 0, 0);

        const diff = objetivo - hoy;
        const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (dias < 0) return `${Math.abs(dias)} días pasados`;
        if (dias === 0) return '¡Hoy!';
        if (dias === 1) return '1 día';
        return `${dias} días`;
    },

    /**
     * Renderizar estado vacío
     */
    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No hay cronograma disponible</h3>
                <p>Inscríbete en una oposición para ver tu cronograma personalizado</p>
            </div>
        `;
    }
};

/**
 * Ir a la pestaña de práctica con bloque seleccionado
 */
function irAPractica(bloqueId) {
    // Switch to practica tab
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById('tab-practica').classList.add('active');
    document.querySelectorAll('.tab-btn')[2].classList.add('active'); // Practica is 3rd tab

    // Render practica with selected bloque
    if (typeof PracticaAdaptativaManager !== 'undefined') {
        PracticaAdaptativaManager.render(currentOposicion, currentCronograma, bloqueId);
    }
}
