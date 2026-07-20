import { useState } from 'react';

import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PhoneInput } from '@/components/auth/PhoneInput';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
import { createDoctor, deleteDoctor, updateDoctor } from '@/lib/api/dashboard';
import type { Doctor, DoctorChangeRequest } from '@/lib/api/types';
import { capitalizeFirstLetter, cn } from '@/lib/utils';
import { createDoctorSchema, updateDoctorSchema } from '@/lib/validations/doctor';
import { validate } from '@/lib/validations/validate';

type PendingDisplay = {
  key: string;
  name: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  city?: string;
  pendingTag: string;
  subtitle?: string;
};

function pendingRequestToDisplay(req: DoctorChangeRequest, doctors: Doctor[]): PendingDisplay {
  const payload = (req.payload ?? {}) as Partial<Doctor>;
  const existing = doctors.find(d => req.doctor_id && String(d.id) === String(req.doctor_id));

  if (req.action === 'add') {
    return {
      key: req.id,
      name: payload.name?.trim() || 'New doctor',
      email: payload.email,
      phone_number: payload.phone_number,
      gender: payload.gender,
      city: payload.city,
      pendingTag: 'Pending',
      subtitle: 'Awaiting approval to add',
    };
  }

  if (req.action === 'update') {
    return {
      key: req.id,
      name: payload.name?.trim() || existing?.name || 'Doctor',
      email: payload.email ?? existing?.email,
      phone_number: payload.phone_number ?? existing?.phone_number,
      gender: payload.gender ?? existing?.gender,
      city: payload.city ?? existing?.city,
      pendingTag: 'Pending',
      subtitle: 'Awaiting approval to update',
    };
  }

  return {
    key: req.id,
    name: existing?.name || 'Doctor',
    email: existing?.email,
    phone_number: existing?.phone_number,
    gender: existing?.gender,
    city: existing?.city,
    pendingTag: 'Pending',
    subtitle: 'Awaiting approval to remove',
  };
}

interface DoctorManagementProps {
  doctors: Doctor[];
  isLoading: boolean;
  docApproval?: number;
  hasMrDetails?: boolean;
  pendingRequests?: DoctorChangeRequest[];
  isLoadingPending?: boolean;
}

