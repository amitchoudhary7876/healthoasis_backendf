const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function addColumn() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    const [{ count }] = await sequelize.query(
      "SELECT COUNT(*) AS count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'availability_status';",
      { type: QueryTypes.SELECT }
    );
    const columnCount = parseInt(count, 10);
    if (columnCount === 0) {
      await sequelize.query(
        "ALTER TABLE doctors ADD COLUMN availability_status ENUM('available','busy','offline') NOT NULL DEFAULT 'available';"
      );
      console.log('Column availability_status added');
    } else {
      console.log('Column availability_status already exists');
    }
  } catch (err) {
    console.error('Error ensuring availability_status column:', err);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

addColumn();
