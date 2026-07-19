import { useEffect, useState } from 'react';

import { Building2, ImagePlus, MapPin, Phone, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { DoctorManagement } from '@/components/dashboard/DoctorManagement';
import { TestAdminManagement } from '@/components/dashboard/TestAdminManagement';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from '@/hooks/useMutation';
import { useQuery } from '@/hooks/useQuery';
import {
  getClinicInfo,
  getDoctors,
  getLogoUrl,
  getPendingDoctorRequests,
  uploadLogo,
} from '@/lib/api/dashboard';
import { getTestAdmins } from '@/lib/api/testAdmin';
import { formatClinicLocationSummary } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';

export const Profile = () => {
  const setDoctors = useDashboardStore(s => s.setDoctors);
  const setTestAdmins = useDashboardStore(s => s.setTestAdmins);

  const { data: clinicInfo, isLoading: isLoadingClinic } = useQuery({
    queryKey: ['clinicInfo'],
    queryFn: getClinicInfo,
    showErrorToast: false,
  });

  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });

  const { data: pendingDoctorRequests = [], isLoading: isLoadingPendingDoctorRequests } = useQuery({
    queryKey: ['pendingDoctorRequests'],
    queryFn: getPendingDoctorRequests,
  });

  const { data: testAdmins = [], isLoading: isLoadingTestAdmins } = useQuery({
    queryKey: ['testAdmins'],
    queryFn: getTestAdmins,
  });

  // Sync with Zustand for test data to be available in test pages
  useEffect(() => {
    if (doctors.length > 0) {
      setDoctors(doctors);
    }
  }, [doctors, setDoctors]);

  useEffect(() => {
    if (testAdmins.length > 0) {
      setTestAdmins(testAdmins);
    }
  }, [testAdmins, setTestAdmins]);

  const { data: logoUrl } = useQuery({
    queryKey: ['logoUrl'],
    queryFn: getLogoUrl,
    retry: false,
    showErrorToast: false,
  });

  // Logo state
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadLogoMutation = useMutation({
    mutationFn: uploadLogo,
    showSuccessToast: true,
    successMessage: 'Logo uploaded successfully',
    invalidateQueries: ['logoUrl'],
  });

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file');
      return;
    }

    try {
      await uploadLogoMutation.mutateAsync(logoFile);
      setIsLogoDialogOpen(false);
      setLogoFile(null);
      setLogoPreview(null);
    } catch {
      // Error already handled by hook
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPG, JPEG, and PNG files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearLogoFile = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
  };

  return (
    <>
      <title>Aignosis | Profile</title>
      <div className="flex flex-col space-y-8 h-full">
        {/* Clinic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Clinic Information</CardTitle>
            <CardDescription>View and manage your clinic information</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-6 items-start py-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Clinic logo"
                className="object-cover w-24 h-24 rounded-lg border-2 border-border/50"
              />
            ) : (
              <div className="flex justify-center items-center w-24 h-24 rounded-lg border-2 border-dashed border-border/50 bg-muted/30">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-4">
              {isLoadingClinic ? (
                <div className="space-y-2">
                  <Skeleton className="w-64 h-6" />
                  <Skeleton className="w-96 h-4" />
                  <Skeleton className="w-48 h-4" />
                </div>
              ) : clinicInfo ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{clinicInfo.clinic_name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 items-start">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="text-muted-foreground space-y-1">
                        {clinicInfo.mr_details ? (
                          <>
                            <p>
                              <span className="font-medium text-foreground">Employee ID:</span>{' '}
                              {clinicInfo.mr_details.employee_id}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Name:</span>{' '}
                              {clinicInfo.mr_details.employee_name}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">State:</span>{' '}
                              {clinicInfo.mr_details.state}
                            </p>
                            {(clinicInfo.mr_details.state_head ?? '') !== '' && (
                              <p>
                                <span className="font-medium text-foreground">State Head:</span>{' '}
                                {clinicInfo.mr_details.state_head}
                              </p>
                            )}
                            {(clinicInfo.mr_details.top_line_manager ?? '') !== '' && (
                              <p>
                                <span className="font-medium text-foreground">
                                  Top Line Manager:
                                </span>{' '}
                                {clinicInfo.mr_details.top_line_manager}
                              </p>
                            )}
                            <p>
                              <span className="font-medium text-foreground">Headquarters:</span>{' '}
                              {clinicInfo.mr_details.headquarters ?? clinicInfo.mr_details.pool}
                            </p>
                          </>
                        ) : (
                          <span>{formatClinicLocationSummary(clinicInfo)}</span>
                        )}
                      </div>
                    </div>
                    {clinicInfo.primary_contact_phone && (
                      <div className="flex gap-2 items-center">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          {clinicInfo.primary_contact_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Clinic information not available</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setIsLogoDialogOpen(true)}
              size="default"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>
          </CardContent>
        </Card>

        {/* Doctors List */}
        <DoctorManagement
          doctors={doctors}
          isLoading={isLoadingDoctors}
          docApproval={clinicInfo?.doc_approval}
          hasMrDetails={Boolean(clinicInfo?.mr_details)}
          pendingRequests={pendingDoctorRequests}
          isLoadingPending={isLoadingPendingDoctorRequests}
        />

        {/* Test Admins List */}
        <TestAdminManagement testAdmins={testAdmins} isLoading={isLoadingTestAdmins} />

        {/* Logo Upload Dialog */}
        <Dialog
          open={isLogoDialogOpen}
          onOpenChange={open => {
            setIsLogoDialogOpen(open);
            if (!open) {
              clearLogoFile();
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Clinic Logo</DialogTitle>
              <DialogDescription>Drag and drop an image or click to browse</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {logoPreview ? (
                <div className="relative group">
                  <div className="flex overflow-hidden justify-center items-center p-4 rounded-xl border-2 bg-muted/30 border-border">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="object-contain max-w-full max-h-48 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2 justify-between items-center mt-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {logoFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {logoFile && (logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearLogoFile}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                      <span className="ml-1">Remove</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    relative flex flex-col items-center justify-center w-full h-48
                    rounded-xl border-2 border-dashed cursor-pointer
                    transition-all duration-200 ease-out
                    ${
                      isDragOver
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={e => handleFileSelect(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className={`
                    flex justify-center items-center mb-3 w-14 h-14 rounded-full transition-colors
                    ${isDragOver ? 'bg-primary/20' : 'bg-muted'}
                  `}
                  >
                    <ImagePlus
                      className={`w-7 h-7 transition-colors ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <p className="mb-1 text-sm font-medium text-foreground">
                    {isDragOver ? 'Drop your image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 5MB)</p>
                </label>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLogoDialogOpen(false);
                  clearLogoFile();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogoUpload}
                disabled={!logoFile || uploadLogoMutation.isPending}
                className="gap-2"
              >
                {uploadLogoMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 animate-spin border-current border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
