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
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'modal-torneo-detalle';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="card" style="max-width: 700px; margin: auto; position: relative;">
                <button onclick="this.closest('.modal').remove()"
                        style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #E0E1DD; font-size: 24px; cursor: pointer;">
                    &times;
                </button>
                <div id="torneo-detalle-content">
                    <div class="loading"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/detalle/${torneoId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) throw new Error('Error cargando torneo');

            const data = await response.json();
            this.renderDetalleTorneoAlumno(data.torneo, data.participantes);

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('torneo-detalle-content').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                    <h3>Error al cargar torneo</h3>
                    <p style="color: #778DA9;">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renderizar detalle del torneo para alumno
     */
    renderDetalleTorneoAlumno(torneo, participantes) {
        const content = document.getElementById('torneo-detalle-content');
        const fechaInicio = new Date(torneo.fecha_inicio).toLocaleString('es-ES');
        const fechaFin = new Date(torneo.fecha_fin).toLocaleString('es-ES');

        // Verificar si el alumno ya está inscrito
        const miParticipacion = participantes.find(p => p.alumno_id === currentUser.id);
        const estaInscrito = !!miParticipacion;
        const haCompletado = miParticipacion?.completado || false;

        let actionButton = '';
        if (torneo.estado === 'finalizado') {
            actionButton = '<button class="btn btn-secondary" style="width: 100%;" disabled>🏁 Torneo Finalizado</button>';
        } else if (haCompletado) {
            actionButton = '<button class="btn btn-secondary" style="width: 100%;" disabled>✅ Ya has participado</button>';
        } else if (estaInscrito && torneo.estado === 'activo') {
            actionButton = `<button class="btn" style="width: 100%;" onclick="GamificacionManager.iniciarTorneo(${torneo.id})">🚀 ¡Comenzar Torneo!</button>`;
        } else if (estaInscrito) {
            actionButton = '<button class="btn btn-secondary" style="width: 100%;" disabled>✓ Inscrito - Espera a que inicie</button>';
        } else if (torneo.max_participantes && participantes.length >= torneo.max_participantes) {
            actionButton = '<button class="btn btn-secondary" style="width: 100%;" disabled>🚫 Torneo Completo</button>';
        } else {
            actionButton = `<button class="btn" style="width: 100%;" onclick="GamificacionManager.inscribirseEnTorneo(${torneo.id})">📝 Inscribirse Ahora</button>`;
        }

        content.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="color: #00D4FF; margin-bottom: 10px;">${torneo.nombre}</h2>
                ${torneo.descripcion ? `<p style="color: #778DA9; margin-bottom: 20px;">${torneo.descripcion}</p>` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; text-align: center;">
                        <div style="font-size: 11px; color: #778DA9; margin-bottom: 5px;">TIPO</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${this.getTipoTorneoLabel(torneo.tipo)}</div>
                    </div>
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; text-align: center;">
                        <div style="font-size: 11px; color: #778DA9; margin-bottom: 5px;">PARTICIPANTES</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${participantes.length}${torneo.max_participantes ? `/${torneo.max_participantes}` : ''}</div>
                    </div>
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; text-align: center;">
                        <div style="font-size: 11px; color: #778DA9; margin-bottom: 5px;">PREGUNTAS</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${torneo.num_preguntas}</div>
                    </div>
                </div>

                <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 20px;">
                    <div style="margin-bottom: 8px;">📅 <strong>Inicio:</strong> ${fechaInicio}</div>
                    <div>🏁 <strong>Fin:</strong> ${fechaFin}</div>
                </div>

                ${actionButton}

                ${haCompletado && miParticipacion ? `
                    <div style="margin-top: 20px; padding: 20px; background: rgba(40, 167, 69, 0.1); border-radius: 10px; border-left: 4px solid #28A745;">
                        <h4 style="color: #28A745; margin-bottom: 10px;">🎉 ¡Tu Resultado!</h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #00D4FF;">${miParticipacion.posicion || '-'}</div>
                                <div style="font-size: 11px; color: #778DA9;">POSICIÓN</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #00D4FF;">${miParticipacion.puntuacion}</div>
                                <div style="font-size: 11px; color: #778DA9;">PUNTOS</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #00D4FF;">${miParticipacion.respuestas_correctas}/${miParticipacion.respuestas_correctas + miParticipacion.respuestas_incorrectas}</div>
                                <div style="font-size: 11px; color: #778DA9;">ACIERTOS</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Inscribirse en torneo
     */
    async inscribirseEnTorneo(torneoId) {
        if (!confirm('¿Quieres inscribirte en este torneo?')) {
            return;
        }

        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/${torneoId}/inscribir`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al inscribirse');
            }

            alert('✅ ¡Inscripción exitosa! Podrás participar cuando el torneo esté activo.');

            // Cerrar y recargar modal
            document.getElementById('modal-torneo-detalle').remove();
            this.verDetalleTorneo(torneoId);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al inscribirse: ' + error.message);
        }
    },

    /**
     * Iniciar participación en torneo
     */
    async iniciarTorneo(torneoId) {
        if (!confirm('¿Estás listo para comenzar el torneo? El cronómetro comenzará inmediatamente.')) {
            return;
        }

        // Cerrar modal de detalle
        document.getElementById('modal-torneo-detalle').remove();

        // Mostrar interfaz de torneo con loading
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'modal-torneo-play';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="card" style="max-width: 900px; width: 95%; margin: auto;">
                <div id="torneo-play-content">
                    <div class="loading"><div class="spinner"></div><p>Preparando torneo...</p></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/${torneoId}/iniciar`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al iniciar torneo');
            }

            const data = await response.json();
            this.jugarTorneo(data);

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('torneo-play-content').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                    <h3>Error al iniciar torneo</h3>
                    <p style="color: #778DA9;">${error.message}</p>
                    <button class="btn" onclick="document.getElementById('modal-torneo-play').remove()" style="margin-top: 20px;">Cerrar</button>
                </div>
            `;
        }
    },

    /**
     * Jugar torneo (interfaz de preguntas con cronómetro)
     */
    jugarTorneo(data) {
        const { participante_id, preguntas, tipo_torneo } = data;

        const estado = {
            participante_id,
            tipo_torneo,
            preguntas,
            indiceActual: 0,
            respuestas: [],
            tiempoInicioPregunta: Date.now(),
            tiempoInicioTorneo: Date.now()
        };

        this.renderPreguntaTorneo(estado);
    },

    /**
     * Renderizar pregunta del torneo
     */
    renderPreguntaTorneo(estado) {
        const pregunta = estado.preguntas[estado.indiceActual];
        const progreso = ((estado.indiceActual + 1) / estado.preguntas.length) * 100;
        const tiempoTranscurrido = Math.floor((Date.now() - estado.tiempoInicioTorneo) / 1000);
        const minutos = Math.floor(tiempoTranscurrido / 60);
        const segundos = tiempoTranscurrido % 60;

        const content = document.getElementById('torneo-play-content');

        content.innerHTML = `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #00D4FF; margin: 0;">⚔️ Torneo en Curso</h3>
                    <div style="font-size: 24px; font-weight: bold; color: #FFC107;">
                        ⏱️ ${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #778DA9;">Pregunta ${estado.indiceActual + 1} de ${estado.preguntas.length}</span>
                        <span style="color: #E0E1DD; font-weight: 600;">${progreso.toFixed(0)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progreso}%"></div>
                    </div>
                </div>

                <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; border-left: 4px solid #00D4FF; margin-bottom: 30px;">
                    <p style="color: #E0E1DD; font-size: 18px; line-height: 1.6; margin: 0;">
                        ${pregunta.question_text}
                    </p>
                </div>

                <div id="opciones-torneo" style="display: grid; gap: 15px; margin-bottom: 30px;">
                    ${this.renderOpcionesTorneo(pregunta)}
                </div>

                <button class="btn" id="btn-confirmar-torneo" onclick="GamificacionManager.confirmarRespuestaTorneo()" disabled style="width: 100%;">
                    ✓ Confirmar Respuesta
                </button>
            </div>
        `;

        // Guardar estado globalmente
        window.torneoEstado = estado;

        // Actualizar cronómetro cada segundo
        if (window.torneoTimer) clearInterval(window.torneoTimer);
        window.torneoTimer = setInterval(() => {
            const tiempo = Math.floor((Date.now() - estado.tiempoInicioTorneo) / 1000);
            const m = Math.floor(tiempo / 60);
            const s = tiempo % 60;
            const timerElement = document.querySelector('[style*="24px"][style*="FFC107"]');
            if (timerElement) {
                timerElement.textContent = `⏱️ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        }, 1000);
    },

    /**
     * Renderizar opciones de torneo
     */
    renderOpcionesTorneo(pregunta) {
        const opciones = [
            { id: 'a', texto: pregunta.option_a },
            { id: 'b', texto: pregunta.option_b },
            { id: 'c', texto: pregunta.option_c },
            { id: 'd', texto: pregunta.option_d }
        ].filter(op => op.texto && op.texto.trim() !== '');

        return opciones.map(opcion => `
            <div class="opcion-respuesta-torneo" onclick="GamificacionManager.seleccionarOpcionTorneo('${opcion.id}')"
                 data-opcion="${opcion.id}"
                 style="padding: 20px; background: rgba(255, 255, 255, 0.05); border: 2px solid #415A77; border-radius: 12px; cursor: pointer; transition: all 0.3s;">
                <span style="display: inline-block; width: 35px; height: 35px; background: #415A77; border-radius: 50%; text-align: center; line-height: 35px; margin-right: 15px; font-weight: bold;">
                    ${opcion.id.toUpperCase()}
                </span>
                <span style="color: #E0E1DD; font-size: 16px;">
                    ${opcion.texto}
                </span>
            </div>
        `).join('');
    },

    /**
     * Seleccionar opción en torneo
     */
    seleccionarOpcionTorneo(opcionId) {
        // Remover selección anterior
        document.querySelectorAll('.opcion-respuesta-torneo').forEach(el => {
            el.style.border = '2px solid #415A77';
            el.style.background = 'rgba(255, 255, 255, 0.05)';
        });

        // Marcar nueva selección
        const opcion = document.querySelector(`[data-opcion="${opcionId}"]`);
        opcion.style.border = '2px solid #00D4FF';
        opcion.style.background = 'rgba(0, 212, 255, 0.1)';

        // Habilitar botón confirmar
        document.getElementById('btn-confirmar-torneo').disabled = false;

        // Guardar selección
        window.torneoEstado.opcionSeleccionada = opcionId;
    },

    /**
     * Confirmar respuesta en torneo
     */
    confirmarRespuestaTorneo() {
        const estado = window.torneoEstado;
        const pregunta = estado.preguntas[estado.indiceActual];
        const opcionSeleccionada = estado.opcionSeleccionada;
        const esCorrecta = opcionSeleccionada === pregunta.correct_answer.toLowerCase();
        const tiempoRespuesta = Math.floor((Date.now() - estado.tiempoInicioPregunta) / 1000);

        // Guardar respuesta
        estado.respuestas.push({
            pregunta_id: pregunta.id,
            respuesta: opcionSeleccionada,
            tiempo_segundos: tiempoRespuesta
        });

        // Avanzar a siguiente pregunta o finalizar
        estado.indiceActual++;

        if (estado.indiceActual < estado.preguntas.length) {
            // Siguiente pregunta
            estado.tiempoInicioPregunta = Date.now();
            estado.opcionSeleccionada = null;
            this.renderPreguntaTorneo(estado);
        } else {
            // Finalizar torneo
            clearInterval(window.torneoTimer);
            this.finalizarTorneo(estado);
        }
    },

    /**
     * Finalizar torneo
     */
    async finalizarTorneo(estado) {
        const content = document.getElementById('torneo-play-content');
        content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Enviando respuestas...</p></div>';

        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/finalizar/${estado.participante_id}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        respuestas: estado.respuestas
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al finalizar torneo');
            }

            const data = await response.json();
            this.mostrarResultadosTorneo(data);

        } catch (error) {
            console.error('Error:', error);
            content.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                    <h3>Error al enviar respuestas</h3>
                    <p style="color: #778DA9;">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Mostrar resultados del torneo
     */
    mostrarResultadosTorneo(data) {
        const { puntuacion, correctas, incorrectas, tiempo_total, posicion } = data;
        const content = document.getElementById('torneo-play-content');

        const minutos = Math.floor(tiempo_total / 60);
        const segundos = tiempo_total % 60;

        let medalIcon = '';
        let mensajeFelicitacion = '';

        if (posicion === 1) {
            medalIcon = '🥇';
            mensajeFelicitacion = '¡ERES EL CAMPEÓN!';
        } else if (posicion === 2) {
            medalIcon = '🥈';
            mensajeFelicitacion = '¡SEGUNDO LUGAR!';
        } else if (posicion === 3) {
            medalIcon = '🥉';
            mensajeFelicitacion = '¡TERCER LUGAR!';
        } else {
            medalIcon = '🏆';
            mensajeFelicitacion = '¡TORNEO COMPLETADO!';
        }

        content.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 20px;">${medalIcon}</div>
                <h2 style="color: #00D4FF; margin-bottom: 10px; font-size: 32px;">${mensajeFelicitacion}</h2>
                <p style="color: #778DA9; margin-bottom: 40px;">Has completado el torneo</p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 40px;">
                    <div style="padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: bold; color: #00D4FF;">${posicion}</div>
                        <div style="color: #778DA9; font-size: 12px;">POSICIÓN</div>
                    </div>
                    <div style="padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: bold; color: #00D4FF;">${puntuacion}</div>
                        <div style="color: #778DA9; font-size: 12px;">PUNTOS</div>
                    </div>
                    <div style="padding: 20px; background: rgba(40, 167, 69, 0.1); border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: bold; color: #28A745;">${correctas}</div>
                        <div style="color: #778DA9; font-size: 12px;">ACIERTOS</div>
                    </div>
                    <div style="padding: 20px; background: rgba(220, 53, 69, 0.1); border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: bold; color: #DC3545;">${incorrectas}</div>
                        <div style="color: #778DA9; font-size: 12px;">ERRORES</div>
                    </div>
                </div>

                <div style="padding: 20px; background: rgba(255, 193, 7, 0.1); border-radius: 12px; margin-bottom: 30px;">
                    <div style="font-size: 24px; font-weight: bold; color: #FFC107;">
                        ⏱️ ${minutos}m ${segundos}s
                    </div>
                    <div style="color: #778DA9; font-size: 12px; margin-top: 5px;">TIEMPO TOTAL</div>
                </div>

                <button class="btn" onclick="document.getElementById('modal-torneo-play').remove(); GamificacionManager.render(currentOposicion)" style="width: 100%;">
                    ✓ Cerrar y Actualizar
                </button>
            </div>
        `;

        // Limpiar timer
        if (window.torneoTimer) {
            clearInterval(window.torneoTimer);
            window.torneoTimer = null;
        }
        window.torneoEstado = null;
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
