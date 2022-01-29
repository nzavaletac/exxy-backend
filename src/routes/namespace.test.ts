import req from 'supertest';
import { app } from '../app';
import { User, IUser } from '../models/user';
import { Namespace } from '../models/namespace';
import { cleanup, connect, disconnect } from '../database';

describe('namespaces', () => {
  let user: IUser;
  let token: string;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    const data = { email: 'test@test.com', password: 'Password123*' };
    user = await User.create({ email: data.email });
    const res = await req(app).post('/users/register').send(data);
    token = res.body.token;
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await disconnect();
  });

  test('namespaces delete logged user not owner', async () => {
    const user2 = await User.create({
      email: 'test2@test.com',
      password: 'Password123*',
    });
    const data = await Namespace.create({
      name: 'Namespace 1',
      user: user2._id,
    });

    const {
      statusCode,
      body: { message },
    } = await req(app)
      .delete(`/namespaces/${data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(403);
    expect(message).toMatch(/el espacio no pudo ser borrado/i);
  });

  test('namespaces delete logged user last namespace', async () => {
    const namespace = await Namespace.findOne({ user: user._id });

    if (!namespace) {
      throw new Error('namespace is null');
    }

    const {
      statusCode,
      body: { message },
    } = await req(app)
      .delete(`/namespaces/${namespace._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(400);
    expect(message).toMatch(
      /el espacio no pudo ser borrado. debes tener al menos un espacio/i
    );
  });

  test('namespaces delete logged user', async () => {
    const data = await Namespace.create({
      name: 'Namespace 1',
      user: user._id,
    });

    const {
      statusCode,
      body: { namespace, message },
    } = await req(app)
      .delete(`/namespaces/${data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(200);
    expect(namespace._id).toMatch(data._id.toString());
    expect(message).toMatch(/espacio borrado/i);
  });

  test('namespaces update validations', async () => {
    const namespace = await Namespace.create({
      name: 'Namespace 1',
      user: user._id,
    });
    const dataShort = { name: 'Name' };
    const dataLong = { name: 'Namespace test blah blah blah blah' };
    const dataExists = { name: 'Namespace 1' };

    const resShort = await req(app)
      .put(`/namespaces/${namespace._id}`)
      .send(dataShort)
      .set('Authorization', `Bearer ${token}`);
    const resLong = await req(app)
      .put(`/namespaces/${namespace._id}`)
      .send(dataLong)
      .set('Authorization', `Bearer ${token}`);
    const resExists = await req(app)
      .put(`/namespaces/${namespace._id}`)
      .send(dataExists)
      .set('Authorization', `Bearer ${token}`);
    const resNoName = await req(app)
      .put(`/namespaces/${namespace._id}`)
      .send({ name: '' })
      .set('Authorization', `Bearer ${token}`);

    expect(resShort.statusCode).toBe(400);
    expect(resShort.body.message).toMatch(
      /los espacios deben tener al menos 5 carácteres/i
    );
    expect(resLong.statusCode).toBe(400);
    expect(resLong.body.message).toMatch(
      /los espacios no deben tener más de 25 carácteres/i
    );
    expect(resExists.statusCode).toBe(400);
    expect(resExists.body.message).toMatch(/el espacio ya existe/i);
    expect(resNoName.statusCode).toBe(400);
    expect(resNoName.body.message).toMatch(
      /los espacios deben tener un nombre/i
    );
  });

  test('namespaces update not logged user', async () => {
    const namespace = await Namespace.create({
      name: 'Namespace 1',
      user: user._id,
    });

    const {
      statusCode,
      body: { message },
    } = await req(app)
      .put(`/namespaces/${namespace._id}`)
      .send({ name: 'New namespace name' });

    expect(statusCode).toBe(401);
    expect(message).toMatch(/su sesión expiró/i);
  });

  test('namespaces update logged user not owned namespace', async () => {
    const user2 = await User.create({
      email: 'test2@test.com',
      password: 'Password123*',
    });
    const namespace = await Namespace.create({
      name: 'Namespace 1',
      user: user2._id,
    });

    const {
      statusCode,
      body: { message },
    } = await req(app)
      .put(`/namespaces/${namespace._id}`)
      .send({ name: 'New namespace name' })
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(403);
    expect(message).toMatch(/el espacio no pudo ser actualizado/i);
  });

  test('namespaces update logged user', async () => {
    const data = await Namespace.create({
      name: 'Namespace 1',
      user: user._id,
    });

    const {
      statusCode,
      body: { namespace, message },
    } = await req(app)
      .put(`/namespaces/${data._id}`)
      .send({ name: 'New namespace name' })
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(200);
    expect(namespace._id.toString()).toMatch(data._id.toString());
    expect(namespace.name).toMatch(/new namespace name/i);
    expect(message).toMatch(/espacio actualizado/i);
  });

  test('namespaces read not logged user', async () => {
    const {
      statusCode,
      body: { message },
    } = await req(app).get('/namespaces').set('Authorization', 'Bearer ');

    expect(statusCode).toBe(401);
    expect(message).toMatch(/su sesión expiró/i);
  });

  test('namespaces read logged user', async () => {
    await Namespace.create({ name: 'Namespace 1', user: user._id });

    const {
      statusCode,
      body: { namespaces, message },
    } = await req(app)
      .get('/namespaces')
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(200);
    expect(namespaces).toHaveLength(2);
    expect(message).toMatch(/se encontr(aron|ó) \d+ espacio(s?)/i);
  });

  test('namespace create not logged user', async () => {
    const data = { name: 'Not logged user' };

    const {
      statusCode,
      body: { message },
    } = await req(app).post('/namespaces').send(data);

    expect(statusCode).toBe(401);
    expect(message).toMatch(/su sesión expiró/i);
  });

  test('namespace create invalid name', async () => {
    const dataShort = { name: 'Name' };
    const dataLong = { name: 'Namespace test blah blah blah blah' };
    const dataExists = { name: 'Namespace duplicate' };

    const resShort = await req(app)
      .post('/namespaces')
      .send(dataShort)
      .set('Authorization', `Bearer ${token}`);
    const resLong = await req(app)
      .post('/namespaces')
      .send(dataLong)
      .set('Authorization', `Bearer ${token}`);
    await req(app)
      .post('/namespaces')
      .send(dataExists)
      .set('Authorization', `Bearer ${token}`);
    const resExists = await req(app)
      .post('/namespaces')
      .send(dataExists)
      .set('Authorization', `Bearer ${token}`);
    const resNoName = await req(app)
      .post('/namespaces')
      .send({})
      .set('Authorization', `Bearer ${token}`);

    expect(resShort.statusCode).toBe(400);
    expect(resShort.body.message).toMatch(
      /los espacios deben tener al menos 5 carácteres/i
    );
    expect(resLong.statusCode).toBe(400);
    expect(resLong.body.message).toMatch(
      /los espacios no deben tener más de 25 carácteres/i
    );
    expect(resExists.statusCode).toBe(400);
    expect(resExists.body.message).toMatch(/el espacio ya existe/i);
    expect(resNoName.statusCode).toBe(400);
    expect(resNoName.body.message).toMatch(
      /los espacios deben tener un nombre/i
    );
  });

  test('namespace create correctly', async () => {
    const data = { name: 'Namespace test' };

    const {
      statusCode,
      body: { namespace, message },
    } = await req(app)
      .post('/namespaces')
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(statusCode).toBe(201);
    expect(namespace.name).toMatch(namespace.name);
    expect(namespace.user).toMatch(user._id.toString());
    expect(message).toMatch(/el espacio fue creado satisfactoriamente/i);
  });
});
