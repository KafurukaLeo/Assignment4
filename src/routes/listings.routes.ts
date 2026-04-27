import express from "express";

type Listing = {
  id: number;
  title: string;
  location: string;
  pricePerNight: number;
  guests: number;
};

const router = express.Router();

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
  title:"Spacious house with a pool",
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
}
];

// Get all listings
router.get("/", (req, res) => {
  res.json(listings);
});

export default router;