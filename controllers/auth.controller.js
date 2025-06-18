const bcrypt = require('bcrypt')
const { usuario, rol, Sequelize } = require('../models')
const { GeneraToken, GeneraRefreshToken, TiempoRestanteToken } = require('../services/jwttoken.service')
const jwt = require('jsonwebtoken');
const ClaimTypes = require('../config/claimtypes')
const activeSessions = require('../utils/sessionStore');

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
        const { v4: uuidv4 } = require('uuid');
        const sessionId = uuidv4();
        const token = GeneraToken(data.email, data.nombre, data.rol, sessionId);
        activeSessions[data.email] = sessionId;

        // Bitácora
        req.bitacora("usuario.login", data.email)

        res
            .cookie()
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

// GET: api/auth/tiempo
self.tiempo = async function (req, res) {
    const tiempo = TiempoRestanteToken(req)
    if (tiempo == null)
        res.status(404).send()

    res.status(200).send(tiempo)
}

self.logout = async function (req, res) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.sendStatus(204); // No había token, sesión ya cerrada

    const decoded = jwt.decode(token);
    const email = decoded?.[ClaimTypes.Name];

    if (email && activeSessions[email]) {
        delete activeSessions[email]; // Elimina la sesión activa
    }

    res.clearCookie('refreshToken');
    res.sendStatus(200);
}

module.exports = self
