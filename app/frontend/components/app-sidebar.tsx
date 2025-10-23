"use client";

import * as React from "react";
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CameraIcon,
  CameraOffIcon,
  ClipboardListIcon,
  CogIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  GraduationCapIcon,
  HelpCircleIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  ListIcon,
  MessageSquareIcon,
  NotebookPenIcon,
  PresentationIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
  VideoIcon,
  SparklesIcon,
  BookmarkIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FormInputIcon,
} from "lucide-react";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "./ui/sidebar";
import packageJson from '../../../package.json'; // đường dẫn tùy thuộc vào cấu trúc dự án
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const iconMap: { [key: string]: React.ComponentType<any> } = {
  FileTextIcon: FileTextIcon,
  VideoIcon: VideoIcon,
  NotebookPenIcon: NotebookPenIcon,
  GraduationCapIcon: GraduationCapIcon,
  CalendarDaysIcon: CalendarDaysIcon,
  TrendingUpIcon: TrendingUpIcon,
  MessageSquareIcon: MessageSquareIcon,
  ListChecksIcon: ListChecksIcon,
  PresentationIcon: PresentationIcon,
  StarIcon: StarIcon,
  CogIcon: CogIcon,
  SearchIcon: SearchIcon,
};

const data = {
  navMain: [
    // {
    //   title: "Khóa học của tôi",
    //   url: "/courses",
    //   icon: BookOpenIcon,
    //   description: "Khóa học đã đăng ký",
    // },
    {
      name: "Danh sách khóa học",
      url: "/courses",
      icon: PresentationIcon,
      description: "Danh sách khóa học có sẵn",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Kết quả học tập",
      url: "/scorecourse",
      icon: StarIcon,
      description: "Xem điểm số và đánh giá",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },

  ],
  classTools: [
    {
      name: "Danh sách lớp học",
      url: "/classes",
      icon: GraduationCapIcon,
      description: "Danh sách lớp học",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Thời khóa biểu",
      url: "/classes-calendar",
      icon: CalendarDaysIcon,
      description: "Thời khóa biểu",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Bài tập thực hành",
      url: "/quan-ly-bai-tap",
      icon: ListChecksIcon,
      description: "Kết quả bài tập và thực hành",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ],
  learningTools: [
    // {
    //   name: "Video bài giảng",
    //   url: "/transcript-video",
    //   icon: VideoIcon,
    //   description: "Xem và học từ video bài giảng",
    //   color: "text-blue-600",
    //   bgColor: "bg-blue-50",
    //   stats: "24 video",
    // },
    // {
    //   name: "Bài kiểm tra",
    //   url: "/quan-ly-bai-thi",
    //   icon: MessageSquareIcon,
    //   description: "Kết quả bài kiểm tra",
    //   color: "text-cyan-600",
    //   bgColor: "bg-cyan-50",
    // },
    {
      name: "Danh sách đề thi",
      url: "/quan-ly-de-thi",
      icon: MessageSquareIcon,
      description: "Quản lý đề thi",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },

    {
      name: "Ngân hàng đề thi",
      url: "/quan-ly-ngan-hang-de-thi",
      icon: MessageSquareIcon,
      description: "Quản lý ngân hàng đề thi",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },

    {
      name: "Ngân hàng câu hỏi",
      url: "/quan-ly-cau-hoi",
      icon: MessageSquareIcon,
      description: "Quản lý câu hỏi và đáp án",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },

    {
      name: "Danh sách đề mục",
      url: "/quan-ly-section",
      icon: MessageSquareIcon,
      description: "Quản lý đề mục",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Mẫu khảo sát đánh giá",
      url: "/form",
      icon: MessageSquareIcon,
      description: "Mẫu khảo sát đánh giá",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    }
  ],
  candidate: [
    {
      name: "Quản lý ứng viên",
      url: "/candidate",
      icon: GraduationCapIcon,
      description: "Quản lý ứng viên",
    },
  ],
  hiring:[
    {
      name: "Quản lý tuyển dụng",
      url: "/hiring",
      icon: GraduationCapIcon,
      description: "Quản lý tuyển dụng",
    },
  ],
  courseManagement: [
    {
      name: "Danh sách khóa học",
      url: "/managecourses",
      icon: GraduationCapIcon,
      description: "Quản lý khóa học",
    },
    {
      name: "Danh sách lớp học",
      url: "/manage-class",
      icon: GraduationCapIcon,
      description: "Quản lý lớp học",
    },
    {
      name: "Lộ trình đào tạo",
      url: "/training-path",
      icon: GraduationCapIcon,
      description: "Quản lý lộ trình đào tạo",
    },
    {
      name: "Danh sách trình độ",
      url: "/levels",
      icon: GraduationCapIcon,
      description: "Quản lý trình độ",
    },

    {
      name: "Danh sách nhóm",
      url: "/group",
      icon: GraduationCapIcon,
      description: "Quản lý nhóm",
    }
    // {
    //   title: "Tiến độ học tập",
    //   url: "/theo-doi-progress",
    //   icon: TrendingUpIcon,
    //   description: "Theo dõi kết quả học tập",
    // },
    // {
    //   title: "Lịch dạy",
    //   url: "/calendar-lecture",
    //   icon: CalendarDaysIcon,
    //   description: "Lịch trình dạy hôm nay",
    //   badge: "Hôm nay",
    // },
    // {
    //   name: "Thống kê học tập",
    //   url: "/stats",
    //   icon: BarChartIcon,
    //   description: "Thống kê kết quả học tập",
    //   color: "text-red-600",
    //   bgColor: "bg-red-50",
    // },
    // {
    //   name: "Quản lý điểm danh",
    //   url: "/attendance",
    //   icon: ClipboardListIcon,
    //   description: "Quản lý điểm danh học viên",
    //   color: "text-red-600",
    //   bgColor: "bg-red-50",
    // },

  ],
  statsCourse: [

    // {
    //   name: "Thống kê học tập",
    //   url: "/stats",
    //   icon: BarChartIcon,
    //   description: "Thống kê kết quả học tập",
    //   color: "text-red-600",
    //   bgColor: "bg-red-50",
    // },
    {
      name: "Báo cáo tổng quan",
      url: "/overviewreport",
      icon: BarChartIcon,
      description: "Báo cáo tổng quan",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      name: "Báo cáo học tập",
      url: "/coursesreport",
      icon: BarChartIcon,
      description: "Báo cáo học tập",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      name: "Thống kê học viên",
      url: "/stats-users",
      icon: BarChartIcon,
      description: "Thống kê học viên",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      name: "Thống kê bài thi",
      url: "/quan-ly-bai-thi",
      icon: NotebookPenIcon,
      description: "Thống kê bài thi",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      name: "Thống kê bài thực hành",
      url: "/quan-ly-bai-tap",
      icon: ListChecksIcon,
      description: "Thống kê bài thực hành",
      color: "text-red-600",
      bgColor: "bg-red-50",
    }


  ],
  adminTools: [
    {
      name: "Danh sách nhân viên",
      url: "/quan-tri-app",
      icon: CogIcon,
      description: "Danh sách nhân viên",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      name: "Phân quyền khoá học",
      url: "/permisson-course",
      icon: CogIcon,
      description: "Phân quyền khoá học",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ],
  navSecondary: [
    {
      title: "Cài đặt",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Tìm kiếm",
      url: "#",
      icon: SearchIcon,
    },
  ],
};

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

// Custom NavItem component for better styling
function NavItem({
  item,
  onItemClick,
  isCompact = false,
}: {
  item: any;
  onItemClick: (url: string) => void;
  isCompact?: boolean;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => onItemClick(item.url)}
        className={`group relative w-full h-auto rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 ${item.isActive ? "bg-blue-50 border-blue-200 text-blue-700" : ""
          } p-0`}
      >
        <div className="flex items-start gap-3 w-full px-3 py-2.5">
          <div
            className={`flex-shrink-0 rounded-lg p-1.5 transition-colors ${item.isActive ? "bg-blue-100" : item.bgColor || "bg-gray-100"
              }`}
          >
            <Icon
              className={`h-4 w-4 ${item.isActive ? "text-blue-600" : item.color || "text-gray-600"
                }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={`font-medium text-sm truncate ${item.isActive ? "text-blue-700" : "text-gray-700"
                  }`}
              >
                {item.name || item.title}
              </span>
              {item.badge && (
                <span className="flex-shrink-0 ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>

            {!isCompact && item.description && (
              <p className="text-xs text-gray-500 mb-0.5 line-clamp-1">
                {item.description}
              </p>
            )}

            {item.stats && (
              <p className="text-xs text-gray-400 mb-0.5">{item.stats}</p>
            )}

            {item.progress && (
              <div className="mt-1.5">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {item.progress}% hoàn thành
                </span>
              </div>
            )}
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Collapsible Group Component
function CollapsibleGroup({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  titleColor = "text-gray-500",
}: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  titleColor?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 -mx-2 transition-colors ${titleColor}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center text-xs font-semibold uppercase tracking-wide">
          <Icon className="h-3 w-3 mr-2 flex-shrink-0" />
          {!isCollapsed && title}
        </div>
        {!isCollapsed && (
          <button className="ml-auto p-0.5 hover:bg-gray-200 rounded transition-colors">
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
          </button>
        )}
      </SidebarGroupLabel>
      {(isExpanded || isCollapsed) && (
        <SidebarGroupContent
          className={`transition-all duration-200 ${isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}
        >
          {children}
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}
const fetchUser = async (email: string) => {
  const encodedEmail = btoa(email);
  const response = await fetch(`/api/users/${encodedEmail}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
};
export function AppSidebar({
  onLogout,
  user,
  avatar,
  onItemClick,
  setShowProfileModal
}: React.ComponentProps<typeof Sidebar> & {
  onLogout: () => void;
  user: User;
  avatar: string;
  onItemClick: (url: string) => void;
  setShowProfileModal: (props: boolean) => void
}) {
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  console.log("dadadadad", user)
  const { data: session } = useSession();
  const { data: fetchedUser } = useQuery({
    queryKey: ["user", session?.user?.email],
    queryFn: () => fetchUser(session?.user?.email!),
    refetchInterval: 5000, // 10 giây
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: !!session?.user?.email,
    staleTime: 5000, // Data được coi là fresh trong 5s
  });
  // Map settings to include proper icon components
  const users = fetchedUser || data;
  console.log("yuaer", users)
  const mappedSettings = fetchedUser?.settings?.map((setting: any) => ({
    ...setting,
    icon: iconMap[setting.icon] || FileTextIcon,
  }));
  console.log("mappsetting", mappedSettings)

  // Check if user is admin
  const isAdmin = user?.email === "tuan.c.nguyen@vnfoods.vn";

  // Filter items based on role and permissions
  const getFilteredItems = (items: any[]) => {
    // If admin, show all items
    if (isAdmin) return items;

    // If no settings, show nothing
    if (!mappedSettings || mappedSettings.length === 0) return [];

    // If no role selected, show nothing for better UX
    if (!selectedRole) return [];

    // Filter items that:
    // 1. Have a matching URL in user settings
    // 2. Have the selected role
    const filteredItems = items.filter((item) => {
      return mappedSettings.some(
        (setting: any) => setting.url === item.url && setting.role === selectedRole
      );
    });

    console.log(
      "Filtering items for role:",
      selectedRole,
      "Result:",
      filteredItems
    );
    return filteredItems;
  };

  // Check if a group should be visible (has at least one visible item)
  const shouldShowGroup = (items: any[]) => {
    const filteredItems = getFilteredItems(items);
    return filteredItems.length > 0;
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0 bg-gray-50/50">
      <SidebarHeader className="border-b border-gray-100  bg-gray-80/80 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-3 data-[slot=sidebar-menu-button]"
            >
              <div className="flex flex-col items-center justify-center min-h-[80px] py-2" style={{ marginTop: "-20px" }} >
                <div className="flex flex-col items-center gap-1">
                  <img
                    src="https://res.cloudinary.com/dk9dk5z3i/image/upload/v1747112581/cfpnwdsmpwkipg1vnogl.png"
                    alt="Logo"
                    className="h-[100px] w-auto"
                  />
                  {!isCollapsed && (
                    <h5 className="text-xs text-gray-500 text-center whitespace-nowrap" style={{ marginTop: "-35px" }}>
                      Version {packageJson.version}
                    </h5>
                  )}
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-4">
        {/* Main Navigation - Show based on role */}
        {shouldShowGroup(data.navMain) && (
          <CollapsibleGroup
            title="Khóa học"
            icon={HomeIcon}
            defaultExpanded={true}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.navMain).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}
        {shouldShowGroup(data.classTools) && (
          <CollapsibleGroup
            title="Lớp học"
            icon={BookOpenIcon}
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.classTools).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}
        {shouldShowGroup(data.courseManagement) && (
          <CollapsibleGroup
            title="Quản lý đào tạo"
            icon={GraduationCapIcon}
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.courseManagement).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}
        {/* Learning Tools - Only show if user has access to at least one item */}
        {shouldShowGroup(data.learningTools) && (
          <CollapsibleGroup
            title="Quản lý nội dung"
            icon={BookOpenIcon}
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.learningTools).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}

        {shouldShowGroup(data.hiring) && (
          <CollapsibleGroup
            title="Quản lý thuê tuyển nhân viên "
            icon={BookOpenIcon}
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.hiring).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}

        {/* Course Management - Only show if user has access to at least one item */}

        {shouldShowGroup(data.statsCourse) && (
          <CollapsibleGroup
            title="Báo cáo"
            icon={BarChartIcon}
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.statsCourse).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}
        {shouldShowGroup(data.candidate) && (
          <CollapsibleGroup
            title="Hệ thống"
            icon={CogIcon}
            titleColor="text-red-500"
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.candidate).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}
        {shouldShowGroup(data.adminTools) && (
          <CollapsibleGroup
            title="Hệ thống"
            icon={CogIcon}
            titleColor="text-red-500"
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {getFilteredItems(data.adminTools).map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )}

        {/* Admin Tools - Only for admin */}
        {/* {isAdmin && (
          <CollapsibleGroup
            title="Quản trị viên"
            icon={CogIcon}
            titleColor="text-red-500"
            defaultExpanded={false}
          >
            <SidebarMenu className="space-y-1">
              {data.adminTools.map((item) => (
                <NavItem
                  key={item.url}
                  item={item}
                  onItemClick={onItemClick}
                  isCompact={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </CollapsibleGroup>
        )} */}

        {/* Show message when no role selected or no items available */}
        {!isAdmin &&
          (!selectedRole ||
            (!shouldShowGroup(data.navMain) &&
              !shouldShowGroup(data.learningTools) &&
              !shouldShowGroup(data.courseManagement))) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-gray-400 text-sm">
                {!selectedRole
                  ? "Vui lòng chọn vai trò để xem menu"
                  : "Không có menu nào khả dụng cho vai trò này"}
              </div>
            </div>
          )}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 bg-white/80 backdrop-blur-sm p-3">
        <NavUser
          user={user}
          avatar={avatar}
          onLogout={onLogout}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          setShowProfileModal={setShowProfileModal}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

