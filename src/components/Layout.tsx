import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, AlertCircle, User as UserIcon, Car, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { role } = useAuth();
  
  const userLinks = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/sos', icon: AlertCircle, label: 'SOS', isSos: true },
    { to: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  const driverLinks = [
    { to: '/driver/dashboard', icon: Car, label: 'Dashboard', isSos: false },
    { to: '/driver/requests', icon: List, label: 'Requests', isSos: false },
    { to: '/profile', icon: UserIcon, label: 'Profile', isSos: false },
  ];

  const links = role === 'DRIVER' ? driverLinks : userLinks;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md">
        <div className="glass-dark rounded-full p-2 flex justify-around items-center">
          {links.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all relative",
                isActive ? "text-[#7695db]" : "text-white/40 hover:text-white/80",
                link.isSos && "top-[-10px]"
              )}
            >
              {({ isActive }) => (
                <>
                  {link.isSos ? (
                     <div className={cn(
                       "w-16 h-16 rounded-full flex flex-col items-center justify-center",
                       isActive ? "bg-[#cc6a53] text-white neon-pulse-accent" : "bg-[#252836] border border-white/5 text-[#cc6a53] shadow-[0_0_15px_rgba(204,106,83,0.3)]"
                     )}>
                        <link.icon className="w-8 h-8" />
                     </div>
                  ) : (
                    <>
                      <link.icon className={cn("w-6 h-6 mb-1 transition-transform", isActive && "scale-110")} />
                      <span className="text-[10px] font-medium">{link.label}</span>
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
