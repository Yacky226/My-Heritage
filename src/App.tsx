import { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './hooks/useToast';
import { WalletProvider, useWallet } from './hooks/useWallet';
import { VaultsProvider } from './hooks/useVaults';
import { ToastContainer } from './components/ui/Toast';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Vaults } from './pages/Vaults';
import { CreateVault } from './pages/CreateVault';
import { HeirInbox } from './pages/HeirInbox';
import { ActivityExplorer } from './pages/ActivityExplorer';
import { Security } from './pages/Security';
import { Settings } from './pages/Settings';

function AppContent() {
  const { wallet } = useWallet();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const saved = localStorage.getItem('aegis_current_page');
    return saved ? saved : 'landing';
  });

  // Track and persist the current page state
  useEffect(() => {
    localStorage.setItem('aegis_current_page', currentPage);
  }, [currentPage]);

  // Navigate helper
  const handleNavigate = (pageId: string) => {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to the public landing page whenever the wallet disconnects.
  useEffect(() => {
    if (!wallet.connected && currentPage !== 'landing') {
      setCurrentPage('landing');
    }
  }, [wallet.connected, currentPage]);

  // Switch network toast triggers
  useEffect(() => {
    if (wallet.connected) {
      addToast(`Logged in with address: ${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}`, 'success', 3000);
    }
  }, [wallet.connected, wallet.address, addToast]);

  // Render Page Content
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'vaults':
        return <Vaults onNavigate={handleNavigate} />;
      case 'create':
        return <CreateVault onNavigate={handleNavigate} />;
      case 'heir':
        return <HeirInbox onNavigate={handleNavigate} />;
      case 'activity':
        return <ActivityExplorer onNavigate={handleNavigate} />;
      case 'security':
        return <Security onNavigate={handleNavigate} />;
      case 'settings':
        return <Settings onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (currentPage === 'landing') {
    return <Landing onLaunchApp={() => handleNavigate('dashboard')} />;
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <WalletProvider>
        <VaultsProvider>
          <AppContent />
          <ToastContainer />
        </VaultsProvider>
      </WalletProvider>
    </ToastProvider>
  );
}
