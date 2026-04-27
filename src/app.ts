import express from 'express';
import "dotenv/config";
import userRoutes from "./routes/users.routes.js";

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.use('/users', userRoutes);
  
export default app;
