import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Upload, Download, Plus, Pencil, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { cn } from './ui/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  PopoverTrigger,
} from "./ui/popover"
import { ImportResultsDialog } from './ImportResultsDialog';

export function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    clientId: '',
  });
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [openEditClientCombobox, setOpenEditClientCombobox] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showImportResults, setShowImportResults] = useState(false);
  const fileInputRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      // Map backend data to frontend format
      const mappedUsers = data.map(u => ({
        id: u._id,
        username: u.username,
        password: u.password || '********', // Show password
        role: u.role,
        clientId: u.clientId || 'N/A',
        status: 'active', // Backend doesn't have status yet
        lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'Never'
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  const handleAddUser = async () => {
    try {
      await api.createUser(newUser);
      toast.success('User created successfully');
      setIsAddDialogOpen(false);
      setNewUser({ username: '', password: '', role: 'user', clientId: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;
    try {
      const payload = {
        username: currentUser.username,
        role: currentUser.role,
        clientId: currentUser.role === 'client' ? currentUser.clientId : null
      };
      // Only include password if it was changed
      if (currentUser.password && currentUser.password !== '********') {
        payload.password = currentUser.password;
      }
      await api.updateUser(currentUser.id, payload);
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const openEditDialog = (user) => {
    setCurrentUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleImportXML = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await api.importUsers(file);

      if (response.results) {
        setImportResults(response);
        setShowImportResults(true);
        toast.success(`Import completed: ${response.summary.success} successful, ${response.summary.failed} failed`);
      } else {
        toast.success('Users imported successfully');
      }

      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to import users';
      toast.error(errorMessage);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportXML = async () => {
    try {
      const xmlData = await api.exportUsers();
      const url = `data:application/xml;charset=utf-8,${encodeURIComponent(xmlData)}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Failed to export users');
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'client':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Users Management</CardTitle>
            <CardDescription>Manage system users and access controls</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4 mr-2" />
              Import XML
            </Button>
            <Button variant="outline" onClick={handleExportXML}>
              <Download className="size-4 mr-2" />
              Export XML
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="overflow-visible">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="jdoe"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="overflow-visible">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user details.
                  </DialogDescription>
                </DialogHeader>
                {currentUser && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-username">Username</Label>
                      <Input
                        id="edit-username"
                        value={currentUser.username}
                        onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-password">Password</Label>
                      <Input
                        id="edit-password"
                        type="text"
                        value={currentUser.password}
                        onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                        placeholder="Enter new password to change"
                      />
                      <p className="text-xs text-muted-foreground">Leave unchanged to keep current password</p>
                    </div>
                    {currentUser.role != 'client' && (
                      <div className="grid gap-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select value={currentUser.role} onValueChange={(value) => setCurrentUser({ ...currentUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <ImportResultsDialog
            open={showImportResults}
            onOpenChange={setShowImportResults}
            results={importResults?.results}
            summary={importResults?.summary}
            title="User Import Results"
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
              <TableHead>User ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell className="font-mono text-sm">{user.password}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.clientId}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                    <Pencil className="size-4" />
                  </Button>
                  {user.role !== 'client' && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
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
