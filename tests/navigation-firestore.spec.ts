import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Dashboard', path: '/', title: 'Dashboard' },
  { name: 'Time', path: '/time', title: 'Time Tracking' },
  { name: 'Expenses', path: '/expenses', title: 'Expenses' },
  { name: 'Projects', path: '/projects', title: 'Projects' },
  { name: 'Clients', path: '/clients', title: 'Clients' },
  { name: 'Team', path: '/team', title: 'Team' },
  { name: 'Reports', path: '/reports', title: 'Reports' },
  { name: 'Invoices', path: '/invoices', title: 'Invoices' },
  { name: 'Manage', path: '/manage', title: 'Manage' }
];

test.describe('Firestore Navigation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  pages.forEach(({ name, path, title }) => {
    test(`should navigate to ${name} page`, async ({ page }) => {
      console.log(`Testing navigation to ${name} (${path})`);
      
      // Click on the navigation link
      await page.click(`a[href="${path}"]`);
      
      // Wait for navigation
      await page.waitForURL(`http://localhost:5173${path}`);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await page.screenshot({ path: `navigation-${name.toLowerCase()}.png` });
      
      // Check URL
      expect(page.url()).toBe(`http://localhost:5173${path}`);
      
      // Check for error messages
      const errorAlert = await page.$('[role="alert"], .error, .chakra-alert');
      if (errorAlert) {
        const errorText = await errorAlert.textContent();
        console.error(`ERROR on ${name} page:`, errorText);
      }
      
      // Log any console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error(`Console error on ${name} page:`, msg.text());
        }
      });
      
      // Check for network errors
      page.on('response', response => {
        if (response.status() >= 400) {
          console.error(`Network error on ${name} page:`, {
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // Wait a bit to catch any delayed errors
      await page.waitForTimeout(1000);
      
      // Check page content
      const pageContent = await page.textContent('body');
      console.log(`${name} page loaded, content length: ${pageContent.length}`);
      
      // Verify no error text in the page
      expect(pageContent).not.toContain('Error');
      expect(pageContent).not.toContain('error');
      expect(pageContent).not.toContain('failed');
    });
  });

  test('should check all API endpoints', async ({ request, page }) => {
    // Get the auth token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    const endpoints = [
      { name: 'User info', url: '/api/v2/auth/me' },
      { name: 'Time entries', url: '/api/v2/time-entries' },
      { name: 'Projects', url: '/api/v2/projects' },
      { name: 'Clients', url: '/api/v2/clients' },
      { name: 'Users', url: '/api/v2/users' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`http://localhost:5001${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`${endpoint.name} - Status: ${response.status()}`);
        
        if (!response.ok()) {
          const body = await response.json();
          console.error(`${endpoint.name} - Error:`, body);
        }
      } catch (error) {
        console.error(`${endpoint.name} - Request failed:`, error);
      }
    }
  });
});