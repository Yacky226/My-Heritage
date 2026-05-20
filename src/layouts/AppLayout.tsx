import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopHeader } from '../components/navigation/TopHeader';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (pageId: string) => void;
}

export function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar container */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 hidden md:block transition-all duration-350`} />
      
      {/* Sidebar navigation */}
      <div className="hidden md:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Drawer Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60"
          />
          {/* Sliding panel */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-64 h-full bg-slate-900"
          >
            <Sidebar
              currentPage={currentPage}
              onNavigate={(id) => {
                onNavigate(id);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              setCollapsed={() => {}}
            />
          </motion.div>
        </div>
      )}

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <TopHeader onMenuToggle={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex-grow flex flex-col"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
