import jwt from 'jsonwebtoken';
import { Category, ICategory } from '../models/categories';
import { INamespace, Namespace } from '../models/namespace';
import { IUser, User } from '../models/user';
import { TOKEN_EXPIRATION } from './constants';

interface TestUser {
  email?: string;
  password?: string;
  isCompleted?: boolean;
}

export const createUser = async ({
  email = 'test@test.com',
  password = 'Password123*',
  isCompleted = true,
}: TestUser): Promise<IUser> => {
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
