'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { useApp } from '@/providers/app-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';

export default function AppsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});
  const [apps, setApps] = useState<any[]>([]);
  const [recentlyUsedApps, setRecentlyUsedApps] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { setSelectedApp } = useApp();
  const router = useRouter();
  const store = useStore();

  // Load apps data từ localStorage
  useEffect(() => {
    if (store.workContext?.apps) {
      setApps(store.workContext.apps);
    } else {
      // Nếu không có data, có thể redirect về login hoặc hiển thị loading
      console.warn('No workContext data found in localStorage');
    }

    // Load recently used apps (handle empty array)
    setRecentlyUsedApps(store.recentlyUsedApps || []);
  }, [store]);

  const toggleTeam = (teamName: string) => {
    setOpenTeams((prev) => ({ ...prev, [teamName]: !prev[teamName] }));
  };

  const groupedInstances = useMemo(() => {
    const groups: Record<string, any[]> = {};
    apps.forEach((app: any) => {
      const teamName = app.team.name;
      if (!groups[teamName]) {
        groups[teamName] = [];
      }
      groups[teamName].push(
        ...app.instances.map((instance: any) => ({
          ...instance,
          teamName,
          teamId: app.team.id,
        })),
      );
    });
    return groups;
  }, [apps]);

  const filteredGroupedInstances = useMemo(() => {
    if (!searchTerm && activeFilter === 'all') return groupedInstances;

    const filtered: Record<string, any[]> = {};
    Object.entries(groupedInstances).forEach(([teamName, instances]) => {
      let filteredInstances = instances;

      // Filter by search term
      if (searchTerm) {
        filteredInstances = filteredInstances.filter((instance: any) =>
          instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instance.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by category
      if (activeFilter !== 'all') {
        filteredInstances = filteredInstances.filter((instance: any) => {
          // Map categories to app identifiers
          const categoryMapping: Record<string, string[]> = {
            'document': ['document-manager', 'doc-processor'],
            'back-office': ['task-management', 'workflow-manager'],
            'automation': ['social-manager', 'welcome-management', 'automation-utility']
          };

          return categoryMapping[activeFilter]?.includes(instance.identifier) ||
                 (activeFilter === 'automation' && instance.identifier.includes('automation'));
        });
      }

      filtered[teamName] = filteredInstances; // Always include team, even with empty array
    });
    return filtered;
  }, [groupedInstances, searchTerm, activeFilter]);

  // Auto-open teams with search results
  useEffect(() => {
    if (searchTerm) {
      const newOpenTeams: Record<string, boolean> = {};
      Object.entries(filteredGroupedInstances).forEach(
        ([teamName, instances]) => {
          if (instances.length > 0) {
            newOpenTeams[teamName] = true;
          }
        },
      );
      setOpenTeams(newOpenTeams);
    } else {
      setOpenTeams({});
    }
  }, [searchTerm, filteredGroupedInstances, activeFilter]);

  return (
    <div className="container mx-auto px-4 max-w-7xl min-h-screen">
      {/* Sticky Header with Title and Search */}
      <div className="fixed top-[60px] lg:top-[60px] left-[var(--sidebar-width)] right-0 bg-white z-40">
        <div className="py-6">
          <div className="mb-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-blue-700">
              Apps Library
            </h1>
            <p className="text-gray-700 mt-2 text-lg">
              Use the search box to find the AI apps you need.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-center mt-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('document')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'document'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Document
              </button>
              <button
                onClick={() => setActiveFilter('back-office')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'back-office'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Back Office
              </button>
              <button
                onClick={() => setActiveFilter('automation')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === 'automation'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Automation Utility
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with padding top to account for sticky header */}
      <div className="pt-[280px]">
        {/* Recently Used Apps Section */}
        {recentlyUsedApps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-400">
              Recently Used Apps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyUsedApps
                .filter((instance: any) => {
                  if (activeFilter === 'all') return true;

                  const categoryMapping: Record<string, string[]> = {
                    'document': ['document-manager', 'doc-processor'],
                    'back-office': ['task-management', 'workflow-manager'],
                    'automation': ['social-manager', 'welcome-management', 'automation-utility']
                  };

                  return categoryMapping[activeFilter]?.includes(instance.identifier) ||
                         (activeFilter === 'automation' && instance.identifier.includes('automation'));
                })
                .map((instance: any) => (
                  <div
                    key={instance.appInstanceId}
                    onClick={() => {
                      setSelectedApp({
                        name: instance.name,
                        description: instance.description,
                        status: instance.status,
                        id: instance.id,
                        userPermissions: instance.userPermissions || {},
                        appInstanceId: instance.appInstanceId,
                        appId: instance.appId,
                        teamId: instance.teamId,
                        teamName: instance.teamName,
                        version: instance.version,
                        iconUrl: instance.iconUrl,
                        identifier: instance.identifier,
                      });
                      // Save to recently used apps in local storage
                      store.setCurrentApp(instance);
                      const targetPath =
                        instance.identifier === 'task-management'
                          ? '/task-managerment/task-list'
                          : instance.identifier === 'social-manager'
                            ? `/social-manager/home`
                            : instance.identifier === 'welcome-management'
                              ? `/welcome-management/home`
                              : '/';
                      router.push(targetPath);
                    }}
                    className="cursor-pointer block"
                  >
                    <Card className="h-full group hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 border-gray-200 hover:border-blue-400 ">
                      <CardContent className="flex items-center gap-3 p-4">
                        {instance.iconUrl ? (
                          <img
                            src={instance.iconUrl}
                            alt={`${instance.name} icon`}
                            className="w-10 h-10 rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-bold">
                              {instance.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-900 group-hover:text-blue-900 transition-colors truncate">
                            {instance.name}
                          </p>
                          <p className="text-xs text-blue-700 group-hover:text-blue-700 transition-colors truncate">
                            {instance.teamName}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
            </div>
          </section>
        )}

        {Object.entries(filteredGroupedInstances).map(([teamName, instances]) => (
          <section key={teamName} className="mb-6 last:mb-0">
            <div
              className="flex items-center mb-4 border-b border-gray-400 cursor-pointer"
              onClick={() => toggleTeam(teamName)}
            >
              <ChevronDown
                className={`w-5 h-5 mr-2 transition-transform ${openTeams[teamName] ? 'rotate-180' : ''}`}
              />
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-gray-700">
                  {teamName}
                </h2>
              </div>
            </div>
            {openTeams[teamName] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {instances.map((instance: any) => (
                  <div
                    key={instance.id}
                    onClick={() => {
                      setSelectedApp({
                        name: instance.name,
                        description: instance.description,
                        status: instance.status,
                        id: instance.id,
                        userPermissions: instance.userPermissions || {},
                        appInstanceId: instance.appInstanceId,
                        appId: instance.appId,
                        teamId: instance.teamId,
                        teamName: instance.teamName,
                        version: instance.version,
                        iconUrl: instance.iconUrl,
                        identifier: instance.identifier,
                      });
                      // Save to recently used apps in local storage
                      store.setCurrentApp(instance);
                      const targetPath =
                        instance.identifier === 'task-management'
                          ? '/task-managerment/task-list'
                          : instance.identifier === 'social-manager'
                            ? `/social-manager/home`
                            : instance.identifier === 'welcome-management'
                              ? `/welcome-management/home`
                              : '/';
                      router.push(targetPath);
                    }}
                    className="cursor-pointer block"
                  >
                    <Card className="h-full group hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 border-gray-200 hover:border-blue-400">
                      <CardContent className="flex items-center gap-3 p-4">
                        {instance.iconUrl ? (
                          <img
                            src={instance.iconUrl}
                            alt={`${instance.name} icon`}
                            className="w-10 h-10 rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-bold">
                              {instance.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-900 group-hover:text-blue-900 transition-colors truncate">
                            {instance.name}
                          </p>
                          <p className="text-xs text-blue-700 group-hover:text-blue-700 transition-colors truncate">
                            {instance.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}