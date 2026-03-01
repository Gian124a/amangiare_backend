import { Request, Response } from 'express';
import Client from '../models/Client.js';
import dolarService from '../services/dolarService.js';

export const createClient = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, identification, location, phoneNumber, balanceUSD } = req.body;

    // 1. Buscamos si ya existe la identificación O el teléfono
    // Usamos $or para hacer una sola consulta a la base de datos (más eficiente)
    const existingClient = await Client.findOne({ 
      $or: [
        { identification }, 
        { phoneNumber }
      ] 
    });

    if (existingClient) {
      // Determinamos cuál de los dos campos es el que está duplicado
      const isDuplicateID = existingClient.identification === identification;
      
      return res.status(400).json({
        ok: false,
        message: isDuplicateID 
          ? 'Ya existe un cliente con esa identificación' 
          : 'Este número de teléfono ya está registrado con otro cliente'
      });
    }

    // 2. Si todo está bien, creamos el cliente
    const newClient = new Client({
      firstName,
      lastName,
      identification,
      location,
      phoneNumber,
      balanceUSD
    });

    await newClient.save();

    res.status(201).json({
      ok: true,
      message: 'Cliente registrado exitosamente',
      client: newClient
    });

  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: 'Error al intentar registrar el cliente',
      error: error.message
    });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.searchTerm as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const allowedSortFields = ['firstName', 'lastName', 'identification', 'phoneNumber', 'balanceUSD', 'createdAt', 'location'];
    const sortBy = allowedSortFields.includes(req.query.sortBy as string) ? (req.query.sortBy as string) : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query: any = { isActive: true };
    if (searchTerm) {
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { identification: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total, bcvRate] = await Promise.all([
      Client.find(query).sort({ [sortBy]: sortOrder as any }).skip(skip).limit(limit),
      Client.countDocuments(query),
      dolarService.getBCVRate()
    ]);

    // --- AQUÍ ESTÁ EL CAMBIO DE ORDEN ---
    const clientsWithVES = clients.map(client => {
      const c = client.toObject();
      return {
        _id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        identification: c.identification,
        location: c.location,
        phoneNumber: c.phoneNumber,
        // Colocamos los balances juntos para que aparezcan uno tras otro
        balanceUSD: c.balanceUSD,
        balanceVES: Number((c.balanceUSD * bcvRate).toFixed(2)),
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        __v: c.__v
      };
    });

    const pageDebtUSD = clients.reduce((acc, c) => acc + c.balanceUSD, 0);
    const totalPages = Math.ceil(total / limit);

    res.json({
      ok: true,
      clients: clientsWithVES,
      exchange: {
        bcvRate,
        currency: 'VES'
      },
      stats: {
        pageTotalUSD: Number(pageDebtUSD.toFixed(2)),
        pageTotalVES: Number((pageDebtUSD * bcvRate).toFixed(2))
      },
      total,
      page,
      pages: totalPages,
      limit,
      searchTerm,
      sortBy,
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc'
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener la lista de clientes',
      error: error.message
    });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { identification, phoneNumber } = req.body;

    // 1. Verificación de Duplicados Cruzados
    // Solo hacemos la búsqueda si el usuario envió identificación o teléfono en el body
    if (identification || phoneNumber) {
      const duplicate = await Client.findOne({
        _id: { $ne: id }, // Buscamos en todos los clientes MENOS en el que estamos editando
        $or: [
          ...(identification ? [{ identification }] : []),
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      });

      if (duplicate) {
        const field = duplicate.identification === identification ? 'identificación' : 'número de teléfono';
        return res.status(400).json({
          ok: false,
          message: `No se puede actualizar: ya existe otro cliente con este ${field}`
        });
      }
    }

    // 2. Ejecutar la actualización
    const updatedClient = await Client.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Datos actualizados correctamente',
      client: updatedClient
    });

  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar los datos del cliente',
      error: error.message
    });
  }
};

// Actualizar el saldo (Abonos o Deudas nuevas)
export const updateClientBalance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });

    // REGLA: Si el monto es negativo (abono), no puede superar la deuda actual
    if (amount < 0 && Math.abs(amount) > client.balanceUSD) {
      return res.status(400).json({ 
        ok: false, 
        message: `Abono inválido. El cliente solo debe $${client.balanceUSD} y no se permite saldo a favor.` 
      });
    }

    client.balanceUSD += amount;
    await client.save();

    res.json({ ok: true, message: 'Saldo actualizado', newBalance: client.balanceUSD });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: 'Error al procesar el saldo', error: error.message });
  }
};

// --- BORRADO LÓGICO (Recomendado para no perder historial) ---
export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ ok: false, message: 'No encontrado' });

    // REGLA: Solo se desactiva si NO debe nada
    if (client.balanceUSD > 0) {
      return res.status(400).json({ 
        ok: false, 
        message: `No se puede desactivar: El cliente tiene una deuda pendiente de $${client.balanceUSD}` 
      });
    }

    client.isActive = false;
    await client.save();
    res.json({ ok: true, message: 'Cliente desactivado correctamente' });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Activar un cliente que estaba desactivado
export const activateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await Client.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ ok: false, message: 'Cliente no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Cliente reactivado correctamente',
      client
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: 'Error al intentar activar el cliente',
      error: error.message
    });
  }
};