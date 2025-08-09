import { test, expect } from '@playwright/test';

test.describe('Firestore Login Test', () => {
  test('should login with admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Debug: Take screenshot
    await page.screenshot({ path: 'login-page.png' });
    
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Debug: Take screenshot after filling
    await page.screenshot({ path: 'login-filled.png' });
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Debug: Take screenshot after click
    await page.screenshot({ path: 'login-after-click.png' });
    
    // Check for error messages
    const errorText = await page.textContent('body');
    console.log('Page content:', errorText);
    
    // Check if we're redirected to dashboard
    const url = page.url();
    console.log('Current URL:', url);
    
    // Check for any error messages
    const errorElement = await page.$('[role="alert"], .error, .chakra-alert');
    if (errorElement) {
      const errorMessage = await errorElement.textContent();
      console.log('Error message found:', errorMessage);
    }
  });
  
  test('should check API endpoint directly', async ({ request }) => {
    // Test the login endpoint directly
    const response = await request.post('http://localhost:5001/api/v2/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });
    
    console.log('API Response status:', response.status());
    const responseData = await response.json();
    console.log('API Response data:', responseData);
    
    expect(response.ok()).toBeTruthy();
  });
});