const jwt = require('jsonwebtoken')
const ClaimTypes = require('../config/claimtypes')
require('dotenv').config();

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET

const GeneraToken = (email, nombre, rol, sessionId) => {
    // Utilizamos los nombres de Claims estándar
    const token = jwt.sign({
        [ClaimTypes.Name]: email,
        [ClaimTypes.GivenName]: nombre,
        [ClaimTypes.Role]: rol,
        sessionId: sessionId,
        "iss": "ServidorFeiJWT",
        "aud": "ClientesFeiJWT"
    },
    jwtAccessSecret, {
        expiresIn: '1m',    // 20 minutos
    })
    return token;
}


const RecargarToken = (email, nombre, rol, sessionId) => {
    // Utilizamos los nombres de Claims estándar
    const token = jwt.sign({
        [ClaimTypes.Name]: email,
        [ClaimTypes.GivenName]: nombre,
        [ClaimTypes.Role]: rol,
        sessionId: sessionId,
        "iss": "ServidorFeiJWT",
        "aud": "ClientesFeiJWT"
    },
    jwtAccessSecret, {
        expiresIn: '10m',    // 20 minutos
    })
    return token;
}

const TiempoRestanteToken = (req) => {
    try {
        const authHeader = req.header('Authorization')
        // Obtiene el token de la solicitud
        const token = authHeader.split(' ')[1]
        // Verifica el token, si no es válido envía error y salta al catch
        const decodedToken = jwt.verify(token, jwtAccessSecret)

        // Regresa el tiempo restante en minutos
        const time = (decodedToken.exp - (new Date().getTime() / 1000))
        const minutos = Math.floor(time / 60)
        const segundos = Math.floor(time - minutos * 60)
        return "00:" + minutos.toString().padStart(2, "0") + ':' + segundos.toString().padStart(2, "0")
    } catch (error) {
        return null
    }
}

module.exports = { GeneraToken, TiempoRestanteToken, RecargarToken }
