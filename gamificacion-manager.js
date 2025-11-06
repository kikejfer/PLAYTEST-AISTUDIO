/**
 * GAMIFICACION MANAGER
 * Gestión de badges, rankings, torneos y estadísticas de gamificación
 */

const GamificacionManager = {
    oposicion: null,
    misBadges: [],
    misPuntos: null,
    ranking: [],
    torneos: [],
    racha: null,

    /**
     * Renderizar pestaña de gamificación
     */
    async render(oposicionData) {
        this.oposicion = oposicionData;
        const container = document.getElementById('gamificacion-container');

        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando gamificación...</p></div>';

        try {
            // Cargar datos en paralelo
            await Promise.all([
                this.cargarMisPuntos(),
                this.cargarMisBadges(),
                this.cargarRanking(),
                this.cargarTorneos(),
                this.cargarRacha()
            ]);

            this.renderGamificacion();

        } catch (error) {
            console.error('Error cargando gamificación:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <h3>Error al cargar gamificación</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Cargar puntos del alumno
     */
    async cargarMisPuntos() {
        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/mi-posicion/${this.oposicion.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();
            this.misPuntos = data.posicion || {
                posicion: '-',
                puntos_totales: 0,
                total_alumnos: 0
            };

            // Actualizar puntos si no existen
            if (!data.posicion) {
                await fetch('https://playtest-backend.onrender.com/api/gamificacion/actualizar-puntos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ oposicion_id: this.oposicion.id })
                });

                // Recargar
                const response2 = await fetch(
                    `https://playtest-backend.onrender.com/api/gamificacion/mi-posicion/${this.oposicion.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                const data2 = await response2.json();
                this.misPuntos = data2.posicion || this.misPuntos;
            }

        } catch (error) {
            console.error('Error cargando puntos:', error);
            this.misPuntos = { posicion: '-', puntos_totales: 0, total_alumnos: 0 };
        }
    },

    /**
     * Cargar badges del alumno
     */
    async cargarMisBadges() {
        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/mis-badges?oposicion_id=${this.oposicion.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();
            this.misBadges = data.badges || [];

        } catch (error) {
            console.error('Error cargando badges:', error);
            this.misBadges = [];
        }
    },

    /**
     * Cargar ranking
     */
    async cargarRanking() {
        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/ranking/${this.oposicion.id}?limite=10`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();
            this.ranking = data.ranking || [];

        } catch (error) {
            console.error('Error cargando ranking:', error);
            this.ranking = [];
        }
    },

    /**
     * Cargar torneos
     */
    async cargarTorneos() {
        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/${this.oposicion.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();
            this.torneos = data.torneos || [];

        } catch (error) {
            console.error('Error cargando torneos:', error);
            this.torneos = [];
        }
    },

    /**
     * Cargar racha
     */
    async cargarRacha() {
        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/mi-racha/${this.oposicion.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const data = await response.json();
            this.racha = data.racha || { racha_actual: 0, racha_maxima: 0 };

        } catch (error) {
            console.error('Error cargando racha:', error);
            this.racha = { racha_actual: 0, racha_maxima: 0 };
        }
    },

    /**
     * Renderizar gamificación completa
     */
    renderGamificacion() {
        const container = document.getElementById('gamificacion-container');

        container.innerHTML = `
            <!-- Stats Grid -->
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-value">${this.misPuntos.posicion}</div>
                    <div class="stat-label">Posición en Ranking</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.misPuntos.puntos_totales || 0}</div>
                    <div class="stat-label">Puntos Totales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.misBadges.length}</div>
                    <div class="stat-label">Badges Obtenidos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">🔥 ${this.racha.racha_actual}</div>
                    <div class="stat-label">Racha Actual</div>
                </div>
            </div>

            <!-- Tabs de Gamificación -->
            <div class="tabs" style="margin-bottom: 30px;">
                <button class="tab-btn active" onclick="GamificacionManager.switchSubTab('badges')">
                    🏆 Mis Badges
                </button>
                <button class="tab-btn" onclick="GamificacionManager.switchSubTab('ranking')">
                    📊 Ranking
                </button>
                <button class="tab-btn" onclick="GamificacionManager.switchSubTab('torneos')">
                    ⚔️ Torneos
                </button>
                <button class="tab-btn" onclick="GamificacionManager.switchSubTab('racha')">
                    🔥 Mi Racha
                </button>
            </div>

            <!-- Sub-tabs content -->
            <div id="sub-tab-badges" class="sub-tab-content active">
                ${this.renderBadges()}
            </div>

            <div id="sub-tab-ranking" class="sub-tab-content">
                ${this.renderRanking()}
            </div>

            <div id="sub-tab-torneos" class="sub-tab-content">
                ${this.renderTorneos()}
            </div>

            <div id="sub-tab-racha" class="sub-tab-content">
                ${this.renderRacha()}
            </div>
        `;
    },

    /**
     * Switch entre sub-tabs
     */
    switchSubTab(tabName) {
        // Hide all sub-tabs
        document.querySelectorAll('.sub-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from buttons
        document.querySelectorAll('#gamificacion-container .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`sub-tab-${tabName}`).classList.add('active');
        event.target.classList.add('active');
    },

    /**
     * Renderizar badges
     */
    renderBadges() {
        if (this.misBadges.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <h3>Aún no tienes badges</h3>
                    <p>Sigue practicando y completando bloques para desbloquear logros</p>
                </div>
            `;
        }

        const badgesHTML = this.misBadges.map(badge => `
            <div class="card" style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">${badge.icono}</div>
                <h3 style="color: #00D4FF; margin-bottom: 10px;">${badge.nombre}</h3>
                <p style="color: #778DA9; font-size: 14px; margin-bottom: 15px;">
                    ${badge.descripcion}
                </p>
                <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                    <span style="color: #00D4FF; font-weight: 600;">+${badge.puntos_otorga} puntos</span>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #778DA9;">
                    Obtenido: ${new Date(badge.obtenido_en).toLocaleDateString('es-ES')}
                </div>
            </div>
        `).join('');

        return `
            <div class="card">
                <h2>🏆 Mis Logros</h2>
                <p style="color: #778DA9; margin-bottom: 30px;">
                    Has desbloqueado ${this.misBadges.length} badges
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                    ${badgesHTML}
                </div>
            </div>
        `;
    },

    /**
     * Renderizar ranking
     */
    renderRanking() {
        if (this.ranking.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No hay datos de ranking</h3>
                    <p>Aún no hay suficientes participantes</p>
                </div>
            `;
        }

        const rankingHTML = this.ranking.map(alumno => {
            let medalIcon = '';
            if (alumno.posicion === 1) medalIcon = '🥇';
            else if (alumno.posicion === 2) medalIcon = '🥈';
            else if (alumno.posicion === 3) medalIcon = '🥉';

            const isCurrentUser = alumno.alumno_id === currentUser.id;

            return `
                <tr style="${isCurrentUser ? 'background: rgba(0, 212, 255, 0.1); font-weight: 600;' : ''}">
                    <td style="padding: 15px; text-align: center;">
                        <span style="font-size: 20px;">${medalIcon || alumno.posicion}</span>
                    </td>
                    <td style="padding: 15px;">${alumno.nickname}${isCurrentUser ? ' (Tú)' : ''}</td>
                    <td style="padding: 15px; text-align: center;">${alumno.nivel}</td>
                    <td style="padding: 15px; text-align: center; color: #00D4FF; font-weight: 600;">
                        ${alumno.puntos_totales}
                    </td>
                    <td style="padding: 15px; text-align: center;">${alumno.total_badges}</td>
                    <td style="padding: 15px; text-align: center;">${(alumno.porcentaje_progreso || 0).toFixed(1)}%</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="card">
                <h2>📊 Ranking Global</h2>
                <p style="color: #778DA9; margin-bottom: 20px;">
                    Tu posición: <strong style="color: #00D4FF;">#${this.misPuntos.posicion}</strong> de ${this.misPuntos.total_alumnos} alumnos
                </p>

                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #415A77;">
                                <th style="padding: 15px; text-align: center; color: #778DA9;">Pos</th>
                                <th style="padding: 15px; text-align: left; color: #778DA9;">Alumno</th>
                                <th style="padding: 15px; text-align: center; color: #778DA9;">Nivel</th>
                                <th style="padding: 15px; text-align: center; color: #778DA9;">Puntos</th>
                                <th style="padding: 15px; text-align: center; color: #778DA9;">Badges</th>
                                <th style="padding: 15px; text-align: center; color: #778DA9;">Progreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rankingHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar torneos
     */
    renderTorneos() {
        const torneosActivos = this.torneos.filter(t => t.estado === 'activo' || t.estado === 'pendiente');
        const torneosFinalizados = this.torneos.filter(t => t.estado === 'finalizado');

        let html = '';

        if (torneosActivos.length > 0) {
            html += '<div class="card"><h2>⚔️ Torneos Disponibles</h2>';
            html += '<div style="display: grid; gap: 15px;">';

            torneosActivos.forEach(torneo => {
                const fechaInicio = new Date(torneo.fecha_inicio).toLocaleDateString('es-ES');
                const fechaFin = new Date(torneo.fecha_fin).toLocaleDateString('es-ES');

                html += `
                    <div style="padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border-left: 4px solid #00D4FF;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #E0E1DD;">${torneo.nombre}</h3>
                            <span class="bloque-status ${torneo.estado === 'activo' ? 'enabled' : ''}">
                                ${torneo.estado === 'activo' ? '🔴 En Vivo' : '📅 Próximamente'}
                            </span>
                        </div>

                        ${torneo.descripcion ? `<p style="color: #778DA9; margin-bottom: 15px;">${torneo.descripcion}</p>` : ''}

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                            <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                                <div style="font-size: 12px; color: #778DA9;">Tipo</div>
                                <div style="color: #E0E1DD; font-weight: 600;">${this.getTipoTorneoLabel(torneo.tipo)}</div>
                            </div>
                            <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                                <div style="font-size: 12px; color: #778DA9;">Participantes</div>
                                <div style="color: #E0E1DD; font-weight: 600;">${torneo.num_participantes}${torneo.max_participantes ? `/${torneo.max_participantes}` : ''}</div>
                            </div>
                            <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                                <div style="font-size: 12px; color: #778DA9;">Preguntas</div>
                                <div style="color: #E0E1DD; font-weight: 600;">${torneo.num_preguntas}</div>
                            </div>
                        </div>

                        <div style="font-size: 14px; color: #778DA9; margin-bottom: 15px;">
                            📅 ${fechaInicio} - ${fechaFin}
                        </div>

                        <button class="btn" onclick="GamificacionManager.verDetalleTorneo(${torneo.id})">
                            Ver Detalles e Inscribirse
                        </button>
                    </div>
                `;
            });

            html += '</div></div>';
        }

        if (torneosFinalizados.length > 0) {
            html += '<div class="card" style="margin-top: 20px;"><h2>🏁 Torneos Finalizados</h2>';
            html += '<div style="display: grid; gap: 15px;">';

            torneosFinalizados.forEach(torneo => {
                html += `
                    <div style="padding: 15px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; opacity: 0.7;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; color: #E0E1DD;">${torneo.nombre}</h4>
                                <div style="font-size: 12px; color: #778DA9; margin-top: 5px;">
                                    ${torneo.num_participantes} participantes
                                </div>
                            </div>
                            <button class="btn btn-secondary" onclick="GamificacionManager.verDetalleTorneo(${torneo.id})">
                                Ver Resultados
                            </button>
                        </div>
                    </div>
                `;
            });

            html += '</div></div>';
        }

        if (this.torneos.length === 0) {
            html = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚔️</div>
                    <h3>No hay torneos disponibles</h3>
                    <p>Tu profesor aún no ha creado ningún torneo</p>
                </div>
            `;
        }

        return html;
    },

    /**
     * Renderizar racha
     */
    renderRacha() {
        return `
            <div class="card" style="text-align: center;">
                <h2>🔥 Mi Racha de Estudio</h2>
                <p style="color: #778DA9; margin-bottom: 40px;">
                    Mantén tu racha practicando cada día
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 40px;">
                    <div style="padding: 40px; background: rgba(255, 107, 107, 0.1); border-radius: 15px; border: 2px solid #FF6B6B;">
                        <div style="font-size: 64px; margin-bottom: 15px;">🔥</div>
                        <div style="font-size: 48px; font-weight: bold; color: #FF6B6B; margin-bottom: 10px;">
                            ${this.racha.racha_actual}
                        </div>
                        <div style="color: #778DA9;">Días Consecutivos</div>
                    </div>

                    <div style="padding: 40px; background: rgba(0, 212, 255, 0.1); border-radius: 15px; border: 2px solid #00D4FF;">
                        <div style="font-size: 64px; margin-bottom: 15px;">🏆</div>
                        <div style="font-size: 48px; font-weight: bold; color: #00D4FF; margin-bottom: 10px;">
                            ${this.racha.racha_maxima}
                        </div>
                        <div style="color: #778DA9;">Récord Personal</div>
                    </div>
                </div>

                <div style="padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 12px; border-left: 4px solid #FFC107;">
                    <strong style="color: #FFC107;">💡 Consejo:</strong>
                    <p style="color: #E0E1DD; margin-top: 10px; line-height: 1.6;">
                        Practicar cada día no solo aumenta tu racha, también mejora tu retención y te da puntos extra.
                        ¡Cada día de racha suma 5 puntos a tu puntuación total!
                    </p>
                </div>
            </div>
        `;
    },

    /**
     * Ver detalle de torneo
     */
    async verDetalleTorneo(torneoId) {
        alert('Funcionalidad de torneos en desarrollo. Torneo ID: ' + torneoId);
        // TODO: Implementar modal con detalle de torneo e inscripción
    },

    /**
     * Obtener label de tipo de torneo
     */
    getTipoTorneoLabel(tipo) {
        const tipos = {
            'puntos': '💯 Máxima Puntuación',
            'velocidad': '⚡ Velocidad',
            'precision': '🎯 Precisión',
            'resistencia': '💪 Resistencia'
        };
        return tipos[tipo] || tipo;
    }
};

// Styles for sub-tabs
const subTabStyles = document.createElement('style');
subTabStyles.innerHTML = `
    .sub-tab-content {
        display: none;
    }

    .sub-tab-content.active {
        display: block;
        animation: fadeIn 0.4s;
    }
`;
document.head.appendChild(subTabStyles);
