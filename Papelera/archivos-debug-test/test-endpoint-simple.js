const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

async function testEndpoints() {
    try {
        console.log('🔐 Obteniendo token para AdminPrincipal...');
        
        // Login para obtener token
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nickname: 'AdminPrincipal',
                password: 'kikejfer'
            })
        });
        
        if (!loginResponse.ok) {
            const errorData = await loginResponse.text();
            console.log('❌ Error en login:', loginResponse.status, errorData);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        console.log('✅ Token obtenido:', token.substring(0, 20) + '...');
        
        // Test PAP endpoint
        console.log('\n🎯 Probando PAP endpoint...');
        const papResponse = await fetch(`${BASE_URL}/api/roles-updated/admin-principal-panel`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (papResponse.ok) {
            const papData = await papResponse.json();
            console.log('✅ PAP Response OK');
            console.log('📊 PAP Data keys:', Object.keys(papData));
            console.log('🔍 PAP - jugadores:', papData.jugadores?.length || 0, 'items');
            console.log('🔍 PAP - profesores:', papData.profesores?.length || 0, 'items');
            console.log('🔍 PAP - creadores:', papData.creadores?.length || 0, 'items');
        } else {
            const errorText = await papResponse.text();
            console.log('❌ PAP Error:', papResponse.status, errorText);
        }
        
        // Test PAS endpoint
        console.log('\n🎯 Probando PAS endpoint...');
        const pasResponse = await fetch(`${BASE_URL}/api/roles-updated/admin-secundario-panel`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (pasResponse.ok) {
            const pasData = await pasResponse.json();
            console.log('✅ PAS Response OK');
            console.log('📊 PAS Data keys:', Object.keys(pasData));
            console.log('🔍 PAS - jugadores:', pasData.jugadores?.length || 0, 'items');
            console.log('🔍 PAS - profesores:', pasData.profesores?.length || 0, 'items');  
            console.log('🔍 PAS - creadores:', pasData.creadores?.length || 0, 'items');
        } else {
            const errorText = await pasResponse.text();
            console.log('❌ PAS Error:', pasResponse.status, errorText);
        }
        
    } catch (error) {
        console.error('❌ Test Exception:', error.message);
    }
}

testEndpoints();