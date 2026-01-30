const express = require('express');
const router = express.Router();
const { getUsers, importUsers, exportUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, admin, getUsers);

router.route('/import')
    .post(protect, admin, upload.single('file'), importUsers);

router.route('/export')
    .get(protect, admin, exportUsers);

router.route('/:id')
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

module.exports = router;