export const DoctorManagement = ({
  doctors,
  isLoading,
  docApproval,
  hasMrDetails,
  pendingRequests = [],
  isLoadingPending,
}: DoctorManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<Partial<Doctor>>({
    name: '',
    email: '',
    gender: undefined,
    city: '',
    phone_number: undefined,
  });

  const createDoctorMutation = useMutation({
    mutationFn: createDoctor,
    showSuccessToast: false,
    invalidateQueries: ['doctors', 'pendingDoctorRequests', 'clinicInfo'],
    onSuccess: result => {
      if (result.pending) {
        toast.success('Change request submitted for approval');
      } else {
        toast.success('Doctor created successfully');
      }
    },
  });

  const updateDoctorMutation = useMutation({
    mutationFn: ({ doctorId, data }: { doctorId: string; data: Partial<Doctor> }) =>
      updateDoctor(doctorId, data),
    showSuccessToast: false,
    invalidateQueries: ['doctors', 'pendingDoctorRequests', 'clinicInfo'],
    onSuccess: result => {
      if (result.pending) {
        toast.success('Change request submitted for approval');
      } else {
        toast.success('Doctor updated successfully');
      }
    },
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: deleteDoctor,
    showSuccessToast: false,
    invalidateQueries: ['doctors', 'pendingDoctorRequests', 'clinicInfo'],
    onSuccess: result => {
      if (result.pending) {
        toast.success('Change request submitted for approval');
      } else {
        toast.success('Doctor deleted successfully');
      }
    },
  });

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        gender: doctor.gender || undefined,
        city: doctor.city || '',
        phone_number: doctor.phone_number,
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        email: '',
        gender: undefined,
        city: '',
        phone_number: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDoctor(null);
    setFormData({
      name: '',
      email: '',
      gender: undefined,
      city: '',
      phone_number: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDoctor) {
        const data = validate(updateDoctorSchema, formData);
        if (!data) return;

        const doctorId = editingDoctor.id || (editingDoctor as Doctor & { _id?: string })._id;
        if (!doctorId) {
          throw new Error('Doctor ID not found');
        }
        const raw = data as Record<string, unknown>;
        const payload = Object.fromEntries(
          Object.entries(raw).filter(([, v]) => v !== undefined && v !== '')
        ) as Partial<Doctor>;
        if (Object.keys(payload).length === 0) {
          toast.error('No changes to save');
          return;
        }
        await updateDoctorMutation.mutateAsync({
          doctorId,
          data: payload,
        });
      } else {
        const data = validate(createDoctorSchema, formData);
        if (!data) return;

        await createDoctorMutation.mutateAsync(data as Omit<Doctor, 'id'>);
      }
      handleCloseDialog();
    } catch {
      // Error already handled by hook
    }
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;

    try {
      const doctorId = doctorToDelete.id || (doctorToDelete as Doctor & { _id?: string })._id;
      if (!doctorId) {
        throw new Error('Doctor ID not found');
      }
      await deleteDoctorMutation.mutateAsync(doctorId);
      setIsDeleteDialogOpen(false);
      setDoctorToDelete(null);
    } catch {
      // Error already handled by hook
    }
  };

  const pendingDisplays = pendingRequests.map(req => pendingRequestToDisplay(req, doctors));

  const renderDoctorFields = (info: { phone_number?: string; gender?: string; city?: string }) => (
    <>
      {info.phone_number ? (
        <div className="flex items-center gap-2.5 text-sm">
          <span className="text-muted-foreground/70 font-medium min-w-[60px]">Phone:</span>
          <span className="text-foreground">{info.phone_number}</span>
        </div>
      ) : null}
      {info.gender ? (
        <div className="flex items-center gap-2.5 text-sm">
          <span className="text-muted-foreground/70 font-medium min-w-[60px]">Gender:</span>
          <span className="capitalize text-foreground">{info.gender}</span>
        </div>
      ) : null}
      {info.city ? (
        <div className="flex items-center gap-2.5 text-sm">
          <span className="text-muted-foreground/70 font-medium min-w-[60px]">City:</span>
          <span className="capitalize text-foreground">{capitalizeFirstLetter(info.city)}</span>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Doctors</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} registered
            </p>
            {hasMrDetails && docApproval === 1 ? (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-500/90">
                Doctor add, edit, or delete requests are sent for approval before they apply.
              </p>
            ) : null}
          </div>
          <Button onClick={() => handleOpenDialog()} size="default" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Doctor
          </Button>
        </div>
        <div
          className={cn(
            'grid gap-4 md:grid-cols-2 lg:grid-cols-3',
            doctors.length === 0 && pendingDisplays.length === 0 && 'flex-1'
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
                  <Skeleton className="w-3/4 h-4" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {isLoadingPending
                ? Array.from({ length: 1 }).map((_, i) => (
                    <Card
                      key={`pending-skeleton-${i}`}
                      className="border border-amber-200/80 bg-yellow-50 dark:bg-yellow-950/30"
                    >
                      <CardHeader className="pb-3">
                        <Skeleton className="mb-2 w-32 h-5" />
                        <Skeleton className="w-40 h-4" />
                      </CardHeader>
                      <CardContent className="py-4">
                        <Skeleton className="w-full h-4" />
                      </CardContent>
                    </Card>
                  ))
                : pendingDisplays.map(p => (
                    <Card
                      key={p.key}
                      className={cn(
                        'backdrop-blur-sm transition-all duration-200 hover:shadow-md',
                        'border-amber-200/90 bg-yellow-50',
                        'dark:border-amber-700/50 dark:bg-yellow-950/35'
                      )}
                    >
                      <CardHeader className="space-y-0">
                        <div className="flex gap-3 justify-between items-start">
                          <div className="flex-1 space-y-1 min-w-0">
                            <CardTitle className="text-lg font-semibold mb-0.5 truncate">
                              {p.name}
                            </CardTitle>
                            <CardDescription className="text-sm truncate text-muted-foreground/80">
                              {p.email || p.subtitle || 'No email'}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-amber-400/90 text-amber-950 hover:bg-amber-400/90 dark:bg-amber-500/90 dark:text-amber-950"
                          >
                            {p.pendingTag}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">{renderDoctorFields(p)}</CardContent>
                    </Card>
                  ))}
              {doctors.length === 0 && pendingDisplays.length === 0 && !isLoadingPending ? (
                <Card className="col-span-full border-dashed">
                  <CardContent className="flex flex-col justify-center flex-1 items-center py-12">
                    <p className="mb-1 text-base font-medium text-muted-foreground">
                      No doctors added yet
                    </p>
                    <p className="mb-6 text-sm text-muted-foreground/70">
                      Get started by adding your first doctor profile
                    </p>
                    <Button onClick={() => handleOpenDialog()} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Your First Doctor
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                doctors.map(doctor => (
                  <Card
                    key={doctor.id || (doctor as Doctor & { _id?: string })._id}
                    className="backdrop-blur-sm transition-all duration-200 hover:shadow-lg border-border/60 bg-card/50"
                  >
                    <CardHeader className="space-y-0">
                      <div className="flex gap-3 justify-between items-start">
                        <div className="flex-1 space-y-1 min-w-0">
                          <CardTitle className="text-lg font-semibold mb-0.5 truncate text-foreground">
                            {doctor.name}
                          </CardTitle>
                          <CardDescription className="text-sm truncate text-muted-foreground/80">
                            {doctor.email || 'No email'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(doctor)}
                            className="w-8 h-8 hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" aria-label="Edit doctor" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(doctor)}
                            className="w-8 h-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" aria-label="Delete doctor" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {renderDoctorFields(doctor)}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Doctor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            <DialogDescription>
              {editingDoctor
                ? 'Update doctor information below.'
                : 'Add a new doctor profile to your account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Doctor Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  value={formData.phone_number}
                  onChange={value => setFormData({ ...formData, phone_number: value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Note: This must be a WhatsApp number as reports will be sent here.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender ?? ''}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      gender: value === '' ? undefined : (value as Doctor['gender']),
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
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDoctorMutation.isPending || updateDoctorMutation.isPending}
              >
                {createDoctorMutation.isPending || updateDoctorMutation.isPending
                  ? 'Saving...'
                  : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Doctor Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {doctorToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDoctorToDelete(null)}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDoctorMutation.isPending}
            >
              {deleteDoctorMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
