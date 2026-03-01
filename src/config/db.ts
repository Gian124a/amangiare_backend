import mongoose from 'mongoose';

/**
 * Establece la conexión con MongoDB Atlas
 */
const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI;

        // Validación de seguridad para la variable de entorno
        if (!mongoUri) {
            console.error('❌ Error: La variable MONGO_URI no está definida en el archivo .env');
            process.exit(1);
        }

        const conn = await mongoose.connect(mongoUri);
        
        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error de conexión a la base de datos: ${error.message}`);
        } else {
            console.error('❌ Ocurrió un error desconocido al conectar a MongoDB');
        }
        
        // Detiene la aplicación si la base de datos falla (es crítico)
        process.exit(1);
    }
};

export default connectDB;