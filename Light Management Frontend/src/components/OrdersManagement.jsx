import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Upload, Download, Plus, Pencil, Trash2, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { ScrollArea } from './ui/scroll-area';
import { ImportResultsDialog } from './ImportResultsDialog';

export function OrdersManagement({ user }) {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewProductsDialogOpen, setIsViewProductsDialogOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [viewOrderProducts, setViewOrderProducts] = useState(null);
    const [newOrder, setNewOrder] = useState({
        reference: '',
        clientId: '',
        type: 'COMMANDE',
        statut: 'BROUILLON',
        dateCreation: new Date().toISOString().split('T')[0],
        dateValidation: '',
        lignes: [],
        totaux: {
            totalHT: 0,
            totalTVA: 0,
            totalTTC: 0
        }
    });

    // Line item state
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [openProductCombobox, setOpenProductCombobox] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [showImportResults, setShowImportResults] = useState(false);
    const fileInputRef = useRef(null);

    const fetchOrders = async () => {
        try {
            const data = await api.getOrders();
            const mappedOrders = data.map(o => ({
                id: o._id,
                reference: o.reference,
                client: o.clientId?.raisonSociale || o.clientId || 'Unknown Client',
                type: o.type,
                status: o.statut,
                total: o.totaux?.totalTTC || 0,
                totalHT: o.totaux?.totalHT || 0,
                totalTVA: o.totaux?.totalTVA || 0,
                date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'
            }));
            setOrders(mappedOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Failed to load orders');
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error('Failed to load products');
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, []);

    const calculateTotals = (lines) => {
        const totalHT = lines.reduce((sum, line) => sum + line.totalHT, 0);
        const totalTVA = totalHT * 0.20;
        const totalTTC = totalHT + totalTVA;
        return { totalHT, totalTVA, totalTTC };
    };

    const handleAddLineItem = () => {
        if (!selectedProductId) {
            toast.error('Please select a product');
            return;
        }
        if (quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        const product = products.find(p => p._id === selectedProductId);
        if (!product) return;

        const totalHT = product.price * quantity;

        const newLine = {
            produitId: product._id,
            productName: product.name,
            quantite: parseInt(quantity),
            prixUnitaireHT: product.price,
            remise: 0,
            totalHT: totalHT
        };

        const updatedLines = [...newOrder.lignes, newLine];
        const newTotals = calculateTotals(updatedLines);

        setNewOrder(prev => ({
            ...prev,
            lignes: updatedLines,
            totaux: newTotals
        }));

        // Reset selection
        setSelectedProductId('');
        setQuantity(1);
    };

    const handleRemoveLineItem = (index) => {
        const updatedLines = newOrder.lignes.filter((_, i) => i !== index);
        const newTotals = calculateTotals(updatedLines);

        setNewOrder(prev => ({
            ...prev,
            lignes: updatedLines,
            totaux: newTotals
        }));
    };

    const handleAddOrder = async () => {
        // For clients, auto-populate clientId and status
        const isClient = user && user.role === 'client';
        console.log('Debug Order Creation:', { user, isClient }); // Debug log
        // Try different possible client identifier fields
        const clientId = isClient ? (user.clientId || user.reference || user.id || user._id) : newOrder.clientId;
        const status = isClient ? 'BROUILLON' : newOrder.statut;
        console.log('Debug Values:', { clientId, status }); // Debug log

        if (!clientId) {
            toast.error('Please enter a client reference');
            return;
        }
        if (newOrder.totaux.totalHT <= 0) {
            toast.error('Please enter a valid total amount');
            return;
        }

        try {
            const payload = {
                reference: newOrder.reference || `CMD-${Date.now()}`,
                clientId: clientId,
                type: newOrder.type,
                statut: status,
                dateCreation: newOrder.dateCreation,
                dateValidation: newOrder.dateValidation || undefined,
                lignes: newOrder.lignes,
                totaux: newOrder.totaux
            };

            await api.createOrder(payload);
            toast.success('Order created successfully');
            setIsAddDialogOpen(false);
            setNewOrder({
                reference: '',
                clientId: '',
                type: 'COMMANDE',
                statut: 'BROUILLON',
                dateCreation: new Date().toISOString().split('T')[0],
                dateValidation: '',
                lignes: [],
                totaux: { totalHT: 0, totalTVA: 0, totalTTC: 0 }
            });
            fetchOrders();
        } catch (error) {
            // Display detailed error message for stock validation
            const errorMessage = error.message || 'Failed to create order';
            toast.error(errorMessage, {
                duration: 6000,
                style: {
                    background: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc'
                }
            });
        }
    };

    const [updateError, setUpdateError] = useState(null);

    const handleUpdateOrder = async () => {
        if (!currentOrder) return;
        setUpdateError(null); // Reset error before update
        try {
            const payload = {
                reference: currentOrder.reference,
                type: currentOrder.type,
                statut: currentOrder.status || currentOrder.statut,
                dateCreation: currentOrder.dateCreation,
                dateValidation: currentOrder.dateValidation || undefined,
                lignes: currentOrder.lignes,
                totaux: currentOrder.totaux
            };
            await api.updateOrder(currentOrder._id || currentOrder.id, payload);
            toast.success('Order updated successfully');
            setIsEditDialogOpen(false);
            setCurrentOrder(null);
            fetchOrders();
        } catch (error) {
            console.error('Update failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update order';
            setUpdateError(errorMessage);
            // Optional: Keep toast for generic fallback or remove if inline is sufficient
            // toast.error(errorMessage); 
        }
    };

    const handleDeleteOrder = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.deleteOrder(id);
            toast.success('Order deleted successfully');
            fetchOrders();
        } catch (error) {
            toast.error(error.message || 'Failed to delete order');
        }
    };

    const openEditDialog = async (order) => {
        try {
            const fullOrder = await api.getOrderById(order.id);
            // Ensure dates are formatted for input type="date"
            const formattedOrder = {
                ...fullOrder,
                status: fullOrder.statut || fullOrder.status, // Ensure status is normalized
                dateCreation: fullOrder.dateCreation ? new Date(fullOrder.dateCreation).toISOString().split('T')[0] : '',
                dateValidation: fullOrder.dateValidation ? new Date(fullOrder.dateValidation).toISOString().split('T')[0] : '',
                lignes: fullOrder.lignes || [],
                totaux: fullOrder.totaux || { totalHT: 0, totalTVA: 0, totalTTC: 0 }
            };
            setCurrentOrder(formattedOrder);
            setUpdateError(null); // Reset error state
            setIsEditDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            toast.error('Failed to load order details');
        }
    };

    const handleAddLineItemToEdit = () => {
        if (!selectedProductId) {
            toast.error('Please select a product');
            return;
        }
        if (quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        const product = products.find(p => p._id === selectedProductId);
        if (!product) return;

        const totalHT = product.price * quantity;

        const newLine = {
            produitId: product._id,
            productName: product.name,
            quantite: parseInt(quantity),
            prixUnitaireHT: product.price,
            remise: 0,
            totalHT: totalHT
        };

        const updatedLines = [...(currentOrder.lignes || []), newLine];
        const newTotals = calculateTotals(updatedLines);

        setCurrentOrder(prev => ({
            ...prev,
            lignes: updatedLines,
            totaux: newTotals,
            totalHT: newTotals.totalHT,
            totalTVA: newTotals.totalTVA,
            total: newTotals.totalTTC
        }));

        // Reset selection
        setSelectedProductId('');
        setQuantity(1);
    };

    const handleRemoveLineItemFromEdit = (index) => {
        const updatedLines = currentOrder.lignes.filter((_, i) => i !== index);
        const newTotals = calculateTotals(updatedLines);

        setCurrentOrder(prev => ({
            ...prev,
            lignes: updatedLines,
            totaux: newTotals,
            totalHT: newTotals.totalHT,
            totalTVA: newTotals.totalTVA,
            total: newTotals.totalTTC
        }));
    };

    const handleViewProducts = async (orderId) => {
        try {
            const orderData = await api.getOrderById(orderId);
            setViewOrderProducts(orderData);
            setIsViewProductsDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            toast.error('Failed to load order products');
        }
    };

    const handleImportXML = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const response = await api.importOrders(file);

            if (response.results) {
                setImportResults(response);
                setShowImportResults(true);
                toast.success(`Import completed: ${response.summary.success} successful, ${response.summary.failed} failed`);
            } else {
                toast.success('Orders imported successfully');
            }

            fetchOrders();
        } catch (error) {
            console.error('Import error:', error);
            const errorMessage = error.message || error.response?.data?.message || 'Failed to import orders';
            toast.error(errorMessage);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleExportXML = async () => {
        try {
            const xmlData = await api.exportOrders();
            const url = `data:application/xml;charset=utf-8,${encodeURIComponent(xmlData)}`;
            const a = document.createElement('a');
            a.href = url;
            a.download = 'orders.xml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success('Orders exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(error.message || 'Failed to export orders');
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'VALIDE':
            case 'COMPLETED':
                return 'default';
            case 'BROUILLON':
            case 'PENDING':
            case 'EN_ATTENTE':
                return 'secondary';
            case 'ANNULE':
            case 'CANCELLED':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Orders Management</CardTitle>
                        <CardDescription>Track and manage customer orders</CardDescription>
                    </div>
                    <div className="flex gap-2">
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
                        {user && (
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="size-4 mr-2" />
                                        New Order
                                    </Button>
                                </DialogTrigger>
                                <DialogContent id="order-dialog">
                                    <DialogHeader>
                                        <DialogTitle>Create New Order</DialogTitle>
                                        <DialogDescription>
                                            Enter order details below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="flex-1 h-64">
                                        <div className="py-4 px-1">
                                            <div className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="reference">Reference</Label>
                                                    <Input
                                                        id="reference"
                                                        placeholder="Auto-generated if empty"
                                                        value={newOrder.reference}
                                                        onChange={(e) => setNewOrder({ ...newOrder, reference: e.target.value })}
                                                    />
                                                </div>

                                                {user && user.role !== 'client' && (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="clientId">Client Reference *</Label>
                                                        <Input
                                                            id="clientId"
                                                            placeholder="e.g., CLI-2024-001"
                                                            value={newOrder.clientId}
                                                            onChange={(e) => setNewOrder({ ...newOrder, clientId: e.target.value })}
                                                        />
                                                        <p className="text-xs text-muted-foreground">Enter the client reference ID</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="type">Type</Label>
                                                        <Select value={newOrder.type} onValueChange={(value) => setNewOrder({ ...newOrder, type: value })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="COMMANDE">Commande</SelectItem>
                                                                <SelectItem value="DEVIS">Devis</SelectItem>
                                                                <SelectItem value="FACTURE">Facture</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {user && user.role !== 'client' && (
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="status">Status</Label>
                                                            <Select value={newOrder.statut} onValueChange={(value) => setNewOrder({ ...newOrder, statut: value })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="BROUILLON">Brouillon</SelectItem>
                                                                    <SelectItem value="EN_ATTENTE">En Attente</SelectItem>
                                                                    <SelectItem value="VALIDE">Validé</SelectItem>
                                                                    <SelectItem value="ANNULE">Annulé</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="dateCreation">Date Creation</Label>
                                                        <Input
                                                            id="dateCreation"
                                                            type="date"
                                                            value={newOrder.dateCreation}
                                                            onChange={(e) => setNewOrder({ ...newOrder, dateCreation: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="dateValidation">Date Validation</Label>
                                                        <Input
                                                            id="dateValidation"
                                                            type="date"
                                                            value={newOrder.dateValidation}
                                                            onChange={(e) => setNewOrder({ ...newOrder, dateValidation: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-t pt-4">
                                                    <h4 className="font-medium mb-3">Products</h4>
                                                    <div className="flex gap-2 mb-4 items-end">
                                                        <div className="flex-1">
                                                            <Label htmlFor="product-select">Product</Label>
                                                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a product" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {products.map(product => (
                                                                        <SelectItem key={product._id} value={product._id}>
                                                                            {product.name} - €{product.price} (Stock: {product.stock})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="w-24">
                                                            <Label htmlFor="quantity">Qty</Label>
                                                            <Input
                                                                id="quantity"
                                                                type="number"
                                                                min="1"
                                                                value={quantity}
                                                                onChange={(e) => setQuantity(e.target.value)}
                                                            />
                                                        </div>
                                                        <Button type="button" onClick={handleAddLineItem}>
                                                            <Plus className="size-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Line Items Table */}
                                                    {newOrder.lignes.length > 0 && (
                                                        <div className="border rounded-md mb-4">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Product</TableHead>
                                                                        <TableHead className="text-right">Qty</TableHead>
                                                                        <TableHead className="text-right">Price</TableHead>
                                                                        <TableHead className="text-right">Total</TableHead>
                                                                        <TableHead></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {newOrder.lignes.map((line, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{line.productName}</TableCell>
                                                                            <TableCell className="text-right">{line.quantite}</TableCell>
                                                                            <TableCell className="text-right">€{line.prixUnitaireHT}</TableCell>
                                                                            <TableCell className="text-right">€{line.totalHT}</TableCell>
                                                                            <TableCell>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveLineItem(index)}
                                                                                >
                                                                                    <Trash2 className="size-4 text-red-500" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}

                                                    <h4 className="font-medium mb-3">Totaux</h4>
                                                    <div className="grid gap-3">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="totalHT">Total HT (€)</Label>
                                                            <Input
                                                                id="totalHT"
                                                                type="number"
                                                                value={newOrder.totaux.totalHT.toFixed(2)}
                                                                disabled
                                                                className="bg-muted"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="totalTVA">Total TVA (€)</Label>
                                                            <Input
                                                                id="totalTVA"
                                                                type="number"
                                                                value={newOrder.totaux.totalTVA.toFixed(2)}
                                                                disabled
                                                                className="bg-muted"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="totalTTC">Total TTC (€)</Label>
                                                            <Input
                                                                id="totalTTC"
                                                                type="number"
                                                                value={newOrder.totaux.totalTTC.toFixed(2)}
                                                                disabled
                                                                className="bg-muted font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter className="mt-4">
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddOrder}>Create Order</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                        {/* Edit Dialog */}
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogContent className="sm:max-w-[600px] max-h-[85vh]" id="edit-order-dialog">
                                <DialogHeader>
                                    <DialogTitle>Edit Order</DialogTitle>
                                    <DialogDescription>
                                        Update order details.
                                    </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="flex-1 min-h-0">
                                    <div className="py-4 px-1">
                                        {currentOrder && (
                                            <div className="grid gap-4">
                                                {user && user.role !== 'client' && (
                                                    <>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-reference">Reference</Label>
                                                            <Input
                                                                id="edit-reference"
                                                                value={currentOrder.reference}
                                                                onChange={(e) => setCurrentOrder({ ...currentOrder, reference: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-client">Client</Label>
                                                            <Input
                                                                id="edit-client"
                                                                value={currentOrder.client}
                                                                disabled
                                                                className="bg-muted"
                                                            />
                                                            <p className="text-xs text-muted-foreground">Client cannot be changed</p>
                                                        </div>
                                                    </>
                                                )}

                                                {user && user.role !== 'client' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-type">Type</Label>
                                                            <Select value={currentOrder.type} onValueChange={(value) => setCurrentOrder({ ...currentOrder, type: value })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="COMMANDE">Commande</SelectItem>
                                                                    <SelectItem value="DEVIS">Devis</SelectItem>
                                                                    <SelectItem value="FACTURE">Facture</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-status">Status</Label>
                                                            <Select value={currentOrder.status} onValueChange={(value) => setCurrentOrder({ ...currentOrder, status: value })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="BROUILLON">Brouillon</SelectItem>
                                                                    <SelectItem value="EN_ATTENTE">En Attente</SelectItem>
                                                                    <SelectItem value="VALIDE">Validé</SelectItem>
                                                                    <SelectItem value="ANNULE">Annulé</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="edit-dateCreation">Date Creation</Label>
                                                        <Input
                                                            id="edit-dateCreation"
                                                            type="date"
                                                            value={currentOrder.dateCreation}
                                                            onChange={(e) => setCurrentOrder({ ...currentOrder, dateCreation: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="edit-dateValidation">Date Validation</Label>
                                                        <Input
                                                            id="edit-dateValidation"
                                                            type="date"
                                                            value={currentOrder.dateValidation}
                                                            onChange={(e) => setCurrentOrder({ ...currentOrder, dateValidation: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="border-t pt-4">
                                                    <h4 className="font-medium mb-3">Products</h4>
                                                    <div className="flex gap-2 mb-4 items-end">
                                                        <div className="flex-1">
                                                            <Label htmlFor="edit-product-select">Product</Label>
                                                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a product" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {products.map(product => (
                                                                        <SelectItem key={product._id} value={product._id}>
                                                                            {product.name} - €{product.price} (Stock: {product.stock})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="w-24">
                                                            <Label htmlFor="edit-quantity">Qty</Label>
                                                            <Input
                                                                id="edit-quantity"
                                                                type="number"
                                                                min="1"
                                                                value={quantity}
                                                                onChange={(e) => setQuantity(e.target.value)}
                                                            />
                                                        </div>
                                                        <Button type="button" onClick={handleAddLineItemToEdit}>
                                                            <Plus className="size-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Line Items Table */}
                                                    {currentOrder.lignes && currentOrder.lignes.length > 0 && (
                                                        <div className="border rounded-md mb-4">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Product</TableHead>
                                                                        <TableHead className="text-right">Qty</TableHead>
                                                                        <TableHead className="text-right">Price</TableHead>
                                                                        <TableHead className="text-right">Total</TableHead>
                                                                        <TableHead></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {currentOrder.lignes.map((line, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>
                                                                                {line.produitId?.name || line.productName || 'Unknown Product'}
                                                                            </TableCell>
                                                                            <TableCell className="text-right">{line.quantite}</TableCell>
                                                                            <TableCell className="text-right">€{line.prixUnitaireHT}</TableCell>
                                                                            <TableCell className="text-right">€{line.totalHT}</TableCell>
                                                                            <TableCell>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveLineItemFromEdit(index)}
                                                                                >
                                                                                    <Trash2 className="size-4 text-red-500" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}

                                                    <h4 className="font-medium mb-3">Totaux</h4>
                                                    <div className="grid gap-3">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-totalHT">Total HT (€)</Label>
                                                            <Input
                                                                id="edit-totalHT"
                                                                type="number"
                                                                value={(currentOrder.totaux?.totalHT || 0).toFixed(2)}
                                                                disabled
                                                                className="bg-muted"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-totalTVA">Total TVA (€)</Label>
                                                            <Input
                                                                id="edit-totalTVA"
                                                                type="number"
                                                                value={(currentOrder.totaux?.totalTVA || 0).toFixed(2)}
                                                                disabled
                                                                className="bg-muted"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-totalTTC">Total TTC (€)</Label>
                                                            <Input
                                                                id="edit-totalTTC"
                                                                type="number"
                                                                value={(currentOrder.totaux?.totalTTC || 0).toFixed(2)}
                                                                disabled
                                                                className="bg-muted font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                {updateError && (
                                    <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                                        <AlertCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
                                        <div className="text-sm text-red-600">
                                            {updateError}
                                        </div>
                                    </div>
                                )}
                                <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateOrder}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {/* View Products Dialog */}
                        <Dialog open={isViewProductsDialogOpen} onOpenChange={setIsViewProductsDialogOpen}>
                            <DialogContent className="sm:max-w-[700px]">
                                <DialogHeader>
                                    <DialogTitle>Order Products</DialogTitle>
                                    <DialogDescription>
                                        {viewOrderProducts && `Products in order ${viewOrderProducts.reference}`}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    {viewOrderProducts && viewOrderProducts.lignes && viewOrderProducts.lignes.length > 0 ? (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Product</TableHead>
                                                        <TableHead className="text-right">Quantity</TableHead>
                                                        <TableHead className="text-right">Unit Price (HT)</TableHead>
                                                        <TableHead className="text-right">Discount</TableHead>
                                                        <TableHead className="text-right">Total (HT)</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {viewOrderProducts.lignes.map((line, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className="font-medium">
                                                                {line.produitId?.name || line.productName || 'Unknown Product'}
                                                            </TableCell>
                                                            <TableCell className="text-right">{line.quantite}</TableCell>
                                                            <TableCell className="text-right">€{line.prixUnitaireHT.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">{line.remise}%</TableCell>
                                                            <TableCell className="text-right">€{line.totalHT.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <div className="mt-6 border-t pt-4">
                                                <div className="flex justify-end gap-8">
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Total HT:</span>
                                                        <span className="ml-2 font-medium">€{viewOrderProducts.totaux?.totalHT?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Total TVA:</span>
                                                        <span className="ml-2 font-medium">€{viewOrderProducts.totaux?.totalTVA?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Total TTC:</span>
                                                        <span className="ml-2 font-bold">€{viewOrderProducts.totaux?.totalTTC?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No products found in this order
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => setIsViewProductsDialogOpen(false)}>Close</Button>
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
                    title="Order Import Results"
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
                            <TableHead>Order ID</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{order.reference}</TableCell>
                                <TableCell>{order.client}</TableCell>
                                <TableCell>{order.type}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(order.status)}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>€{(order.total || 0).toLocaleString()}</TableCell>
                                <TableCell>{order.date}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewProducts(order.id)}>
                                        <Eye className="size-4" />
                                    </Button>
                                    {user && (
                                        (user.role === 'admin') ||
                                        (user.role === 'user') ||
                                        (user.role === 'client' && order.status === 'BROUILLON')
                                    ) && (
                                            <>
                                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(order)}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order.id)}>
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
