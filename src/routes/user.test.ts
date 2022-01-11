import { User } from '../models/user';
import { connect, disconnect, cleanup } from '../database';
import { app } from '../app';
import req from 'supertest';

describe('user', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await disconnect();
  });

  test('complete registration invalid password error', async () => {
    const userInvalidLength = { email: 'test1@test.com', password: 'Pass1*' };
    const userInvalidSymbols = {
      email: 'test2@test.com',
      password: 'Password123',
    };
    const userInvalidNumbers = {
      email: 'test3@test.com',
      password: 'Password*',
    };
    const userInvalidUppercase = {
      email: 'test4@test.com',
      password: 'password123*',
    };

    await User.create({ email: userInvalidLength.email });
    await User.create({ email: userInvalidSymbols.email });
    await User.create({ email: userInvalidNumbers.email });
    await User.create({ email: userInvalidUppercase.email });

    const resInvalidLength = await req(app)
      .post('/users/register')
      .send(userInvalidLength);
    const resInvalidSymbols = await req(app)
      .post('/users/register')
      .send(userInvalidSymbols);
    const resInvalidNumbers = await req(app)
      .post('/users/register')
      .send(userInvalidNumbers);
    const resInvalidUppercase = await req(app)
      .post('/users/register')
      .send(userInvalidUppercase);

    expect(resInvalidLength.statusCode).toBe(400);
    expect(resInvalidSymbols.statusCode).toBe(400);
    expect(resInvalidNumbers.statusCode).toBe(400);
    expect(resInvalidUppercase.statusCode).toBe(400);
    expect(resInvalidLength.body.message).toMatch(/contraseña inválida/i);
    expect(resInvalidSymbols.body.message).toMatch(/contraseña inválida/i);
    expect(resInvalidNumbers.body.message).toMatch(/contraseña inválida/i);
    expect(resInvalidUppercase.body.message).toMatch(/contraseña inválida/i);
  });

  test('complete registration email does not exist error', async () => {
    const user = { email: 'test@test.com', password: 'Password123*' };

    await req(app).post('/users/register').send(user);
    const res = await req(app).post('/users/register').send(user);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/el registro no pudo ser completado/i);
  });

  test('complete registration already exists error', async () => {
    const user = { email: 'test@test.com', password: 'Password123*' };

    await User.create({ email: user.email });

    await req(app).post('/users/register').send(user);
    const res = await req(app).post('/users/register').send(user);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(
      /este usuario ya completó su registro previamente/i
    );
  });

  test('complete registration success', async () => {
    const user = { email: 'test@test.com', password: 'Password123*' };

    await User.create({ email: user.email });

    const res = await req(app).post('/users/register').send(user);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(
      /el registro se ha completado satisfactoriamente/i
    );
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toMatch(
      /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/
    );
  });
});
