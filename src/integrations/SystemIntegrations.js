/**
 * Integración centralizada con todos los sistemas existentes de PLAYTEST
 * Este módulo actúa como puente entre los nuevos sistemas y los existentes
 */

/**
 * Integración con el sistema de Luminarias
 */
export class LuminariasIntegration {
  /**
   * Otorgar luminarias por participación en torneos
   */
  static async awardTournamentLuminarias(userId, tournamentId, placement, performance) {
    try {
      const baseReward = this.calculateBaseLuminarias(placement, performance);
      const multiplier = this.getPerformanceMultiplier(performance);
      const finalAmount = Math.floor(baseReward * multiplier);

      // Llamada al sistema existente de luminarias
      const response = await fetch('/api/luminarias/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: finalAmount,
          source: 'tournament',
          sourceId: tournamentId,
          metadata: {
            placement,
            performance,
            multiplier
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Notificar al usuario
        await this.notifyLuminariasAwarded(userId, finalAmount, 'tournament');
        
        return { success: true, amount: finalAmount, result };
      }
      
      throw new Error('Error awarding luminarias');
    } catch (error) {
      console.error('Error in luminarias integration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular luminarias base según posición
   */
  static calculateBaseLuminarias(placement, performance) {
    const placementRewards = {
      1: 1000,  // Primer lugar
      2: 750,   // Segundo lugar
      3: 500,   // Tercer lugar
    };

    const baseReward = placementRewards[placement] || Math.max(100, 500 - (placement * 25));
    
    // Bonus por rendimiento excepcional
    if (performance.averageScore >= 90) {
      return Math.floor(baseReward * 1.5);
    } else if (performance.averageScore >= 80) {
      return Math.floor(baseReward * 1.25);
    } else if (performance.averageScore >= 70) {
      return Math.floor(baseReward * 1.1);
    }
    
    return baseReward;
  }

  /**
   * Calcular multiplicador por rendimiento
   */
  static getPerformanceMultiplier(performance) {
    let multiplier = 1.0;
    
    // Bonus por fair play
    if (performance.fairPlayScore >= 95) {
      multiplier += 0.2;
    } else if (performance.fairPlayScore >= 85) {
      multiplier += 0.1;
    }
    
    // Bonus por mejora
    if (performance.improvementRate >= 0.2) {
      multiplier += 0.15;
    } else if (performance.improvementRate >= 0.1) {
      multiplier += 0.1;
    }
    
    // Bonus por consistencia
    if (performance.consistencyScore >= 0.8) {
      multiplier += 0.1;
    }
    
    return Math.min(multiplier, 2.0); // Máximo 2x
  }

  /**
   * Notificar al usuario sobre luminarias otorgadas
   */
  static async notifyLuminariasAwarded(userId, amount, source) {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'luminarias_awarded',
          title: '✨ ¡Luminarias Otorgadas!',
          message: `Has recibido ${amount} luminarias por tu participación en el torneo.`,
          data: { amount, source }
        })
      });
    } catch (error) {
      console.error('Error sending luminarias notification:', error);
    }
  }

  /**
   * Verificar si el usuario tiene suficientes luminarias para una acción
   */
  static async checkLuminariasBalance(userId, requiredAmount) {
    try {
      const response = await fetch(`/api/luminarias/balance/${userId}`);
      if (response.ok) {
        const { balance } = await response.json();
        return {
          sufficient: balance >= requiredAmount,
          balance,
          required: requiredAmount,
          deficit: Math.max(0, requiredAmount - balance)
        };
      }
      return { sufficient: false, balance: 0, required: requiredAmount };
    } catch (error) {
      console.error('Error checking luminarias balance:', error);
      return { sufficient: false, balance: 0, required: requiredAmount };
    }
  }
}

/**
 * Integración con el sistema de Chat
 */
