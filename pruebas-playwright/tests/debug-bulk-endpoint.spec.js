const { test, expect } = require('@playwright/test');

test.describe('Debug Bulk Endpoint Persistence', () => {
  
  test('Diagnose bulk endpoint database persistence issue', async ({ page, context }) => {
    console.log('🔍 DEBUGGING: Bulk endpoint persistence problem');
    
    // Login as AndGar
    await page.goto('https://playtest-frontend.onrender.com/');
    await page.waitForSelector('input[name="nickname"]', { timeout: 10000 });
    await page.locator('input[name="nickname"]').fill('AndGar');
    await page.locator('input[name="password"]').fill('1002');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);
    
    console.log('✅ Logged in as AndGar');
    
    // Capture network requests to backend
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('playtest-backend.onrender.com')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('playtest-backend.onrender.com')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to Add Questions tab
    const addQuestionsTab = page.locator('.tab-button:has-text("Añadir Preguntas")').first();
    await addQuestionsTab.click();
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Add Questions tab');
    
    // Try simple file upload
    const fileInput = page.locator('input[type="file"]:not([webkitdirectory])').first();
    await fileInput.setInputFiles(['tests/CE1978_Título I Derechos y Deberes.txt']);
    console.log('✅ File uploaded');
    
    await page.waitForTimeout(3000);
    
    // Try to save - capture what happens
    const saveButtons = [
      'button:has-text("Guardar Preguntas")',
      'button:has-text("Guardar preguntas")',
      'button:has-text("Guardar")'
    ];
    
    let saveClicked = false;
    for (const selector of saveButtons) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log(`✅ Clicked save button: ${selector}`);
        saveClicked = true;
        break;
      }
    }
    
    if (!saveClicked) {
      console.log('❌ No save button found');
    }
    
    // Wait for backend requests to complete
    await page.waitForTimeout(5000);
    
    // Analyze the requests and responses
    console.log('\n🔍 NETWORK ANALYSIS:');
    console.log(`📊 Total backend requests: ${requests.length}`);
    console.log(`📊 Total backend responses: ${responses.length}`);
    
    const bulkRequests = requests.filter(r => r.url.includes('/questions/bulk'));
    const bulkResponses = responses.filter(r => r.url.includes('/questions/bulk'));
    
    console.log(`📊 Bulk requests: ${bulkRequests.length}`);
    console.log(`📊 Bulk responses: ${bulkResponses.length}`);
    
    if (bulkRequests.length > 0) {
      console.log('\n📤 BULK REQUEST DETAILS:');
      bulkRequests.forEach((req, i) => {
        console.log(`Request ${i + 1}:`);
        console.log(`  Method: ${req.method}`);
        console.log(`  URL: ${req.url}`);
        console.log(`  Auth header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
        console.log(`  Content-Type: ${req.headers['content-type']}`);
        if (req.postData) {
          try {
            const data = JSON.parse(req.postData);
            console.log(`  BlockId: ${data.blockId}`);
            console.log(`  Questions count: ${data.questions?.length || 0}`);
          } catch (e) {
            console.log(`  Post data: ${req.postData?.substring(0, 100)}...`);
          }
        }
      });
    }
    
    if (bulkResponses.length > 0) {
      console.log('\n📥 BULK RESPONSE DETAILS:');
      bulkResponses.forEach((res, i) => {
        console.log(`Response ${i + 1}:`);
        console.log(`  Status: ${res.status} ${res.statusText}`);
        console.log(`  URL: ${res.url}`);
      });
    }
    
    // Check if there are any error responses
    const errorResponses = responses.filter(r => r.status >= 400);
    if (errorResponses.length > 0) {
      console.log('\n❌ ERROR RESPONSES:');
      errorResponses.forEach(res => {
        console.log(`  ${res.status} ${res.statusText} - ${res.url}`);
      });
    }
  });
});