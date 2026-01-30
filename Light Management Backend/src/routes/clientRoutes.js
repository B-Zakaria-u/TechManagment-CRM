const express = require('express');
const router = express.Router();
const { getClients, createClient, updateClient, deleteClient, importClients, exportClients } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getClients);
router.post('/', protect, createClient);
router.put('/:id', protect, updateClient);
router.delete('/:id', protect, deleteClient);
router.post('/import', protect, upload.single('file'), importClients);
router.get('/export', protect, exportClients);

module.exports = router;
