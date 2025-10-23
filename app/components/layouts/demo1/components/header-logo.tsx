import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, PanelRight } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useLayout } from './context';
import { HeaderSearch } from './header-search';
import { SidebarCommunities } from './sidebar-communities';
import { SidebarFeeds } from './sidebar-feeds';
import { SidebarPrimaryMenu } from './sidebar-primary-menu';
import { SidebarResourcesMenu } from './sidebar-resources-menu';

export function HeaderLogo() {
  const pathname = usePathname();
  const { isMobile, sidebarToggle } = useLayout();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Close sheet when route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 lg:w-(--sidebar-width) px-5">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" mode="icon" size="sm" className="-ms-1.5">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="p-0 gap-0 w-[225px] lg:w-(--sidebar-width)"
            side="left"
            close={false}
          >
            <SheetHeader className="p-0 space-y-0" />
            <SheetBody className="flex flex-col grow p-0">
              <HeaderSearch />
              <ScrollArea className="grow h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-4rem)] mt-0 mb-2.5 lg:my-7.5">
                <SidebarPrimaryMenu />
                <Separator className="my-2.5" />
                <SidebarFeeds />
                <Separator className="my-2.5" />
                <SidebarCommunities />
                <Separator className="my-2.5" />
                <SidebarResourcesMenu />
                <Separator className="my-2.5" />
              </ScrollArea>
            </SheetBody>
          </SheetContent>
        </Sheet>
      )}

      {/* Brand */}
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link href="/layout-12" className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/vnf-logo.png')}
              className="dark:hidden w-10 h-10 object-cover"
              alt="logo"
            />
            <img
              src={toAbsoluteUrl('/media/app/vnf-logo.png')}
              className="hidden dark:block w-10 h-10 object-cover"
              alt="logo dark"
            />
          </div>

          {/* Text bên phải */}
          <div className="flex flex-col justify-center leading-tight h-10">
            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
              Vietnam Food
            </span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">
              AI Platform V3.0
            </span>
          </div>
        </Link>

        {/* Sidebar toggle */}
        <Button
          mode="icon"
          variant="ghost"
          onClick={sidebarToggle}
          className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
        >
          <PanelRight className="-rotate-180 in-data-[sidebar-open=false]:rotate-0 opacity-100" />
        </Button>
      </div>
    </div>
  );
}
