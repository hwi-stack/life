/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LotteryProvider } from './context/LotteryContext';
import { Header } from './components/Header';
import { PrizeNavigation } from './components/PrizeNavigation';
import { LotteryStage } from './components/LotteryStage';
import { AdminModal } from './components/AdminModal';
import { StageFooter } from './components/StageFooter';

function MainApp() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-900 overflow-x-hidden selection:bg-amber-500 selection:text-white">
      {/* Top Festival Header */}
      <Header onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Prize Selection Tabs */}
      <PrizeNavigation />

      {/* 16:9 Center Main Lottery Stage */}
      <main className="flex-1 flex flex-col justify-center items-center w-full">
        <LotteryStage />
      </main>

      {/* Bottom Live Stats & Instructions */}
      <StageFooter />

      {/* Admin Control Panel Modal */}
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LotteryProvider>
      <MainApp />
    </LotteryProvider>
  );
}
