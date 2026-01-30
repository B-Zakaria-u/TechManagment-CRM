const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    opportuniteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    type: String,
    statut: String,
    dateCreation: { type: Date, default: Date.now },
    dateValidation: Date,
    lignes: [{
        produitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantite: Number,
        prixUnitaireHT: Number,
        remise: Number,
        totalHT: Number
    }],
    totaux: {
        totalHT: Number,
        totalTVA: Number,
        totalTTC: Number
    },
    conditions: {
        delaiLivraison: Number,
        modalitesPaiement: String,
        validiteDevis: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
