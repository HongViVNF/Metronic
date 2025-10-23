import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { I18N_LANGUAGES, Language } from '@/i18n/config';
import {
  BetweenHorizontalStart,
  Coffee,
  CreditCard,
  FileText,
  Globe,
  Moon,
  Settings,
  Shield,
  User,
  UserCircle,
  Users,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useApp } from '@/providers/app-provider';
import { useLanguage } from '@/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { data: session } = useSession();
  const { changeLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { setSelectedApp } = useApp();
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
          href: '#',
        })),
      );
      setUserApps(apps);
    }
  }, [store]);

  // Sử dụng userApps thay vì mockApps
  const apps = userApps;

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang.code);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
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
          <Badge variant="primary" appearance="light" size="sm">
            Pro
          </Badge>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link
            href="/public-profile/profiles/default"
            className="flex items-center gap-2"
          >
            <UserCircle />
            Public Profile
          </Link>
        </DropdownMenuItem>
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
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="flex flex-col">
                    <span>{app.name}</span>
                    <span className="text-xs text-muted-foreground">
                      # {app.teamName}
                    </span>
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
          {/* <DropdownMenuSubContent className="w-48">
            {mockCompanies.map((company) => (
              <DropdownMenuItem key={company.id} asChild>
                <Link
                  href={company.href}
                  className="flex items-center gap-2"
                >
                  <Users />
                  {company.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent> */}
        </DropdownMenuSub>
        {/* My Account Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Settings />
            My Account
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href="/account/home/get-started"
                className="flex items-center gap-2"
              >
                <Coffee />
                Get Started
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account/home/user-profile"
                className="flex items-center gap-2"
              >
                <FileText />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account/billing/basic"
                className="flex items-center gap-2"
              >
                <CreditCard />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account/security/overview"
                className="flex items-center gap-2"
              >
                <Shield />
                Security
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account/members/teams"
                className="flex items-center gap-2"
              >
                <Users />
                Members & Roles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account/integrations"
                className="flex items-center gap-2"
              >
                <BetweenHorizontalStart />
                Integrations
              </Link>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Language Submenu with Radio Group */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 [&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden hover:[&_[data-slot=badge]]:border-input data-[state=open]:[&_[data-slot=badge]]:border-input">
            <Globe />
            <span className="flex items-center justify-between gap-2 grow relative">
              Language
              <Badge
                variant="outline"
                className="absolute end-0 top-1/2 -translate-y-1/2"
              >
                {language.name}
                <img
                  src={language.flag}
                  className="w-3.5 h-3.5 rounded-full"
                  alt={language.name}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={language.code}
              onValueChange={(value) => {
                const selectedLang = I18N_LANGUAGES.find(
                  (lang) => lang.code === value,
                );
                if (selectedLang) handleLanguage(selectedLang);
              }}
            >
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <img
                    src={item.flag}
                    className="w-4 h-4 rounded-full"
                    alt={item.name}
                  />
                  <span>{item.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Footer */}
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
        <div className="p-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              store.logout(); // Clear localStorage
              signOut(); // NextAuth logout
            }}
          >
            Logout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
