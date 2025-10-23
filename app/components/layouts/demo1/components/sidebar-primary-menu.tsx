import { useCallback } from "react";
import { MENU_SIDEBAR_MAIN } from "@/config/layout-12.config";
import { MenuItem } from "@/config/types";
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubTrigger,
  AccordionMenuSubContent,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/app-provider';
import { Coffee, MessageSquare, CheckSquare, Settings } from 'lucide-react';

export function SidebarPrimaryMenu() {
  const pathname = usePathname();
  const { selectedApp } = useApp();

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean =>
      path === pathname || (path.length > 1 && pathname.startsWith(path) && path !== '/layout-12'),
    [pathname],
  );

  // Function lấy icon dựa trên app identifier
  const getAppIcon = (identifier: string) => {
    switch (identifier) {
      case 'social-manager':
        return MessageSquare;
      case 'welcome-management':
        return Settings;
      case 'task-management':
        return CheckSquare;
      default:
        return Coffee;
    }
  };

  // Logic tạo dynamic menu cho app đã chọn
  const getAppMenuChildren = (app: any) => {
    switch (app.identifier) {
      case 'social-manager':
        return [
          { title: 'Home', path: `/teams/apps/${app.identifier}/${app.appInstanceId}/home` },
          { title: 'Settings', path: `/teams/apps/${app.identifier}/${app.appInstanceId}/settings` },
        ];
      case 'welcome-management':
        return [
          { title: 'Home', path: `/welcome-management/home` },
          { title: 'Settings', path: `/welcome-management/settings` },
        ];
      case 'task-management':
        return [
          { title: 'Task List', path: `/task-managerment/task-list` },
          { title: 'Overview Task', path: `/task-managerment/mytask-followed` },
          { title: 'My Task', path: `/task-managerment/assignee-task` },
          { title: 'Task Chat', path: `/task-managerment/task-chat` },
        ];
      default:
        return [
          { title: 'Dashboard', path: `/teams/apps/${app.identifier}/${app.appInstanceId}/dashboard` },
          { title: 'Settings', path: `/teams/apps/${app.identifier}/${app.appInstanceId}/settings` },
        ];
    }
  };

  const dynamicMenu: MenuItem[] = selectedApp ? [
    {
      title: selectedApp.name,
      path: `/teams/apps/${selectedApp.identifier}/${selectedApp.appInstanceId}`,
      icon: getAppIcon(selectedApp.identifier),
      children: getAppMenuChildren(selectedApp)
    }
  ] : [];

  // Function build menu items
  const buildMenuItem = (item: MenuItem, index: number) => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `dynamic-${index}`}>
          <AccordionMenuSubTrigger className="text-sm font-medium">
            {selectedApp?.iconUrl ? (
              <img
                src={selectedApp.iconUrl}
                alt={selectedApp.name}
                className="w-4 h-4 rounded mr-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const iconElement = document.createElement('div');
                  iconElement.className = 'w-4 h-4 mr-2 flex items-center justify-center';
                  iconElement.innerHTML = '📱';
                  // Insert trước span title thay vì trước img
                  const titleSpan = target.parentNode?.querySelector('[data-slot="accordion-menu-title"]');
                  if (titleSpan) {
                    target.parentNode?.insertBefore(iconElement, titleSpan);
                  } else {
                    target.parentNode?.insertBefore(iconElement, target);
                  }
                }}
              />
            ) : (
              item.icon && <item.icon data-slot="accordion-menu-icon" />
            )}
            <span data-slot="accordion-menu-title">{item.title}</span>
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent type="single" collapsible parentValue={item.path || `dynamic-${index}`} className="ps-6">
            {item.children.map((child: MenuItem, childIndex: number) => (
              <AccordionMenuItem key={childIndex} value={child.path || '#'}>
                <Link href={child.path || '#'} className="flex items-center justify-between grow gap-2">
                  <span>{child.title}</span>
                </Link>
              </AccordionMenuItem>
            ))}
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem key={index} value={item.path || '#'}>
          <Link href={item.path || '#'} className="flex items-center justify-between grow gap-2">
            {selectedApp?.iconUrl ? (
              <img
                src={selectedApp.iconUrl}
                alt={selectedApp.name}
                className="w-4 h-4 rounded mr-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const iconElement = document.createElement('div');
                  iconElement.className = 'w-4 h-4 mr-2 flex items-center justify-center';
                  iconElement.innerHTML = '📱';
                  // Insert trước span title thay vì trước img
                  const titleSpan = target.parentNode?.querySelector('[data-slot="accordion-menu-title"]');
                  if (titleSpan) {
                    target.parentNode?.insertBefore(iconElement, titleSpan);
                  } else {
                    target.parentNode?.insertBefore(iconElement, target);
                  }
                }}
              />
            ) : (
              item.icon && <item.icon data-slot="accordion-menu-icon" />
            )}
            <span data-slot="accordion-menu-title">{item.title}</span>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  return (
    <AccordionMenu
      selectedValue={pathname}
      matchPath={matchPath}
      type="multiple"
      className="space-y-4 px-2.5"
      classNames={{
        label: 'text-xs font-normal text-muted-foreground mb-2',
        item: 'h-8.5 px-2.5 text-sm font-normal text-foreground hover:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium data-[selected=true]:text-foreground [&[data-selected=true]_svg]:opacity-100',
        group: '',
      }}
    >
      {/* Dynamic menu cho app đã chọn */}
      {dynamicMenu.map((item, index) => buildMenuItem(item, index))}

      {/* Main menu tĩnh */}
      {MENU_SIDEBAR_MAIN.map((item: MenuItem, index: number) => {
        return (
          <AccordionMenuGroup key={`main-${index}`}>
            <AccordionMenuLabel>
              {item.title}
            </AccordionMenuLabel>
            {item.children?.map((child: MenuItem, childIndex: number) => {
              return (
                <AccordionMenuItem key={`child-${childIndex}`} value={child.path || '#'}>
                  <Link href={child.path || '#'}>
                    {child.icon && <child.icon />}
                    <span>{child.title}</span>
                    {child.badge === 'Beta' && <Badge size="sm" variant="destructive" appearance="light">{child.badge}</Badge>}
                  </Link>
                </AccordionMenuItem>
              )
            })}
          </AccordionMenuGroup>
        )
      })}
    </AccordionMenu>
  );
}
