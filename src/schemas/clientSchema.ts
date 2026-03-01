import { z } from 'zod';

// --- Reglas Reutilizables ---
const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/;
const idRegex = /^[VEJ]-\d{6,8}$/i;
const phoneRegex = /^\+58(412|414|416|424|426|422)\d{7}$/;

const nameMessage = 'Solo puede contener letras y espacios';
const phoneMessage = 'Formato: +58 seguido de prefijo (412, 424, etc.) y 7 dígitos';
const idMessage = 'Debe ser V-, E- o J- seguido de 6 a 8 números';

// --- Esquema de Registro ---
export const clientRegistrationSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .regex(nameRegex, nameMessage)
      .trim(),
    
    lastName: z.string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .regex(nameRegex, nameMessage)
      .trim(),
    
    identification: z.string()
      .regex(idRegex, idMessage)
      .trim(),
    
    location: z.string()
      .min(5, 'La dirección debe ser más detallada'),
    
    phoneNumber: z.string()
      .regex(phoneRegex, phoneMessage)
      .trim(),
    
    balanceUSD: z.number()
      .min(0, 'El saldo inicial no puede ser negativo')
      .default(0)
  }).strict()
});

// --- Esquema de Actualización ---
export const updateClientSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .regex(nameRegex, nameMessage)
      .trim()
      .optional(),
    
    lastName: z.string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .regex(nameRegex, nameMessage)
      .trim()
      .optional(),
    
    // Agregamos identificación por si necesitas editarla, también con su regex
    identification: z.string()
      .regex(idRegex, idMessage)
      .trim()
      .optional(),
    
    location: z.string()
      .min(5, 'La dirección debe ser más detallada')
      .optional(),
    
    phoneNumber: z.string()
      .regex(phoneRegex, phoneMessage)
      .trim()
      .optional(),
    
    isActive: z.boolean().optional(),
  }).strict()
});

export const updateBalanceSchema = z.object({
  body: z.object({
    amount: z
      .any() // Aceptamos la entrada
      .refine((val) => typeof val === 'number', "Debe ser un número") // Validamos tipo
      .refine((val) => val !== 0, "No puede ser cero") // Validamos lógica
  }).strict()
});