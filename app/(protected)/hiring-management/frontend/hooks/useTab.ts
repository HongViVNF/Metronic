import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useTab(defaultTab = 'overview') {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = searchParams.get('tab') || defaultTab;
    setActiveTab(tab);
  }, [searchParams, defaultTab]);

  const createHref = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabName);
    return `${pathname}?${params.toString()}`;
  };

  return { activeTab, createHref };
}