'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('producto', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      titulo: {
        type: Sequelize.STRING,
        defaultValue: "Sin titulo"
      },
      descripcion: {
        type: Sequelize.TEXT,
        defaultValue: "Sin descripcion"
      },
      precio: {
        type: Sequelize.DECIMAL(10,2)
      },
      cantidad: {
        type: Sequelize.INTEGER
      },
      archivoid: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'archivo',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('producto');
  }
};
