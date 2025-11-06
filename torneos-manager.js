/**
 * TORNEOS MANAGER (Panel de Profesor)
 * Gestión de torneos: creación, visualización y control
 */

// Helper function to get authentication token
function getTokenTorneos() {
    return localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

const TorneosManager = {
    oposicionActual: null,
    torneos: [],
    bloques: [],

    /**
     * Cargar torneos de una oposición
     */
    async cargarTorneos(oposicionId) {
        this.oposicionActual = oposicionId;
        const container = document.getElementById('torneos-container');

        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            // Cargar torneos
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/${oposicionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${getTokenTorneos()}`
                    }
                }
            );

            if (!response.ok) throw new Error('Error cargando torneos');

            const data = await response.json();
            this.torneos = data.torneos || [];

            // Cargar bloques para el selector del modal
            await this.cargarBloques(oposicionId);

            this.renderTorneos();

        } catch (error) {
            console.error('Error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3 class="empty-title">Error al cargar torneos</h3>
                    <p class="empty-description">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Cargar bloques de la oposición para el selector
     */
    async cargarBloques(oposicionId) {
        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/oposiciones/${oposicionId}/bloques`,
                {
                    headers: {
                        'Authorization': `Bearer ${getTokenTorneos()}`
                    }
                }
            );

            if (!response.ok) throw new Error('Error cargando bloques');

            const data = await response.json();
            this.bloques = data.bloques || [];

            // Actualizar selector en el modal
            const selector = document.getElementById('select-bloque-torneo');
            if (selector) {
                selector.innerHTML = '<option value="">Toda la oposición</option>' +
                    this.bloques.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
            }

        } catch (error) {
            console.error('Error cargando bloques:', error);
            this.bloques = [];
        }
    },

    /**
     * Renderizar lista de torneos
     */
    renderTorneos() {
        const container = document.getElementById('torneos-container');

        if (this.torneos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚔️</div>
                    <h3 class="empty-title">No hay torneos creados</h3>
                    <p class="empty-description">Crea tu primer torneo para motivar a tus alumnos</p>
                    <button class="btn btn-primary" onclick="TorneosManager.openModalCrearTorneo()">
                        ⚔️ Crear Primer Torneo
                    </button>
                </div>
            `;
            return;
        }

        // Agrupar por estado
        const activos = this.torneos.filter(t => t.estado === 'activo');
        const pendientes = this.torneos.filter(t => t.estado === 'pendiente');
        const finalizados = this.torneos.filter(t => t.estado === 'finalizado');

        let html = '';

        // Torneos Activos
        if (activos.length > 0) {
            html += '<div class="card" style="margin-bottom: 20px;"><h3 style="color: #28A745; margin-bottom: 20px;">🔴 Torneos En Vivo</h3>';
            html += '<div style="display: grid; gap: 15px;">';
            activos.forEach(torneo => {
                html += this.renderTorneoCard(torneo, true);
            });
            html += '</div></div>';
        }

        // Torneos Pendientes
        if (pendientes.length > 0) {
            html += '<div class="card" style="margin-bottom: 20px;"><h3 style="color: #FFC107; margin-bottom: 20px;">📅 Próximos Torneos</h3>';
            html += '<div style="display: grid; gap: 15px;">';
            pendientes.forEach(torneo => {
                html += this.renderTorneoCard(torneo, false);
            });
            html += '</div></div>';
        }

        // Torneos Finalizados
        if (finalizados.length > 0) {
            html += '<div class="card"><h3 style="color: #778DA9; margin-bottom: 20px;">🏁 Torneos Finalizados</h3>';
            html += '<div style="display: grid; gap: 15px;">';
            finalizados.forEach(torneo => {
                html += this.renderTorneoCard(torneo, false);
            });
            html += '</div></div>';
        }

        container.innerHTML = html;
    },

    /**
     * Renderizar tarjeta de torneo individual
     */
    renderTorneoCard(torneo, esActivo) {
        const fechaInicio = new Date(torneo.fecha_inicio).toLocaleString('es-ES');
        const fechaFin = new Date(torneo.fecha_fin).toLocaleString('es-ES');

        let estadoBadge = '';
        switch (torneo.estado) {
            case 'activo':
                estadoBadge = '<span style="padding: 5px 15px; background: rgba(40, 167, 69, 0.2); color: #28A745; border-radius: 20px; font-size: 12px; font-weight: 600;">🔴 EN VIVO</span>';
                break;
            case 'pendiente':
                estadoBadge = '<span style="padding: 5px 15px; background: rgba(255, 193, 7, 0.2); color: #FFC107; border-radius: 20px; font-size: 12px; font-weight: 600;">📅 PRÓXIMAMENTE</span>';
                break;
            case 'finalizado':
                estadoBadge = '<span style="padding: 5px 15px; background: rgba(119, 141, 169, 0.2); color: #778DA9; border-radius: 20px; font-size: 12px; font-weight: 600;">🏁 FINALIZADO</span>';
                break;
        }

        const tipoLabel = this.getTipoTorneoLabel(torneo.tipo);

        return `
            <div style="padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border-left: 4px solid ${esActivo ? '#28A745' : '#415A77'};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <h4 style="color: #E0E1DD; margin-bottom: 8px;">${torneo.nombre}</h4>
                        ${torneo.descripcion ? `<p style="color: #778DA9; font-size: 14px; margin-bottom: 10px;">${torneo.descripcion}</p>` : ''}
                    </div>
                    ${estadoBadge}
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                    <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                        <div style="font-size: 11px; color: #778DA9; text-transform: uppercase;">Tipo</div>
                        <div style="color: #E0E1DD; font-weight: 600; font-size: 13px;">${tipoLabel}</div>
                    </div>
                    <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                        <div style="font-size: 11px; color: #778DA9; text-transform: uppercase;">Participantes</div>
                        <div style="color: #E0E1DD; font-weight: 600; font-size: 13px;">${torneo.num_participantes || 0}${torneo.max_participantes ? `/${torneo.max_participantes}` : ''}</div>
                    </div>
                    <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                        <div style="font-size: 11px; color: #778DA9; text-transform: uppercase;">Preguntas</div>
                        <div style="color: #E0E1DD; font-weight: 600; font-size: 13px;">${torneo.num_preguntas}</div>
                    </div>
                    ${torneo.bloque_nombre ? `
                        <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                            <div style="font-size: 11px; color: #778DA9; text-transform: uppercase;">Bloque</div>
                            <div style="color: #E0E1DD; font-weight: 600; font-size: 13px;">${torneo.bloque_nombre}</div>
                        </div>
                    ` : ''}
                </div>

                <div style="font-size: 13px; color: #778DA9; margin-bottom: 15px;">
                    <div>📅 Inicio: ${fechaInicio}</div>
                    <div>🏁 Fin: ${fechaFin}</div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary btn-sm" onclick="TorneosManager.verDetalleTorneo(${torneo.id})">
                        👥 Ver Participantes (${torneo.num_participantes || 0})
                    </button>
                    ${torneo.estado !== 'finalizado' ? `
                        <button class="btn btn-secondary btn-sm" onclick="TorneosManager.cancelarTorneo(${torneo.id})">
                            ❌ Cancelar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Obtener etiqueta del tipo de torneo
     */
    getTipoTorneoLabel(tipo) {
        const tipos = {
            'puntos': '💯 Puntos',
            'velocidad': '⚡ Velocidad',
            'precision': '🎯 Precisión',
            'resistencia': '💪 Resistencia'
        };
        return tipos[tipo] || tipo;
    },

    /**
     * Abrir modal para crear torneo
     */
    openModalCrearTorneo() {
        if (!this.oposicionActual) {
            alert('Primero selecciona una oposición');
            return;
        }

        // Establecer fechas mínimas
        const now = new Date();
        const nowString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

        const inputs = document.querySelectorAll('#form-crear-torneo input[type="datetime-local"]');
        inputs.forEach(input => {
            input.setAttribute('min', nowString);
        });

        // Resetear form
        document.getElementById('form-crear-torneo').reset();

        // Mostrar modal
        document.getElementById('modal-crear-torneo').style.display = 'flex';
    },

    /**
     * Crear torneo
     */
    async crearTorneo(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const data = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion') || null,
            tipo: formData.get('tipo'),
            bloque_id: formData.get('bloque_id') || null,
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_fin: formData.get('fecha_fin'),
            num_preguntas: parseInt(formData.get('num_preguntas')),
            max_participantes: formData.get('max_participantes') ? parseInt(formData.get('max_participantes')) : null
        };

        // Validación de fechas
        if (new Date(data.fecha_inicio) >= new Date(data.fecha_fin)) {
            alert('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        try {
            const response = await fetch('https://playtest-backend.onrender.com/api/gamificacion/torneos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getTokenTorneos()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oposicion_id: this.oposicionActual,
                    ...data
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear torneo');
            }

            const result = await response.json();

            alert('✅ Torneo creado exitosamente!');
            this.closeModal('modal-crear-torneo');
            form.reset();

            // Recargar torneos
            await this.cargarTorneos(this.oposicionActual);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al crear torneo: ' + error.message);
        }
    },

    /**
     * Ver detalle de torneo
     */
    async verDetalleTorneo(torneoId) {
        const modal = document.getElementById('modal-detalle-torneo');
        const content = document.getElementById('modal-detalle-torneo-content');

        // Mostrar modal con loading
        modal.style.display = 'flex';
        content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const response = await fetch(
                `https://playtest-backend.onrender.com/api/gamificacion/torneos/detalle/${torneoId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${getTokenTorneos()}`
                    }
                }
            );

            if (!response.ok) throw new Error('Error cargando detalle');

            const data = await response.json();
            const torneo = data.torneo;
            const participantes = data.participantes || [];

            // Renderizar detalle
            content.innerHTML = this.renderDetalleTorneo(torneo, participantes);

        } catch (error) {
            console.error('Error:', error);
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3 class="empty-title">Error al cargar detalle</h3>
                    <p class="empty-description">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Renderizar detalle del torneo con participantes
     */
    renderDetalleTorneo(torneo, participantes) {
        const fechaInicio = new Date(torneo.fecha_inicio).toLocaleString('es-ES');
        const fechaFin = new Date(torneo.fecha_fin).toLocaleString('es-ES');

        let participantesHTML = '';

        if (participantes.length === 0) {
            participantesHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3 class="empty-title">Sin participantes aún</h3>
                    <p class="empty-description">Ningún alumno se ha inscrito todavía</p>
                </div>
            `;
        } else {
            const completados = participantes.filter(p => p.completado);
            const pendientes = participantes.filter(p => !p.completado);

            if (completados.length > 0) {
                participantesHTML += '<h4 style="color: #E0E1DD; margin: 20px 0 15px;">🏆 Ranking</h4>';
                participantesHTML += '<table style="width: 100%; border-collapse: collapse;">';
                participantesHTML += `
                    <thead>
                        <tr style="border-bottom: 2px solid #415A77;">
                            <th style="padding: 10px; text-align: center; color: #778DA9;">Pos</th>
                            <th style="padding: 10px; text-align: left; color: #778DA9;">Alumno</th>
                            <th style="padding: 10px; text-align: center; color: #778DA9;">Puntos</th>
                            <th style="padding: 10px; text-align: center; color: #778DA9;">Correctas</th>
                            <th style="padding: 10px; text-align: center; color: #778DA9;">Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                `;

                completados.forEach(p => {
                    let medalIcon = '';
                    if (p.posicion === 1) medalIcon = '🥇';
                    else if (p.posicion === 2) medalIcon = '🥈';
                    else if (p.posicion === 3) medalIcon = '🥉';

                    const minutos = Math.floor(p.tiempo_total_segundos / 60);
                    const segundos = p.tiempo_total_segundos % 60;

                    participantesHTML += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <td style="padding: 10px; text-align: center; font-size: 20px;">${medalIcon || p.posicion}</td>
                            <td style="padding: 10px;">${p.nickname}</td>
                            <td style="padding: 10px; text-align: center; color: #00D4FF; font-weight: 600;">${p.puntuacion}</td>
                            <td style="padding: 10px; text-align: center;">${p.respuestas_correctas}/${p.respuestas_correctas + p.respuestas_incorrectas}</td>
                            <td style="padding: 10px; text-align: center;">${minutos}m ${segundos}s</td>
                        </tr>
                    `;
                });

                participantesHTML += '</tbody></table>';
            }

            if (pendientes.length > 0) {
                participantesHTML += '<h4 style="color: #E0E1DD; margin: 20px 0 15px;">⏳ Inscritos (Pendientes)</h4>';
                participantesHTML += '<div style="display: grid; gap: 10px;">';
                pendientes.forEach(p => {
                    const fechaInscripcion = new Date(p.fecha_inscripcion).toLocaleDateString('es-ES');
                    participantesHTML += `
                        <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <strong>${p.nickname}</strong>
                            <span style="color: #778DA9; font-size: 12px; margin-left: 10px;">Inscrito: ${fechaInscripcion}</span>
                        </div>
                    `;
                });
                participantesHTML += '</div>';
            }
        }

        return `
            <div style="padding: 20px;">
                <h3 style="color: #00D4FF; margin-bottom: 15px;">${torneo.nombre}</h3>
                ${torneo.descripcion ? `<p style="color: #778DA9; margin-bottom: 20px;">${torneo.descripcion}</p>` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                        <div style="font-size: 12px; color: #778DA9; margin-bottom: 5px;">Tipo</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${this.getTipoTorneoLabel(torneo.tipo)}</div>
                    </div>
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                        <div style="font-size: 12px; color: #778DA9; margin-bottom: 5px;">Participantes</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${participantes.length}${torneo.max_participantes ? `/${torneo.max_participantes}` : ''}</div>
                    </div>
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                        <div style="font-size: 12px; color: #778DA9; margin-bottom: 5px;">Preguntas</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${torneo.num_preguntas}</div>
                    </div>
                    <div style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                        <div style="font-size: 12px; color: #778DA9; margin-bottom: 5px;">Estado</div>
                        <div style="color: #E0E1DD; font-weight: 600;">${torneo.estado.toUpperCase()}</div>
                    </div>
                </div>

                <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 25px;">
                    <div style="margin-bottom: 10px;">📅 Inicio: <strong>${fechaInicio}</strong></div>
                    <div>🏁 Fin: <strong>${fechaFin}</strong></div>
                </div>

                ${participantesHTML}
            </div>
        `;
    },

    /**
     * Cancelar torneo
     */
    async cancelarTorneo(torneoId) {
        if (!confirm('¿Estás seguro de que quieres cancelar este torneo?')) {
            return;
        }

        // TODO: Implementar endpoint de cancelación en el backend
        alert('Funcionalidad de cancelación en desarrollo');
    },

    /**
     * Cerrar modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
};
