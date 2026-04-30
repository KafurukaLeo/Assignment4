import { type Request, type Response } from "express";
export declare const getAllBookings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBookingById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserBookings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getListingBookings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createBooking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBooking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteBooking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBookingStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=bookings.controller.d.ts.map