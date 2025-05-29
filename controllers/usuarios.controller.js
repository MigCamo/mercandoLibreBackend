const { usuario, rol, Sequelize } = require('../models')
const db = require('../models');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

let self = {}

// GET: api/usuarios
self.getAll = async function (req, res, next) {
    try {
        const data = await db.usuario.findAll({
            raw: true,
            attributes: ['id', 'email', 'nombre', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        })
        res.status(200).json(data)
    } catch (error) {
        next(error)
    }
}

// GET: api/usuarios/email
self.get = async function (req, res, next) {
    try {
        const email = req.params.email

        if (!email?.trim()) {
            return res.status(400).json({ mensaje: "Datos inválidos: no se permiten campos vacíos o en blanco." });
        }

        const data = await db.usuario.findOne({
            where: { email: email },
            raw: true,
            attributes: ['id', 'email', 'nombre', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        })
        if (data)
            return res.status(200).json(data)
        res.status(404).send()
    } catch (error) {
        next(error)
    }
}

// POST: api/usuarios
self.create = async function (req, res, next) {
    try {
        const { email, password, nombre, rol } = req.body;

        if (!email?.trim() || !password?.trim() || !nombre?.trim() || !rol?.trim()) {
            return res.status(400).json({ mensaje: "Datos inválidos: no se permiten campos vacíos o en blanco." });
        }

        const rolusuario = await db.rol.findOne({ where: { nombre: rol } })

        if (!rolusuario) {
            return res.status(400).json({ mensaje: "Rol especificado no válido." })
        }

        const data = await db.usuario.create({
            id: crypto.randomUUID(),
            email,
            passwordhash: await bcrypt.hash(password, 10),
            nombre,
            rolid: rolusuario.id
        });

        req.bitacora("usuarios.crear", data.email);
        res.status(201).json({
            id: data.id,
            email: data.email,
            nombre: data.nombre,
            rolid: rolusuario.nombre
        });
    } catch (error) {
        next(error);
    }
};


// POST: api/usuarios/nuevocliente
self.createcustomer = async function (req, res, next) {
    try {
        const { email, password, nombre } = req.body;

        if (!email?.trim() || !password?.trim() || !nombre?.trim()) {
            return res.status(400).json({ mensaje: "Datos inválidos: no se permiten campos vacíos o en blanco." });
        }

        const rolusuario = await db.rol.findOne({ where: { nombre: 'Usuario' } })

        if (!rolusuario) {
            return res.status(400).json({ mensaje: "Rol especificado no válido." })
        }

        const data = await db.usuario.create({
            id: crypto.randomUUID(),
            email,
            passwordhash: await bcrypt.hash(password, 10),
            nombre,
            rolid: rolusuario.id
        });

        req.bitacora("usuarios.crear", data.email);
        res.status(201).json({
            id: data.id,
            email: data.email,
            nombre: data.nombre,
            rolid: rolusuario.nombre
        });
    } catch (error) {
        next(error);
    }
};

// PUT: api/usuarios/:email
self.update = async function (req, res, next) {
  try {
    const { email: paramEmail } = req.params;
    const { email, password, nombre, rol } = req.body;

    if (!email?.trim() || !password?.trim() || !nombre?.trim() || !rol?.trim()) {
      return res.status(400).json({ mensaje: "Datos inválidos: no se permiten campos vacíos o en blanco." });
    }

    const rolusuario = await db.rol.findOne({ where: { nombre: rol } });

    if (!rolusuario) {
      return res.status(400).json({ mensaje: "Rol especificado no válido." });
    }

    const usuarioActualizado = {
      email: email.trim(),
      passwordhash: await bcrypt.hash(password, 10),
      nombre: nombre.trim(),
      rolid: rolusuario.id
    };

    const resultado = await db.usuario.update(usuarioActualizado, {
      where: { email: paramEmail }
    });

    if (resultado[0] === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    req.bitacora("usuarios.editar", paramEmail);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
  

// DELETE: api/usuarios/email
self.delete = async function (req, res, next) {
    try {
        const email = req.params.email

        if (!email?.trim()) {
            return res.status(400).json({ mensaje: "Datos inválidos: no se permiten campos vacíos o en blanco." });
        }

        let data = await db.usuario.findOne({ where: { email: email } })
        // No se pueden eliminar usuarios protegidos
        if (data.protegido) return res.status(403).send()

        data = await db.usuario.destroy({ where: { email: email } })
        if (data === 1) {
            // Bitacora
            req.bitacora("usuarios.eliminar", email)
            return res.status(204).send() // Elemento eliminado
        }

        res.status(403).send()
    } catch (error) {
        next(error)
    }
}


module.exports = self
