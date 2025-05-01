require('dotenv').config();
const sequelize = require('./config/database');
const AdminWallet = require('./models/adminWallet.model');
const DoctorWallet = require('./models/doctorWallet.model');
const PatientWallet = require('./models/patientWallet.model');

// Import all models to ensure they're registered with Sequelize
require('./models');

async function setupTables() {
  try {
    
    await sequelize.authenticate();
    

    
    
    // Sync specific wallet models
    await AdminWallet.sync({ alter: true });
    
    
    await DoctorWallet.sync({ alter: true });
    
    
    await PatientWallet.sync({ alter: true });
    

    
    
    // Create default admin wallet if it doesn't exist
    const adminWallet = await AdminWallet.findOne({ where: { id: 1 } });
    if (!adminWallet) {
      await AdminWallet.create({
        id: 1,
        balance: 0,
        transactions: []
      });
      
    }

    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database tables:', error);
    process.exit(1);
  }
}

setupTables();
