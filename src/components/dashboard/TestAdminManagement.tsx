import { useState } from 'react';

import { Edit, Plus, Trash2 } from 'lucide-react';

import { PhoneInput } from '@/components/auth/PhoneInput';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from '@/hooks/useMutation';
import { createTestAdmin, deleteTestAdmin, updateTestAdmin } from '@/lib/api/testAdmin';
import type { TestAdmin } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { createTestAdminSchema, updateTestAdminSchema } from '@/lib/validations/testAdmin';
import { validate } from '@/lib/validations/validate';

interface TestAdminManagementProps {
  testAdmins: TestAdmin[];
  isLoading: boolean;
}

export const TestAdminManagement = ({ testAdmins, isLoading }: TestAdminManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testAdminToDelete, setTestAdminToDelete] = useState<TestAdmin | null>(null);
  const [editingTestAdmin, setEditingTestAdmin] = useState<TestAdmin | null>(null);
  const [formData, setFormData] = useState<Partial<TestAdmin>>({
    name: '',
    email: '',
    phone_number: undefined,
    gender: undefined,
  });

  const createTestAdminMutation = useMutation({
    mutationFn: createTestAdmin,
    showSuccessToast: true,
    successMessage: 'Test admin created successfully',
    invalidateQueries: ['testAdmins'],
  });

  const updateTestAdminMutation = useMutation({
    mutationFn: ({ testAdminId, data }: { testAdminId: string; data: Partial<TestAdmin> }) =>
      updateTestAdmin(testAdminId, data),
    showSuccessToast: true,
    successMessage: 'Test admin updated successfully',
    invalidateQueries: ['testAdmins'],
  });

  const deleteTestAdminMutation = useMutation({
    mutationFn: deleteTestAdmin,
    showSuccessToast: true,
    successMessage: 'Test admin deleted successfully',
    invalidateQueries: ['testAdmins'],
  });

  const handleOpenDialog = (testAdmin?: TestAdmin) => {
    if (testAdmin) {
      setEditingTestAdmin(testAdmin);
      setFormData({
        name: testAdmin.name || '',
        email: testAdmin.email || '',
        phone_number: testAdmin.phone_number,
        gender: testAdmin.gender,
      });
    } else {
      setEditingTestAdmin(null);
      setFormData({
        name: '',
        email: '',
        phone_number: undefined,
        gender: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone_number: undefined,
      gender: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTestAdmin) {
        const data = validate(updateTestAdminSchema, formData);
        if (!data) return;

        const testAdminId =
          editingTestAdmin.id || (editingTestAdmin as TestAdmin & { _id?: string })._id;
        if (!testAdminId) {
          throw new Error('Test Admin ID not found');
        }
        await updateTestAdminMutation.mutateAsync({
          testAdminId,
          data: data as Partial<TestAdmin>,
        });
      } else {
        const data = validate(createTestAdminSchema, formData);
        if (!data) return;

        await createTestAdminMutation.mutateAsync(data as Omit<TestAdmin, 'id'>);
      }
      handleCloseDialog();
    } catch {
      // Error already handled by hook
    }
  };

  const handleDeleteClick = (testAdmin: TestAdmin) => {
    setTestAdminToDelete(testAdmin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testAdminToDelete) return;

    try {
      const testAdminId =
        testAdminToDelete.id || (testAdminToDelete as TestAdmin & { _id?: string })._id;
      if (!testAdminId) {
        throw new Error('Test Admin ID not found');
      }
      await deleteTestAdminMutation.mutateAsync(testAdminId);
      setIsDeleteDialogOpen(false);
      setTestAdminToDelete(null);
    } catch {
      // Error already handled by hook
    }
  };

  return (
    <>
      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Test Administrators</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {testAdmins.length}{' '}
              {testAdmins.length === 1 ? 'test administrator' : 'test administrators'} registered
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="default" className="gap-2">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
        <div
          className={cn(
            'grid gap-4 md:grid-cols-2 lg:grid-cols-3 ',
            testAdmins.length === 0 && 'flex-1'
          )}
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="mb-2 w-32 h-5" />
                  <Skeleton className="w-40 h-4" />
                </CardHeader>
                <CardContent className="py-4">
                  <Skeleton className="mb-2 w-full h-4" />
                </CardContent>
              </Card>
            ))
          ) : testAdmins.length === 0 ? (
            <Card className="col-span-full border-dashed ">
              <CardContent className="flex flex-col justify-center flex-1 items-center py-12">
                <p className="mb-1 text-base font-medium text-muted-foreground">
                  No test administrators added yet
                </p>
                <p className="mb-6 text-sm text-muted-foreground/70">
                  Get started by adding your first test administrator
                </p>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </CardContent>
            </Card>
          ) : (
            testAdmins.map(testAdmin => (
              <Card
                key={testAdmin.id || (testAdmin as TestAdmin & { _id?: string })._id}
                className="overflow-hidden backdrop-blur-sm transition-all duration-200 hover:shadow-lg border-border/60 bg-card/50"
              >
                <CardHeader className="space-y-0">
                  <div className="flex gap-2 justify-between items-start">
                    <div className="flex-1 space-y-1 min-w-0 overflow-hidden">
                      <CardTitle className="text-lg font-semibold mb-0.5 truncate text-foreground">
                        {testAdmin.name}
                      </CardTitle>
                      <CardDescription className="text-sm truncate text-muted-foreground/80">
                        {testAdmin.email || 'No email'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(testAdmin)}
                        className="w-8 h-8 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" aria-label="Edit test admin" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(testAdmin)}
                        className="w-8 h-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" aria-label="Delete test admin" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {testAdmin.phone_number && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className="text-muted-foreground/70 font-medium min-w-[60px]">
                        Phone:
                      </span>
                      <span className="text-foreground truncate">{testAdmin.phone_number}</span>
                    </div>
                  )}
                  {testAdmin.gender && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className="text-muted-foreground/70 font-medium min-w-[60px]">
                        Gender:
                      </span>
                      <span className="capitalize text-foreground">{testAdmin.gender}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Test Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTestAdmin ? 'Edit Test Administrator' : 'Add New Test Administrator'}
            </DialogTitle>
            <DialogDescription>
              {editingTestAdmin
                ? 'Update test administrator information below.'
                : 'Add a new test administrator profile to your account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testAdminName">Name *</Label>
                <Input
                  id="testAdminName"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Test Admin Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testAdminEmail">Email</Label>
                <Input
                  id="testAdminEmail"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testAdminPhone">Phone Number *</Label>
                <PhoneInput
                  value={formData.phone_number}
                  onChange={value => setFormData({ ...formData, phone_number: value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender ?? ''}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      gender: value === '' ? undefined : (value as TestAdmin['gender']),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTestAdminMutation.isPending || updateTestAdminMutation.isPending}
              >
                {createTestAdminMutation.isPending || updateTestAdminMutation.isPending
                  ? 'Saving...'
                  : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Test Admin Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {testAdminToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTestAdminToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTestAdminMutation.isPending}
            >
              {deleteTestAdminMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
