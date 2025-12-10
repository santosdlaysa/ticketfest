import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import DatabaseService from '../../config/database.js';

describe('API Health E2E Tests', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
    });

    it('should return health status object', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('OK');
    });

    it('should include uptime in response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('API Server', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route-12345');

      expect(response.status).toBe(404);
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      // Verifica se headers CORS estão presentes
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should accept JSON content type', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Database Health via API', () => {
    it('should have database connected', async () => {
      const isHealthy = await DatabaseService.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });
});
