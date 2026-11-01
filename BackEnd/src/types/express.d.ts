import type { JwtPayload } from '../services/customer.service';

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer: Buffer;
      }
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
    files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    file?: Express.Multer.File;
  }
}