export class ChatIntegration {
  /**
   * Crear canales de chat para torneos
   */
  static async createTournamentChannel(tournamentId, tournamentName, participants) {
    try {
      const response = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tournament',
          name: `🏆 ${tournamentName}`,
          description: `Canal oficial del torneo ${tournamentName}`,
          sourceId: tournamentId,
          participants: participants.map(p => p.userId),
          settings: {
            allowImages: true,
            allowFiles: false,
            moderationLevel: 'strict',
            maxMessageLength: 500
          }
        })
      });

      if (response.ok) {
        const channel = await response.json();
        
        // Enviar mensaje de bienvenida
        await this.sendWelcomeMessage(channel.id, tournamentName);
        
        return { success: true, channel };
      }
      
      throw new Error('Error creating tournament channel');
    } catch (error) {
      console.error('Error in chat integration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar actualizaciones del torneo al chat
   */
  static async sendTournamentUpdate(channelId, updateType, data) {
    const messages = {
      tournament_started: `🚀 ¡El torneo ha comenzado! ¡Que comience la competencia!`,
      match_completed: `🏆 Partido completado: ${data.participant1} vs ${data.participant2} - Ganador: ${data.winner}`,
      round_completed: `✅ Ronda ${data.round} completada. Preparándose para la siguiente ronda...`,
      tournament_completed: `🎉 ¡Torneo finalizado! Felicitaciones a todos los participantes.`,
      participant_eliminated: `💔 ${data.participant} ha sido eliminado del torneo.`,
      prizes_distributed: `💰 ¡Premios distribuidos! Revisa tu perfil para ver tus recompensas.`
    };

    const message = messages[updateType];
    if (!message) return;

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          type: 'system',
          content: message,
          metadata: {
            updateType,
            data,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('Error sending tournament update:', error);
    }
  }

  /**
   * Moderar mensajes de chat durante torneos
   */
  static async moderateMessage(messageId, channelId, reason, moderatorId) {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          action: 'hide',
          reason,
          moderatorId,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error moderating message:', error);
      return false;
    }
  }

  /**
   * Enviar mensaje de bienvenida al canal del torneo
   */
  static async sendWelcomeMessage(channelId, tournamentName) {
    const welcomeMessage = `
🎯 **¡Bienvenidos al ${tournamentName}!**

📋 **Reglas importantes:**
• Mantén el respeto hacia todos los participantes
• No hagas spam ni uses lenguaje ofensivo
• Las dudas sobre el torneo pueden consultarse aquí
• ¡Que gane el mejor!

🛡️ Este canal está moderado automáticamente.
¡Diviértanse y buena suerte a todos! 🍀
    `;

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          type: 'system',
          content: welcomeMessage,
          pinned: true
        })
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }
}

/**
 * Integración con el sistema de Niveles
 */
export class LevelsIntegration {
  /**
   * Otorgar experiencia por participación en torneos
   */
  static async awardTournamentExperience(userId, tournamentId, performance) {
    try {
      const baseXP = this.calculateBaseExperience(performance);
      const bonusXP = this.calculateBonusExperience(performance);
      const totalXP = baseXP + bonusXP;

      const response = await fetch('/api/levels/award-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: totalXP,
          source: 'tournament',
          sourceId: tournamentId,
          breakdown: {
            base: baseXP,
            bonus: bonusXP,
            performance
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Verificar si subió de nivel
        if (result.levelUp) {
          await this.handleLevelUp(userId, result.newLevel, result.rewards);
        }
        
        return { success: true, xp: totalXP, result };
      }
      
      throw new Error('Error awarding experience');
    } catch (error) {
      console.error('Error in levels integration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular experiencia base
   */
  static calculateBaseExperience(performance) {
    let baseXP = 100; // XP base por participar
    
    // XP por partidos jugados
    baseXP += (performance.gamesPlayed || 0) * 20;
    
    // XP por rendimiento
    if (performance.averageScore >= 90) {
      baseXP += 200;
    } else if (performance.averageScore >= 80) {
      baseXP += 150;
    } else if (performance.averageScore >= 70) {
      baseXP += 100;
    } else if (performance.averageScore >= 60) {
      baseXP += 50;
    }
    
    return baseXP;
  }

  /**
   * Calcular experiencia bonus
   */
  static calculateBonusExperience(performance) {
    let bonusXP = 0;
    
    // Bonus por primera vez
    if (performance.firstTournament) {
      bonusXP += 500;
    }
    
    // Bonus por fair play
    if (performance.fairPlayScore >= 95) {
      bonusXP += 200;
    } else if (performance.fairPlayScore >= 85) {
      bonusXP += 100;
    }
    
    // Bonus por mejora
    if (performance.improvementRate >= 0.3) {
      bonusXP += 150;
    } else if (performance.improvementRate >= 0.2) {
      bonusXP += 100;
    } else if (performance.improvementRate >= 0.1) {
      bonusXP += 50;
    }
    
    // Bonus por racha de victorias
    if (performance.winStreak >= 5) {
      bonusXP += 100;
    } else if (performance.winStreak >= 3) {
      bonusXP += 50;
    }
    
    return bonusXP;
  }

  /**
   * Manejar subida de nivel
   */
  static async handleLevelUp(userId, newLevel, rewards) {
    try {
      // Notificar al usuario
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'level_up',
          title: '🎉 ¡Nivel Superior!',
          message: `¡Felicitaciones! Has alcanzado el nivel ${newLevel}.`,
          data: { 
            newLevel, 
            rewards: rewards || []
          }
        })
      });

      // Otorgar recompensas de nivel si las hay
      if (rewards && rewards.length > 0) {
        for (const reward of rewards) {
          await this.grantLevelReward(userId, reward);
        }
      }

    } catch (error) {
      console.error('Error handling level up:', error);
    }
  }

  /**
   * Otorgar recompensas de nivel
   */
  static async grantLevelReward(userId, reward) {
    try {
      switch (reward.type) {
        case 'luminarias':
          await LuminariasIntegration.awardTournamentLuminarias(
            userId, 
            'level_reward', 
            1, 
            { averageScore: 100, fairPlayScore: 100 }
          );
          break;
          
        case 'badge':
          await fetch('/api/badges/award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              badgeId: reward.badgeId,
              source: 'level_up'
            })
          });
          break;
          
