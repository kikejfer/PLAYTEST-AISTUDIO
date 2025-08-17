import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTournaments } from '../../../hooks/useTournaments';
import { useAuthContext } from '../../../contexts/AuthContext';
import RegistrationForm from './RegistrationForm';
import RegistrationValidation from './RegistrationValidation';
import './TournamentRegistration.scss';

const TournamentRegistration = ({ 
  tournament, 
  onRegistrationChange,
  className = '' 
}) => {
  const { 
    registerForTournament, 
    unregisterFromTournament, 
    isRegisteredInTournament,
    loading 
  } = useTournaments();
  
  const { user } = useAuthContext();

  const [registrationStep, setRegistrationStep] = useState(1);
  const [registrationData, setRegistrationData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    experience: '',
    motivation: '',
    preferences: {
      notifications: true,
      publicProfile: true,
      shareStatistics: false
    },
    teamName: '',
    additionalInfo: {}
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Verificar si ya está registrado
  const isAlreadyRegistered = useMemo(() => {
    return tournament?.id ? isRegisteredInTournament(tournament.id) : false;
  }, [tournament?.id, isRegisteredInTournament]);

  // Verificar elegibilidad para el torneo
  const eligibilityCheck = useMemo(() => {
    if (!tournament || !user) {
      return { eligible: false, reasons: ['Usuario no autenticado'] };
    }

    const reasons = [];
    
    // Verificar si las inscripciones están abiertas
    if (tournament.status !== 'registration') {
      reasons.push('Las inscripciones no están abiertas');
    }

    // Verificar fecha límite de inscripción
    if (tournament.registrationDeadline) {
      const deadline = new Date(tournament.registrationDeadline);
      if (new Date() > deadline) {
        reasons.push('La fecha límite de inscripción ha pasado');
      }
    }

    // Verificar límite de participantes
    if (tournament.maxParticipants && tournament.currentParticipants >= tournament.maxParticipants) {
      reasons.push('El torneo ha alcanzado el límite máximo de participantes');
    }

    // Verificar requisitos específicos del torneo
    if (tournament.requirements) {
      // Verificar nivel mínimo del usuario
      if (tournament.requirements.minLevel && user.level < tournament.requirements.minLevel) {
        reasons.push(`Nivel mínimo requerido: ${tournament.requirements.minLevel} (tu nivel: ${user.level})`);
      }

      // Verificar luminarias mínimas
      if (tournament.requirements.minLuminarias && user.luminarias < tournament.requirements.minLuminarias) {
        reasons.push(`Luminarias mínimas requeridas: ${tournament.requirements.minLuminarias} (tienes: ${user.luminarias})`);
      }

      // Verificar experiencia previa en torneos
      if (tournament.requirements.minTournaments && user.tournamentsParticipated < tournament.requirements.minTournaments) {
        reasons.push(`Experiencia mínima: ${tournament.requirements.minTournaments} torneos previos`);
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  }, [tournament, user]);

  // Validar datos de inscripción
  const validateRegistrationData = useCallback(() => {
    const errors = [];

    // Validaciones básicas
    if (!registrationData.nickname.trim()) {
      errors.push('El nickname es obligatorio');
    }

    if (!registrationData.email.trim()) {
      errors.push('El email es obligatorio');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
      errors.push('El email no tiene un formato válido');
    }

    // Validaciones específicas por tipo de torneo
    if (tournament.type === 'groups' && tournament.requiresTeamName) {
      if (!registrationData.teamName.trim()) {
        errors.push('El nombre del equipo es obligatorio para este torneo');
      }
    }

    if (tournament.requiresMotivation && registrationData.motivation.length < 50) {
      errors.push('La motivación debe tener al menos 50 caracteres');
    }

    // Validaciones específicas por categoría
    if (tournament.category === 'competitive' && !registrationData.experience) {
      errors.push('Debes especificar tu nivel de experiencia para torneos competitivos');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [registrationData, tournament]);

  // Manejar inscripción
  const handleRegistration = useCallback(async () => {
    if (!validateRegistrationData()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerForTournament(tournament.id, registrationData);
      
      if (result.success) {
        setRegistrationResult({
          success: true,
          message: '¡Inscripción exitosa! Te has registrado en el torneo.',
          registration: result.registration
        });
        onRegistrationChange?.(true);
      } else {
        setRegistrationResult({
          success: false,
          message: result.error || 'Error durante la inscripción',
          errors: result.errors
        });
      }
    } catch (error) {
      setRegistrationResult({
        success: false,
        message: 'Error inesperado durante la inscripción',
        errors: [error.message]
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateRegistrationData, registerForTournament, tournament.id, registrationData, onRegistrationChange]);

  // Manejar cancelación de inscripción
  const handleUnregistration = useCallback(async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu inscripción?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await unregisterFromTournament(tournament.id);
      
      if (result.success) {
        setRegistrationResult({
          success: true,
          message: 'Inscripción cancelada exitosamente.',
        });
        onRegistrationChange?.(false);
      } else {
        setRegistrationResult({
          success: false,
          message: result.error || 'Error al cancelar la inscripción',
        });
      }
    } catch (error) {
      setRegistrationResult({
        success: false,
        message: 'Error inesperado al cancelar la inscripción',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [unregisterFromTournament, tournament.id, onRegistrationChange]);

  // Actualizar datos de inscripción
  const updateRegistrationData = useCallback((field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Calcular tiempo restante para inscripción
  const getTimeRemaining = useCallback(() => {
    if (!tournament.registrationDeadline) return null;

    const deadline = new Date(tournament.registrationDeadline);
    const now = new Date();
    const timeLeft = deadline - now;

    if (timeLeft <= 0) return null;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, total: timeLeft };
  }, [tournament.registrationDeadline]);

  // Actualizar datos del usuario automáticamente
  useEffect(() => {
    if (user) {
      setRegistrationData(prev => ({
        ...prev,
        nickname: user.nickname || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const timeRemaining = getTimeRemaining();

  // Si ya está registrado, mostrar estado de inscripción
  if (isAlreadyRegistered) {
    return (
      <div className={`tournament-registration registered ${className}`}>
        <div className="registration-status">
          <div className="status-icon success">✅</div>
          <div className="status-content">
            <h3>¡Ya estás inscrito!</h3>
            <p>Te has registrado exitosamente en este torneo.</p>
            
            <div className="registration-details">
              <div className="detail-item">
                <span className="detail-label">Fecha de inscripción:</span>
                <span className="detail-value">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estado:</span>
                <span className="detail-value confirmed">Confirmado</span>
              </div>
            </div>

            <div className="registration-actions">
              <button
                className="btn btn-danger"
                onClick={handleUnregistration}
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? '⏳ Cancelando...' : '❌ Cancelar Inscripción'}
              </button>
            </div>
          </div>
        </div>

        {registrationResult && (
          <div className={`registration-result ${registrationResult.success ? 'success' : 'error'}`}>
            <p>{registrationResult.message}</p>
          </div>
        )}
      </div>
    );
  }

  // Si no es elegible, mostrar razones
  if (!eligibilityCheck.eligible) {
    return (
      <div className={`tournament-registration ineligible ${className}`}>
        <div className="registration-status">
          <div className="status-icon error">❌</div>
          <div className="status-content">
            <h3>No puedes inscribirte</h3>
            <p>No cumples con los requisitos para participar en este torneo:</p>
            
            <ul className="ineligibility-reasons">
              {eligibilityCheck.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>

            {tournament.requirements && (
              <div className="requirements-info">
                <h4>📋 Requisitos del torneo:</h4>
                <div className="requirements-list">
                  {tournament.requirements.minLevel && (
                    <div className="requirement">
                      <span className="req-label">Nivel mínimo:</span>
                      <span className="req-value">{tournament.requirements.minLevel}</span>
                    </div>
                  )}
                  {tournament.requirements.minLuminarias && (
                    <div className="requirement">
                      <span className="req-label">Luminarias mínimas:</span>
                      <span className="req-value">{tournament.requirements.minLuminarias}</span>
                    </div>
                  )}
                  {tournament.requirements.minTournaments && (
                    <div className="requirement">
                      <span className="req-label">Torneos previos:</span>
                      <span className="req-value">{tournament.requirements.minTournaments}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tournament-registration ${className}`}>
      {/* Header de inscripción */}
      <div className="registration-header">
        <h3>📝 Inscripción al Torneo</h3>
        <p>Completa los siguientes pasos para inscribirte en {tournament.name}</p>
        
        {timeRemaining && (
          <div className="time-remaining">
            <span className="time-label">⏰ Tiempo restante:</span>
            <div className="time-display">
              {timeRemaining.days > 0 && (
                <span className="time-unit">
                  <span className="time-value">{timeRemaining.days}</span>
                  <span className="time-label">días</span>
                </span>
              )}
              <span className="time-unit">
                <span className="time-value">{timeRemaining.hours}</span>
                <span className="time-label">h</span>
              </span>
              <span className="time-unit">
                <span className="time-value">{timeRemaining.minutes}</span>
                <span className="time-label">m</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progreso de inscripción */}
      <div className="registration-progress">
        <div className="progress-steps">
          <div className={`step ${registrationStep >= 1 ? 'active' : ''} ${registrationStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Información Básica</div>
          </div>
          <div className={`step ${registrationStep >= 2 ? 'active' : ''} ${registrationStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Validación</div>
          </div>
          <div className={`step ${registrationStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Confirmación</div>
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((registrationStep - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="registration-content">
        {registrationStep === 1 && (
          <RegistrationForm
            tournament={tournament}
            registrationData={registrationData}
            onDataChange={updateRegistrationData}
            validationErrors={validationErrors}
            onNext={() => {
              if (validateRegistrationData()) {
                setRegistrationStep(2);
              }
            }}
          />
        )}

        {registrationStep === 2 && (
          <RegistrationValidation
            tournament={tournament}
            registrationData={registrationData}
            onBack={() => setRegistrationStep(1)}
            onNext={() => setRegistrationStep(3)}
          />
        )}

        {registrationStep === 3 && (
          <div className="registration-confirmation">
            <div className="confirmation-header">
              <h4>🎯 Confirmar Inscripción</h4>
              <p>Revisa tu información antes de confirmar la inscripción:</p>
            </div>

            <div className="confirmation-summary">
              <div className="summary-section">
                <h5>Información Personal</h5>
                <div className="summary-item">
                  <span className="item-label">Nickname:</span>
                  <span className="item-value">{registrationData.nickname}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Email:</span>
                  <span className="item-value">{registrationData.email}</span>
                </div>
                {registrationData.teamName && (
                  <div className="summary-item">
                    <span className="item-label">Equipo:</span>
                    <span className="item-value">{registrationData.teamName}</span>
                  </div>
                )}
              </div>

              {registrationData.experience && (
                <div className="summary-section">
                  <h5>Experiencia</h5>
                  <div className="summary-item">
                    <span className="item-value">{registrationData.experience}</span>
                  </div>
                </div>
              )}

              {registrationData.motivation && (
                <div className="summary-section">
                  <h5>Motivación</h5>
                  <div className="summary-item">
                    <span className="item-value">{registrationData.motivation}</span>
                  </div>
                </div>
              )}

              <div className="summary-section">
                <h5>Preferencias</h5>
                <div className="summary-item">
                  <span className="item-label">Notificaciones:</span>
                  <span className="item-value">{registrationData.preferences.notifications ? 'Sí' : 'No'}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Perfil público:</span>
                  <span className="item-value">{registrationData.preferences.publicProfile ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setRegistrationStep(2)}
                disabled={isSubmitting}
              >
                ← Atrás
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRegistration}
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? '⏳ Inscribiendo...' : '✅ Confirmar Inscripción'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resultado de inscripción */}
      {registrationResult && (
        <div className={`registration-result ${registrationResult.success ? 'success' : 'error'}`}>
          <div className="result-icon">
            {registrationResult.success ? '✅' : '❌'}
          </div>
          <div className="result-content">
            <p>{registrationResult.message}</p>
            {registrationResult.errors && registrationResult.errors.length > 0 && (
              <ul className="result-errors">
                {registrationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentRegistration;