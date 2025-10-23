-- ==========================================
-- ESQUEMA DE BASE DE DATOS - PANEL DE PROFESORES
-- Sistema completo de gestión académica y seguimiento pedagógico
-- ==========================================

-- TABLA: Clases y grupos académicos
CREATE TABLE IF NOT EXISTS teacher_classes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_name VARCHAR(200) NOT NULL,
    class_code VARCHAR(20) UNIQUE NOT NULL, -- Código de acceso único
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    
    -- Configuración de clase
    max_students INTEGER DEFAULT 30,
    current_students INTEGER DEFAULT 0,
    meeting_schedule JSONB, -- Horarios de clase
    class_room VARCHAR(100),
    
    -- Configuración académica
    curriculum_standards JSONB, -- Estándares curriculares
    learning_objectives JSONB, -- Objetivos de aprendizaje
    assessment_criteria JSONB, -- Criterios de evaluación
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Inscripciones de estudiantes en clases
CREATE TABLE IF NOT EXISTS class_enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información de inscripción
    enrollment_date DATE DEFAULT CURRENT_DATE,
    enrollment_status VARCHAR(20) DEFAULT 'active', -- 'active', 'dropped', 'completed', 'transferred'
    
    -- Información académica del estudiante
    previous_grade DECIMAL(5,2),
    learning_style VARCHAR(50), -- 'visual', 'auditory', 'kinesthetic', 'mixed'
    special_needs JSONB, -- Necesidades especiales y acomodaciones
    
    -- Información familiar
    parent_guardian_info JSONB, -- Información de padres/tutores
    emergency_contacts JSONB, -- Contactos de emergencia
    
    -- Seguimiento
    attendance_rate DECIMAL(5,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    last_activity TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- TABLA: Perfiles académicos detallados de estudiantes
CREATE TABLE IF NOT EXISTS student_academic_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    
    -- Evaluación de estilo de aprendizaje
    learning_style_assessment JSONB, -- Resultados detallados del assessment
    dominant_learning_style VARCHAR(50),
    learning_preferences JSONB, -- Preferencias específicas
    
    -- Mapeo de fortalezas y debilidades
    strengths_mapping JSONB, -- Por materia y competencia
    weaknesses_mapping JSONB, -- Áreas de mejora identificadas
    improvement_areas JSONB, -- Áreas prioritarias de mejora
    
    -- Objetivos académicos
    individual_goals JSONB, -- Objetivos específicos del estudiante
    goal_progress JSONB, -- Progreso hacia objetivos
    achievement_milestones JSONB, -- Hitos alcanzados
    
    -- Análisis de rendimiento
    performance_trends JSONB, -- Tendencias de rendimiento
    engagement_patterns JSONB, -- Patrones de engagement
    motivation_profile JSONB, -- Perfil de motivación
    
    -- Intervenciones y apoyos
    interventions_applied JSONB, -- Intervenciones implementadas
    accommodations JSONB, -- Acomodaciones especiales
    support_services JSONB, -- Servicios de apoyo recibidos
    
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Asistencia y participación
CREATE TABLE IF NOT EXISTS attendance_tracking (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información de asistencia
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
    arrival_time TIME,
    departure_time TIME,
    
    -- Participación y engagement
    participation_level INTEGER CHECK (participation_level >= 1 AND participation_level <= 5),
    engagement_score INTEGER CHECK (engagement_score >= 1 AND engagement_score <= 10),
    behavior_notes TEXT,
    
    -- Actividad académica del día
    activities_completed INTEGER DEFAULT 0,
    blocks_attempted INTEGER DEFAULT 0,
    blocks_completed INTEGER DEFAULT 0,
    time_on_task INTEGER DEFAULT 0, -- minutos
    
    -- Observaciones
    teacher_observations TEXT,
    behavioral_incidents JSONB, -- Incidentes comportamentales
    achievements_noted JSONB, -- Logros observados
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Cronogramas académicos y planificación
CREATE TABLE IF NOT EXISTS academic_schedules (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del cronograma
    schedule_name VARCHAR(200) NOT NULL,
    schedule_type VARCHAR(50), -- 'semester', 'unit', 'weekly', 'daily'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Planificación curricular
    curriculum_mapping JSONB, -- Mapeo de contenidos por fecha
    learning_milestones JSONB, -- Hitos de aprendizaje planificados
    pacing_guide JSONB, -- Guía de ritmo de estudio
    
    -- Asignación de contenido
    content_distribution JSONB, -- Distribución de bloques por fecha
    difficulty_progression JSONB, -- Progresión de dificultad
    prerequisites_map JSONB, -- Mapeo de prerrequisitos
    
    -- Evaluaciones programadas
    assessment_schedule JSONB, -- Calendario de evaluaciones
    exam_dates JSONB, -- Fechas de exámenes importantes
    checkpoint_dates JSONB, -- Puntos de control de progreso
    
    -- Adaptaciones
    adaptive_adjustments JSONB, -- Ajustes basados en progreso
    holiday_adjustments JSONB, -- Ajustes por períodos vacacionales
    individual_accommodations JSONB, -- Acomodaciones por estudiante
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Asignaciones de contenido y actividades
CREATE TABLE IF NOT EXISTS content_assignments (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES academic_schedules(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    
    -- Información de la asignación
    assignment_name VARCHAR(200) NOT NULL,
    assignment_type VARCHAR(50), -- 'practice', 'assessment', 'project', 'homework'
    
    -- Contenido asignado
    block_ids INTEGER[], -- IDs de bloques asignados
    due_date TIMESTAMP,
    estimated_duration INTEGER, -- minutos estimados
    
    -- Configuración pedagógica
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    learning_objectives JSONB, -- Objetivos específicos
    success_criteria JSONB, -- Criterios de éxito
    
    -- Diferenciación
    differentiated_versions JSONB, -- Versiones diferenciadas por nivel
    accommodations JSONB, -- Acomodaciones especiales
    enrichment_activities JSONB, -- Actividades de enriquecimiento
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    auto_assign BOOLEAN DEFAULT false, -- Asignación automática
    adaptive_difficulty BOOLEAN DEFAULT false, -- Dificultad adaptativa
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Progreso académico detallado
CREATE TABLE IF NOT EXISTS academic_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    assignment_id INTEGER REFERENCES content_assignments(id) ON DELETE CASCADE,
    
    -- Información del progreso
    date_started TIMESTAMP,
    date_completed TIMESTAMP,
    time_spent INTEGER DEFAULT 0, -- minutos
    attempts_count INTEGER DEFAULT 0,
    
    -- Resultados académicos
    score DECIMAL(5,2),
    max_possible_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(5), -- A, B, C, D, F o sistema local
    
    -- Análisis detallado
    competencies_mastered JSONB, -- Competencias dominadas
    learning_objectives_met JSONB, -- Objetivos alcanzados
    error_patterns JSONB, -- Patrones de errores identificados
    time_on_task_analysis JSONB, -- Análisis de tiempo en tarea
    
    -- Feedback y observaciones
    teacher_feedback TEXT,
    automated_feedback JSONB, -- Feedback automatizado del sistema
    peer_feedback JSONB, -- Feedback de compañeros
    self_assessment JSONB, -- Autoevaluación del estudiante
    
    -- Predicciones y recomendaciones
    predicted_performance JSONB, -- Predicción de rendimiento futuro
    recommended_actions JSONB, -- Acciones recomendadas
    intervention_triggers JSONB, -- Triggers de intervención
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Evaluaciones y exámenes
CREATE TABLE IF NOT EXISTS teacher_assessments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    
    -- Información de la evaluación
    assessment_name VARCHAR(200) NOT NULL,
    assessment_type VARCHAR(50), -- 'formative', 'summative', 'diagnostic', 'benchmark'
    subject_area VARCHAR(100),
    
    -- Configuración académica
    standards_alignment JSONB, -- Alineación con estándares
    blooms_taxonomy_levels JSONB, -- Niveles de taxonomía de Bloom
    learning_objectives JSONB, -- Objetivos evaluados
    
    -- Estructura de la evaluación
    question_structure JSONB, -- Estructura de preguntas
    grading_rubric JSONB, -- Rúbrica de evaluación
    time_limit INTEGER, -- minutos
    max_attempts INTEGER DEFAULT 1,
    
    -- Configuración de accesibilidad
    accommodations JSONB, -- Acomodaciones por estudiante
    alternative_formats JSONB, -- Formatos alternativos
    assistive_technologies JSONB, -- Tecnologías de asistencia
    
    -- Fechas y disponibilidad
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    is_published BOOLEAN DEFAULT false,
    
    -- Análisis y resultados
    class_average DECIMAL(5,2),
    difficulty_analysis JSONB, -- Análisis de dificultad por pregunta
    discrimination_analysis JSONB, -- Análisis de discriminación
    reliability_statistics JSONB, -- Estadísticas de confiabilidad
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Resultados de evaluaciones por estudiante
CREATE TABLE IF NOT EXISTS assessment_results (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES teacher_assessments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del intento
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_taken INTEGER, -- minutos
    
    -- Resultados globales
    total_score DECIMAL(8,2),
    max_possible_score DECIMAL(8,2),
    percentage DECIMAL(5,2),
    letter_grade VARCHAR(5),
    
    -- Análisis detallado por competencia
    competency_scores JSONB, -- Puntuaciones por competencia
    objective_mastery JSONB, -- Dominio de objetivos
    bloom_level_performance JSONB, -- Rendimiento por nivel de Bloom
    
    -- Análisis de respuestas
    question_responses JSONB, -- Respuestas detalladas
    correct_answers INTEGER,
    incorrect_answers INTEGER,
    skipped_questions INTEGER,
    
    -- Patrones de rendimiento
    response_patterns JSONB, -- Patrones de respuesta
    time_per_question JSONB, -- Tiempo por pregunta
    difficulty_progression JSONB, -- Progresión en dificultad
    
    -- Feedback y recomendaciones
    automated_feedback JSONB, -- Feedback automatizado
    teacher_comments TEXT,
    improvement_recommendations JSONB, -- Recomendaciones de mejora
    
    -- Flags académicos
    needs_intervention BOOLEAN DEFAULT false,
    exceptional_performance BOOLEAN DEFAULT false,
    accommodation_used JSONB, -- Acomodaciones utilizadas
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Intervenciones pedagógicas
CREATE TABLE IF NOT EXISTS pedagogical_interventions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    
    -- Información de la intervención
    intervention_name VARCHAR(200) NOT NULL,
    intervention_type VARCHAR(50), -- 'remedial', 'enrichment', 'behavioral', 'motivational'
    urgency_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Identificación del problema
    identified_issues JSONB, -- Problemas identificados
    assessment_data JSONB, -- Datos de evaluación que triggerearon
    teacher_observations TEXT,
    
    -- Estrategia de intervención
    intervention_strategy JSONB, -- Estrategia detallada
    learning_accommodations JSONB, -- Acomodaciones aplicadas
    additional_resources JSONB, -- Recursos adicionales proporcionados
    
    -- Cronograma y seguimiento
    start_date DATE,
    expected_duration INTEGER, -- semanas
    review_dates JSONB, -- Fechas de revisión programadas
    
    -- Resultados y efectividad
    progress_measurements JSONB, -- Mediciones de progreso
    effectiveness_score DECIMAL(3,2), -- 0-1 score de efectividad
    student_response JSONB, -- Respuesta del estudiante
    
    -- Colaboración
    family_involvement JSONB, -- Participación familiar
    specialist_consultation JSONB, -- Consultas con especialistas
    peer_support_assigned JSONB, -- Apoyo de compañeros asignado
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active', -- 'planned', 'active', 'completed', 'discontinued'
    completion_date DATE,
    success_indicators JSONB, -- Indicadores de éxito
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Torneos educativos
CREATE TABLE IF NOT EXISTS educational_tournaments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES teacher_classes(id) ON DELETE CASCADE,
    
    -- Información del torneo
    tournament_name VARCHAR(200) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50), -- 'individual', 'team', 'class_vs_class', 'collaborative'
    
    -- Configuración pedagógica
    learning_objectives JSONB, -- Objetivos de aprendizaje
    curriculum_alignment JSONB, -- Alineación curricular
    competencies_targeted JSONB, -- Competencias objetivo
    
    -- Estructura del torneo
    format_type VARCHAR(50), -- 'bracket', 'round_robin', 'point_accumulation', 'project_based'
    team_size INTEGER DEFAULT 1,
    max_participants INTEGER,
    
    -- Configuración de evaluación
    assessment_criteria JSONB, -- Criterios de evaluación
    scoring_rubric JSONB, -- Rúbrica de puntuación
    peer_assessment_enabled BOOLEAN DEFAULT false,
    
    -- Mecánicas educativas
    collaboration_requirements JSONB, -- Requisitos de colaboración
    research_components JSONB, -- Componentes de investigación
    presentation_requirements JSONB, -- Requisitos de presentación
    
    -- Fechas y cronograma
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    tournament_start TIMESTAMP,
    tournament_end TIMESTAMP,
    
    -- Premios y reconocimiento
    academic_rewards JSONB, -- Premios académicos
    recognition_criteria JSONB, -- Criterios de reconocimiento
    effort_recognition BOOLEAN DEFAULT true,
    
    -- Seguimiento pedagógico
    learning_outcomes_tracking JSONB, -- Seguimiento de resultados
    engagement_metrics JSONB, -- Métricas de engagement
    collaboration_assessment JSONB, -- Evaluación de colaboración
    
    -- Estado
    status VARCHAR(20) DEFAULT 'planning', -- 'planning', 'registration', 'active', 'completed', 'cancelled'
    anxiety_reduction_features JSONB, -- Características para reducir ansiedad
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Participantes de torneos
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES educational_tournaments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del participante
    team_name VARCHAR(100),
    registration_date TIMESTAMP DEFAULT NOW(),
    collaboration_preferences JSONB,
    
    -- Estado de participación
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'active', 'eliminated', 'completed'
    final_rank INTEGER,
    total_score DECIMAL(8,2),
    
    -- Evaluaciones específicas
    collaboration_score DECIMAL(5,2),
    presentation_score DECIMAL(5,2),
    research_quality DECIMAL(5,2),
    creativity_score DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, student_id)
);

-- TABLA: Progreso en torneos
CREATE TABLE IF NOT EXISTS tournament_progress (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES educational_tournaments(id) ON DELETE CASCADE,
    participant_id INTEGER REFERENCES tournament_participants(id) ON DELETE CASCADE,
    
    -- Información de la fase
    phase VARCHAR(50) NOT NULL, -- 'preliminary', 'quarterfinals', 'semifinals', 'finals'
    score DECIMAL(8,2),
    feedback TEXT,
    achievements JSONB,
    
    -- Evaluaciones detalladas
    collaboration_score DECIMAL(5,2),
    presentation_score DECIMAL(5,2),
    research_quality DECIMAL(5,2),
    creativity_score DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tournament_id, participant_id, phase)
);

-- TABLA: Recursos educativos (MOVIDA ANTES DE resource_reviews para resolver dependencia FK)
CREATE TABLE IF NOT EXISTS educational_resources (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Información del recurso
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50), -- 'assessment', 'multimedia', 'interactive', 'virtual_trip', 'simulation'
    subject_area VARCHAR(100),
    grade_level VARCHAR(50),

    -- Clasificación académica
    standards_alignment JSONB, -- Alineación con estándares
    bloom_taxonomy_level JSONB, -- Nivel de taxonomía de Bloom
    learning_objectives JSONB, -- Objetivos de aprendizaje

    -- Contenido del recurso
    resource_content JSONB, -- Contenido estructurado
    multimedia_elements JSONB, -- Elementos multimedia
    interactive_components JSONB, -- Componentes interactivos

    -- Metadatos educativos
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    estimated_duration INTEGER, -- minutos
    prerequisites JSONB, -- Prerrequisitos necesarios

    -- Diferenciación y accesibilidad
    differentiation_options JSONB, -- Opciones de diferenciación
    accessibility_features JSONB, -- Características de accesibilidad
    language_options JSONB, -- Opciones de idioma

    -- Uso y efectividad
    usage_count INTEGER DEFAULT 0,
    effectiveness_rating DECIMAL(3,2), -- Rating de efectividad
    teacher_reviews JSONB, -- Reseñas de profesores

    -- Estado y disponibilidad
    is_published BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    tags JSONB, -- Tags para búsqueda

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Reseñas de recursos educativos
CREATE TABLE IF NOT EXISTS resource_reviews (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES educational_resources(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Información de la reseña
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    usage_context JSONB, -- Contexto de uso del recurso

    -- Efectividad reportada
    effectiveness_score DECIMAL(3,2), -- 0-1 score
    student_engagement_impact INTEGER CHECK (student_engagement_impact >= 1 AND student_engagement_impact <= 5),
    learning_outcome_impact INTEGER CHECK (learning_outcome_impact >= 1 AND learning_outcome_impact <= 5),

    -- Recomendaciones
    would_recommend BOOLEAN DEFAULT true,
    improvement_suggestions TEXT,
    alternative_uses JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Comunicación educativa
CREATE TABLE IF NOT EXISTS educational_communications (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del mensaje
    communication_type VARCHAR(50), -- 'student', 'parent', 'progress_report', 'behavioral', 'emergency'
    subject VARCHAR(200) NOT NULL,
    message_content TEXT NOT NULL,
    
    -- Destinatarios
    recipient_students INTEGER[], -- IDs de estudiantes destinatarios
    recipient_parents INTEGER[], -- IDs de padres destinatarios
    class_id INTEGER REFERENCES teacher_classes(id), -- Comunicación a toda la clase
    
    -- Configuración de entrega
    delivery_method VARCHAR(50), -- 'immediate', 'scheduled', 'automated'
    scheduled_delivery TIMESTAMP,
    priority_level VARCHAR(20), -- 'low', 'normal', 'high', 'urgent'
    
    -- Contenido pedagógico
    academic_context JSONB, -- Contexto académico del mensaje
    progress_data JSONB, -- Datos de progreso incluidos
    recommendations JSONB, -- Recomendaciones incluidas
    
    -- Seguimiento de comunicación
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read'
    read_confirmations JSONB, -- Confirmaciones de lectura
    responses JSONB, -- Respuestas recibidas
    
    -- Categorización
    is_automated BOOLEAN DEFAULT false,
    template_used VARCHAR(200), -- Plantilla utilizada
    language VARCHAR(10) DEFAULT 'es',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Reportes académicos institucionales
CREATE TABLE IF NOT EXISTS institutional_reports (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información del reporte
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50), -- 'progress', 'attendance', 'behavior', 'standards_alignment', 'iep'
    report_period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'semester', 'annual'
    
    -- Configuración del reporte
    class_ids INTEGER[], -- Clases incluidas
    student_ids INTEGER[], -- Estudiantes específicos
    date_range_start DATE,
    date_range_end DATE,
    
    -- Contenido del reporte
    report_data JSONB, -- Datos completos del reporte
    summary_statistics JSONB, -- Estadísticas resumidas
    performance_metrics JSONB, -- Métricas de rendimiento
    
    -- Configuración institucional
    standards_framework VARCHAR(100), -- Marco de estándares usado
    compliance_requirements JSONB, -- Requisitos de cumplimiento
    privacy_settings JSONB, -- Configuración de privacidad
    
    -- Distribución
    authorized_recipients JSONB, -- Destinatarios autorizados
    access_permissions JSONB, -- Permisos de acceso
    sharing_restrictions JSONB, -- Restricciones de compartición
    
    -- Estado
    generation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    file_path TEXT, -- Ruta del archivo generado
    expiration_date DATE, -- Fecha de expiración
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ========================================

-- Índices para clases y inscripciones
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON teacher_classes(teacher_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_code ON teacher_classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id, enrollment_status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);

-- Índices para perfiles académicos
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_class ON student_academic_profiles(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_tracking(class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_tracking(student_id, attendance_date);

-- Índices para cronogramas y asignaciones
CREATE INDEX IF NOT EXISTS idx_academic_schedules_class ON academic_schedules(class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_content_assignments_schedule ON content_assignments(schedule_id, is_active);
CREATE INDEX IF NOT EXISTS idx_content_assignments_class ON content_assignments(class_id, due_date);

-- Índices para progreso académico
CREATE INDEX IF NOT EXISTS idx_academic_progress_student ON academic_progress(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_academic_progress_assignment ON academic_progress(assignment_id);
CREATE INDEX IF NOT EXISTS idx_academic_progress_date ON academic_progress(date_completed);

-- Índices para evaluaciones
CREATE INDEX IF NOT EXISTS idx_teacher_assessments_class ON teacher_assessments(class_id, is_published);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON assessment_results(student_id);

-- Índices para intervenciones
CREATE INDEX IF NOT EXISTS idx_interventions_student ON pedagogical_interventions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_interventions_teacher ON pedagogical_interventions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_interventions_urgency ON pedagogical_interventions(urgency_level, start_date);

-- Índices para torneos educativos
CREATE INDEX IF NOT EXISTS idx_educational_tournaments_teacher ON educational_tournaments(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_educational_tournaments_class ON educational_tournaments(class_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_student ON tournament_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_tournament_progress_tournament ON tournament_progress(tournament_id, phase);
CREATE INDEX IF NOT EXISTS idx_tournament_progress_participant ON tournament_progress(participant_id);

-- Índices para recursos y comunicaciones
CREATE INDEX IF NOT EXISTS idx_educational_resources_teacher ON educational_resources(teacher_id, is_published);
CREATE INDEX IF NOT EXISTS idx_educational_resources_subject ON educational_resources(subject_area, grade_level);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_resource ON resource_reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_teacher ON resource_reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_educational_communications_teacher ON educational_communications(teacher_id, delivery_status);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_institutional_reports_teacher ON institutional_reports(teacher_id, report_type);

-- ========================================
-- FUNCIONES DE UTILIDAD Y TRIGGERS
-- ========================================

-- Función para generar códigos de clase únicos
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generar código alfanumérico de 6 caracteres
        new_code := upper(substr(md5(random()::text), 1, 6));
        
        -- Verificar si ya existe
        SELECT EXISTS(SELECT 1 FROM teacher_classes WHERE class_code = new_code) INTO code_exists;
        
        -- Si no existe, retornar el código
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular métricas de progreso académico
CREATE OR REPLACE FUNCTION calculate_student_progress_metrics(student_id_param INTEGER, class_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    progress_metrics JSONB;
    attendance_rate DECIMAL(5,2);
    avg_score DECIMAL(5,2);
    completion_rate DECIMAL(5,2);
    engagement_score DECIMAL(5,2);
BEGIN
    -- Calcular tasa de asistencia
    SELECT COALESCE(
        (COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 0
    ) INTO attendance_rate
    FROM attendance_tracking
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND attendance_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Calcular promedio de calificaciones
    SELECT COALESCE(AVG(percentage), 0) INTO avg_score
    FROM academic_progress
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND date_completed >= CURRENT_DATE - INTERVAL '30 days';

    -- Calcular tasa de finalización
    SELECT COALESCE(
        (COUNT(CASE WHEN date_completed IS NOT NULL THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 0
    ) INTO completion_rate
    FROM academic_progress
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND date_started >= CURRENT_DATE - INTERVAL '30 days';

    -- Calcular score de engagement promedio
    SELECT COALESCE(AVG(engagement_score), 0) INTO engagement_score
    FROM attendance_tracking
    WHERE student_id = student_id_param AND class_id = class_id_param
    AND attendance_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Construir JSON de métricas
    progress_metrics := jsonb_build_object(
        'attendance_rate', attendance_rate,
        'average_score', avg_score,
        'completion_rate', completion_rate,
        'engagement_score', engagement_score,
        'calculated_at', NOW()
    );

    RETURN progress_metrics;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar estudiantes que necesitan intervención
CREATE OR REPLACE FUNCTION detect_intervention_needs()
RETURNS VOID AS $$
DECLARE
    student_record RECORD;
    intervention_criteria JSONB;
BEGIN
    -- Iterar sobre estudiantes activos
    FOR student_record IN
        SELECT DISTINCT ce.student_id, ce.class_id, tc.teacher_id
        FROM class_enrollments ce
        JOIN teacher_classes tc ON ce.class_id = tc.id
        WHERE ce.enrollment_status = 'active'
        AND tc.is_active = true
    LOOP
        -- Calcular métricas del estudiante
        SELECT calculate_student_progress_metrics(student_record.student_id, student_record.class_id)
        INTO intervention_criteria;

        -- Verificar criterios de intervención
        IF (intervention_criteria->>'attendance_rate')::DECIMAL < 75 OR
           (intervention_criteria->>'average_score')::DECIMAL < 60 OR
           (intervention_criteria->>'completion_rate')::DECIMAL < 50 OR
           (intervention_criteria->>'engagement_score')::DECIMAL < 4 THEN

            -- Crear intervención automática si no existe una activa
            INSERT INTO pedagogical_interventions (
                student_id, teacher_id, class_id, intervention_name, intervention_type,
                urgency_level, identified_issues, intervention_strategy, status
            )
            SELECT 
                student_record.student_id,
                student_record.teacher_id,
                student_record.class_id,
                'Intervención Automática - Bajo Rendimiento',
                'remedial',
                CASE 
                    WHEN (intervention_criteria->>'average_score')::DECIMAL < 40 THEN 'critical'
                    WHEN (intervention_criteria->>'attendance_rate')::DECIMAL < 50 THEN 'high'
                    ELSE 'medium'
                END,
                intervention_criteria,
                jsonb_build_object(
                    'type', 'automated_detection',
                    'recommended_actions', CASE
                        WHEN (intervention_criteria->>'attendance_rate')::DECIMAL < 75 THEN 
                            '["Contactar familia", "Revisar barreras de asistencia", "Plan de recuperación"]'::jsonb
                        WHEN (intervention_criteria->>'average_score')::DECIMAL < 60 THEN
                            '["Tutoría adicional", "Revisión de método de enseñanza", "Evaluación de comprensión"]'::jsonb
                        ELSE
                            '["Seguimiento cercano", "Refuerzo positivo", "Adaptación de estrategias"]'::jsonb
                    END
                ),
                'planned'
            WHERE NOT EXISTS (
                SELECT 1 FROM pedagogical_interventions pi
                WHERE pi.student_id = student_record.student_id
                AND pi.class_id = student_record.class_id
                AND pi.status IN ('planned', 'active')
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
DO $$
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY[
        'teacher_classes', 'class_enrollments', 'student_academic_profiles',
        'academic_schedules', 'content_assignments', 'teacher_assessments',
        'pedagogical_interventions', 'educational_tournaments', 'educational_resources',
        'educational_communications', 'institutional_reports', 'tournament_progress'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s;
            CREATE TRIGGER trigger_update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;