const WorkingHours = require('../models/workinghours');

exports.getAllWorkingHours = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  try {
    const workingHours = await WorkingHours.findAll();
    res.json(workingHours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkingHoursById = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  try {
    const workingHours = await WorkingHours.findByPk(req.params.id);
    if (!workingHours) {
      return res.status(404).json({ message: 'Working hours not found' });
    }
    res.json(workingHours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWorkingHours = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  try {
    const workingHours = await WorkingHours.create(req.body);
    res.status(201).json(workingHours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateWorkingHours = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  try {
    const workingHours = await WorkingHours.findByPk(req.params.id);
    if (!workingHours) {
      return res.status(404).json({ message: 'Working hours not found' });
    }
    await workingHours.update(req.body);
    res.json(workingHours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWorkingHours = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  try {
    const workingHours = await WorkingHours.findByPk(req.params.id);
    if (!workingHours) {
      return res.status(404).json({ message: 'Working hours not found' });
    }
    await workingHours.destroy();
    res.json({ message: 'Working hours deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};