const pool = require('../config/database');

// =====================================================
// SERVICIO DE NOTIFICACIONES PUSH
// =====================================================
// Diseñado para funcionar con OneSignal o Firebase FCM
// Configuración en .env:
//   PUSH_PROVIDER=onesignal|fcm
//   ONESIGNAL_APP_ID=your_app_id
//   ONESIGNAL_API_KEY=your_api_key
//   FCM_SERVER_KEY=your_server_key
// =====================================================

class PushNotificationService {
    constructor() {
        this.provider = process.env.PUSH_PROVIDER || 'onesignal';
        this.oneSignalAppId = process.env.ONESIGNAL_APP_ID;
        this.oneSignalApiKey = process.env.ONESIGNAL_API_KEY;
        this.fcmServerKey = process.env.FCM_SERVER_KEY;

        // Verificar configuración
        if (this.provider === 'onesignal' && (!this.oneSignalAppId || !this.oneSignalApiKey)) {
            console.warn('⚠️  OneSignal no configurado. Notificaciones push deshabilitadas.');
            this.enabled = false;
        } else if (this.provider === 'fcm' && !this.fcmServerKey) {
            console.warn('⚠️  Firebase FCM no configurado. Notificaciones push deshabilitadas.');
            this.enabled = false;
        } else {
            this.enabled = true;
            console.log(`✅ Servicio de notificaciones push habilitado (${this.provider})`);
        }
    }

    /**
     * Registra un token/player_id de dispositivo para un usuario
     */
    async registerDeviceToken(userId, playerIdOrToken, platform = 'web') {
        try {
            await pool.query(`
                INSERT INTO user_push_tokens (user_id, player_id, platform, is_active)
                VALUES ($1, $2, $3, TRUE)
                ON CONFLICT (user_id, player_id)
                DO UPDATE SET
                    is_active = TRUE,
                    updated_at = NOW()
            `, [userId, playerIdOrToken, platform]);

            console.log(`📱 Token registrado para usuario ${userId} (${platform})`);
            return true;
        } catch (error) {
            console.error('Error registrando token:', error);
            return false;
        }
    }

    /**
     * Desactiva un token de dispositivo
     */
    async unregisterDeviceToken(userId, playerIdOrToken) {
        try {
            await pool.query(`
                UPDATE user_push_tokens
                SET is_active = FALSE, updated_at = NOW()
                WHERE user_id = $1 AND player_id = $2
            `, [userId, playerIdOrToken]);

            return true;
        } catch (error) {
            console.error('Error desregistrando token:', error);
            return false;
        }
    }

