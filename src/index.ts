

import express from 'express';
import "dotenv/config";
import userRoutes from './routes/users.routes.js'; 

const app = express();

app.use(express.json());

//  THIS is what "connect it to your server" means
app.use( "/users", userRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});