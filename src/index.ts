import 'dotenv/config';
import app from './app.js';
import uploadRouter from './routes/upload.routes.js';

app.use('/api', uploadRouter);

const port = process.env.PORT || 3000;

app.listen(3000, () => {
  console.log('Listening on  http://localhost:3000');
});

export default app;

// import express from 'express';
// import userRoutes from './routes/user.routes.js'; // ⚠️ include .js

// const app = express();

// app.use(express.json());

// //  THIS is what "connect it to your server" means
// app.use(userRoutes);

// app.listen(3000, () => {
//   console.log('Server running on http://localhost:3000');
// });