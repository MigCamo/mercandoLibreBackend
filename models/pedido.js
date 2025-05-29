'use strict';
const { Model } = require('sequelize');
const Sequelize = require('sequelize');


module.exports = (sequelize, DataTypes) => {
    class pedido extends Model {
        static associate(models) {
            pedido.belongsTo(models.usuario);
            pedido.hasMany(models.pedido_producto);
        }
    }

    pedido.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        usuarioid: {
            type: DataTypes.STRING,
            allowNull: true
        },
        fecha: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
        },
        costototal: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true
        },
        numeroproductos: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        freezeTableName: true,
        modelName: 'pedido',
    });

    return pedido;
};
