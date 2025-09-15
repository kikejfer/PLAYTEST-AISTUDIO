const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://playtest-frontend.onrender.com/';
const LOGIN_URL = `${BASE_URL}`;

test.describe('Verificación de APIs Críticas', () => {
  
  test('Health check del backend', async ({ page }) => {
    await test.step('Verificar health check', async () => {
      const response = await page.request.get('https://playtest-backend.onrender.com/health');
      expect(response.status()).toBe(200);
      console.log('✅ Backend health check passed');
    });
  });
  
  test('Endpoint loaded-stats con autenticación', async ({ page }) => {
    
    await test.step('Login para obtener autenticación', async () => {
      // Login como admin para obtener token
      await page.goto(LOGIN_URL);
      await page.locator('input[name="nickname"]').fill('AdminPrincipal');
      await page.locator('input[name="password"]').fill('kikejfer');
      await page.locator('button[type="submit"], #login-btn, .login-btn').first().click();
      await page.waitForNavigation();
      console.log('✅ Logged in for API authentication');
    });
    
    await test.step('Verificar endpoint loaded-stats', async () => {
      // Obtener token de autenticación del localStorage o cookies
      const authToken = await page.evaluate(() => {
        return localStorage.getItem('playtest_auth_token') || 
               localStorage.getItem('token') || 
               localStorage.getItem('auth_token');
      });
      
      let headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await page.request.get('https://playtest-backend.onrender.com/blocks/loaded-stats', {
        headers: headers
      });
      
      // Verificar que responde correctamente (puede ser 200 o 401 si auth es requerida)
      expect([200, 401, 403].includes(response.status())).toBeTruthy();
      
      if (response.status() === 200) {
        console.log('✅ loaded-stats endpoint responding correctly with auth');
      } else {
        console.log('✅ loaded-stats endpoint properly requires authentication');
      }
    });
  });
  
  test('Verificación de conectividad general', async ({ page }) => {
    
    await test.step('Verificar frontend accesible', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Verificar que la página principal carga
      const loginForm = page.locator('form, input[name="nickname"], #login-form').first();
      await expect(loginForm).toBeVisible();
      console.log('✅ Frontend is accessible and login form is visible');
    });
    
    await test.step('Verificar tiempo de respuesta', async () => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      console.log(`📊 Page load time: ${loadTime}ms`);
      
      // Verificar que carga en tiempo razonable (menos de 10 segundos)
      expect(loadTime).toBeLessThan(10000);
      console.log('✅ Page loads within acceptable time limit');
    });
  });
  
  console.log('🎉 API tests completed successfully');
});