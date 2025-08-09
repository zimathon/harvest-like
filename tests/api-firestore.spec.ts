import { test, expect } from '@playwright/test';

let authToken: string;

test.describe('Firestore API Tests', () => {
  test.beforeAll(async ({ request }) => {
    // Login once and get token
    const loginResponse = await request.post('http://localhost:5001/api/v2/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test.describe('Users API', () => {
    test('GET /api/v2/users should return user list', async ({ request }) => {
      const response = await request.get('http://localhost:5001/api/v2/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('GET /api/v2/users/:id should return a specific user', async ({ request }) => {
      // First get the current user ID
      const meResponse = await request.get('http://localhost:5001/api/v2/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const meData = await meResponse.json();
      const userId = meData.data.id;

      // Then fetch that user
      const response = await request.get(`http://localhost:5001/api/v2/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(userId);
    });
  });

  test.describe.serial('Expenses API', () => {
    let expenseId: string;

    test('POST /api/v2/expenses should create a new expense', async ({ request }) => {
      const response = await request.post('http://localhost:5001/api/v2/expenses', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          description: 'Test expense',
          amount: 100.50,
          category: 'Travel',
          date: new Date().toISOString()
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.description).toBe('Test expense');
      expenseId = data.data.id;
    });

    test('GET /api/v2/expenses should return expense list', async ({ request }) => {
      const response = await request.get('http://localhost:5001/api/v2/expenses', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('PUT /api/v2/expenses/:id should update an expense', async ({ request }) => {
      const response = await request.put(`http://localhost:5001/api/v2/expenses/${expenseId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          description: 'Updated expense',
          amount: 150.75
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.description).toBe('Updated expense');
    });

    test('DELETE /api/v2/expenses/:id should delete an expense', async ({ request }) => {
      const response = await request.delete(`http://localhost:5001/api/v2/expenses/${expenseId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  test.describe.serial('Invoices API', () => {
    let invoiceId: string;

    test('POST /api/v2/invoices should create a new invoice', async ({ request }) => {
      // First create a client with unique email
      const timestamp = Date.now();
      const clientResponse = await request.post('http://localhost:5001/api/v2/clients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          name: `Test Client ${timestamp}`,
          email: `client-${timestamp}@test.com`
        }
      });
      expect(clientResponse.ok()).toBeTruthy();
      const clientData = await clientResponse.json();
      const clientId = clientData.data.id;

      // Then create invoice
      const response = await request.post('http://localhost:5001/api/v2/invoices', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          clientId: clientId,
          invoiceNumber: 'INV-001',
          items: [
            { description: 'Consulting', quantity: 10, rate: 100 }
          ],
          status: 'draft',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.invoiceNumber).toBe('INV-001');
      invoiceId = data.data.id;
    });

    test('GET /api/v2/invoices should return invoice list', async ({ request }) => {
      const response = await request.get('http://localhost:5001/api/v2/invoices', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('GET /api/v2/invoices/:id should return a specific invoice', async ({ request }) => {
      const response = await request.get(`http://localhost:5001/api/v2/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(invoiceId);
    });

    test('PUT /api/v2/invoices/:id should update an invoice', async ({ request }) => {
      const response = await request.put(`http://localhost:5001/api/v2/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        data: {
          status: 'sent'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('sent');
    });

    test('DELETE /api/v2/invoices/:id should delete an invoice', async ({ request }) => {
      const response = await request.delete(`http://localhost:5001/api/v2/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  test.describe('Reports API', () => {
    test('GET /api/v2/reports/summary should return report data', async ({ request }) => {
      const response = await request.get('http://localhost:5001/api/v2/reports/summary', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalHours');
      expect(data.data).toHaveProperty('totalRevenue');
      expect(data.data).toHaveProperty('totalExpenses');
    });

    test('GET /api/v2/reports/time-entries should return time entries report', async ({ request }) => {
      const response = await request.get('http://localhost:5001/api/v2/reports/time-entries', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});