import type { Request, Response, NextFunction } from 'express';
export declare const cache: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const cacheHeaders: (duration: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const setCacheHeaders: (duration: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=catche.d.ts.map