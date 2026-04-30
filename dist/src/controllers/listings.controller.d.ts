import { type Request, type Response } from "express";
export declare const getAllListings: (req: Request, res: Response) => void;
export declare const getListingById: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const createListing: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const updateListing: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const deleteListing: (req: Request, res: Response) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=listings.controller.d.ts.map