import mongoose from 'mongoose';

const conectarDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error de conexión: ${error.message}`);
        }
        process.exit(1); // Detiene la app si falla la base de datos
    }
};

export default conectarDB;