/**
 * Controller para las funciones del Administrador Principal
 * Maneja la gestión de administradores secundarios, profesores y usuarios
 */

/**
 * MOCK DATA - En producción, esto vendría de la base de datos
 */
const mockData = {
  administradoresSecundarios: [
    {
      id: 1,
      user_id: 101,
      nickname: 'AdminSecundario1',
      email: 'admin1@playtest.com',
      created_by: 1,
      created_at: '2024-01-15T10:00:00Z',
      profesores_asignados: 5,
      bloques_totales: 25,
      preguntas_totales: 350,
      luminarias: 15000
    },
    {
      id: 2,
      user_id: 102,
      nickname: 'AdminSecundario2',
      email: 'admin2@playtest.com',
      created_by: 1,
      created_at: '2024-02-01T14:30:00Z',
      profesores_asignados: 3,
      bloques_totales: 18,
      preguntas_totales: 220,
      luminarias: 12000
    }
  ],

  profesoresCreadores: [
    {
      id: 1,
      nickname: 'ProfesorMath',
      email: 'profesor.math@playtest.com',
      admin_id: 1,
      admin_asignado: 'AdminSecundario1',
      bloques_creados: 8,
      preguntas_totales: 120,
      usuarios_bloques_publicos: 45,
      luminarias_actuales: 8500,
      luminarias_ganadas: 10000,
      luminarias_gastadas: 1200,
      luminarias_abonadas: 300,
      luminarias_compradas: 0
    },
    {
      id: 2,
      nickname: 'ProfesorHistory',
      email: 'profesor.history@playtest.com',
      admin_id: 2,
      admin_asignado: 'AdminSecundario2',
      bloques_creados: 6,
      preguntas_totales: 85,
      usuarios_bloques_publicos: 32,
      luminarias_actuales: 6200,
      luminarias_ganadas: 7500,
      luminarias_gastadas: 900,
      luminarias_abonadas: 400,
      luminarias_compradas: 100
    }
  ],

  usuarios: [
    {
      id: 1,
      nickname: 'Player1',
      email: 'player1@playtest.com',
      admin_id: 1,
      admin_asignado: 'AdminSecundario1',
      bloques_cargados: 12,
      luminarias_actuales: 2500,
      luminarias_ganadas: 3000,
      luminarias_gastadas: 400,
      luminarias_abonadas: 0,
      luminarias_compradas: 100
    },
    {
      id: 2,
      nickname: 'Player2',
      email: 'player2@playtest.com',
      admin_id: 2,
      admin_asignado: 'AdminSecundario2',
      bloques_cargados: 8,
      luminarias_actuales: 1800,
      luminarias_ganadas: 2200,
      luminarias_gastadas: 300,
      luminarias_abonadas: 0,
      luminarias_compradas: 50
    }
  ],

  bloques: [
    {
      id: 1,
      name: 'Matemáticas Básicas',
      profesor_id: 1,
      num_temas: 5,
      total_preguntas: 50,
      usuarios_bloque: 25,
      created_at: '2024-01-10T09:00:00Z'
    },
    {
      id: 2,
      name: 'Historia Universal',
      profesor_id: 2,
      num_temas: 4,
      total_preguntas: 32,
      usuarios_bloque: 18,
      created_at: '2024-01-20T11:00:00Z'
    }
  ],

  temas: [
    {
      id: 1,
      bloque_id: 1,
      topic: 'Suma y Resta',
      num_preguntas: 12
    },
    {
      id: 2,
      bloque_id: 1,
      topic: 'Multiplicación',
      num_preguntas: 15
    },
    {
      id: 3,
      bloque_id: 2,
      topic: 'Roma Antigua',
      num_preguntas: 10
    }
  ],

  preguntas: [
    {
      id: 1,
      tema_id: 1,
      text_question: '¿Cuánto es 2 + 2?',
      difficulty: 1,
      explanation: 'Suma básica de números enteros',
      answers: [
        { text: '3', is_correct: false },
        { text: '4', is_correct: true },
        { text: '5', is_correct: false },
        { text: '6', is_correct: false }
      ]
    },
    {
      id: 2,
      tema_id: 1,
      text_question: '¿Cuánto es 10 - 3?',
      difficulty: 2,
      explanation: 'Resta básica de números enteros',
      answers: [
        { text: '6', is_correct: false },
        { text: '7', is_correct: true },
        { text: '8', is_correct: false },
        { text: '9', is_correct: false }
      ]
    }
  ],

  searchableUsers: [
    { id: 201, nickname: 'NewUser1', email: 'newuser1@playtest.com' },
    { id: 202, nickname: 'NewUser2', email: 'newuser2@playtest.com' },
    { id: 203, nickname: 'TestUser', email: 'testuser@playtest.com' }
  ]
};

/**
 * Obtener lista de administradores secundarios
 */
const getAdministradoresSecundarios = async () => {
  // En producción, esto haría una consulta a la base de datos
  return mockData.administradoresSecundarios;
};

/**
 * Crear nuevo administrador secundario
 */
const createAdministradorSecundario = async (adminData) => {
  const newAdmin = {
    id: mockData.administradoresSecundarios.length + 1,
    ...adminData,
    created_at: new Date().toISOString(),
    profesores_asignados: 0,
    bloques_totales: 0,
    preguntas_totales: 0,
    luminarias: 0
  };
  
  mockData.administradoresSecundarios.push(newAdmin);
  return newAdmin;
};

