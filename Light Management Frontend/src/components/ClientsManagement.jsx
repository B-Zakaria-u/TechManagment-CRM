import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { ImportResultsDialog } from './ImportResultsDialog';

export function ClientsManagement({ user }) {
    const [clients, setClients] = useState([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);
    const [newClient, setNewClient] = useState({
        reference: '',
        raisonSociale: '',
        type: 'ENTREPRISE',
        ville: '',
        pays: '',
        contactNom: '',
        contactPrenom: '',
        contactEmail: '',
        contactTelephone: ''
    });
    const [importResults, setImportResults] = useState(null);
    const [showImportResults, setShowImportResults] = useState(false);
    const fileInputRef = useRef(null);

    const fetchClients = async () => {
        try {
            const data = await api.getClients();
            const mappedClients = data.map(c => ({
                id: c._id,
                reference: c.reference,
                name: c.raisonSociale,
                type: c.type,
                city: c.adresseFacturation?.ville || 'N/A',
                country: c.adresseFacturation?.pays || 'N/A',
                contact: c.contacts?.[0]?.nom ? `${c.contacts[0].nom} ${c.contacts[0].prenom}` : 'N/A',
                rawContact: c.contacts?.[0] || {}
            }));
            setClients(mappedClients);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            toast.error('Failed to load clients');
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleAddClient = async () => {
        try {
            const payload = {
                reference: newClient.reference,
                raisonSociale: newClient.raisonSociale,
                type: newClient.type,
                adresseFacturation: {
                    ville: newClient.ville,
                    pays: newClient.pays
                },
                contacts: [{
                    nom: newClient.contactNom,
                    prenom: newClient.contactPrenom,
                    email: newClient.contactEmail,
                    telephone: newClient.contactTelephone,
                    fonction: 'Principal'
                }]
            };

            // Create the client first
            const createdClient = await api.createClient(payload);
            toast.success('Client created successfully');

            // Automatically create a user account for the client
            try {
                const username = newClient.contactEmail || `${newClient.reference}_user`;
                const defaultPassword = `${newClient.reference}123`; // Auto-generated password

                await api.register(username, defaultPassword, 'client', createdClient._id);
                toast.success(`Client account created with username: ${username}`);
            } catch (userError) {
                console.error('Failed to create client user account:', userError);
                toast.warning('Client created but user account creation failed. Please create manually.');
            }

            setIsAddDialogOpen(false);
            setNewClient({
                reference: '',
                raisonSociale: '',
                type: 'ENTREPRISE',
                ville: '',
                pays: '',
                contactNom: '',
                contactPrenom: '',
                contactEmail: '',
                contactTelephone: ''
            });
            fetchClients();
        } catch (error) {
            toast.error(error.message || 'Failed to create client');
        }
    };

    const handleUpdateClient = async () => {
        if (!currentClient) return;
        try {
            const payload = {
                reference: currentClient.reference,
                raisonSociale: currentClient.name,
                type: currentClient.type,
                adresseFacturation: {
                    ville: currentClient.city,
                    pays: currentClient.country
                },
                contacts: [{
                    nom: currentClient.contactNom,
                    prenom: currentClient.contactPrenom,
                    email: currentClient.contactEmail,
                    telephone: currentClient.contactTelephone,
                    fonction: 'Principal'
                }]
            };
            await api.updateClient(currentClient.id, payload);
            toast.success('Client updated successfully');
            setIsEditDialogOpen(false);
            setCurrentClient(null);
            fetchClients();
        } catch (error) {
            toast.error(error.message || 'Failed to update client');
        }
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await api.deleteClient(id);
            toast.success('Client deleted successfully');
            fetchClients();
        } catch (error) {
            toast.error(error.message || 'Failed to delete client');
        }
    };

    const openEditDialog = (client) => {
        setCurrentClient({
            ...client,
            contactNom: client.rawContact?.nom || '',
            contactPrenom: client.rawContact?.prenom || '',
            contactEmail: client.rawContact?.email || '',
            contactTelephone: client.rawContact?.telephone || ''
        });
        setIsEditDialogOpen(true);
    };

    const handleImportXML = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('Starting import for file:', file.name);

        try {
            const response = await api.importClients(file);
            console.log('Import response:', response);

            if (response.results) {
                setImportResults(response);
                setShowImportResults(true);
                toast.success(`Import completed: ${response.summary.success} successful, ${response.summary.failed} failed`);
            } else {
                toast.success('Clients imported successfully');
            }

            fetchClients();
        } catch (error) {
            console.error('Import error caught:', error);
            console.error('Error type:', typeof error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);

            const errorMessage = error.message || error.response?.data?.message || 'Failed to import clients';
            console.log('Displaying error message:', errorMessage);
            toast.error(errorMessage);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExportXML = async () => {
        try {
            const xmlData = await api.exportClients();
            const url = `data:application/xml;charset=utf-8,${encodeURIComponent(xmlData)}`;
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clients.xml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success('Clients exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(error.message || 'Failed to export clients');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Clients Management</CardTitle>
                        <CardDescription>Manage your client database</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <>
                            {user && user.role !== 'client' && (
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="size-4 mr-2" />
                                    Import XML
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleExportXML}>
                                <Download className="size-4 mr-2" />
                                Export XML
                            </Button>
                            {user && user.role !== 'client' && (
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="size-4 mr-2" />
                                            Add Client
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Add New Client</DialogTitle>
                                            <DialogDescription>
                                                Enter the details of the new client below.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="reference">Reference</Label>
                                                    <Input
                                                        id="reference"
                                                        placeholder="CLI-2024-001"
                                                        value={newClient.reference}
                                                        onChange={(e) => setNewClient({ ...newClient, reference: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="type">Type</Label>
                                                    <Select value={newClient.type} onValueChange={(value) => setNewClient({ ...newClient, type: value })}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                                                            <SelectItem value="PARTICULIER">Particulier</SelectItem>
                                                            <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="raisonSociale">Company Name</Label>
                                                <Input
                                                    id="raisonSociale"
                                                    placeholder="Acme Corp"
                                                    value={newClient.raisonSociale}
                                                    onChange={(e) => setNewClient({ ...newClient, raisonSociale: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="ville">City</Label>
                                                    <Input
                                                        id="ville"
                                                        placeholder="Paris"
                                                        value={newClient.ville}
                                                        onChange={(e) => setNewClient({ ...newClient, ville: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="pays">Country</Label>
                                                    <Input
                                                        id="pays"
                                                        placeholder="France"
                                                        value={newClient.pays}
                                                        onChange={(e) => setNewClient({ ...newClient, pays: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="border-t pt-4 mt-2">
                                                <h4 className="text-sm font-medium mb-4">Primary Contact</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="contactNom">Last Name</Label>
                                                        <Input
                                                            id="contactNom"
                                                            placeholder="Doe"
                                                            value={newClient.contactNom}
                                                            onChange={(e) => setNewClient({ ...newClient, contactNom: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="contactPrenom">First Name</Label>
                                                        <Input
                                                            id="contactPrenom"
                                                            placeholder="John"
                                                            value={newClient.contactPrenom}
                                                            onChange={(e) => setNewClient({ ...newClient, contactPrenom: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="contactEmail">Email</Label>
                                                        <Input
                                                            id="contactEmail"
                                                            type="email"
                                                            placeholder="john@example.com"
                                                            value={newClient.contactEmail}
                                                            onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="contactTelephone">Phone</Label>
                                                        <Input
                                                            id="contactTelephone"
                                                            placeholder="+33 1 23 45 67 89"
                                                            value={newClient.contactTelephone}
                                                            onChange={(e) => setNewClient({ ...newClient, contactTelephone: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleAddClient}>Create Client</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </>


                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Edit Client</DialogTitle>
                                    <DialogDescription>
                                        Update client details.
                                    </DialogDescription>
                                </DialogHeader>
                                {currentClient && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-reference">Reference</Label>
                                                <Input
                                                    id="edit-reference"
                                                    value={currentClient.reference}
                                                    onChange={(e) => setCurrentClient({ ...currentClient, reference: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-type">Type</Label>
                                                <Select value={currentClient.type} onValueChange={(value) => setCurrentClient({ ...currentClient, type: value })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                                                        <SelectItem value="PARTICULIER">Particulier</SelectItem>
                                                        <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-name">Company Name</Label>
                                            <Input
                                                id="edit-name"
                                                value={currentClient.name}
                                                onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-city">City</Label>
                                                <Input
                                                    id="edit-city"
                                                    value={currentClient.city}
                                                    onChange={(e) => setCurrentClient({ ...currentClient, city: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="edit-country">Country</Label>
                                                <Input
                                                    id="edit-country"
                                                    value={currentClient.country}
                                                    onChange={(e) => setCurrentClient({ ...currentClient, country: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t pt-4 mt-2">
                                            <h4 className="text-sm font-medium mb-4">Primary Contact</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-contactNom">Last Name</Label>
                                                    <Input
                                                        id="edit-contactNom"
                                                        value={currentClient.contactNom}
                                                        onChange={(e) => setCurrentClient({ ...currentClient, contactNom: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-contactPrenom">First Name</Label>
                                                    <Input
                                                        id="edit-contactPrenom"
                                                        value={currentClient.contactPrenom}
                                                        onChange={(e) => setCurrentClient({ ...currentClient, contactPrenom: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-contactEmail">Email</Label>
                                                    <Input
                                                        id="edit-contactEmail"
                                                        type="email"
                                                        value={currentClient.contactEmail}
                                                        onChange={(e) => setCurrentClient({ ...currentClient, contactEmail: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-contactTelephone">Phone</Label>
                                                    <Input
                                                        id="edit-contactTelephone"
                                                        value={currentClient.contactTelephone}
                                                        onChange={(e) => setCurrentClient({ ...currentClient, contactTelephone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateClient}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <ImportResultsDialog
                    open={showImportResults}
                    onOpenChange={setShowImportResults}
                    results={importResults?.results}
                    summary={importResults?.summary}
                    title="Client Import Results"
                    id="import-results-dialog"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    className="hidden"
                    onChange={handleImportXML}
                />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.reference}</TableCell>
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.type}</TableCell>
                                <TableCell>{client.city}</TableCell>
                                <TableCell>{client.country}</TableCell>
                                <TableCell>{client.contact}</TableCell>
                                <TableCell className="text-right">
                                    {user && user.role !== 'client' && (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(client)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)}>
                                                <Trash2 className="size-4 text-red-600" />
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
