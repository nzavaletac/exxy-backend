import req from 'supertest';
import endOfTomorrow from 'date-fns/endOfTomorrow';
import isToday from 'date-fns/isToday';
import parseISO from 'date-fns/parseISO';
import { app } from '../app';
import { connect, disconnect, cleanup } from '../database';
import { IUser } from '../models/user';
import { INamespace } from '../models/namespace';
import { ICategory } from '../models/categories';
import {
  createUser,
  generateToken,
  createNamespace,
  createCategory,
  createExpense,
} from '../utils/testHelpers';

describe('expenses', () => {
  let user: IUser;
  let token: string;
  let namespace: INamespace;
  let category: ICategory;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    user = await createUser();
    token = generateToken(user);
    namespace = await createNamespace({ user });
    category = await createCategory({ namespace });
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await disconnect();
  });

  test('create expense successful', async () => {
    const data = {
      merchant: 'merchant 1',
      date: new Date(),
      currency: 'COP',
      amount: 1000,
      description: 'test description',
    };

    const res = await req(app)
      .post(`/namespaces/${namespace._id}/categories/${category._id}/expenses`)
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/el gasto fue creado satisfactoriamente/i);
    expect(res.body).toHaveProperty('expense');
  });

  const expense = {
    merchant: 'merchant 1',
    date: new Date(),
    currency: 'COP',
    amount: 1000,
    description: 'test description',
  };
  const updateValidationCases = [
    {
      test: 'merchant too short',
      data: { ...expense, merchant: new Array(4).join('a') },
      expectedStatus: 400,
      expectedMessage: 'El comerciante debe tener al menos 5 carácteres',
    },
    {
      test: 'merchant too long',
      data: { ...expense, merchant: new Array(52).join('a') },
      expectedStatus: 400,
      expectedMessage: 'El comerciante no debe tener más de 50 carácteres',
    },
    {
      test: 'date cannot be in the future',
      data: { ...expense, date: endOfTomorrow() },
      expectedStatus: 400,
      expectedMessage: 'Los gastos no deben ser futuros',
    },
    {
      test: 'currency enum',
      data: { ...expense, currency: 'AUD' },
      expectedStatus: 400,
      expectedMessage: 'La moneda debe ser COP ó USD',
    },
    {
      test: 'description too long',
      data: { ...expense, description: new Array(257).join('a') },
      expectedStatus: 400,
      expectedMessage: 'La descripción no debe tener más de 255 carácteres',
    },
  ];

  const createValidationCases = [
    ...updateValidationCases,
    {
      test: 'merchant is required',
      data: { ...expense, merchant: undefined },
      expectedStatus: 400,
      expectedMessage: 'Los gastos deben tener un comerciante',
    },
  ];
  test.each(createValidationCases)(
    'create expense $test validation errors',
    async ({ data, expectedStatus, expectedMessage }) => {
      const res = await req(app)
        .post(
          `/namespaces/${namespace._id}/categories/${category._id}/expenses`
        )
        .send(data)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(expectedStatus);
      expect(res.body.message).toMatch(new RegExp(expectedMessage, 'i'));
    }
  );

  const defaultCases = [
    {
      test: 'email',
      data: { ...expense, date: undefined },
      expectedField: 'date',
      expectedValue: (date: string) => {
        return isToday(parseISO(date));
      },
    },
    {
      test: 'currency',
      data: { ...expense, currency: undefined },
      expectedField: 'currency',
      expectedValue: 'COP',
    },
    {
      test: 'amount',
      data: { ...expense, amount: undefined },
      expectedField: 'amount',
      expectedValue: 0,
    },
    {
      test: 'description',
      data: { ...expense, description: undefined },
      expectedField: 'description',
      expectedValue: '',
    },
  ];
  test.each(defaultCases)(
    'create expense $test default value',
    async ({ data, expectedField, expectedValue }) => {
      const res = await req(app)
        .post(
          `/namespaces/${namespace._id}/categories/${category._id}/expenses`
        )
        .send(data)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(201);
      if (typeof expectedValue === 'function') {
        expect(expectedValue(res.body.expense[expectedField])).toBeTruthy();
        return;
      }
      expect(res.body.expense[expectedField]).toBe(expectedValue);
    }
  );

  test('create expense not logged user', async () => {
    const data = {
      merchant: 'merchant 1',
      date: new Date(),
      currency: 'COP',
      amount: 1000,
      description: 'test description',
    };
    const res = await req(app)
      .post(`/namespaces/${namespace._id}/categories/${category._id}/expenses`)
      .send(data);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  async function createNotOwnedData() {
    const owner = {
      token,
      namespaceId: namespace._id,
      categoryId: category._id,
    };
    const user2 = await createUser();
    const token2 = generateToken(user2);
    const namespace2 = await createNamespace({ user: user2 });
    const category2 = await createCategory({ namespace: namespace2 });

    return [
      { ...owner, token: token2 },
      { ...owner, namespaceId: namespace2._id },
      { ...owner, categoryId: category2._id },
    ];
  }
  test('create expense not owned namespace or category', async () => {
    const notOwned = await createNotOwnedData();
    const data = {
      merchant: 'merchant 1',
      date: new Date(),
      currency: 'COP',
      amount: 1000,
      description: 'test description',
    };
    notOwned.forEach(async ({ token, namespaceId, categoryId }) => {
      const res = await req(app)
        .post(`/namespaces/${namespaceId}/categories/${categoryId}/expenses`)
        .send(data)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/el gasto no pudo ser creado/i);
    });
  });

  test.each([
    { numExpenses: 0, message: 'se encontraron 0 gastos' },
    { numExpenses: 1, message: 'se encontró 1 gasto' },
    { numExpenses: 2, message: 'se encontraron 2 gastos' },
  ])('list expenses logged user', async ({ numExpenses, message }) => {
    Array(numExpenses)
      .fill(0)
      .forEach(async (_, i) => {
        await createExpense({ merchant: `Merchant_${i}`, category });
      });
    const res = await req(app)
      .get(`/namespaces/${namespace._id}/categories/${category._id}/expenses`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(new RegExp(message, 'i'));
    expect(res.body.expenses).toHaveLength(numExpenses);
  });

  test('list expenses not logged user', async () => {
    const res = await req(app).get(
      `/namespaces/${namespace._id}/categories/${category._id}/expenses`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('list expenses not owned namespace or category', async () => {
    const notOwned = await createNotOwnedData();
    notOwned.forEach(async ({ token, namespaceId, categoryId }) => {
      const res = await req(app)
        .get(`/namespaces/${namespaceId}/categories/${categoryId}/expenses`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/no se pueden ver los gastos/i);
    });
  });

  test('show expense logged user', async () => {
    const expense = await createExpense({ category });
    const res = await req(app)
      .get(
        `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/se encontró 1 gasto/i);
    expect(res.body.expense._id).toMatch(expense._id.toString());
  });

  test('show expense not logged user', async () => {
    const expense = await createExpense({ category });
    const res = await req(app).get(
      `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  async function createNotOwnedDataWithExpense() {
    const expense = await createExpense({ category });
    const owner = {
      token,
      namespaceId: namespace._id,
      categoryId: category._id,
      expenseId: expense._id,
    };
    const user2 = await createUser();
    const token2 = generateToken(user2);
    const namespace2 = await createNamespace({ user: user2 });
    const category2 = await createCategory({ namespace: namespace2 });
    const expense2 = await createExpense({ category: category2 });

    return [
      { ...owner, token: token2 },
      { ...owner, namespaceId: namespace2._id },
      { ...owner, categoryId: category2._id },
      { ...owner, expenseId: expense2._id },
    ];
  }
  test('show expense not owned namespace, category, or expense', async () => {
    const notOwned = await createNotOwnedDataWithExpense();
    notOwned.forEach(async ({ token, namespaceId, categoryId, expenseId }) => {
      const res = await req(app)
        .get(
          `/namespaces/${namespaceId}/categories/${categoryId}/expenses/${expenseId}`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/no se puede ver el gasto/i);
    });
  });

  test('update expense logged user', async () => {
    const expense = await createExpense({ category });
    const data = {
      merchant: 'new merchant',
      date: new Date(),
      currency: 'USD',
      amount: 10000,
      description: 'new test description',
    };
    const res = await req(app)
      .put(
        `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
      )
      .send(data)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(
      /el gasto fue actualizado satisfactoriamente/i
    );
    expect(res.body.expense._id).toMatch(expense._id.toString());
  });

  test.each(updateValidationCases)(
    'update expense $test validation errors',
    async ({ data, expectedStatus, expectedMessage }) => {
      const expense = await createExpense({ category });
      const res = await req(app)
        .put(
          `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
        )
        .send(data)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(expectedStatus);
      expect(res.body.message).toMatch(new RegExp(expectedMessage, 'i'));
    }
  );

  test('update expense not logged user', async () => {
    const expense = await createExpense({ category });
    const data = {
      merchant: 'new merchant',
      date: new Date(),
      currency: 'USD',
      amount: 10000,
      description: 'new test description',
    };
    const res = await req(app)
      .put(
        `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
      )
      .send(data);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('update expense not owned namespace, category, or expense', async () => {
    const notOwned = await createNotOwnedDataWithExpense();
    const data = {
      merchant: 'new merchant',
      date: new Date(),
      currency: 'USD',
      amount: 10000,
      description: 'new test description',
    };
    notOwned.forEach(async ({ token, namespaceId, categoryId, expenseId }) => {
      const res = await req(app)
        .put(
          `/namespaces/${namespaceId}/categories/${categoryId}/expenses/${expenseId}`
        )
        .send(data)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/el gasto no pudo ser actualizado/i);
    });
  });

  test('delete expense logged user', async () => {
    const expense = await createExpense({ category });
    const res = await req(app)
      .delete(
        `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(
      /el gasto fue eliminado satisfactoriamente/i
    );
    expect(res.body.expense._id).toMatch(expense._id.toString());
  });

  test('delete expense not logged user', async () => {
    const expense = await createExpense({ category });
    const res = await req(app).delete(
      `/namespaces/${namespace._id}/categories/${category._id}/expenses/${expense._id}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/su sesión expiró/i);
  });

  test('delete expense not owned namespace, category, or expense', async () => {
    const notOwned = await createNotOwnedDataWithExpense();
    notOwned.forEach(async ({ token, namespaceId, categoryId, expenseId }) => {
      const res = await req(app)
        .delete(
          `/namespaces/${namespaceId}/categories/${categoryId}/expenses/${expenseId}`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/el gasto no pudo ser eliminado/i);
    });
  });
});
