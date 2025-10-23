'use client';

import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import hiringManagementConfig from './appConfig';
const PageMenu = () => {
  const menuItems = hiringManagementConfig.menu.children;
  
  if (menuItems) {
    return <NavbarMenu items={menuItems} />;
  }
  
  return <></>;
};

export { PageMenu };