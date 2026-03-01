import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// 1. Aquí definimos que 'validate' RECIBE un argumento (el esquema)
export const validate = (schema: z.ZodObject<any, any>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 2. Aquí usamos ese esquema para validar
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      return next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          message: 'Error de validación',
          errors: error.issues.map((issue) => ({
            field: issue.path[1] || issue.path[0], 
            message: issue.message
          })),
        });
      }

      return res.status(500).json({ 
        ok: false, 
        message: 'Error interno en la validación' 
      });
    }
};