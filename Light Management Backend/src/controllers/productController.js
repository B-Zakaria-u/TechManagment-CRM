const Product = require('../models/Product');
const { parseXML, buildXML } = require('../utils/xmlHelper');
const { validateXML } = require('../utils/xmlValidator');

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    const { name, price, category, stock, description } = req.body;

    try {
        const product = new Product({
            name,
            price,
            category,
            stock,
            description,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    const { name, price, category, stock, description } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.price = price || product.price;
            product.category = category || product.category;
            product.stock = stock || product.stock;
            product.description = description || product.description;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const importProducts = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const xmlData = req.file.buffer.toString();
        const result = await parseXML(xmlData);

        // Validate root element
        if (!result.products) {
            return res.status(400).json({
                message: "You're trying to import wrong elements to the database."
            });
        }

        let productsToImport = [];
        if (result.products && result.products.product) {
            if (Array.isArray(result.products.product)) {
                productsToImport = result.products.product;
            } else {
                productsToImport = [result.products.product];
            }
        } else {
            return res.status(400).json({ message: 'Invalid XML structure' });
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const p of productsToImport) {
            const name = Array.isArray(p.name) ? p.name[0] : p.name;

            try {
                // Check for duplicate name
                const existingProduct = await Product.findOne({ name });
                if (existingProduct) {
                    throw new Error('Product already exists');
                }

                const productData = {
                    name: name,
                    price: Number(Array.isArray(p.price) ? p.price[0] : p.price),
                    category: Array.isArray(p.category) ? p.category[0] : p.category,
                    stock: Number(Array.isArray(p.stock) ? p.stock[0] : p.stock),
                    description: Array.isArray(p.description) ? p.description[0] : p.description
                };

                const newProduct = new Product(productData);
                await newProduct.save();

                results.push({
                    item: name,
                    status: 'success',
                    message: 'Product successfully added'
                });
                successCount++;
            } catch (err) {
                failureCount++;
                let reason = err.message;
                if (err.code === 11000) {
                    reason = 'Product already exists';
                }

                results.push({
                    item: name || 'Unknown Product',
                    status: 'error',
                    message: `Could not be added`,
                    reason: reason
                });
            }
        }

        res.status(201).json({
            message: 'Import completed',
            summary: {
                total: productsToImport.length,
                success: successCount,
                failed: failureCount
            },
            results: results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error importing products: ' + error.message });
    }
};

const exportProducts = async (req, res) => {
    try {
        const products = await Product.find({}).lean();

        const productsForXml = products.map(p => ({
            ...p,
            _id: p._id.toString(),
            createdAt: p.createdAt ? p.createdAt.toISOString() : '',
            updatedAt: p.updatedAt ? p.updatedAt.toISOString() : ''
        }));

        const xml = buildXML({ products: { product: productsForXml } });

        // Validate XML against XSD schema
        const validation = validateXML(xml, 'products');
        if (!validation.valid) {
            console.error('XML validation failed:', validation.message);
            return res.status(500).json({
                message: 'XML validation failed',
                errors: validation.errors,
                details: validation.message
            });
        }

        console.log('XML validation passed for products export');
        res.header('Content-Type', 'application/xml');
        res.attachment('products.xml');
        res.send(xml);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    exportProducts,
};
