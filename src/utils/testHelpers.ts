import jwt from 'jsonwebtoken';
import { Category, ICategory } from '../models/categories';
import { INamespace, Namespace } from '../models/namespace';
import { IUser, User } from '../models/user';
import { Expense, IExpense } from '../models/expense';
import { TOKEN_EXPIRATION } from './constants';

interface TestUser {
  email?: string;
  password?: string;
  isCompleted?: boolean;
}

interface CreateUser {
  (user?: TestUser): Promise<IUser>;
}

export const createUser: CreateUser = async ({
  email = 'test@test.com',
  password = 'Password123*',
  isCompleted = true,
} = {}) => {
  return await User.create({ email, password, isCompleted });
};

export const generateToken = (user: IUser): string => {
  return jwt.sign({ userId: user._id }, process.env.SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });
};

interface TestNamespace {
  name?: string;
  user: IUser;
}

export const createNamespace = async ({
  name = 'Test Namespace',
  user,
}: TestNamespace): Promise<INamespace> => {
  return await Namespace.create({ name, user: user._id });
};

interface TestCategory {
  name?: string;
  namespace: INamespace;
}

export const createCategory = async ({
  name = 'Test Category',
  namespace,
}: TestCategory): Promise<ICategory> => {
  return await Category.create({ name, namespace: namespace._id });
};

interface TestExpense {
  merchant?: string;
  date?: Date;
  currency?: string;
  amount?: number;
  description?: string;
  category: ICategory;
}

export const createExpense = async ({
  merchant = 'Test Merchant',
  date = new Date(),
  currency = 'COP',
  amount = 10000,
  description = 'Test Description',
  category,
}: TestExpense): Promise<IExpense> => {
  return await Expense.create({
    merchant,
    date,
    currency,
    amount,
    description,
    category: category._id,
  });
};
