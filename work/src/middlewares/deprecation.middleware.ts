import type { Request, Response, NextFunction } from "express";

export function deprecatev1(req: Request, res: Response, next: NextFunction){
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', "Fri, 01 May 2026 00:00:00 GMT");
  res.setHeader("Link", '</api/v2>; rel="successor-version"');
  next();
}