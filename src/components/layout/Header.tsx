import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Building2, LogOut, MapPin, Phone } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { getClinicInfo, getLogoUrl } from '@/lib/api/dashboard';
import type { ClinicInfo } from '@/lib/api/types';
import { formatClinicLocationSummary } from '@/lib/utils';

export const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        const [info, logo] = await Promise.all([
          getClinicInfo(),
          getLogoUrl().catch(() => null), // Logo might not exist
        ]);
        setClinicInfo(info);
        setLogoUrl(logo);
      } catch (error) {
        console.error('Failed to fetch clinic info:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClinicInfo();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex justify-end items-center px-6 h-16 border-b shadow-sm border-border bg-card">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex relative justify-center items-center rounded-full transition-all hover:ring-2 hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Open clinic menu"
          >
            {isLoading ? (
              <Skeleton className="w-9 h-9 rounded-full" />
            ) : (
              <Avatar className="w-9 h-9 border-2 transition-colors cursor-pointer border-border hover:border-primary/50">
                {logoUrl ? (
                  <AvatarImage src={logoUrl} alt={clinicInfo?.clinic_name || 'Clinic logo'} />
                ) : null}
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {clinicInfo?.clinic_name ? (
                    getInitials(clinicInfo.clinic_name)
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {isLoading ? (
            <div className="p-2 space-y-3">
              <Skeleton className="w-full h-16" />
              <Skeleton className="w-full h-12" />
            </div>
          ) : clinicInfo ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0">
                  <div className="flex gap-3 items-center px-2 py-3">
                    <Avatar className="w-12 h-12 border-2 border-border">
                      {logoUrl ? <AvatarImage src={logoUrl} alt={clinicInfo.clinic_name} /> : null}
                      <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                        {getInitials(clinicInfo.clinic_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-foreground">
                        {clinicInfo.clinic_name}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Clinic Information
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 space-y-3">
                  <div className="flex gap-2 items-start text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {clinicInfo.mr_details ? 'MR details' : 'Address'}
                      </p>
                      <p className="leading-relaxed text-foreground wrap-break-words">
                        {formatClinicLocationSummary(clinicInfo)}
                      </p>
                    </div>
                  </div>
                  {clinicInfo.primary_contact_phone && (
                    <div className="flex gap-2 items-center text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Contact</p>
                        <p className="text-foreground">{clinicInfo.primary_contact_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                className="gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuLabel className="px-2 py-4 text-sm text-center text-muted-foreground">
              Clinic information unavailable
            </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
