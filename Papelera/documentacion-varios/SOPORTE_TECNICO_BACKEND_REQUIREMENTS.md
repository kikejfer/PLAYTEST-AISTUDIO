# 🛠️ Requerimientos Backend para Rol Soporte Técnico

## 📋 Resumen
El frontend para el rol "Soporte Técnico" está completamente implementado, pero requiere endpoints específicos en el backend para funcionar correctamente.

## 🚨 ERROR ACTUAL
```
Error asignando soporte técnico: Error: Route not found
```

## ✅ ENDPOINT REQUERIDO

### 1. POST /api/roles-updated/add-soporte-tecnico

**Descripción:** Asigna el rol de Soporte Técnico a un usuario existente por nickname.

**Request Headers:**
```javascript
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```javascript
{
  "nickname": "usuario123"
}
```

**Response Success (200):**
```javascript
{
  "success": true,
  "message": "Rol de Soporte Técnico asignado exitosamente",
  "user": {
    "id": 123,
    "nickname": "usuario123",
    "roles": ["jugador", "soporte_tecnico"]
  }
}
```

**Response Error (400/404):**
```javascript
{
  "success": false,
  "error": "Usuario no encontrado" // o "Rol ya asignado", etc.
}
```

### 2. Lógica del Endpoint

**Pasos que debe realizar el backend:**

1. **Validar autenticación:** El usuario que hace la petición debe ser admin_principal
2. **Buscar usuario:** Encontrar usuario por nickname
3. **Verificar rol:** Confirmar que el rol 'soporte_tecnico' existe en tabla `roles`
4. **Insertar relación:** Crear registro en tabla `user_roles`
5. **Retornar respuesta:** Confirmar éxito o error

**SQL Queries necesarias:**
```sql
-- 1. Buscar usuario
SELECT id FROM users WHERE nickname = ?

-- 2. Buscar rol
SELECT id FROM roles WHERE role_name = 'soporte_tecnico'

-- 3. Verificar si ya tiene el rol
SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?

-- 4. Insertar nuevo rol
INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)
```

## 🗄️ REQUISITOS EN BASE DE DATOS

### Tabla `roles`
Debe contener el rol de soporte técnico:
```sql
INSERT INTO roles (role_name, description) 
VALUES ('soporte_tecnico', 'Personal de soporte técnico del sistema');
```

### Tabla `user_roles`
Estructura esperada:
```sql
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_id)
);
```

## 📊 ENDPOINT DE DATOS DEL PANEL

### Modificación en GET /api/admin-panel-data

El endpoint debe incluir la lista de usuarios con rol soporte técnico:

```javascript
{
  "soporteTecnico": [
    {
      "id": 123,
      "nickname": "tech_user",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com",
      "fecha_asignacion": "2025-01-27",
      "luminarias": 0
    }
  ],
  "statistics": {
    "admins": 2,
    "soporte": 1,  // ⬅️ NUEVO: Cantidad de usuarios con rol soporte_tecnico
    "profesores": 5,
    "creadores": 3,
    "jugadores": 100,
    "usuarios": 111
  }
}
```

**Query para obtener soporte técnico:**
```sql
SELECT u.id, u.nickname, u.first_name, u.last_name, u.email, u.luminarias,
       ur.created_at as fecha_asignacion
FROM users u
JOIN user_roles ur ON u.id = ur.user_id  
JOIN roles r ON ur.role_id = r.id
WHERE r.role_name = 'soporte_tecnico'
ORDER BY ur.created_at DESC;
```

## 🧪 TESTS PARA VALIDAR

### Test 1: Endpoint Exists
```bash
curl -X POST "https://playtest-backend.onrender.com/api/roles-updated/add-soporte-tecnico" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"test_user"}'

# Expected: No "Route not found"
```

### Test 2: Role Assignment
```sql
-- Verificar que se creó el registro
SELECT ur.*, u.nickname, r.role_name 
FROM user_roles ur 
JOIN users u ON ur.user_id = u.id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.nickname = 'test_user' AND r.role_name = 'soporte_tecnico';
```

### Test 3: Panel Data
```bash
curl -X GET "https://playtest-backend.onrender.com/api/admin-panel-data" \
  -H "Authorization: Bearer <token>"

# Expected: Response includes "soporteTecnico" array
```

## 📝 IMPLEMENTACIÓN SUGERIDA (Node.js/Express)

```javascript
// routes/roles-updated.js
router.post('/add-soporte-tecnico', authenticateToken, requireAdminPrincipal, async (req, res) => {
    try {
        const { nickname } = req.body;
        
        if (!nickname) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nickname es requerido' 
            });
        }

        // Buscar usuario
        const user = await db.query(
            'SELECT id FROM users WHERE nickname = ?', 
            [nickname]
        );
        
        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }

        // Buscar rol soporte_tecnico
        const role = await db.query(
            'SELECT id FROM roles WHERE role_name = ?', 
            ['soporte_tecnico']
        );
        
        if (role.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Rol soporte_tecnico no existe en la base de datos' 
            });
        }

        // Verificar si ya tiene el rol
        const existingRole = await db.query(
            'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
            [user[0].id, role[0].id]
        );

        if (existingRole.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'El usuario ya tiene el rol de Soporte Técnico' 
            });
        }

        // Asignar rol
        await db.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [user[0].id, role[0].id]
        );

        res.json({ 
            success: true, 
            message: 'Rol de Soporte Técnico asignado exitosamente' 
        });

    } catch (error) {
        console.error('Error assigning support role:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});
```

## 🎯 PRIORIDAD

**ALTA** - Sin este endpoint, la funcionalidad de asignación de Soporte Técnico no funciona.

## ✅ CHECKLIST PARA BACKEND

- [ ] Crear endpoint `/api/roles-updated/add-soporte-tecnico`
- [ ] Verificar que existe rol 'soporte_tecnico' en tabla `roles`
- [ ] Modificar endpoint `/api/admin-panel-data` para incluir `soporteTecnico`
- [ ] Actualizar estadísticas para incluir contador de soporte
- [ ] Probar asignación de rol con usuario real
- [ ] Verificar que aparece en admin panel después de asignación

**Una vez implementado, el sistema funcionará completamente.** 🚀