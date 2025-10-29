// Test de registro usando la API REST del backend

async function testRegistroAPI() {
  const baseURL = 'http://localhost:3002';
  
  // Datos de prueba
  const userData = {
    nickname: 'test_api_' + Date.now(),
    password: 'password123',
    email: 'testapi@example.com',
    firstName: 'Ana',
    lastName: 'García'
  };
  
  console.log('🧪 Probando registro via API...');
  console.log('📝 Datos:', {
    nickname: userData.nickname,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName
  });
  
  try {
    // Llamada al endpoint de registro
    const response = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    console.log('📡 Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error response:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Registro exitoso:', {
      message: result.message,
      user: result.user,
      hasToken: !!result.token
    });
    
    // Probar login
    console.log('🔐 Probando login...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: userData.nickname,
        password: userData.password
      })
    });
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Login exitoso:', {
        message: loginResult.message,
        user: loginResult.user
      });
      
      // Probar obtener perfil
      console.log('👤 Probando obtener perfil...');
      const profileResponse = await fetch(`${baseURL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResult.token}`
        }
      });
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        console.log('✅ Perfil obtenido:', {
          id: profile.id,
          nickname: profile.nickname,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName
        });
      } else {
        console.error('❌ Error obteniendo perfil:', await profileResponse.text());
      }
      
    } else {
      console.error('❌ Error en login:', await loginResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar test
testRegistroAPI();