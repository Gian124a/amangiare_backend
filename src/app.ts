// 1. Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config(); 

// 2. Importar el resto de dependencias
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import conectarDB from './config/db.js';

const app: Application = express();

// 3. Conectar a MongoDB (Ahora process.env.MONGO_URI ya tiene valor)
conectarDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta inicial para probar en el navegador
app.get('/', (req: Request, res: Response) => {
    res.json({ 
        ok: true, 
        mensaje: "API Amangiare Conectada 🍝",
        db_status: "Conectado a MongoDB Atlas"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en: http://localhost:${PORT}`);
});