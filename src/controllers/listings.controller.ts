import { type Request, type Response } from "express";

type Listing = {
  id: number;
  title: string;
  location: string;
  pricePerNight: number;
  guests: number;
};

const listings: Listing[] = [
  {
    id: 1,
    title: "Cozy apartment in the city center",
    location: "New York",
    pricePerNight: 150,
    guests: 4,
  },
  {
    id: 2,
    title: "Spacious house with a pool",
    location: "Los Angeles",
    pricePerNight: 400,
    guests: 10,
  },
  {
    id: 3,
    title: "Beachfront villa with stunning views",
    location: "Miami",
    pricePerNight: 600,
    guests: 12,
  },
];

//  Validation function
const validateListing = (data: any) => {
  const { title, location, pricePerNight, guests } = data;

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return "Title must be a string with at least 3 characters";
  }

  if (!location || typeof location !== "string") {
    return "Location is required and must be a string";
  }

  if (
    pricePerNight === undefined ||
    typeof pricePerNight !== "number" ||
    pricePerNight <= 0
  ) {
    return "Price must be a positive number";
  }

  if (
    guests === undefined ||
    typeof guests !== "number" ||
    guests <= 0
  ) {
    return "Guests must be a positive number";
  }

  return null;
};

//  Get all listings
export const getAllListings = (req: Request, res: Response) => {
  res.json(listings);
};

//  Get listing by ID
export const getListingById = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const listing = listings.find((item) => item.id === id);

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  res.json(listing);
};

//  POST new listing
export const createListing = (req: Request, res: Response) => {
  const error = validateListing(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const { title, location, pricePerNight, guests } = req.body;

  const newListing: Listing = {
    id: (listings.at(-1)?.id ?? 0) + 1,
    title,
    location,
    pricePerNight,
    guests,
  };

  listings.push(newListing);

  res.status(201).json(newListing);
};

//  PUT (update listing)
export const updateListing = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const index = listings.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const error = validateListing(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const { title, location, pricePerNight, guests } = req.body;

  listings[index] = {
    ...listings[index],
    id,
    title,
    location,
    pricePerNight,
    guests,
  };

  res.json(listings[index]);
};

//  DELETE listing
export const deleteListing = (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const index = listings.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const deleted = listings.splice(index, 1);

  res.json({
    message: "Listing deleted successfully",
    data: deleted[0],
  });
};