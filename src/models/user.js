'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongTo(models.Allcode, { foreignKey: 'positionId', targeKey: 'keyMap', as: 'positionData' })
      User.belongTo(models.Allcode, { foreignKey: 'gender', targeKey: 'keyMap', as: 'genderData' })
      User.hasOne(models.Markdown, { foreignKey: 'doctoeId' })
    }
  };
  User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    address: DataTypes.STRING,
    phonenumber: DataTypes.STRING,
    gender: DataTypes.STRING,
    image: DataTypes.STRING,
    roleId: DataTypes.STRING,
    positionId: DataTypes.STRING,


  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};