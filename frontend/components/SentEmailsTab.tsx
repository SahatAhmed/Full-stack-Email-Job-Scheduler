'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { type EmailJob } from '@/lib/api';
import { Loader2, AlertCircle, Star } from 'lucide-react';
import apiClient from '@/lib/api';

// Fetcher function
const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export function SentEmailsTab() {
  const [limit] = useState(20); // Adjusted limit to fit typical list view
  const [offset, setOffset] = useState(0);

  // Fetch data
  const { data, isLoading, error } = useSWR(
    `/emails/sent?limit=${limit}&offset=${offset}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const emails: EmailJob[] = data?.emails || [];

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="m-6 p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-center text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Failed to load sent emails.</span>
      </div>
    );
  }

  // --- Empty State ---
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-900 font-medium">No sent emails</p>
        <p className="text-gray-500 text-sm mt-1">Emails you send will appear here.</p>
      </div>
    );
  }

  // --- Main List View ---
  return (
    <div className="w-full bg-white">
      {/* Email List Rows */}
      <div className="flex flex-col">
        {emails.map((email) => (
          <div
            key={email.id}
            className="group flex items-center px-6 py-4 border-b border-gray-100 hover:shadow-sm hover:bg-gray-50/50 transition-all cursor-pointer"
          >
            {/* 'To' Column */}
            <div className="w-[200px] flex-shrink-0 flex items-center text-sm">
              <span className="font-bold text-gray-700 mr-1">To:</span>
              <span className="font-bold text-gray-900 truncate pr-4">
                {/* Fallback to 'Unknown' if no recipient, or use name logic if available */}
                {email.recipientEmail || 'Unknown Recipient'} 
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0 mr-4">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium min-w-[50px]">
                Sent
              </span>
            </div>

            {/* Subject - Body Snippet */}
            <div className="flex-1 min-w-0 flex items-center text-sm truncate mr-4">
              <span className="font-bold text-gray-900 flex-shrink-0">
                {email.subject || '(No Subject)'}
              </span>
              <span className="mx-2 text-gray-400">-</span>
              <span className="text-gray-400 truncate font-normal">
                {email.body ? email.body.replace(/<[^>]*>/g, '') : 'No content'}
              </span>
            </div>

            {/* Star Icon (Action) */}
            <div className="flex-shrink-0">
              <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <Star className="w-5 h-5 text-gray-300 hover:text-yellow-400 transition-colors" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer (Subtle style to match clean look) */}
      <div className="flex items-center justify-end px-6 py-4 gap-4 border-t border-gray-50">
        <span className="text-sm text-gray-500">
          Showing {offset + 1}-{Math.min(offset + limit, offset + emails.length)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-3 py-1 text-sm border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={emails.length < limit}
            className="px-3 py-1 text-sm border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}