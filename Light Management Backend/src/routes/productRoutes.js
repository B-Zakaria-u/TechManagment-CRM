const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    exportProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(getProducts)
    .post(protect, createProduct);

router.route('/import')
    .post(protect, upload.single('file'), importProducts);

router.route('/export')
    .get(protect, exportProducts);

router.route('/:id')
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

module.exports = router;
