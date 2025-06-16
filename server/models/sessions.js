const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./db');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  channel_name: {
    type: DataTypes.STRING(100), 
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true, 
      min: 0 
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.fn('NOW') 
  }
}, {
  tableName: 'sessions',
  timestamps: false,
  indexes: [
    { fields: ['channel_name'] }, 
    { fields: ['user_id'] } 
  ]
});

module.exports = Session;