-- ==========================================
-- MIGRACIÓN: Crear tabla block_assignments
-- Fecha: 2025-10-26
-- Descripción: Tabla para almacenar asignaciones de bloques a grupos o estudiantes individuales
-- ==========================================

-- Crear tabla block_assignments
CREATE TABLE IF NOT EXISTS block_assignments (
    id SERIAL PRIMARY KEY,

    -- Bloque asignado
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,

    -- Profesor que realiza la asignación
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Destinatario (grupo o usuario individual - uno de los dos debe estar presente)
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    assigned_to_user INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Información de la asignación
    due_date TIMESTAMP,
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT NOW(),

    -- Constrains
    CHECK (group_id IS NOT NULL OR assigned_to_user IS NOT NULL), -- Al menos uno debe estar presente
    CHECK (NOT (group_id IS NOT NULL AND assigned_to_user IS NOT NULL)) -- Pero no ambos al mismo tiempo
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_block_assignments_block ON block_assignments(block_id);
CREATE INDEX IF NOT EXISTS idx_block_assignments_assigned_by ON block_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_block_assignments_group ON block_assignments(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_block_assignments_user ON block_assignments(assigned_to_user) WHERE assigned_to_user IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_block_assignments_due_date ON block_assignments(due_date) WHERE due_date IS NOT NULL;

-- Crear índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_block_assignments_assigned_by_date ON block_assignments(assigned_by, assigned_at DESC);

COMMENT ON TABLE block_assignments IS 'Almacena las asignaciones de bloques de preguntas a grupos o estudiantes individuales';
COMMENT ON COLUMN block_assignments.block_id IS 'ID del bloque asignado';
COMMENT ON COLUMN block_assignments.assigned_by IS 'ID del profesor que realiza la asignación';
COMMENT ON COLUMN block_assignments.group_id IS 'ID del grupo al que se asigna (si aplica)';
COMMENT ON COLUMN block_assignments.assigned_to_user IS 'ID del usuario individual al que se asigna (si aplica)';
COMMENT ON COLUMN block_assignments.due_date IS 'Fecha límite de entrega/completado';
COMMENT ON COLUMN block_assignments.notes IS 'Notas adicionales sobre la asignación';
COMMENT ON COLUMN block_assignments.assigned_at IS 'Fecha y hora en que se realizó la asignación';
