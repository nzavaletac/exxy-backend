declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: number;
      SECRET: string;
      MONGO_URI: string;
    }
  }

  namespace Express {
    import { Request } from 'express';
    export interface Request {
      userId?: string;
    }
  }
}

declare module 'jsonwebtoken' {
  import * as jwt from 'jsonwebtoken';
  export interface UserIdJwtPayload extends jwt.JwtPayload {
    userId?: string;
  }
}

export {};
