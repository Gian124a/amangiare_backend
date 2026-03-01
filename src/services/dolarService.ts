import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Estructura de la respuesta de DolarApi
interface DolarResponse {
  moneda: string;
  fuente: string;
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
}

class DolarService {
  private cachedRate: number | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hora de caché

  async getBCVRate(): Promise<number> {
    const now = Date.now();

    // Si tenemos la tasa en caché y no ha pasado una hora, la devolvemos
    if (this.cachedRate && (now - this.lastUpdate < this.CACHE_DURATION)) {
      return this.cachedRate;
    }

    try {
      // Consultamos la tasa oficial del BCV en DolarApi
      const { data } = await axios.get<DolarResponse>(process.env.DOLAR_API_URL || '');
      
      this.cachedRate = data.promedio || data.venta; // DolarApi suele usar 'promedio' o 'venta'
      this.lastUpdate = now;
      
      return this.cachedRate!;
    } catch (error) {
      console.error('Error al obtener tasa del BCV:', error);
      // Si falla la API, devolvemos una tasa guardada o lanzamos error
      return this.cachedRate || 54.50; // Tasa de auxilio por si el internet falla
    }
  }
}

export default new DolarService();