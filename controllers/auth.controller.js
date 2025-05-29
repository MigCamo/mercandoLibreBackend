const bcrypt = require('bcrypt')
const { usuario, rol, Sequelize } = require('../models')
const { GeneraToken, GeneraRefreshToken, TiempoRestanteToken } = require('../services/jwttoken.service')
const jwt = require('jsonwebtoken');

let self = {}

// POST: api/auth
self.login = async function (req, res, next) {
    const { email, password } = req.body

    try {
        let data = await usuario.findOne({
            where: { email: email },
            raw: true,
            attributes: ['id', 'email', 'nombre', 'passwordhash', [Sequelize.col('rol.nombre'), 'rol']],
            include: { model: rol, attributes: [] }
        })

        if (data === null)
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' })

        // Se compara la contraseña vs el hash almacenado
        const passwordMatch = await bcrypt.compare(password, data.passwordhash)
        if (!passwordMatch)
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' })

        // Utilizamos los nombres de Claims estándar
        const token = GeneraToken(data.email, data.nombre, data.rol)
        const refreshToken = GeneraRefreshToken(data.email)

        await usuario.update({ refreshToken }, { where: { email } })

        // Bitácora
        req.bitacora("usuario.login", data.email)

        res
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .status(200)
            .json({
                email: data.email,
                nombre: data.nombre,
                rol: data.rol,
                jwt: token
            })

    } catch (error) {
        next(error)
    }
}

// POST: api/auth/refresh
self.refresh = async function (req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(401).json({ mensaje: 'No se proporcionó refresh token.' })
    }

    let payload
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    } catch (err) {
      return res.status(403).json({ mensaje: 'Refresh token inválido o expirado.' })
    }

    const user = await usuario.findOne({
      where: { email: payload.email },
      raw: true,
      attributes: [
        'email',
        'nombre',
        'refreshToken',
        [Sequelize.col('rol.nombre'), 'rol']
      ],
      include: {
        model: rol,
        attributes: []
      }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ mensaje: 'Refresh token no coincide.' })
    }

    const newAccessToken = RecargarToken(user.email, user.nombre, user.rol)
    const newRefreshToken = GeneraRefreshToken(user.email)
    await usuario.update({ refreshToken: newRefreshToken }, { where: { email: user.email } })

    res
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({ accessToken: newAccessToken })

  } catch (error) {
    next(error)
  }
}

// GET: api/auth/tiempo
self.tiempo = async function (req, res) {
    const tiempo = TiempoRestanteToken(req)
    if (tiempo == null)
        res.status(404).send()

    res.status(200).send(tiempo)
}

self.logout = async function (req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const payload = jwt.decode(refreshToken);
      await Usuario.update({ refreshToken: null }, { where: { id: payload.id } });
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Sesión cerrada' });
}

module.exports = self
