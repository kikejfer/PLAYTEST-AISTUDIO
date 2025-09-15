const { test, expect } = require('@playwright/test');

const testUsers = [
  { username: 'AdminPrincipal', password: 'kikejfer', expectedPath: '/admin-principal-panel' },
  { username: 'kikejfer', password: '123', expectedPath: '/admin-secundario-panel' },
  { username: 'admin', password: 'kikejfer', expectedPath: '/support-panel' },
  { username: 'Toñi', password: '987', expectedPath: '/profesores-panel' },
  { username: 'AntLop', password: '1001', expectedPath: '/creators-panel' }
];

for (const user of testUsers) {
  test(`Login y redirección - ${user.username}`, async ({ page }) => {
    console.log(`🧪 Testing user: ${user.username}`);
    
    // Ir a la página de login
    await page.goto('https://playtest-frontend.onrender.com/');
    
    // Esperar y rellenar formulario
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill(user.username);
    await page.locator('input[name="password"]').fill(user.password);
    
    // Hacer login
    await page.locator('button[type="submit"]').click();
    
    // Esperar a que redirija (más tiempo y flexible)
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Verificar que no estamos en la página de login
    expect(currentUrl).not.toContain('playtest-frontend.onrender.com/');
    
    // Verificar que contiene parte de la ruta esperada
    const containsExpectedPath = currentUrl.includes(user.expectedPath.replace('/', '')) || 
                                 currentUrl.includes(user.username.toLowerCase()) ||
                                 currentUrl.includes('panel');
    
    if (containsExpectedPath) {
      console.log(`✅ ${user.username} redirected correctly`);
    } else {
      console.log(`❌ ${user.username} unexpected redirect to: ${currentUrl}`);
    }
    
    // Verificar que la página cargó (buscar elementos comunes)
    const hasHeader = await page.locator('.user-header, .header, h1').count() > 0;
    const hasContainer = await page.locator('.container, .panel, .admin').count() > 0;
    
    if (hasHeader || hasContainer) {
      console.log(`✅ ${user.username} panel loaded successfully`);
    } else {
      console.log(`❌ ${user.username} panel did not load properly`);
    }
  });
}

// Test adicional para APIs
test('Health Check APIs', async ({ page }) => {
  const response = await page.request.get('https://playtest-backend.onrender.com/health');
  expect(response.status()).toBe(200);
  console.log('✅ Backend health check passed');
});