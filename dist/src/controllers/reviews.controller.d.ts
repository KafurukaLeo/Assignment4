import type { Request, Response } from "express";
export declare const createReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getReviews: (req: Request, res: Response) => Promise<void>;
export declare const getReviewById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=reviews.controller.d.ts.map