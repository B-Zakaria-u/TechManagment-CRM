
import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImportResultsDialog } from './ImportResultsDialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Upload, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export function ProductsManagement({ user }) {
  const [products, setProducts] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [showImportResults, setShowImportResults] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      // Map backend data to frontend format
      const mappedProducts = data.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        description: p.description || 'N/A',
        status: p.stock === 0 ? 'out-of-stock' : (p.stock < 10 ? 'low-stock' : 'in-stock'),
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const validateForm = (product) => {
    const newErrors = {};
    if (!product.name.trim()) newErrors.name = 'Product name is required';
    if (!product.category) newErrors.category = 'Category is required';
    if (product.price < 0) newErrors.price = 'Price cannot be negative';
    if (product.stock < 0) newErrors.stock = 'Stock cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateForm(newProduct)) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await api.createProduct(newProduct);
      toast.success('Product created successfully');
      setIsAddDialogOpen(false);
      setNewProduct({ name: '', category: '', price: 0, stock: 0, description: '' });
      setErrors({});
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!currentProduct) return;
    if (!validateForm(currentProduct)) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await api.updateProduct(currentProduct.id, {
        name: currentProduct.name,
        category: currentProduct.category,
        price: currentProduct.price,
        stock: currentProduct.stock,
        description: currentProduct.description
      });
      toast.success('Product updated successfully');
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
      setErrors({});
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const openEditDialog = (product) => {
    setCurrentProduct({ ...product });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const handleImportXML = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await api.importProducts(file);

      if (response.results) {
        setImportResults(response);
        setShowImportResults(true);
        toast.success(`Import completed: ${response.summary.success} successful, ${response.summary.failed} failed`);
      } else {
        toast.success('Products imported successfully');
      }

      fetchProducts(); // Refresh list
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to import products';
      toast.error(errorMessage);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportXML = async () => {
    try {
      const xmlData = await api.exportProducts();
      const url = `data: application / xml; charset = utf - 8, ${encodeURIComponent(xmlData)} `;
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Failed to export products');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'in-stock':
        return 'default';
      case 'low-stock':
        return 'secondary';
      case 'out-of-stock':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const categories = [
    "Computers",
    "Laptops",
    "Components",
    "Peripherals",
    "Networking",
    "Software",
    "Accessories",
    "Servers",
    "Storage"
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Products Management</CardTitle>
            <CardDescription>Manage your tech inventory and catalog</CardDescription>
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
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) setErrors({});
            }}>
              {user && user.role !== 'client' && (
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new tech product below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. MacBook Pro M3, RTX 4090"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <span className="text-xs text-red-500">{errors.category}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                        className={errors.price ? "border-red-500" : ""}
                      />
                      {errors.price && <span className="text-xs text-red-500">{errors.price}</span>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                        className={errors.stock ? "border-red-500" : ""}
                      />
                      {errors.stock && <span className="text-xs text-red-500">{errors.stock}</span>}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed product specs and description..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct}>Add Product</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setErrors({});
            }}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>
                    Update product details.
                  </DialogDescription>
                </DialogHeader>
                {currentProduct && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Product Name</Label>
                      <Input
                        id="edit-name"
                        value={currentProduct.name}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select value={currentProduct.category} onValueChange={(value) => setCurrentProduct({ ...currentProduct, category: value })}>
                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <span className="text-xs text-red-500">{errors.category}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-price">Price ($)</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentProduct.price}
                          onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) || 0 })}
                          className={errors.price ? "border-red-500" : ""}
                        />
                        {errors.price && <span className="text-xs text-red-500">{errors.price}</span>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-stock">Stock Quantity</Label>
                        <Input
                          id="edit-stock"
                          type="number"
                          min="0"
                          value={currentProduct.stock}
                          onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) || 0 })}
                          className={errors.stock ? "border-red-500" : ""}
                        />
                        {errors.stock && <span className="text-xs text-red-500">{errors.stock}</span>}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={currentProduct.description}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProduct}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <ImportResultsDialog
            open={showImportResults}
            onOpenChange={setShowImportResults}
            results={importResults?.results}
            summary={importResults?.summary}
            title="Product Import Results"
            id="import-results-dialog"
          />
        </div>
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
              <TableHead>Product ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${(product.price || 0).toLocaleString()}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(product.status)}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={product.description}>{product.description}</TableCell>
                <TableCell className="text-right">
                  {user && user.role !== 'client' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
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
