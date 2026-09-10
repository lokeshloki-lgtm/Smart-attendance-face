import Department from '../models/Department.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to load departments' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });
    const department = await Department.create({ name, classes: Array.isArray(req.body.classes) ? req.body.classes : [] });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({ success: false, message: error.code === 11000 ? 'Department already exists' : error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, {
      name: req.body.name?.trim(),
      classes: Array.isArray(req.body.classes) ? req.body.classes : [],
      isActive: req.body.isActive,
    }, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update department' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate department' });
  }
};
