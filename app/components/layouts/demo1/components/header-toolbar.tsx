import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckSquare,
  Clock,
  Download,
  ExternalLink,
  LogOut,
  Mails,
  MessageSquare,
  Moon,
  NotepadText,
  Plus,
  Settings,
  Shield,
  Sun,
  Target,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useStore } from '@/lib/store';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useApp } from '@/providers/app-provider';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export function HeaderToolbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { setSelectedApp } = useApp();
  const router = useRouter();
  const store = useStore();
  const [userApps, setUserApps] = useState<any[]>([]);

  // Load apps data từ localStorage
  useEffect(() => {
    if (store.workContext?.apps) {
      const apps = store.workContext.apps.flatMap((app: any) =>
        app.instances.map((instance: any) => ({
          id: instance.id,
          name: instance.name,
          teamName: instance.teamName,
          identifier: instance.identifier,
          appInstanceId: instance.appInstanceId,
          iconUrl: instance.iconUrl,
          href: '#',
        })),
      );
      setUserApps(apps);
    }
  }, [store]);

  // Sử dụng userApps thay vì mockApps
  const apps = userApps;

  const getAppMenuChildren = (app: any) => {
    switch (app.identifier) {
      case 'social-manager':
        return [
          {
            title: 'Home',
            path: `/teams/apps/${app.identifier}/${app.appInstanceId}/home`,
          },
          {
            title: 'Settings',
            path: `/teams/apps/${app.identifier}/${app.appInstanceId}/settings`,
          },
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
          {
            title: 'Dashboard',
            path: `/teams/apps/${app.identifier}/${app.appInstanceId}/dashboard`,
          },
          {
            title: 'Settings',
            path: `/teams/apps/${app.identifier}/${app.appInstanceId}/settings`,
          },
        ];
    }
  };

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
        return Settings;
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <nav className="flex items-center gap-2.5">
      <Button variant="ghost">
        <Plus /> Create
      </Button>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Mails className="opacity-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <NotepadText className="opacity-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="opacity-100" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer">
          {session?.user && (session.user as any)?.avatar ? (
            <Avatar className="size-7">
              <AvatarImage
                src={(session.user as any)?.avatar}
                alt="User Avatar"
              />
              <AvatarIndicator className="-end-2 -top-2">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
          ) : (
            <div className="size-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" side="bottom" align="end">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              {session?.user && (session.user as any)?.avatar ? (
                <img
                  className="w-9 h-9 rounded-full border border-border"
                  src={(session.user as any)?.avatar}
                  alt="User avatar"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 border border-border flex items-center justify-center">
                  <span className="text-blue-600 text-lg font-semibold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <Link
                  href="/account/home/get-started"
                  className="text-sm text-mono hover:text-primary font-semibold"
                >
                  {session?.user.name || ''}
                </Link>
                <Link
                  href="mailto:c.fisher@gmail.com"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {session?.user.email || ''}
                </Link>
              </div>
            </div>
          </div>

          {/* <DropdownMenuItem className="cursor-pointer py-1 rounded-md border border-border hover:bg-muted">
            <Clock/>
            <span>Set availability</span>
          </DropdownMenuItem> */}

          <DropdownMenuSeparator />

          {/* My App Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Settings />
              My App
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {apps.map((app: any) => (
                <DropdownMenuItem key={app.id} asChild>
                  <Link
                    href={app.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedApp(app);
                      // Save to recently used apps
                      store.setCurrentApp(app);

                      // Navigate đến menu it em đầu tiên của app
                      const firstMenuItem = getAppMenuChildren(app)[0];
                      if (firstMenuItem && firstMenuItem.path) {
                        router.push(firstMenuItem.path);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {app.iconUrl ? (
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            // Fallback to default icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallbackIcon = document.createElement('div');
                            fallbackIcon.className =
                              'w-4 h-4 flex items-center justify-center';
                            fallbackIcon.innerHTML = '📱';
                            // Insert vào đúng vị trí trong flex container
                            const flexContainer = target.parentNode;
                            if (flexContainer) {
                              flexContainer.insertBefore(fallbackIcon, target);
                            }
                          }}
                        />
                      ) : (
                        (() => {
                          const IconComponent = getAppIcon(app.identifier);
                          return <IconComponent className="w-4 h-4" />;
                        })()
                      )}
                      <div className="flex flex-col">
                        <span>{app.name}</span>
                        <span className="text-xs text-muted-foreground">
                          # {app.teamName}
                        </span>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {/* My Company Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Settings />
              My Company
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {apps.map((app: any) => (
                <DropdownMenuItem key={app.id} asChild>
                  <Link
                    href={app.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedApp(app);
                      // Save to recently used apps
                      store.setCurrentApp(app);

                      // Navigate đến menu it em đầu tiên của app
                      const firstMenuItem = getAppMenuChildren(app)[0];
                      if (firstMenuItem && firstMenuItem.path) {
                        router.push(firstMenuItem.path);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {app.iconUrl ? (
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            // Fallback to default icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallbackIcon = document.createElement('div');
                            fallbackIcon.className =
                              'w-4 h-4 flex items-center justify-center';
                            fallbackIcon.innerHTML = '📱';
                            // Insert vào đúng vị trí trong flex container
                            const flexContainer = target.parentNode;
                            if (flexContainer) {
                              flexContainer.insertBefore(fallbackIcon, target);
                            }
                          }}
                        />
                      ) : (
                        (() => {
                          const IconComponent = getAppIcon(app.identifier);
                          return <IconComponent className="w-4 h-4" />;
                        })()
                      )}
                      <div className="flex flex-col">
                        <span>{app.name}</span>
                        <span className="text-xs text-muted-foreground">
                          # {app.teamName}
                        </span>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Core Actions */}
          {/* <DropdownMenuItem>
            <Target/>
            <span>My Projects</span>
            <Badge variant="info" size="sm" appearance="outline" className="ms-auto">3</Badge>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Users/>
            <span>Team Management</span>
          </DropdownMenuItem> 

          <DropdownMenuItem>
            <Building2/>
            <span>Organization</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />*/}

          {/* Settings */}
          <DropdownMenuItem>
            <User />
            <span>Profile Settings</span>
          </DropdownMenuItem>

          {/* <DropdownMenuItem>
            <Settings/>
            <span>Preferences</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Shield/>
            <span>Security</span>
          </DropdownMenuItem> */}

          <DropdownMenuSeparator />

          {/* Theme Toggle */}

          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(event) => event.preventDefault()}
          >
            <Moon />
            <div className="flex items-center gap-2 justify-between grow">
              Dark Mode
              <Switch
                size="sm"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Developer Tools */}
          {/* <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Zap/>
              <span>Developer Tools</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem>API Documentation</DropdownMenuItem>
              <DropdownMenuItem>Code Repository</DropdownMenuItem>
              <DropdownMenuItem>Testing Suite</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem>
            <Download/>
            <span>Download SDK</span>
            <ExternalLink className="size-3 ms-auto" />
          </DropdownMenuItem>

          <DropdownMenuSeparator /> */}

          {/* Action Items */}
          <DropdownMenuItem
            onClick={() => {
              store.logout(); // Clear localStorage
              signOut(); // NextAuth logout
            }}
          >
            <LogOut />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
