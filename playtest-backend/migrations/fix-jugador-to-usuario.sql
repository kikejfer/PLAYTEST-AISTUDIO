-- Migración: Renombrar rol 'jugador' a 'usuario'
-- Fecha: 2024-12-04
-- Descripción: Corrige inconsistencia entre schema y base de datos real

-- Paso 1: Verificar si existe el rol 'jugador'
DO $$
BEGIN
    -- Si existe 'jugador' y NO existe 'usuario', renombrar
    IF EXISTS (SELECT 1 FROM roles WHERE name = 'jugador')
       AND NOT EXISTS (SELECT 1 FROM roles WHERE name = 'usuario') THEN

        UPDATE roles
        SET name = 'usuario',
            description = 'Asignado automáticamente al cargar primer bloque ajeno'
        WHERE name = 'jugador';

        RAISE NOTICE '✅ Rol "jugador" renombrado a "usuario"';

    -- Si existen ambos, consolidar en 'usuario'
    ELSIF EXISTS (SELECT 1 FROM roles WHERE name = 'jugador')
          AND EXISTS (SELECT 1 FROM roles WHERE name = 'usuario') THEN

        -- Obtener IDs
        DECLARE
            jugador_id INTEGER;
            usuario_id INTEGER;
        BEGIN
            SELECT id INTO jugador_id FROM roles WHERE name = 'jugador';
            SELECT id INTO usuario_id FROM roles WHERE name = 'usuario';

            -- Migrar todas las asignaciones de 'jugador' a 'usuario'
            UPDATE user_roles
            SET role_id = usuario_id
            WHERE role_id = jugador_id
            AND NOT EXISTS (
                SELECT 1 FROM user_roles ur2
                WHERE ur2.user_id = user_roles.user_id
                AND ur2.role_id = usuario_id
            );

            -- Eliminar duplicados (usuarios que ya tenían ambos roles)
            DELETE FROM user_roles
            WHERE role_id = jugador_id;

            -- Eliminar el rol 'jugador'
            DELETE FROM roles WHERE name = 'jugador';

            RAISE NOTICE '✅ Rol "jugador" consolidado en "usuario" y eliminado';
        END;

    -- Si solo existe 'usuario', no hacer nada
    ELSIF EXISTS (SELECT 1 FROM roles WHERE name = 'usuario') THEN
        RAISE NOTICE '✅ Rol "usuario" ya existe correctamente';

    -- Si no existe ninguno, crear 'usuario'
    ELSE
        INSERT INTO roles (name, description, hierarchy_level, permissions)
        VALUES ('usuario', 'Asignado automáticamente al cargar primer bloque ajeno', 4, '{"play_games": true, "load_blocks": true}');

        RAISE NOTICE '✅ Rol "usuario" creado';
    END IF;
END $$;

-- Paso 2: Verificar resultado
SELECT name, description, hierarchy_level
FROM roles
WHERE name IN ('usuario', 'jugador')
ORDER BY name;
