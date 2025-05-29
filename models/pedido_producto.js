'use strict';
const { Model, DataTypes } = require('sequelize');
const Sequelize = require('sequelize');


module.exports = (sequelize) => {
    class pedido_producto extends Model {
        static associate(models) {
            pedido_producto.belongsTo(models.pedido);
            pedido_producto.belongsTo(models.producto);
        }
    }

    pedido_producto.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        pedidoid: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        productoid: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        preciounitario: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        sequelize,
        freezeTableName: true,
        modelName: 'pedido_producto',
    });

    return pedido_producto;
};
