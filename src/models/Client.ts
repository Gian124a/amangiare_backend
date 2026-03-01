import { Schema, model, Document } from 'mongoose';

export interface IClient extends Document {
  firstName: string;
  lastName: string;
  identification: string;
  location: string;
  phoneNumber: string;
  balanceUSD: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  firstName: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'], 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: [true, 'El apellido es obligatorio'], 
    trim: true 
  },
  identification: { 
    type: String, 
    required: [true, 'La identificación es obligatoria'], 
    unique: true,
    trim: true 
  },
  location: { 
    type: String, 
    required: [true, 'La ubicación es necesaria para el delivery'], 
    trim: true 
  },
  phoneNumber: { 
    type: String, 
    required: [true, 'El número de teléfono es obligatorio'],
    unique: true,
    trim: true 
  },
  balanceUSD: { 
    type: Number, 
    default: 0,
    min: [0, 'El saldo no puede ser negativo']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true 
});

// Índice para búsquedas rápidas en el buscador de la App
ClientSchema.index({ lastName: 1, firstName: 1 });

export default model<IClient>('Client', ClientSchema);