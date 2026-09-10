import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../controllers/departmentController.js';

const router = express.Router();
router.use(authMiddleware, adminMiddleware);
router.get('/', getDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
export default router;
