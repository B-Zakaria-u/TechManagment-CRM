const Order = require('../models/Order');
const Product = require('../models/Product');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const { parseXML, buildXML } = require('../utils/xmlHelper');
const { validateXML } = require('../utils/xmlValidator');

const getOrders = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'client') {
            if (req.user.clientId) {
                query = { clientId: req.user.clientId };
            } else {
                return res.json([]);
            }
        }

        const orders = await Order.find(query).populate('clientId', 'raisonSociale');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('clientId', 'raisonSociale')
            .populate('lignes.produitId', 'name price');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user has permission to view this order
        if (req.user && req.user.role === 'client') {
            if (!req.user.clientId || order.clientId._id.toString() !== req.user.clientId.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createOrder = async (req, res) => {
    try {
        const orderData = { ...req.body };

        if (orderData.clientId && !mongoose.Types.ObjectId.isValid(orderData.clientId)) {
            const client = await Client.findOne({ reference: orderData.clientId });
            if (client) {
                orderData.clientId = client._id;
            } else {
                return res.status(400).json({ message: `Client not found with reference: ${orderData.clientId}` });
            }
        }

        // Validate stock and deduct ONLY if status is VALIDE
        if (orderData.statut === 'VALIDE' && orderData.lignes && orderData.lignes.length > 0) {
            for (const ligne of orderData.lignes) {
                const product = await Product.findById(ligne.produitId);
                if (!product) {
                    return res.status(400).json({ message: `Product not found: ${ligne.produitId}` });
                }
                if (product.stock < ligne.quantite) {
                    return res.status(400).json({
                        message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${ligne.quantite}. Please change the order status to "EN_ATTENTE" instead.`,
                        productName: product.name,
                        available: product.stock,
                        requested: ligne.quantite
                    });
                }
            }

            // If validation passes, deduct stock
            for (const ligne of orderData.lignes) {
                const product = await Product.findById(ligne.produitId);
                product.stock -= ligne.quantite;
                await product.save();
            }
        }

        const order = new Order(orderData);
        const savedOrder = await order.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOrder = async (req, res) => {
    try {
        // Get the existing order first
        const existingOrder = await Order.findById(req.params.id);

        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const updateData = { ...req.body };
        const wasValide = existingOrder.statut === 'VALIDE';
        const willBeValide = updateData.statut === 'VALIDE';

        // If changing status to VALIDE, validate and deduct stock
        if (!wasValide && willBeValide) {
            // Use existing lignes if not provided in update
            const lignes = updateData.lignes || existingOrder.lignes;

            if (lignes && lignes.length > 0) {
                // First, validate all products have sufficient stock
                for (const ligne of lignes) {
                    const product = await Product.findById(ligne.produitId);
                    if (!product) {
                        return res.status(400).json({ message: `Product not found: ${ligne.produitId}` });
                    }
                    if (product.stock < ligne.quantite) {
                        return res.status(400).json({
                            message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${ligne.quantite}. Please keep the order status as "EN_ATTENTE" or "BROUILLON".`,
                            productName: product.name,
                            available: product.stock,
                            requested: ligne.quantite
                        });
                    }
                }

                // If validation passes, deduct stock
                for (const ligne of lignes) {
                    const product = await Product.findById(ligne.produitId);
                    product.stock -= ligne.quantite;
                    await product.save();
                }
            }
        }

        // If changing status from VALIDE to something else, restore stock
        if (wasValide && !willBeValide) {
            const lignes = existingOrder.lignes;

            if (lignes && lignes.length > 0) {
                for (const ligne of lignes) {
                    const product = await Product.findById(ligne.produitId);
                    if (product) {
                        product.stock += ligne.quantite;
                        await product.save();
                    }
                }
            }
        }

        // Update the order
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('clientId', 'raisonSociale');

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.deleteOne();
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const importOrders = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const xmlData = req.file.buffer.toString();
        const result = await parseXML(xmlData);

        // Validate root element
        if (!result.commandes) {
            return res.status(400).json({
                message: "You're trying to import wrong elements to the database."
            });
        }

        const ordersData = result.commandes.commande;
        const ordersArray = Array.isArray(ordersData) ? ordersData : [ordersData];

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const oData of ordersArray) {
            const reference = oData.reference[0];

            try {
                // Check for duplicate reference
                const existingOrder = await Order.findOne({ reference });
                if (existingOrder) {
                    throw new Error('Order already exists');
                }

                const newOrder = new Order({
                    reference: reference,
                    type: oData.type[0],
                    statut: oData.statut[0],
                    dateCreation: new Date(oData.dateCreation[0]),
                    dateValidation: oData.dateValidation?.[0] ? new Date(oData.dateValidation[0]) : undefined,
                    lignes: oData.lignes?.[0]?.ligne?.map(l => ({
                        produitId: l.produitId?.[0],
                        quantite: parseInt(l.quantite[0]),
                        prixUnitaireHT: parseFloat(l.prixUnitaireHT[0]),
                        remise: parseFloat(l.remise?.[0] || 0),
                        totalHT: parseFloat(l.totalHT[0])
                    })) || [],
                    totaux: {
                        totalHT: parseFloat(oData.totaux[0].totalHT[0]),
                        totalTVA: parseFloat(oData.totaux[0].totalTVA[0]),
                        totalTTC: parseFloat(oData.totaux[0].totalTTC[0])
                    },
                    conditions: oData.conditions?.[0] ? {
                        delaiLivraison: parseInt(oData.conditions[0].delaiLivraison[0]),
                        modalitesPaiement: oData.conditions[0].modalitesPaiement[0],
                        validiteDevis: parseInt(oData.conditions[0].validiteDevis[0])
                    } : undefined
                });

                const clientRef = oData.clientId[0];
                const client = await Client.findOne({ reference: clientRef });

                if (client) {
                    newOrder.clientId = client._id;
                } else if (mongoose.Types.ObjectId.isValid(clientRef)) {
                    newOrder.clientId = clientRef;
                } else {
                    console.warn(`Client not found for reference: ${clientRef}`);
                }
                if (mongoose.Types.ObjectId.isValid(oData.opportuniteId?.[0])) {
                    newOrder.opportuniteId = oData.opportuniteId[0];
                }

                await newOrder.save();

                results.push({
                    item: reference,
                    status: 'success',
                    message: 'Order successfully added'
                });
                successCount++;
            } catch (err) {
                failureCount++;
                let reason = err.message;
                if (err.code === 11000) {
                    reason = 'Order already exists';
                }

                results.push({
                    item: reference || 'Unknown Order',
                    status: 'error',
                    message: `Could not be added`,
                    reason: reason
                });
            }
        }

        res.status(201).json({
            message: 'Import completed',
            summary: {
                total: ordersArray.length,
                success: successCount,
                failed: failureCount
            },
            results: results
        });
    } catch (error) {
        res.status(500).json({ message: 'Error importing XML', error: error.message });
    }
};

