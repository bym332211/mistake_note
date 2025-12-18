import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  iconClass: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: '首页', iconClass: 'fa-home' },
  { to: '/upload', label: '上传', iconClass: 'fa-camera' },
  { to: '/error-book', label: '错题本', iconClass: 'fa-book' },
];

export const MobileNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden bg-card-bg border-t border-border-light z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center px-3 py-1 text-xs ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <i className={`fas ${item.iconClass} text-lg`} />
              <span className="mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

