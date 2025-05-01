const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const LabTest = require('./labTests');
const CheckupPackage = require('./checkupPackages');

const LabAppointment = sequelize.define('LabAppointment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Simplified user_id field without explicit foreign key constraints
    // The association will be handled by the belongsTo below
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    test_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: LabTest,
            key: 'id'
        }
    },
    package_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: CheckupPackage,
            key: 'id'
        }
    },
    appointment_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'canceled'),
        defaultValue: 'scheduled'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'lab_appointments',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
});

LabAppointment.belongsTo(User, { foreignKey: 'user_id' });
LabAppointment.belongsTo(LabTest, { foreignKey: 'test_id' });
LabAppointment.belongsTo(CheckupPackage, { foreignKey: 'package_id' });

module.exports = LabAppointment;