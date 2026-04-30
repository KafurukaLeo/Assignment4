import compression from 'compression';
import type { Request, Response, NextFunction } from 'express';

// Enable gzip compression
export const cache = compression();

// Optional: custom cache headers middleware
export const cacheHeaders = (duration: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.set('Cache-Control', `public, max-age=${duration}`);
        next();
    };
};

export const setCacheHeaders = cacheHeaders;
