const router = require('express').Router()
const pedidos = require('../controllers/pedidos.controller')
const Authorize = require('../middlewares/auth.middleware')

router.post('/', Authorize('Usuario,Administrador'), pedidos.create)

router.get('/', Authorize('Administrador'), pedidos.getAll)

router.get('/:usuarioid', Authorize('Usuario'), pedidos.getByUsuario)

router.get('/detalles/:pedidoid', Authorize('Usuario,Administrador'), pedidos.getDetalles)


module.exports = router