const exportOrders = async (req, res) => {
    try {
        const orders = await Order.find().lean();
        const ordersObj = {
            commandes: {
                commande: orders.map(o => ({
                    reference: o.reference,
                    clientId: o.clientId?.toString(),
                    opportuniteId: o.opportuniteId?.toString(),
                    type: o.type,
                    statut: o.statut,
                    dateCreation: o.dateCreation.toISOString(),
                    dateValidation: o.dateValidation?.toISOString(),
                    lignes: {
                        ligne: o.lignes.map(l => ({
                            produitId: l.produitId?.toString(),
                            quantite: l.quantite,
                            prixUnitaireHT: l.prixUnitaireHT,
                            remise: l.remise,
                            totalHT: l.totalHT
                        }))
                    },
                    totaux: {
                        totalHT: o.totaux.totalHT,
                        totalTVA: o.totaux.totalTVA,
                        totalTTC: o.totaux.totalTTC
                    },
                    conditions: o.conditions ? {
                        delaiLivraison: o.conditions.delaiLivraison,
                        modalitesPaiement: o.conditions.modalitesPaiement,
                        validiteDevis: o.conditions.validiteDevis
                    } : undefined
                }))
            }
        };
        const xml = buildXML(ordersObj);

        // Validate XML against XSD schema
        const validation = validateXML(xml, 'commandes');
        if (!validation.valid) {
            console.error('XML validation failed:', validation.message);
            return res.status(500).json({
                message: 'XML validation failed',
                errors: validation.errors,
                details: validation.message
            });
        }

        console.log('XML validation passed for orders export');
        res.header('Content-Type', 'application/xml');
        res.attachment('commandes.xml');
        res.send(xml);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrder, deleteOrder, importOrders, exportOrders };
