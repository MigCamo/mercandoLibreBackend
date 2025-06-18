const { pedido, pedido_producto, usuario, producto } = require('../models');

let self = {}

// GET: api/productos
self.getAll = async function (req, res, next) {
    try {
      const pedidos = await pedido.findAll({
        include: [
          { model: pedido_producto, include: [producto] },
          { model: usuario }
        ],
        order: [['fecha', 'DESC']]
      });
      res.json(pedidos);
    } catch (error) {
      next(error);
    }
}


// GET: api/productos/5
self.getByUsuario = async function (req, res, next) {
    try {
      
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({ mensaje: 'Datos inválidos' });
      }

      const usuarioObj = await usuario.findOne({
        where: { email },
        raw: true,
        attributes: ['id']
      });

      if (!usuarioObj) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const pedidos = await pedido.findAll({
        where: { usuarioid: usuarioObj.id },
        include: [{ model: pedido_producto, include: [producto] }],
        order: [['fecha', 'DESC']]
      });

      res.json(pedidos);

    } catch (error) {
      next(error);
    }
}

// POST: api/productos
self.create = async function (req, res, next) {
  try {
    const { email, productos } = req.body;

    // Validaciones básicas
    if (!email || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Datos inválidos' });
    }

    // Validar estructura de cada producto
    for (const item of productos) {
      if (!item.productoid || !item.cantidad || item.cantidad <= 0) {
        return res.status(400).json({ 
          mensaje: 'Cada producto debe tener productoid y cantidad válida (mayor que 0)' 
        });
      }
    }

    // Buscar usuario
    const idUser = await usuario.findOne({
      where: { email },
      raw: true,
      attributes: ['id']
    });

    if (!idUser) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const numeroproductos = productos.length;
    let costototal = 0;

    // Crear el pedido
    const nuevoPedido = await pedido.create({
      usuarioid: idUser.id,
      numeroproductos,
      costototal: 0,
    });

    // Procesar cada producto
    for (const item of productos) {
      const prod = await producto.findByPk(item.productoid);

      if (!prod) {
        return res.status(404).json({ 
          mensaje: `Producto con ID ${item.productoid} no encontrado` 
        });
      }

      // Verificar stock
      if (prod.cantidad < item.cantidad) {
        return res.status(400).json({ 
          mensaje: `No hay suficiente stock para el producto con ID ${item.productoid}. Solo hay disponibles ${prod.cantidad} unidades.` 
        });
      }

      const precio_unitario = parseFloat(prod.precio);
      const subtotal = parseFloat((item.cantidad * precio_unitario).toFixed(2));
      costototal = parseFloat((costototal + subtotal).toFixed(2));

      // Crear relación pedido-producto
      await pedido_producto.create({
        pedidoid: nuevoPedido.id,
        productoid: item.productoid,
        cantidad: item.cantidad,
        preciounitario: precio_unitario,
      });

      // Descontar stock del producto
      prod.cantidad -= item.cantidad;
      await prod.save();
    }

    // Actualizar costo total
    nuevoPedido.costototal = costototal;
    await nuevoPedido.save();

    res.status(201).json({
      mensaje: 'Pedido creado correctamente',
      pedido: nuevoPedido,
    });
  } catch (error) {
    next(error);
  }
}


/*
self.getDetalles = async function (req, res, next) {
    try {
      const { pedidoid } = req.params;

      const detalles = await pedido_producto.findAll({
        where: { pedidoid },
        include: [producto]
      });

      res.json(detalles);
    } catch (error) {
      next(error);
    }
}
*/


self.getDetalles = async function (req, res, next) {
  try {
    const { pedidoid } = req.params;

    // 1. Obtener el pedido
    const pedidoData = await pedido.findByPk(pedidoid);

    if (!pedidoData) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // 2. Obtener productos del pedido
    const detalles = await pedido_producto.findAll({
      where: { pedidoid },
      include: [producto]
    });

    // 3. Preparar productos con cantidad y precio unitario desde la tabla intermedia
    const productos = detalles.map(dp => {
      const p = dp.producto.toJSON(); // objeto plano
      p.cantidad = dp.cantidad;
      p.precio = dp.preciounitario;
      return p;
    });

    // 4. Enviar la respuesta
    res.json({
      pedido: pedidoData,
      productos
    });

  } catch (error) {
    next(error);
  }
}


module.exports = self
