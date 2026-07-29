// src/components/layout/DashboardLayout.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden print:h-auto print:overflow-visible print:block">
      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto">
        <div className="print:hidden">
          <Topbar onMenuOpen={() => setSidebarOpen(true)} title={title} />
        </div>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 print:overflow-visible print:px-0 print:py-0"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;