/**
 * Eliminar administrador secundario
 */
const deleteAdministradorSecundario = async (adminId) => {
  const index = mockData.administradoresSecundarios.findIndex(admin => admin.id === parseInt(adminId));
  if (index === -1) {
    throw new Error('Administrador no encontrado');
  }
  
  mockData.administradoresSecundarios.splice(index, 1);
  return true;
};

/**
 * Obtener lista de profesores/creadores
 */
const getProfesoresCreadores = async () => {
  return mockData.profesoresCreadores;
};

/**
 * Obtener bloques de un profesor específico
 */
const getBloquesProfesor = async (profesorId) => {
  const bloques = mockData.bloques.filter(bloque => bloque.profesor_id === parseInt(profesorId));
  return bloques;
};

/**
 * Obtener temas de un bloque específico
 */
const getTemasBloque = async (bloqueId) => {
  const temas = mockData.temas.filter(tema => tema.bloque_id === parseInt(bloqueId));
  return temas;
};

/**
 * Obtener preguntas de un tema específico
 */
const getPreguntasTema = async (temaId) => {
  const preguntas = mockData.preguntas.filter(pregunta => pregunta.tema_id === parseInt(temaId));
  return preguntas;
};

/**
 * Obtener lista de usuarios/jugadores con filtros y paginación
 */
const getUsuariosJugadores = async (options = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'luminarias',
    sortOrder = 'desc',
    filters = {}
  } = options;

  let usuarios = [...mockData.usuarios];

  // Aplicar filtros
  if (filters.search) {
    usuarios = usuarios.filter(user => 
      user.nickname.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  if (filters.adminAsignado) {
    usuarios = usuarios.filter(user => user.admin_asignado === filters.adminAsignado);
  }

  if (filters.bloquesMin !== null) {
    usuarios = usuarios.filter(user => user.bloques_cargados >= filters.bloquesMin);
  }

  if (filters.bloquesMax !== null) {
    usuarios = usuarios.filter(user => user.bloques_cargados <= filters.bloquesMax);
  }

  if (filters.luminariasMin !== null) {
    usuarios = usuarios.filter(user => user.luminarias_actuales >= filters.luminariasMin);
  }

  if (filters.luminariasMax !== null) {
    usuarios = usuarios.filter(user => user.luminarias_actuales <= filters.luminariasMax);
  }

  // Ordenar
  usuarios.sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    
    if (sortOrder === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  // Paginación
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = usuarios.slice(startIndex, endIndex);

  return {
    usuarios: paginatedUsers,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(usuarios.length / limit),
      total_count: usuarios.length,
      per_page: limit
    }
  };
};

/**
 * Asignar administrador a un usuario individual
 */
const assignAdminToUser = async (userId, adminId) => {
  const userIndex = mockData.usuarios.findIndex(user => user.id === parseInt(userId));
  if (userIndex === -1) {
    throw new Error('Usuario no encontrado');
  }

  const admin = mockData.administradoresSecundarios.find(admin => admin.id === parseInt(adminId));
  if (!admin) {
    throw new Error('Administrador no encontrado');
  }

  mockData.usuarios[userIndex].admin_id = parseInt(adminId);
  mockData.usuarios[userIndex].admin_asignado = admin.nickname;

  return mockData.usuarios[userIndex];
};

/**
 * Reasignación masiva de administrador a múltiples usuarios
 */
const massiveAssignAdmin = async (userIds, adminId) => {
  const admin = mockData.administradoresSecundarios.find(admin => admin.id === parseInt(adminId));
  if (!admin) {
    throw new Error('Administrador no encontrado');
  }

  let affectedCount = 0;

  userIds.forEach(userId => {
    const userIndex = mockData.usuarios.findIndex(user => user.id === parseInt(userId));
    if (userIndex !== -1) {
      mockData.usuarios[userIndex].admin_id = parseInt(adminId);
      mockData.usuarios[userIndex].admin_asignado = admin.nickname;
      affectedCount++;
    }
  });

  return { affectedCount };
};

/**
 * Asignar administrador a un profesor
 */
const assignAdminToProfesor = async (profesorId, adminId) => {
  const profesorIndex = mockData.profesoresCreadores.findIndex(profesor => profesor.id === parseInt(profesorId));
  if (profesorIndex === -1) {
    throw new Error('Profesor no encontrado');
  }

  const admin = mockData.administradoresSecundarios.find(admin => admin.id === parseInt(adminId));
  if (!admin) {
    throw new Error('Administrador no encontrado');
  }

  mockData.profesoresCreadores[profesorIndex].admin_id = parseInt(adminId);
  mockData.profesoresCreadores[profesorIndex].admin_asignado = admin.nickname;

  return mockData.profesoresCreadores[profesorIndex];
};

/**
 * Buscar usuarios por nickname
 */
const searchUsers = async (query) => {
  const users = mockData.searchableUsers.filter(user =>
    user.nickname.toLowerCase().includes(query.toLowerCase())
  );
  
  return users;
};

module.exports = {
  getAdministradoresSecundarios,
  createAdministradorSecundario,
  deleteAdministradorSecundario,
  getProfesoresCreadores,
  getBloquesProfesor,
  getTemasBloque,
  getPreguntasTema,
  getUsuariosJugadores,
  assignAdminToUser,
  massiveAssignAdmin,
  assignAdminToProfesor,
  searchUsers
};