import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Airbnb API",
      version: "1.0.0",
      description: "Airbnb API",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Local server",
      },
      {
        url: "https://your-app.onrender.com/api/v1",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The auto-generated id of the user",
              example: "cm7p6vx4x0000vswe5g7h5k9q",
            },
            name: {
              type: "string",
              description: "The name of the user",
              example: "John Doe",
            },
            email: {
              type: "string",
              description: "The email of the user",
              example: "john@example.com",
            },
            username: {
              type: "string",
              description: "The username of the user",
              example: "johndoe",
            },
            phone: {
              type: "string",
              nullable: true,
              description: "The phone number of the user",
              example: "+1234567890",
            },
            role: {
              type: "string",
              enum: ["host", "guest"],
              description: "The role of the user",
              example: "guest",
            },
            avatar: {
              type: "string",
              nullable: true,
              description: "The avatar URL of the user",
              example: "https://example.com/avatar.jpg",
            },
            bio: {
              type: "string",
              nullable: true,
              description: "The bio of the user",
              example: "Travel enthusiast",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
              example: "2024-01-15T10:30:00Z",
            },
          },
        },
        Listing: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The auto-generated id of the listing",
              example: "cm7p6vx4x0001vswe5g7h5k9r",
            },
            title: {
              type: "string",
              description: "The title of the listing",
              example: "Beachfront Villa",
            },
            description: {
              type: "string",
              description: "The description of the listing",
              example: "Beautiful villa with ocean view",
            },
            location: {
              type: "string",
              description: "The location of the listing",
              example: "Miami Beach, Florida",
            },
            pricePerNight: {
              type: "number",
              description: "The price per night",
              example: 299,
            },
            guests: {
              type: "integer",
              description: "Maximum number of guests",
              example: 6,
            },
            type: {
              type: "string",
              enum: ["apartment", "house", "villa", "cabin"],
              description: "The type of listing",
              example: "villa",
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              description: "List of amenities",
              example: ["WiFi", "Pool", "Kitchen"],
            },
            photos: {
              type: "array",
              items: { type: "string" },
              description: "List of photo URLs",
              example: ["https://example.com/photo1.jpg"],
            },
            rating: {
              type: "number",
              nullable: true,
              description: "The average rating",
              example: 4.8,
            },
            hostId: {
              type: "string",
              description: "The ID of the host",
              example: "cm7p6vx4x0000vswe5g7h5k9q",
            },
            host: { $ref: "#/components/schemas/User" },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
              example: "2024-01-15T10:30:00Z",
            },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The auto-generated id of the booking",
              example: "cm7p6vx4x0002vswe5g7h5k9s",
            },
            checkIn: {
              type: "string",
              format: "date-time",
              description: "Check-in date",
              example: "2024-12-25T15:00:00Z",
            },
            checkOut: {
              type: "string",
              format: "date-time",
              description: "Check-out date",
              example: "2024-12-30T11:00:00Z",
            },
            totalPrice: {
              type: "number",
              description: "Total price of the booking",
              example: 1495,
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled"],
              description: "Booking status",
              example: "confirmed",
            },
            guestId: {
              type: "string",
              description: "The ID of the guest",
              example: "cm7p6vx4x0000vswe5g7h5k9q",
            },
            listingId: {
              type: "string",
              description: "The ID of the listing",
              example: "cm7p6vx4x0001vswe5g7h5k9r",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
              example: "2024-11-20T08:00:00Z",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
              example: "Resource not found",
            },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["name", "email", "username", "password", "role"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            username: { type: "string", example: "johndoe" },
            phone: { type: "string", example: "+1234567890" },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
            role: { type: "string", enum: ["host", "guest"], example: "guest" },
            avatar: {
              type: "string",
              format: "binary",
              description: "Profile picture",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT token",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        CreateListingInput: {
          type: "object",
          required: [
            "title",
            "description",
            "location",
            "pricePerNight",
            "guests",
            "type",
          ],
          properties: {
            title: { type: "string", example: "Beachfront Villa" },
            description: {
              type: "string",
              example: "Beautiful villa with ocean view",
            },
            location: { type: "string", example: "Miami Beach" },
            pricePerNight: { type: "number", example: 299 },
            guests: { type: "integer", example: 6 },
            type: {
              type: "string",
              enum: ["apartment", "house", "villa", "cabin"],
              example: "villa",
            },
            amenities: {
              type: "array",
              items: { type: "string" },
              example: ["WiFi", "Pool", "Kitchen"],
            },
            photos: {
              type: "array",
              items: { type: "string", format: "binary" },
              description: "Listing photos",
            },
          },
        },
        CreateBookingInput: {
          type: "object",
          required: ["listingId", "checkIn", "checkOut"],
          properties: {
            listingId: { type: "string", example: "cm7p6vx4x0001vswe5g7h5k9r" },
            checkIn: { type: "string", format: "date", example: "2024-12-25" },
            checkOut: { type: "string", format: "date", example: "2024-12-30" },
          },
        },
        UpdateProfileInput: {
          type: "object",
          properties: {
            name: { type: "string", example: "John Updated" },
            phone: { type: "string", example: "+9876543210" },
            bio: {
              type: "string",
              example: "Love traveling and exploring new places",
            },
            avatar: {
              type: "string",
              format: "binary",
              description: "Profile picture",
            },
          },
        },
        ChangePasswordInput: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              format: "password",
              example: "oldpassword123",
            },
            newPassword: {
              type: "string",
              format: "password",
              example: "newpassword123",
            },
          },
        },
        ForgotPasswordInput: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", example: "john@example.com" },
          },
        },
        ResetPasswordInput: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string", example: "reset-token-12345" },
            newPassword: {
              type: "string",
              format: "password",
              example: "newpassword123",
            },
          },
        },
        VerifyOtpInput: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            otp: { type: "string", example: "123456" },
          },
        },
        CreateReviewInput: {
          type: "object",
          required: ["userId", "listingId", "rating"],
          properties: {
            userId: { type: "number", example: 1 },
            listingId: { type: "number", example: 1 },
            rating: { type: "number", example: 4.5 },
            comment: { type: "string", example: "Great place to stay!" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The auto-generated id of the review",
              example: 1,
            },
            rating: {
              type: "number",
              description: "The rating of the review (1-5)",
              example: 4.5,
            },
            comment: {
              type: "string",
              description: "The comment of the review",
              example: "Great place to stay!",
            },
            userId: {
              type: "number",
              description: "The ID of the user who wrote the review",
              example: 1,
            },
            listingId: {
              type: "number",
              description: "The ID of the listing being reviewed",
              example: 1,
            },
            user: { $ref: "#/components/schemas/User" },
            listing: { $ref: "#/components/schemas/Listing" },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
              example: "2024-01-15T10:30:00Z",
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/v1/auth.routes.ts",
    "./src/routes/v1/users.routes.ts",
    "./src/routes/v1/bookings.routes.ts",
    "./src/routes/v1/listings.routes.ts",
    "./src/routes/v1/reviews.routes.ts",
    "./src/routes/v1/upload.routes.ts",
  ],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  const router = swaggerUi.serve;
  app.use("/api-docs", router, swaggerUi.setup(specs));

  app.get("/api-docs.json", (req: any, res: any) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.log("Swagger docs available at http://localhost:5000/api-docs");
};
