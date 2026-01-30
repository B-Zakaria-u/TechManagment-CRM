const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.mimetype === 'application/xml' || path.extname(file.originalname).toLowerCase() === '.xml') {
        cb(null, true);
    } else {
        cb(new Error('Only XML files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

module.exports = upload;
