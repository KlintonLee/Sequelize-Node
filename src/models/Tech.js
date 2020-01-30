const { Model, DataTypes } = require('sequelize');

class Tech extends Model {
  static init(sequelize) {
    super.init({
      name: DataTypes.STRING
    }, { sequelize, tableName: 'techs' });
    // Posso forçar o nome da table ser 'techs', por padrão ele pluralizou para teches.
  }

  static associate(models) {
    this.belongsToMany(models.User, { foreignKey: 'tech_id', through: 'user_techs', as: 'users' });
  }
}

module.exports = Tech;