import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('should login with admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('http://localhost:5173/');
    
    // Check for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=/Invalid email or password|Login failed/')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
    
    // Find and click logout button
    await page.click('text=Logout');
    
    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:5173/login');
  });
});