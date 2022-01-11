declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: number;
      SECRET: string;
      MONGO_URI: string;
    }
  }
}

export {};