        case 'title':
          await fetch('/api/titles/award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              titleId: reward.titleId,
              source: 'level_up'
            })
          });
          break;
      }
    } catch (error) {
      console.error('Error granting level reward:', error);
    }
  }

  /**
   * Verificar requisitos de nivel para torneos
   */
  static async checkLevelRequirement(userId, requiredLevel) {
    try {
      const response = await fetch(`/api/levels/user/${userId}`);
      if (response.ok) {
        const { level } = await response.json();
        return {
          meets: level >= requiredLevel,
          current: level,
          required: requiredLevel,
          deficit: Math.max(0, requiredLevel - level)
        };
      }
      return { meets: false, current: 1, required: requiredLevel };
    } catch (error) {
      console.error('Error checking level requirement:', error);
      return { meets: false, current: 1, required: requiredLevel };
    }
  }
}

/**
 * Integración con el sistema de notificaciones en tiempo real
 */
export class NotificationsIntegration {
  /**
   * Enviar notificación push
   */
  static async sendPushNotification(userId, notification) {
    try {
      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...notification,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Notificar inicio de torneo
   */
  static async notifyTournamentStart(tournamentId, participants) {
    for (const participant of participants) {
      await this.sendPushNotification(participant.userId, {
        type: 'tournament_start',
        title: '🚀 ¡Torneo Iniciado!',
        message: 'Tu torneo ha comenzado. ¡Ve a participar!',
        data: { tournamentId },
        actions: [
          { id: 'view', label: 'Ver Torneo', url: `/tournaments/${tournamentId}` }
        ]
      });
    }
  }

  /**
   * Notificar próximo partido
   */
  static async notifyUpcomingMatch(matchId, participants, scheduledTime) {
    const timeUntilMatch = new Date(scheduledTime) - new Date();
    const minutesUntil = Math.floor(timeUntilMatch / (1000 * 60));

    for (const participant of participants) {
      await this.sendPushNotification(participant.userId, {
        type: 'match_reminder',
        title: '⏰ Próximo Partido',
        message: `Tu partido comienza en ${minutesUntil} minutos.`,
        data: { matchId, scheduledTime },
        priority: 'high'
      });
    }
  }
}

/**
 * Orquestador principal de integraciones
 */
export class SystemIntegrations {
  static luminarias = LuminariasIntegration;
  static chat = ChatIntegration;
  static levels = LevelsIntegration;
  static notifications = NotificationsIntegration;

  /**
   * Inicializar un torneo con todas las integraciones
   */
  static async initializeTournament(tournament, participants) {
    try {
      const results = {
        chat: null,
        notifications: null,
        errors: []
      };

      // Crear canal de chat del torneo
      try {
        results.chat = await this.chat.createTournamentChannel(
          tournament.id,
          tournament.name,
          participants
        );
      } catch (error) {
        results.errors.push({ system: 'chat', error: error.message });
      }

      // Notificar a los participantes
      try {
        await this.notifications.notifyTournamentStart(tournament.id, participants);
        results.notifications = { success: true };
      } catch (error) {
        results.errors.push({ system: 'notifications', error: error.message });
      }

      return results;
    } catch (error) {
      console.error('Error initializing tournament integrations:', error);
      return { errors: [{ system: 'general', error: error.message }] };
    }
  }

  /**
   * Finalizar un torneo con todas las integraciones
   */
  static async finalizeTournament(tournament, results, prizeDistribution) {
    try {
      const integrationResults = {
        luminarias: [],
        levels: [],
        chat: null,
        notifications: null,
        errors: []
      };

      // Distribuir luminarias y experiencia
      for (const result of results) {
        try {
          // Otorgar luminarias
          const luminariasResult = await this.luminarias.awardTournamentLuminarias(
            result.userId,
            tournament.id,
            result.placement,
            result.performance
          );
          integrationResults.luminarias.push(luminariasResult);

          // Otorgar experiencia
          const levelsResult = await this.levels.awardTournamentExperience(
            result.userId,
            tournament.id,
            result.performance
          );
          integrationResults.levels.push(levelsResult);
        } catch (error) {
          integrationResults.errors.push({ 
            system: 'rewards', 
            userId: result.userId, 
            error: error.message 
          });
        }
      }

      // Notificar finalización en chat
      try {
        if (tournament.chatChannelId) {
          await this.chat.sendTournamentUpdate(
            tournament.chatChannelId,
            'tournament_completed',
            { 
              winner: results[0]?.username,
              totalParticipants: results.length
            }
          );
          
          await this.chat.sendTournamentUpdate(
            tournament.chatChannelId,
            'prizes_distributed',
            { prizeDistribution }
          );
        }
        integrationResults.chat = { success: true };
      } catch (error) {
        integrationResults.errors.push({ system: 'chat', error: error.message });
      }

      return integrationResults;
    } catch (error) {
      console.error('Error finalizing tournament integrations:', error);
      return { errors: [{ system: 'general', error: error.message }] };
    }
  }
}