import express from 'express';
import "dotenv/config";
const app = express();
app.use(express.json());
// Test route
app.get("/test", (req, res) => {
    console.log("Test route hit!");
    res.json({ message: "Test route works" });
});
// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date()
    });
});
export default app;
//# sourceMappingURL=app.js.map