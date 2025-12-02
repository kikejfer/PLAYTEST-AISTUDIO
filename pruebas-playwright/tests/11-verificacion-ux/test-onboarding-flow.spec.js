
const { test, expect } = require('@playwright/test');

test.describe('Onboarding Flow for New Users', () => {
  test('should redirect to first-steps.html after successful registration', async ({ page }) => {
    // Generar datos de usuario único para cada ejecución
    const uniqueId = `testuser_${Date.now()}`;
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      nickname: uniqueId,
      email: `${uniqueId}@example.com`,
      password: 'password123',
    };

    // 1. Navegar a la página de inicio
    await page.goto('http://localhost:3000');

    // 2. Ir al formulario de registro
    await page.click('text=Sign up');

    // Esperar a que el formulario de registro sea visible
    await page.waitForSelector('form[aria-label="Create Account"]');

    // 3. Completar el formulario de registro
    await page.fill('input[name="firstName"]', newUser.firstName);
    await page.fill('input[name="lastName"]', newUser.lastName);
    await page.fill('input[name="nickname"]', newUser.nickname);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="confirmPassword"]', newUser.password);
    
    // 4. Enviar el formulario
    await page.click('button:has-text("Sign Up")');

    // 5. Verificación Clave: Esperar y verificar la redirección
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    // La URL final debe ser la página de primeros pasos
    expect(page.url()).toBe('http://localhost:3000/first-steps.html');

    // Verificación adicional: El contenido de la página es el correcto
    const heading = await page.textContent('h1');
    expect(heading).toContain('¡Bienvenido a PlayTest!');
  });
});
