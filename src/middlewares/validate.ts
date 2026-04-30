import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { AnyZodObject } from "zod/v3";

export  const validate = (schema: AnyZodObject) => {

(req: Request, res: Response, next: NextFunction) => {  
    try{
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();

    } catch(error){
       next(error);
    }
    }
};
