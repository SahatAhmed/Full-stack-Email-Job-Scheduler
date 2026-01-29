'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { Sidebar } from '@/components/Sidebar'; // Suggested component
import { ScheduledEmailsTab } from '@/components/ScheduledEmailsTab';
import { SentEmailsTab } from '@/components/SentEmailsTab';
import { ComposeModal } from '@/components/ComposeModal';
import { Send, Clock, Plus, LogOut  } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import React from "react";
import ProfileCard from '@/components/ProfileCard';
import { Search, SlidersHorizontal, RotateCw, Filter } from "lucide-react";
import LogoutButton from '@/components/LogoutButton';

type TabType = 'scheduled' | 'sent';

export default function DashboardPage() {
  const router = useRouter();
  const { user, checkAuth, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  

  return (
    <div className="flex h-screen bg-white text-slate-900">
      <Toaster position="top-right" />

      {/* Side Navigation */}
      <aside className="w-80 bg-white flex flex-col">
        <div className="flex space-x-1 text-black font-mono text-6xl pl-6">
          ONB
        </div>

<div className=' p-6'>
        <ProfileCard
  name={user.name || "Oliver Brown"}
  email={user.email || "oliver.brown@domain.io"}
  avatarUrl={user.avatar || "/path/to/avatar.png"}
/>
</div>

        <div className="p-6">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="w-full flex items-center justify-center gap-2 border border-green-600 text-green-600 bg-white py-2 px-4 rounded-full font-semibold hover:bg-green-50 hover:text-green-700 transition-all shadow-md shadow-green-100 cursor-pointer"
          >
            Compose
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <span className=' pl-6 font-medium text-gray-400'>CORE</span>
          <button 
            onClick={() => setActiveTab('scheduled')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'scheduled' ? 'bg-green-100 text-black font-medium' : 'hover:bg-green-50 text-gray-600'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Scheduled</span>
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'sent' ? 'bg-green-100 text-black font-medium' : 'hover:bg-green-50 text-gray-600'}`}
          >
            <Send className="w-5 h-5" />
            <span className="font-medium">Sent</span>
          </button>
        </nav>


        <LogoutButton />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">


        <main className="flex-1 overflow-y-auto p-8">
          <header className="w-full">
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="flex items-center w-5xl bg-gray-100 rounded-full px-5 py-3">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="ml-3 w-full bg-transparent outline-none text-black placeholder-gray-500"
          />
        </div>

        {/* Right Icons */}
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <Filter className="w-5 h-5 text-gray-400" />
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <RotateCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </header>

    <div className="min-h-full mt-5">
            {activeTab === 'scheduled' ? <ScheduledEmailsTab /> : <SentEmailsTab />}
          </div>
        </main>







        
        
        
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  );
}