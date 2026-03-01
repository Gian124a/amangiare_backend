import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import clientRoutes from './routes/clientRoutes.js';

dotenv.config();
const app: Application = express();

connectDB();

app.use(cors());
app.use(express.json());

// Registro de rutas
app.use('/api/clients', clientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Amangiare Server: http://localhost:${PORT}`);
});