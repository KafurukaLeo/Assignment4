import type { Request, Response, NextFunction } from "express";

/**
 * deprecatev1 middleware
 * Adds deprecation headers to all v1 API responses.
 * This informs API clients (developers) that v1 is deprecated
 * and they should migrate to v2 before the sunset date.
 *
 * Headers added:
 * - Deprecation: true — signals that this API version is deprecated
 * - Sunset: the date when v1 will be shut down
 * - Link: points to the successor version (v2)
 *
 * Applied to all routes in v1Router (see routes/v1/index.ts)
 */
export function deprecatev1(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', "Fri, 01 May 2026 00:00:00 GMT");
  res.setHeader("Link", '</api/v2>; rel="successor-version"');
  next(); // Continue to the actual route handler
}
