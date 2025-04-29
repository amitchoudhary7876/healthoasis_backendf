const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VideoCall = sequelize.define('VideoCall', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null if we don't have patient authentication yet
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in seconds
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'missed', 'cancelled'),
    defaultValue: 'in-progress',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'video_calls',
  timestamps: true,
});

module.exports = VideoCall;
