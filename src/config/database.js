const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'healthcare',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false, // Disable all SQL query logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    },
    // Add these options to handle foreign key constraints more gracefully
    dialectOptions: {
      // For MySQL 8.0+
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    // Disable foreign key constraint checks during sync
    sync: {
      force: false,
      alter: true
    }
  }
);
const db =sequelize;
module.exports = sequelize;
