'use client';

import { useSession } from '@/lib/auth/session-context';
import { Icons } from '@/components/icons';
import { AvenraIcon } from '@/components/brand/avenra-logo';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

export function OrgSwitcher() {
  const { isMobile, state } = useSidebar();
  // Side menus open to the right: 8px from the expanded sidebar, 16px off the icon rail
  const railMenu = state === 'collapsed' && !isMobile;
  const router = useRouter();
  const { memberships, membership, setActiveOrganization } = useSession();
  const orgId = membership?.organization.id ?? null;

  const handleOrganizationSwitch = (organizationId: string) => {
    if (orgId === organizationId) return;
    setActiveOrganization(organizationId);
  };

  // Show create organization option if no organizations
  if (memberships.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size='lg'
            onClick={() => router.push('/dashboard/workspaces')}
            className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
          >
            <div className='flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
              <AvenraIcon size={26} />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-semibold tracking-wide'>AVENRA</span>
              <span className='text-muted-foreground truncate text-xs'>Firm Platform</span>
            </div>
            <Icons.chevronsUpDown
              className={`text-muted-foreground ml-auto transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Use active organization or first organization as fallback
  if (!membership) {
    return null;
  }
  const displayOrganization = membership.organization;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
              />
            }
          >
            <div className='flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
              <AvenraIcon size={26} />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-medium' title={displayOrganization.name}>
                {displayOrganization.name}
              </span>
              <span className='text-muted-foreground truncate text-xs'>
                {formatRole(membership.role)}
              </span>
            </div>
            <Icons.chevronsUpDown
              className={`text-muted-foreground ml-auto transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-72 max-w-[calc(100vw-2rem)]'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={isMobile ? 4 : railMenu ? 16 : 8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {memberships.map((item) => {
                const isActive = item.organization.id === orgId;
                return (
                  <DropdownMenuItem
                    key={item.membershipId}
                    onClick={() => handleOrganizationSwitch(item.organization.id)}
                    className='items-start gap-2 p-1.5'
                  >
                    <div className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border'>
                      <Icons.galleryVerticalEnd className='size-3.5 shrink-0' />
                    </div>
                    {/* Names wrap instead of truncating so similar org names stay distinguishable */}
                    <div className='grid min-w-0 flex-1 leading-tight'>
                      <span className='text-pretty wrap-break-word'>{item.organization.name}</span>
                      <span className='text-muted-foreground text-xs'>{formatRole(item.role)}</span>
                    </div>
                    {isActive && <Icons.check className='mt-1.5 ml-auto size-4' />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className='gap-2 p-1.5'
                onClick={() => {
                  router.push('/dashboard/workspaces');
                }}
              >
                <div className='flex size-7 items-center justify-center rounded-md border bg-transparent'>
                  <Icons.add className='size-4' />
                </div>
                <div className='text-muted-foreground font-medium'>Add organization</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
