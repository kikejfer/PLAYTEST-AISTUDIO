const { test, expect } = require('@playwright/test');

test('Debug - Simple login test', async ({ page }) => {
  console.log('🔍 Starting debug test...');
  
  try {
    // Ir a la página
    console.log('🔍 Going to login page...');
    await page.goto('https://playtest-frontend.onrender.com/', { timeout: 30000 });
    
    // Esperar a que cargue
    console.log('🔍 Waiting for page load...');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verificar que la página cargó
    console.log('🔍 Taking screenshot...');
    await page.screenshot({ path: 'debug-page.png' });
    
    // Buscar el formulario de login
    console.log('🔍 Looking for login form...');
    const nicknameField = page.locator('input[name="nickname"]');
    const passwordField = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('🔍 Checking if elements exist...');
    console.log('Nickname field count:', await nicknameField.count());
    console.log('Password field count:', await passwordField.count());
    console.log('Submit button count:', await submitButton.count());
    
    if (await nicknameField.count() > 0) {
      console.log('✅ Login form found');
      
      // Intentar hacer login
      await nicknameField.fill('AdminPrincipal');
      await passwordField.fill('kikejfer');
      
      console.log('🔍 Clicking submit...');
      await submitButton.click();
      
      // Esperar un momento para ver qué pasa
      await page.waitForTimeout(5000);
      
      console.log('🔍 Current URL:', page.url());
      await page.screenshot({ path: 'after-login.png' });
      
    } else {
      console.log('❌ Login form not found');
      
      // Ver qué hay en la página
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error in debug test:', error.message);
    await page.screenshot({ path: 'error-state.png' });
  }
});