'use client';

import React from "react"

import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-6 border-b border-border pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-2 py-3 text-sm font-medium border-b-2 transition-colors relative',
            activeTab === tab.id
              ? 'text-foreground border-primary'
              : 'text-muted-foreground hover:text-foreground border-transparent hover:border-border'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
