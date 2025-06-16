require('dotenv').config();

const commonConfig = {
  username: process.env.SEQUELIZE_USER,
  password: process.env.SEQUELIZE_PASSWORD,
  database: process.env.SEQUELIZE_DATABASE,
  host: process.env.SEQUELIZE_HOST,
  dialect: process.env.SEQUELIZE_DIALECT,
  port: Number(process.env.SEQUELIZE_PORT),
  ssl: process.env.SEQUELIZE_SSL === 'true',
};

module.exports = {
  development: { ...commonConfig },
  test: { ...commonConfig },
  production: { ...commonConfig },
};
