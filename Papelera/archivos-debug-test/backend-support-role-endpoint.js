/**
 * ENDPOINT IMPLEMENTATION FOR TECHNICAL SUPPORT ROLE
 * 
 * This file contains the implementation for the Technical Support role assignment endpoint
 * that should be added to the backend routes/roles-updated.js file
 */

// Add this to routes/roles-updated.js or create a new file roles-support.js

const express = require('express');
const router = express.Router();

/**
 * POST /api/roles-updated/add-soporte-tecnico
 * Assigns Technical Support role to a user by nickname
 */
router.post('/add-soporte-tecnico', authenticateToken, requireAdminPrincipal, async (req, res) => {
    try {
        const { nickname } = req.body;
        
        console.log('🛠️ BACKEND: Processing support role assignment for:', nickname);
        
        // Validate input
        if (!nickname || typeof nickname !== 'string') {
            return res.status(400).json({ 
                success: false, 
                error: 'Nickname es requerido y debe ser un string válido' 
            });
        }

        // 1. Find user by nickname
        const userQuery = `
            SELECT id, nickname, first_name, last_name, email 
            FROM users 
            WHERE nickname = ? 
            LIMIT 1
        `;
        
        const users = await db.query(userQuery, [nickname]);
        
        if (users.length === 0) {
            console.log('❌ BACKEND: User not found:', nickname);
            return res.status(404).json({ 
                success: false, 
                error: `Usuario con nickname "${nickname}" no encontrado` 
            });
        }

        const user = users[0];
        console.log('✅ BACKEND: User found:', user.id, user.nickname);

        // 2. Find soporte_tecnico role
        const roleQuery = `
            SELECT id, role_name 
            FROM roles 
            WHERE role_name = 'soporte_tecnico' 
            LIMIT 1
        `;
        
        const roles = await db.query(roleQuery);
        
        if (roles.length === 0) {
            console.log('❌ BACKEND: Role soporte_tecnico not found in roles table');
            
            // Auto-create the role if it doesn't exist
            console.log('🔧 BACKEND: Creating soporte_tecnico role...');
            const insertRoleQuery = `
                INSERT INTO roles (role_name, description) 
                VALUES ('soporte_tecnico', 'Personal de soporte técnico del sistema')
            `;
            
            try {
                const roleResult = await db.query(insertRoleQuery);
                console.log('✅ BACKEND: Role soporte_tecnico created with ID:', roleResult.insertId);
                
                // Get the newly created role
                const newRoles = await db.query(roleQuery);
                if (newRoles.length === 0) {
                    throw new Error('Failed to retrieve newly created role');
                }
                var role = newRoles[0];
            } catch (createError) {
                console.error('❌ BACKEND: Failed to create soporte_tecnico role:', createError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error creating soporte_tecnico role. Please contact administrator.' 
                });
            }
        } else {
            var role = roles[0];
        }

        console.log('✅ BACKEND: Role found/created:', role.id, role.role_name);

        // 3. Check if user already has this role
        const existingRoleQuery = `
            SELECT ur.id 
            FROM user_roles ur 
            WHERE ur.user_id = ? AND ur.role_id = ? 
            LIMIT 1
        `;
        
        const existingRoles = await db.query(existingRoleQuery, [user.id, role.id]);
        
        if (existingRoles.length > 0) {
            console.log('⚠️ BACKEND: User already has soporte_tecnico role');
            return res.status(400).json({ 
                success: false, 
                error: `El usuario "${nickname}" ya tiene el rol de Soporte Técnico` 
            });
        }

        // 4. Assign the role
        const assignRoleQuery = `
            INSERT INTO user_roles (user_id, role_id, created_at) 
            VALUES (?, ?, NOW())
        `;
        
        const assignResult = await db.query(assignRoleQuery, [user.id, role.id]);
        
        if (assignResult.affectedRows === 0) {
            throw new Error('Failed to insert role assignment');
        }

        console.log('✅ BACKEND: Role assigned successfully. user_roles ID:', assignResult.insertId);

        // 5. Get updated user roles for response
        const userRolesQuery = `
            SELECT r.role_name 
            FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = ?
        `;
        
        const userRoles = await db.query(userRolesQuery, [user.id]);
        const roleNames = userRoles.map(ur => ur.role_name);

        // 6. Success response
        const response = {
            success: true,
            message: `Rol de Soporte Técnico asignado exitosamente a "${nickname}"`,
            user: {
                id: user.id,
                nickname: user.nickname,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                roles: roleNames
            },
            assignment: {
                user_id: user.id,
                role_id: role.id,
                role_name: 'soporte_tecnico',
                assigned_at: new Date().toISOString()
            }
        };

        console.log('🎉 BACKEND: Support role assignment completed successfully');
        res.status(200).json(response);

    } catch (error) {
        console.error('❌ BACKEND: Error in add-soporte-tecnico endpoint:', error);
        
        // Handle different types of errors
        let errorMessage = 'Error interno del servidor';
        let statusCode = 500;
        
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'El usuario ya tiene este rol asignado';
            statusCode = 400;
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            errorMessage = 'Usuario o rol no válido';
            statusCode = 400;
        }
        
        res.status(statusCode).json({ 
            success: false, 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * ADDITIONAL: Update admin panel data endpoint to include support staff
 * Add this to the existing /api/admin-panel-data endpoint
 */
async function getSupportTechnicians() {
    const query = `
        SELECT 
            u.id,
            u.nickname,
            u.first_name,
            u.last_name,
            u.email,
            u.luminarias,
            ur.created_at as fecha_asignacion
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id  
        JOIN roles r ON ur.role_id = r.id
        WHERE r.role_name = 'soporte_tecnico'
        ORDER BY ur.created_at DESC
    `;
    
    try {
        const results = await db.query(query);
        return results;
    } catch (error) {
        console.error('Error fetching support technicians:', error);
        return [];
    }
}

// Export for use in main routes file
module.exports = {
    router,
    getSupportTechnicians
};

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Add to main app.js or routes/index.js:
 *    const supportRoutes = require('./routes/roles-support');
 *    app.use('/api/roles-updated', supportRoutes.router);
 * 
 * 2. Update existing /api/admin-panel-data endpoint:
 *    const { getSupportTechnicians } = require('./routes/roles-support');
 *    
 *    // In the admin-panel-data endpoint:
 *    const soporteTecnico = await getSupportTechnicians();
 *    
 *    return res.json({
 *        // ... existing data ...
 *        soporteTecnico: soporteTecnico,
 *        statistics: {
 *            // ... existing stats ...
 *            soporte: soporteTecnico.length
 *        }
 *    });
 * 
 * 3. Ensure the following middleware exists:
 *    - authenticateToken: JWT token validation
 *    - requireAdminPrincipal: Checks if user has admin_principal role
 *    - db: Database connection/query handler
 */