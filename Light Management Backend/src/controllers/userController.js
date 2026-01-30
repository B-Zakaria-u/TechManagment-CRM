const User = require('../models/User');
const { parseXML, buildXML } = require('../utils/xmlHelper');
const { encrypt, decrypt } = require('../utils/encryption');
const { validateXML } = require('../utils/xmlValidator');

const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        const decryptedUsers = users.map(user => {
            const u = user.toObject();
            u.password = decrypt(user.password);
            return u;
        });
        res.json(decryptedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const importUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const xmlData = req.file.buffer.toString();
        const result = await parseXML(xmlData);

        // Validate root element
        if (!result.users) {
            return res.status(400).json({
                message: "You're trying to import wrong elements to the database."
            });
        }

        let usersToImport = [];
        if (result.users && result.users.user) {
            if (Array.isArray(result.users.user)) {
                usersToImport = result.users.user;
            } else {
                usersToImport = [result.users.user];
            }
        } else {
            return res.status(400).json({ message: 'Invalid XML structure' });
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const u of usersToImport) {
            const username = Array.isArray(u.username) ? u.username[0] : u.username;

            try {
                const password = Array.isArray(u.password) ? u.password[0] : u.password;
                const role = Array.isArray(u.role) ? u.role[0] : u.role;
                const clientId = u.clientId ? (Array.isArray(u.clientId) ? u.clientId[0] : u.clientId) : undefined;

                // Check if user already exists
                const existingUser = await User.findOne({ username });
                if (existingUser) {
                    throw new Error('User already exists');
                }

                const encryptedPassword = encrypt(password);

                const userData = {
                    username,
                    password: encryptedPassword,
                    role: role || 'client'
                };

                if (clientId) {
                    userData.clientId = clientId;
                }

                const newUser = new User(userData);
                await newUser.save();

                results.push({
                    item: username,
                    status: 'success',
                    message: 'User successfully added'
                });
                successCount++;
            } catch (err) {
                failureCount++;
                let reason = err.message;
                if (err.code === 11000) {
                    reason = 'User already exists';
                }

                results.push({
                    item: username || 'Unknown User',
                    status: 'error',
                    message: `Could not be added`,
                    reason: reason
                });
            }
        }

        res.status(201).json({
            message: 'Import completed',
            summary: {
                total: usersToImport.length,
                success: successCount,
                failed: failureCount
            },
            results: results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error importing users: ' + error.message });
    }
};

const exportUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').lean();

        const usersForXml = users.map(u => ({
            _id: u._id.toString(),
            username: u.username,
            role: u.role,
            clientId: u.clientId ? u.clientId.toString() : undefined,
            createdAt: u.createdAt ? u.createdAt.toISOString() : '',
            updatedAt: u.updatedAt ? u.updatedAt.toISOString() : ''
        }));

        const xml = buildXML({ users: { user: usersForXml } });

        // Validate XML against XSD schema
        const validation = validateXML(xml, 'users');
        if (!validation.valid) {
            console.error('XML validation failed:', validation.message);
            return res.status(500).json({
                message: 'XML validation failed',
                errors: validation.errors,
                details: validation.message
            });
        }

        console.log('XML validation passed for users export');
        res.header('Content-Type', 'application/xml');
        res.attachment('users.xml');
        res.send(xml);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.username = req.body.username || user.username;
        if (req.body.password) {
            user.password = req.body.password;
        }
        user.role = req.body.role || user.role;
        if (req.body.clientId !== undefined) {
            user.clientId = req.body.clientId === "" ? undefined : req.body.clientId;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            role: updatedUser.role,
            clientId: updatedUser.clientId,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { getUsers, importUsers, exportUsers, updateUser, deleteUser };
