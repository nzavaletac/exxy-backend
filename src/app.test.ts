import { app } from './app';
import req from 'supertest';

describe('app', () => {
  it('should start a server and work with sample request', async () => {
    const res = await req(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/app working correctly/i);
  });
});
