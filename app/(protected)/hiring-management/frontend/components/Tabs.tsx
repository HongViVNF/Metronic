'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTab } from "../hooks/useTab";

interface TabItem {
  name: string;
  id: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  className?: string;
  defaultTab?: string;
  variant?: 'default' | 'underline' | 'pills';
  activeTab?: string;
}

export function Tabs({ 
  tabs, 
  className, 
  defaultTab = 'overview',
  variant = 'default',
  activeTab: externalActiveTab
}: TabsProps) {
  const pathname = usePathname();
  const { activeTab: internalActiveTab, createHref } = useTab(defaultTab);
  const activeTab = externalActiveTab || internalActiveTab;

  return (
    <div className={cn(
      "border-b border-gray-200", 
      className,
      variant === 'pills' && 'border-none'
    )}>
      <nav className={cn(
        "flex space-x-8",
        variant === 'pills' && 'gap-2'
      )} aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <Link
              key={tab.id}
              href={createHref(tab.id)}
              scroll={false}
              className={cn(
                // Base style
                "flex items-center whitespace-nowrap px-1 py-4 text-sm font-medium transition-colors",
                
                // Default variant
                variant === 'default' && [
                  'border-b-2',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ],
                
                // Underline variant
                variant === 'underline' && [
                  'border-b',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ],
                
                // Pills variant
                variant === 'pills' && [
                  'rounded-md px-3 py-2 text-sm',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                ]
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && (
                <span className="mr-2">
                  {tab.icon}
                </span>
              )}
              {tab.name}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    isActive 
                      ? variant === 'pills' 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}