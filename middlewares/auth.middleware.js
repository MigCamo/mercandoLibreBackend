const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_ACCESS_SECRET
const ClaimTypes = require('../config/claimtypes')
const { RecargarToken } = require('../services/jwttoken.service')
const activeSessions = require('../utils/sessionStore');


const Authorize = (rol) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.header('Authorization')

            const error = new Error('Acceso denegado');
            error.statusCode = 401;

            if (!authHeader.startsWith('Bearer ')) 
                return next(error);

            const token = authHeader.split(' ')[1]
            const decodedToken = jwt.verify(token, jwtSecret)

            const email = decodedToken[ClaimTypes.Name];
            

            //if (rol.split(',').indexOf(decodedToken[ClaimTypes.Role]) == -1 || activeSessions[email] !== decodedToken.sessionId)
                //return next(error);

            if (!rol.split(',').includes(decodedToken[ClaimTypes.Role]))
                return next(error);

            // Verificación de sesión
            if (activeSessions[email] !== decodedToken.sessionId)
                return next(error);


            req.decodedToken = decodedToken

            var minutosRestantes = (decodedToken.exp - (new Date().getTime() / 1000)) / 60;
            if (minutosRestantes < 5) {
                var nuevoToken = RecargarToken(decodedToken[ClaimTypes.Name], decodedToken[ClaimTypes.GivenName], decodedToken[ClaimTypes.Role], decodedToken.sessionId)
                res.header("Set-Authorization", nuevoToken)
            }

            next()
        } catch (error) {
            error.statusCode = 401
            next(error)
        }
    }
}


module.exports = Authorize
