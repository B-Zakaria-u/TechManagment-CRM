const Client = require('../models/Client');
const User = require('../models/User');
const mongoose = require('mongoose');
const { parseXML, buildXML } = require('../utils/xmlHelper');
const { validateXML } = require('../utils/xmlValidator');

// Get all clients
const getClients = async (req, res) => {
    try {
        const clients = await Client.find().populate('informationsCommerciales.commercialResponsable', 'username');
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create client
const createClient = async (req, res) => {
    try {
        const client = new Client(req.body);
        const savedClient = await client.save();
        res.status(201).json(savedClient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const importClients = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const xmlData = req.file.buffer.toString();
        const result = await parseXML(xmlData);

        // Validate root element
        if (!result.clients) {
            return res.status(400).json({
                message: "You're trying to import wrong elements to the database."
            });
        }

        const clientsData = result.clients.client;
        const clientsArray = Array.isArray(clientsData) ? clientsData : [clientsData];

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const clientData of clientsArray) {
            const reference = clientData.reference[0];

            try {
                // Check for duplicate reference
                const existingClient = await Client.findOne({ reference });
                if (existingClient) {
                    throw new Error('Client already exists');
                }

                const newClient = new Client({
                    reference: reference,
                    type: clientData.type[0],
                    raisonSociale: clientData.raisonSociale[0],
                    siret: clientData.siret?.[0],
                    formeJuridique: clientData.formeJuridique?.[0],
                    effectif: clientData.effectif?.[0] ? parseInt(clientData.effectif[0]) : undefined,
                    secteurActivite: clientData.secteurActivite?.[0],
                    adresseFacturation: {
                        adresse: clientData.adresseFacturation[0].adresse[0],
                        codePostal: clientData.adresseFacturation[0].codePostal[0],
                        ville: clientData.adresseFacturation[0].ville[0],
                        pays: clientData.adresseFacturation[0].pays[0]
                    },
                    contacts: clientData.contacts[0].contact.map(c => ({
                        nom: c.nom[0],
                        prenom: c.prenom[0],
                        fonction: c.fonction[0],
                        email: c.email[0],
                        telephone: c.telephone[0],
                        statut: c.statut[0]
                    })),
                    informationsCommerciales: {
                        source: clientData.informationsCommerciales[0].source[0],
                        dateAcquisition: new Date(clientData.informationsCommerciales[0].dateAcquisition[0]),
                        niveau: clientData.informationsCommerciales[0].niveau[0],
                        chiffreAffaireCumule: parseFloat(clientData.informationsCommerciales[0].chiffreAffaireCumule[0]),
                        dernierAchat: new Date(clientData.informationsCommerciales[0].dernierAchat[0])
                    },
                    contrats: clientData.contrats?.[0]?.contrat?.map(c => ({
                        reference: c.reference[0],
                        type: c.type[0],
                        dateDebut: new Date(c.dateDebut[0]),
                        dateFin: new Date(c.dateFin[0]),
                        montant: parseFloat(c.montant[0])
                    })) || []
                });

                const commResp = clientData.informationsCommerciales[0].commercialResponsable?.[0];
                if (commResp && mongoose.Types.ObjectId.isValid(commResp)) {
                    newClient.informationsCommerciales.commercialResponsable = commResp;
                } else if (commResp) {
                    console.warn(`Skipping invalid commercialResponsable ObjectId: ${commResp}`);
                }

                await newClient.save();

                results.push({
                    item: reference,
                    status: 'success',
                    message: 'Client successfully added'
                });
                successCount++;
            } catch (err) {
                failureCount++;
                let reason = err.message;
                if (err.code === 11000) {
                    reason = 'Client already exists';
                }

                results.push({
                    item: reference || 'Unknown Client',
                    status: 'error',
                    message: `Could not be added`,
                    reason: reason
                });
            }
        }

        res.status(201).json({
            message: 'Import completed',
            summary: {
                total: clientsArray.length,
                success: successCount,
                failed: failureCount
            },
            results: results
        });
    } catch (error) {
        console.error(error);
        const fs = require('fs');
        fs.appendFileSync('error.log', `Import Error: ${error.message}\n${error.stack}\n`);
        res.status(500).json({ message: 'Error importing XML', error: error.message });
    }
};

// Export Clients to XML
const exportClients = async (req, res) => {
    try {
        const clients = await Client.find().lean();

        const clientsObj = {
            clients: {
                client: clients.map(client => ({
                    reference: client.reference,
                    type: client.type,
                    raisonSociale: client.raisonSociale,
                    siret: client.siret,
                    formeJuridique: client.formeJuridique,
                    effectif: client.effectif,
                    secteurActivite: client.secteurActivite,
                    adresseFacturation: client.adresseFacturation ? {
                        adresse: client.adresseFacturation.adresse,
                        codePostal: client.adresseFacturation.codePostal,
                        ville: client.adresseFacturation.ville,
                        pays: client.adresseFacturation.pays
                    } : undefined,
                    contacts: {
                        contact: client.contacts.map(c => ({
                            nom: c.nom,
                            prenom: c.prenom,
                            fonction: c.fonction,
                            email: c.email,
                            telephone: c.telephone,
                            statut: c.statut
                        }))
                    },
                    informationsCommerciales: client.informationsCommerciales ? {
                        source: client.informationsCommerciales.source,
                        dateAcquisition: client.informationsCommerciales.dateAcquisition,
                        niveau: client.informationsCommerciales.niveau,
                        chiffreAffaireCumule: client.informationsCommerciales.chiffreAffaireCumule,
                        dernierAchat: client.informationsCommerciales.dernierAchat,
                        commercialResponsable: client.informationsCommerciales.commercialResponsable?.toString()
                    } : undefined,
                    contrats: {
                        contrat: client.contrats.map(c => ({
                            reference: c.reference,
                            type: c.type,
                            dateDebut: c.dateDebut,
                            dateFin: c.dateFin,
                            montant: c.montant
                        }))
                    }
                }))
            }
        };

        const xml = buildXML(clientsObj);

        // Validate XML against XSD schema
        const validation = validateXML(xml, 'clients');
        if (!validation.valid) {
            console.error('XML validation failed:', validation.message);
            return res.status(500).json({
                message: 'XML validation failed',
                errors: validation.errors,
                details: validation.message
            });
        }

        console.log('XML validation passed for clients export');
        res.header('Content-Type', 'application/xml');
        res.attachment('clients.xml');
        res.send(xml);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update client
const updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete client
const deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Delete associated user account if exists
        await User.findOneAndDelete({ clientId: client._id });

        await client.deleteOne();
        res.json({ message: 'Client and associated user account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getClients,
    createClient,
    updateClient,
    deleteClient,
    importClients,
    exportClients
};
