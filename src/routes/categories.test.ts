import req from 'supertest';
import { app } from '../app';
import { connect, cleanup, disconnect } from '../database';
import { IUser } from '../models/user';
import { INamespace } from '../models/namespace';
// import { Category } from '../models/category';
import {
  createCategory,
  createNamespace,
  createUser,
  generateToken,
} from '../utils/testHelpers';

describe('categories', () => {
  let user: IUser;
  let namespace: INamespace;
  let token: string;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    user = await createUser({});
    token = generateToken(user);
    namespace = await createNamespace({ user });
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await disconnect();
  });

  test('create category successful', async () => {
    const data = { name: 'Category 1' };
    const res = await req(app)
      .post(`/namespaces/${namespace._id}/categories/`)
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(
      /la categoría fue creada satisfactoriamente/i
    );
    expect(res.body.category.name).toMatch(data.name);
    expect(res.body.category.namespace).toMatch(namespace._id.toString());
  });

  test('create category name validations', async () => {
    const dataTooShort = { name: 'name' };
    const dataTooLong = { name: 'A Very Long Category Name Blah' };
    const dataExists = { name: 'Already exists' };

    const resNoName = await req(app)
      .post(`/namespaces/${namespace._id}/categories`)
      .send({})
      .set('Authorization', `Bearer ${token}`);
    const resTooShort = await req(app)
      .post(`/namespaces/${namespace._id}/categories`)
      .send(dataTooShort)
      .set('Authorization', `Bearer ${token}`);
    const resTooLong = await req(app)
      .post(`/namespaces/${namespace._id}/categories`)
      .send(dataTooLong)
      .set('Authorization', `Bearer ${token}`);
    await req(app)
      .post(`/namespaces/${namespace._id}/categories`)
      .send(dataExists)
      .set('Authorization', `Bearer ${token}`);
    const resExists = await req(app)
      .post(`/namespaces/${namespace._id}/categories`)
      .send(dataExists)
      .set('Authorization', `Bearer ${token}`);

    expect(resNoName.statusCode).toBe(400);
    expect(resNoName.body.message).toMatch(
      /las categorías deben tener un nombre/i
    );
    expect(resTooShort.statusCode).toBe(400);
    expect(resTooShort.body.message).toMatch(
      /las categorías deben tener al menos 5 carácteres/i
    );
    expect(resTooLong.statusCode).toBe(400);
    expect(resTooLong.body.message).toMatch(
      /las categorías no deben tener más de 25 carácteres/i
    );
    expect(resExists.statusCode).toBe(400);
    expect(resExists.body.message).toMatch(/la categoría ya existe/i);
  });

  test('create category not authenticated', async () => {
    const data = { name: 'Category 1' };

    const res = await req(app)
      .post(`/namespaces/${namespace._id}/categories`)
      .send(data)
      .set('Authorization', '');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('create category not authorized', async () => {
    const user2 = await createUser({});
    const namespace2 = await createNamespace({ user: user2 });
    const data = { name: 'Category 1' };

    const res = await req(app)
      .post(`/namespaces/${namespace2._id}/categories`)
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/la categoría no pudo ser creada/i);
  });

  test('read categories successful', async () => {
    const resZero = await req(app)
      .get(`/namespaces/${namespace._id}/categories`)
      .set('Authorization', `Bearer ${token}`);

    expect(resZero.statusCode).toBe(200);
    expect(resZero.body.message).toMatch(/se encontraron 0 categorías/i);
    expect(resZero.body.categories).toHaveLength(0);

    await createCategory({ namespace });

    const resOne = await req(app)
      .get(`/namespaces/${namespace._id}/categories`)
      .set('Authorization', `Bearer ${token}`);

    expect(resOne.statusCode).toBe(200);
    expect(resOne.body.message).toMatch(/se encontró 1 categoría/i);
    expect(resOne.body.categories).toHaveLength(1);

    await createCategory({ name: 'Test category 2', namespace });

    const resMultiple = await req(app)
      .get(`/namespaces/${namespace._id}/categories`)
      .set('Authorization', `Bearer ${token}`);

    expect(resMultiple.statusCode).toBe(200);
    expect(resMultiple.body.message).toMatch(/se encontraron 2 categorías/i);
    expect(resMultiple.body.categories).toHaveLength(2);
  });

  test('read categories not logged user', async () => {
    const res = await req(app).get(`/namespaces/${namespace._id}/categories`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('read categories not owned namespace', async () => {
    const user2 = await createUser({});
    const namespace2 = await createNamespace({ user: user2 });

    const res = await req(app)
      .get(`/namespaces/${namespace2._id}/categories`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/no se pueden ver las categorías/i);
  });

  test('update category successful', async () => {
    const category = await createCategory({ namespace });
    const data = { name: 'New name' };

    const res = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(
      /la categoría fue actualizada satisfactoriamente/i
    );
    expect(res.body.category.name).toMatch(data.name);
  });

  test('update category name validations', async () => {
    const category = await createCategory({ namespace });

    const dataTooShort = { name: 'name' };
    const dataTooLong = { name: 'A Very Long Category Name Blah' };
    const dataExists = { name: 'Already Exists' };

    const resTooShort = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(dataTooShort)
      .set('Authorization', `Bearer ${token}`);
    const resTooLong = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(dataTooLong)
      .set('Authorization', `Bearer ${token}`);
    await createCategory({
      name: dataExists.name,
      namespace,
    });
    const resExists = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(dataExists)
      .set('Authorization', `Bearer ${token}`);

    expect(resTooShort.statusCode).toBe(400);
    expect(resTooShort.body.message).toMatch(
      /las categorías deben tener al menos 5 carácteres/i
    );
    expect(resTooLong.statusCode).toBe(400);
    expect(resTooLong.body.message).toMatch(
      /las categorías no deben tener más de 25 carácteres/i
    );
    expect(resExists.statusCode).toBe(400);
    expect(resExists.body.message).toMatch(/la categoría ya existe/i);
  });

  test('update category not logged user', async () => {
    const category = await createCategory({ namespace });
    const data = { name: 'New Category Name' };

    const res = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(data);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('update category not owned', async () => {
    const user2 = await createUser({});
    const namespace2 = await createNamespace({ user: user2 });
    const category = await createCategory({ namespace: namespace2 });
    const data = { name: 'New Category Name' };

    const res = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(data)
      .set('Authorization', `Bearer ${token}`);
    const res2 = await req(app)
      .put(`/namespaces/${namespace2._id}/categories/${category._id}`)
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/la categoría no pudo ser actualizada/i);
    expect(res2.statusCode).toBe(403);
    expect(res2.body.message).toMatch(/la categoría no pudo ser actualizada/i);
  });

  test('update category move to not owned namespace', async () => {
    const user2 = await createUser({});
    const namespace2 = await createNamespace({ user: user2._id });
    const category = await createCategory({ namespace });
    const data = { namespace: namespace2._id.toString() };

    const res = await req(app)
      .put(`/namespaces/${namespace._id}/categories/${category._id}`)
      .send(data)
      .set('Authorization', `Beare ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/la categoría no pudo ser actualizada/i);
  });

  test('delete category successful', async () => {
    const category = await createCategory({ namespace });

    const res = await req(app)
      .delete(`/namespaces/${namespace._id}/categories/${category._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(
      /la categoría fue borrada satisfactoriamente/i
    );
    expect(res.body.category._id).toMatch(category._id.toString());
  });

  test('delete category not logged user', async () => {
    const category = await createCategory({ namespace });

    const res = await req(app).delete(
      `/namespaces/${namespace._id}/categories/${category._id}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('delete category not owned', async () => {
    const user2 = await createUser({});
    const namespace2 = await createNamespace({ user: user2 });
    const category = await createCategory({ namespace: namespace2 });

    const res = await req(app)
      .delete(`/namespaces/${namespace._id}/categories/${category._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/la categoría no pudo ser borrada/i);
  });
});
