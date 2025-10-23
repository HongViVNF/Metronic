"use client";

import * as React from "react";
import {
  LogOutIcon,
  MoreVerticalIcon,
  CheckIcon,
  UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

type User = {
  name: string;
  email: string;
  avatar: string;
  settings: Array<{
    name: string;
    url: string;
    icon: string;
    role: string;
  }> | null;
};

export function NavUser({
  user,
  avatar,
  onLogout,
  selectedRole,
  setSelectedRole,
  setShowProfileModal,
}: {
  user: User;
  avatar:string,
  onLogout: () => void;
  selectedRole: string | null;
  setSelectedRole: (role: string | null) => void;
  setShowProfileModal: (props: boolean) => void;
}) {
  const { isMobile } = useSidebar();

  // Get unique roles from user settings
  const roles = Array.from(
    new Set(user?.settings?.map((setting) => setting.role) || [])
  );
  React.useEffect(() => {
    if (selectedRole === null) {
      setSelectedRole(user?.settings?.[0]?.role || "");
    }
  }, []);
  // Normalize name for Vietnamese characters and get initials
  const getInitials = (name: string) => {
    const normalizedName = name
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    const words = normalizedName?.split(" ").filter((word) => word);
    if (words?.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0]?.slice(0, 2)?.toUpperCase() || "UN";
  };

  const initials = getInitials(user?.name);

  // Get display name for current role
  const getCurrentRoleDisplay = () => {
    return selectedRole;
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors duration-200 p-3"
            >
              <div className="relative">
                <Avatar className="rounded-full w-12 h-12 flex items-center justify-center border-2 border-white shadow-sm">
                  <AvatarImage
                    src={avatar}
                    alt={user?.name}
                    className="rounded-full object-cover"
                  />
                  <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                <span className="truncate font-semibold text-sidebar-foreground">
                  {user?.name}
                </span>
                <span className="truncate text-xs text-muted-foreground mb-0.5">
                  {user?.email}
                </span>
                {/* Current role indicator */}
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-blue-600 font-medium truncate">
                    {getCurrentRoleDisplay()}
                  </span>
                </div>
              </div>
              <MoreVerticalIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl shadow-lg border-0 bg-white/95 backdrop-blur-sm"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left border-b border-gray-100">
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-xl border-2 border-gray-200">
                    <AvatarImage
                      src={avatar}
                      alt={user?.name}
                      className="rounded-xl object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">
                    {getGreeting()}
                  </div>
                  <span className="truncate font-semibold text-gray-900">
                    {user?.name}
                  </span>
                  <span className="truncate text-xs text-gray-600">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-2 mb-1">
                Vai trò của bạn
              </div>
              <DropdownMenuGroup>
                {roles.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-lg mx-1 px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                      selectedRole === role
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={`p-1.5 rounded-lg ${
                          selectedRole === role ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <UserIcon
                          className={`h-4 w-4 ${
                            selectedRole === role
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <span className="font-medium flex-1">{role}</span>
                      {selectedRole === role && (
                        <CheckIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
            <DropdownMenuLabel className="px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wide">
              Thông tin cá nhân
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setShowProfileModal(true)}
              className={`rounded-lg mx-1 px-3 py-2.5 cursor-pointer transition-all duration-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-blue-100">
                  <UserIcon className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className="font-medium">Thông tin cá nhân</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2 bg-gray-100" />

            <div className="p-2">
              <DropdownMenuItem
                onClick={onLogout}
                className="rounded-lg mx-1 px-3 py-2.5 cursor-pointer hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-red-100">
                    <LogOutIcon className="h-4 w-4 text-gray-600 group-hover:text-red-600" />
                  </div>
                  <span className="font-medium">Đăng xuất</span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
