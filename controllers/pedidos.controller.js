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
      const { usuarioid } = req.params;

      const pedidos = await pedido.findAll({
        where: { usuarioid },
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
    const { usuarioid, productos } = req.body;

    if (!usuarioid || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Datos inválidos' });
    }

    let numeroproductos = productos.length;
    let costototal = 0;

    const nuevoPedido = await pedido.create({
      usuarioid,
      numeroproductos,
      costototal: 0, // se actualiza al final
    });

    for (const item of productos) {
      const prod = await producto.findByPk(item.productoid);

      if (!prod) {
        return res.status(404).json({ mensaje: `Producto con ID ${item.productoid} no encontrado` });
      }

      const precio_unitario = parseFloat(prod.precio);
      const subtotal = item.cantidad * precio_unitario;
      costototal += subtotal;

      await pedido_producto.create({
        pedidoid: nuevoPedido.id,
        productoid: item.productoid,
        cantidad: item.cantidad,
        preciounitario: precio_unitario,
      });
    }

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

//
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


module.exports = self