    /**
     * Envía una notificación push a un usuario específico
     */
    async sendToUser(userId, notification) {
        if (!this.enabled) {
            console.log('📵 Notificaciones push deshabilitadas');
            return { success: false, reason: 'disabled' };
        }

        try {
            // Obtener tokens activos del usuario
            const result = await pool.query(`
                SELECT player_id, platform
                FROM user_push_tokens
                WHERE user_id = $1 AND is_active = TRUE
            `, [userId]);

            if (result.rows.length === 0) {
                console.log(`📵 Usuario ${userId} no tiene dispositivos registrados`);
                return { success: false, reason: 'no_devices' };
            }

            const playerIds = result.rows.map(r => r.player_id);

            // Enviar según el provider
            let response;
            if (this.provider === 'onesignal') {
                response = await this.sendViaOneSignal(playerIds, notification);
            } else if (this.provider === 'fcm') {
                response = await this.sendViaFCM(playerIds, notification);
            }

            // Registrar notificación enviada
            await pool.query(`
                INSERT INTO push_notifications_log (user_id, title, body, data, provider, player_ids, success)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                userId,
                notification.title,
                notification.body,
                JSON.stringify(notification.data || {}),
                this.provider,
                JSON.stringify(playerIds),
                response.success
            ]);

            return response;
        } catch (error) {
            console.error('Error enviando notificación:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envía notificación a múltiples usuarios
     */
    async sendToMultipleUsers(userIds, notification) {
        const results = {
            total: userIds.length,
            successful: 0,
            failed: 0,
            noDevices: 0
        };

        for (const userId of userIds) {
            const result = await this.sendToUser(userId, notification);

            if (result.success) {
                results.successful++;
            } else if (result.reason === 'no_devices') {
                results.noDevices++;
            } else {
                results.failed++;
            }
        }

        return results;
    }

    /**
     * Envía notificación via OneSignal
     */
    async sendViaOneSignal(playerIds, notification) {
        try {
            const fetch = (await import('node-fetch')).default;

            const payload = {
                app_id: this.oneSignalAppId,
                include_player_ids: playerIds,
                headings: { en: notification.title },
                contents: { en: notification.body },
                data: notification.data || {},
                ios_badgeType: 'Increase',
                ios_badgeCount: 1
            };

            if (notification.url) {
                payload.url = notification.url;
            }

            if (notification.image) {
                payload.big_picture = notification.image;
                payload.ios_attachments = { id1: notification.image };
            }

            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${this.oneSignalApiKey}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`✅ Notificación OneSignal enviada a ${playerIds.length} dispositivos`);
                return { success: true, data };
            } else {
                console.error('❌ Error en OneSignal:', data);
                return { success: false, error: data };
            }
        } catch (error) {
            console.error('Error en OneSignal:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envía notificación via Firebase FCM
     */
    async sendViaFCM(tokens, notification) {
        try {
            const fetch = (await import('node-fetch')).default;

            const payload = {
                registration_ids: tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    icon: notification.icon || '/icon-512.png',
                    badge: '/icon-512.png'
                },
                data: notification.data || {}
            };

            if (notification.image) {
                payload.notification.image = notification.image;
            }

            const response = await fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `key=${this.fcmServerKey}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success > 0) {
                console.log(`✅ Notificación FCM enviada: ${data.success}/${tokens.length}`);
                return { success: true, data };
            } else {
                console.error('❌ Error en FCM:', data);
                return { success: false, error: data };
            }
        } catch (error) {
            console.error('Error en FCM:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Plantillas de notificaciones predefinidas
     */
    async sendStreakReminder(userId) {
        return this.sendToUser(userId, {
            title: '🔥 ¡Tu racha está en riesgo!',
            body: 'No has estudiado hoy. ¡Mantén tu racha viva con 5 minutos de estudio!',
            data: {
                type: 'streak_reminder',
                action: 'open_app'
            },
            url: '/dashboard'
        });
    }

    async sendQuestAvailable(userId) {
        return this.sendToUser(userId, {
            title: '🎯 Nuevas misiones disponibles',
            body: 'Completa 3 misiones diarias y gana hasta 150 Luminarias',
            data: {
                type: 'daily_quest',
                action: 'open_quests'
            },
            url: '/daily-quests'
        });
    }

    async sendQuestExpiring(userId, questName, hoursLeft) {
        return this.sendToUser(userId, {
            title: '⏰ Misión próxima a expirar',
            body: `"${questName}" expira en ${hoursLeft} horas. ¡No pierdas tu recompensa!`,
            data: {
                type: 'quest_expiring',
                action: 'open_quests'
            },
            url: '/daily-quests'
        });
    }

    async sendAchievementUnlocked(userId, achievementName, points) {
        return this.sendToUser(userId, {
            title: '🏆 ¡Logro desbloqueado!',
            body: `Has conseguido "${achievementName}" (+${points} puntos)`,
            data: {
                type: 'achievement',
                action: 'open_achievements'
            },
            url: '/achievements'
        });
    }

    async sendChallengeInvite(userId, challengeTitle, inviterName) {
        return this.sendToUser(userId, {
            title: '⚔️ Desafío recibido',
            body: `${inviterName} te ha retado a "${challengeTitle}"`,
            data: {
                type: 'challenge_invite',
                action: 'open_challenges'
            },
            url: '/challenges'
        });
    }

    async sendLevelUp(userId, newLevel) {
        return this.sendToUser(userId, {
            title: '🎉 ¡Subiste de nivel!',
            body: `Ahora eres nivel ${newLevel}. ¡Sigue así!`,
            data: {
                type: 'level_up',
                level: newLevel,
                action: 'open_profile'
            },
            url: '/profile'
        });
    }

    async sendContentRecommendation(userId, blockTitle) {
        return this.sendToUser(userId, {
            title: '📚 Contenido recomendado',
            body: `Basado en tu progreso, te sugerimos: "${blockTitle}"`,
            data: {
                type: 'content_recommendation',
                action: 'open_block'
            },
            url: '/explore'
        });
    }

    async sendInactiveReminder(userId, daysInactive) {
        return this.sendToUser(userId, {
            title: '👋 ¡Te echamos de menos!',
            body: `Han pasado ${daysInactive} días. ¡Vuelve y gana 200 Luminarias de regreso!`,
            data: {
                type: 'comeback_bonus',
                action: 'open_app'
            },
            url: '/dashboard'
        });
    }
}

module.exports = new PushNotificationService();
