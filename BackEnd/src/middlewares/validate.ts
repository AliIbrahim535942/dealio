/* factory function
// accepts a schema
// returns a function 
// the returned function calls parseAsync on the schema
// parseAsync will check the schems and
// 1. Parse : does the data matched the schema
// 2. Transform : convert from string -> numbers ,.. etc
// 3. Returns transformed data (clean) or throws a Zod Error to the Error handler
*/
import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError, ZodIssue } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace with validated data
      req.body = validated.body || req.body; // why ? because some schemas has only one
      req.query = validated.query || req.query; // value ,  not all of this
      req.params = validated.params || req.params; //

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(new AppError('Validation failed', 400, formattedErrors));
      }
      next(error);
    }
  };
};
