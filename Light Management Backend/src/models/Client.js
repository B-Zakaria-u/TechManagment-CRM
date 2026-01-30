const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    raisonSociale: { type: String, required: true },
    siret: { type: String },
    formeJuridique: { type: String },
    effectif: { type: Number },
    secteurActivite: { type: String },
    adresseFacturation: {
        adresse: String,
        codePostal: String,
        ville: String,
        pays: String
    },
    contacts: [{
        nom: String,
        prenom: String,
        fonction: String,
        email: String,
        telephone: String,
        statut: String
    }],
    informationsCommerciales: {
        source: String,
        dateAcquisition: Date,
        commercialResponsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        chiffreAffaireCumule: Number,
        dernierAchat: Date
    },
    contrats: [{
        reference: String,
        type: { type: String },
        dateDebut: Date,
        dateFin: Date,
        montant: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
