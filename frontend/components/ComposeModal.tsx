'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Upload,
  Calendar,
  X,
  ChevronDown,
  Loader2,
  Undo,
  Redo,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSWR from 'swr';

import { emailApi } from '@/lib/api';
import { parseCSV, validateEmail } from '@/lib/utils';
import apiClient from '@/lib/api';

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScheduleOption {
  label: string;
  value: string;
  date?: string;
  timeLabel?: string;
}

type Attachment = {
  file: File;
  preview?: string;
  isImage: boolean;
};

export function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  /* =======================
       REFS & STATE
   ======================== */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [fromEmail, setFromEmail] = useState('oliver.brown@domain.io');
  const [delayBetweenMs, setDelayBetweenMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(200);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Data Fetching
  const { data: sendersData } = useSWR('/senders', fetcher);

  // FIX: Safely extract the array. API likely returns { senders: [...] } or just [...]
  const senderList = Array.isArray(sendersData) 
    ? sendersData 
    : (sendersData?.senders || []);

  /* =======================
       EFFECTS
   ======================== */

  // Initialize schedule date to tomorrow 9AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setScheduleDate(tomorrow.toISOString().slice(0, 16));
  }, []);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach(att => {
        if (att.preview) URL.revokeObjectURL(att.preview);
      });
    };
  }, [attachments]);

  if (!isOpen) return null;

  /* =======================
       LOGIC HELPERS
   ======================== */

  const getScheduleOptions = (): ScheduleOption[] => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const getIso = (h: number) => {
      const d = new Date(tomorrow);
      d.setHours(h, 0, 0, 0);
      return d.toISOString();
    };

    return [
      { label: 'Tomorrow', value: 'tomorrow', date: getIso(9) },
      { label: 'Tomorrow,', value: '10am', date: getIso(10), timeLabel: '10:00 AM' },
      { label: 'Tomorrow,', value: '11am', date: getIso(11), timeLabel: '11:00 AM' },
      { label: 'Tomorrow,', value: '3pm', date: getIso(15), timeLabel: '3:00 PM' }
    ];
  };

  const handleAddRecipient = (email: string) => {
    if (!email.trim()) return;
    if (!validateEmail(email)) return toast.error('Invalid email');
    if (recipients.includes(email)) return toast.error('Already added');

    setRecipients(prev => [...prev, email]);
    setNewRecipient('');
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      const emails = parseCSV(content).filter(validateEmail);

      if (!emails.length) return toast.error('No valid emails found');
      setRecipients(emails);
      toast.success(`Loaded ${emails.length} emails`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (isScheduled: boolean) => {
    if (!fromEmail || !subject || !body || !recipients.length) {
      return toast.error('Please fill all required fields');
    }

    setIsSubmitting(true);

    try {
      // Using FormData to handle file attachments
      const formData = new FormData();
      formData.append('senderEmail', fromEmail);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('recipients', JSON.stringify(recipients));
      formData.append('delayBetweenMs', String(delayBetweenMs));
      formData.append('hourlyLimit', String(hourlyLimit));

      attachments.forEach(att => {
        formData.append('attachments', att.file);
      });

      if (isScheduled) {
        formData.append('startTime', scheduleDate);
        await emailApi.schedule(formData);
        toast.success('Email scheduled successfully');
      } else {
        await emailApi.send(formData);
        toast.success('Email sent successfully');
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to process email');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================
       RENDER
   ======================== */

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans animate-in fade-in duration-200">
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl text-gray-800 font-normal">Compose New Email</h1>
        </div>

        <div className="flex items-center gap-4 relative">
          {/* Attachment Button */}
          <button
            onClick={() => attachmentInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={attachmentInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.zip"
            className="hidden"
            onChange={(e) => {
              if (!e.target.files) return;
              const newFiles: Attachment[] = Array.from(e.target.files).map(file => ({
                file,
                isImage: file.type.startsWith('image/'),
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
              }));
              setAttachments(prev => [...prev, ...newFiles]);
            }}
          />
          
          {/* Schedule Toggle */}
          <button 
            onClick={() => setShowSchedulePopup(!showSchedulePopup)}
            className={`transition-colors ${showSchedulePopup ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Main Send Button */}
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-white hover:bg-green-50 text-green-600 border border-green-600 px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>

          {/* --- Send Later Popup --- */}
          {showSchedulePopup && (
            <div className="absolute top-12 right-0 w-[300px] bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Send Later</h3>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <input
                     type="datetime-local"
                     value={scheduleDate}
                     onChange={(e) => setScheduleDate(e.target.value)}
                     className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg text-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                   <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1 mb-6">
                {getScheduleOptions().map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                        if (opt.date) setScheduleDate(opt.date);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors text-left"
                  >
                    <span>{opt.label}</span>
                    {opt.timeLabel && <span>{opt.timeLabel}</span>}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => setShowSchedulePopup(false)}
                  className="text-sm text-gray-600 font-medium hover:text-gray-800 px-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="text-sm bg-white border border-green-600 text-green-600 px-6 py-1.5 rounded-full font-medium hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-6xl mx-auto w-full">
        
        {/* From Row */}
        <div className="flex items-center py-4 border-b border-gray-100">
          <label className="w-24 text-sm text-gray-500 font-medium">From</label>
          <div className="relative">
             <div className="flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-md text-sm text-gray-800 font-medium">
                {fromEmail}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
             </div>
             <select 
               className="absolute inset-0 opacity-0 cursor-pointer"
               onChange={(e) => setFromEmail(e.target.value)}
               value={fromEmail}
             >
                {senderList.map((s: any) => (
                    <option key={s.id || s.email} value={s.email}>{s.email}</option>
                ))}
                {!senderList.length && <option value={fromEmail}>{fromEmail}</option>}
             </select>
          </div>
        </div>

        {/* To Row */}
        <div className="flex items-center py-4 border-b border-gray-100">
          <label className="w-24 text-sm text-gray-500 font-medium">To</label>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {recipients.map((email) => (
              <span key={email} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-sm">
                {email}
                <button onClick={() => handleRemoveRecipient(email)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            <input 
              type="text" 
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient(newRecipient)}
              placeholder={recipients.length === 0 ? "recipient@example.com" : ""}
              className="flex-1 outline-none text-gray-700 placeholder:text-gray-300 py-1"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-emerald-500 text-sm font-medium hover:text-emerald-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload List
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
        </div>

        {/* Subject Row */}
        <div className="flex items-center py-4 border-b border-gray-100">
          <label className="w-24 text-sm text-gray-500 font-medium">Subject</label>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 outline-none text-gray-700 placeholder:text-gray-300 py-1 font-normal"
          />
        </div>

        {/* Configuration Row */}
        <div className="flex items-center py-6 border-b border-gray-100 gap-12">
            <div className="flex items-center gap-4">
                <label className="text-sm text-gray-800 font-medium">Delay between 2 emails</label>
                <input 
                    type="number"
                    value={delayBetweenMs / 1000}
                    onChange={(e) => setDelayBetweenMs(Number(e.target.value) * 1000)}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-emerald-500 text-gray-500"
                />
            </div>
            <div className="flex items-center gap-4">
                <label className="text-sm text-gray-800 font-medium">Hourly Limit</label>
                <input 
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-center text-sm focus:outline-none focus:border-emerald-500 text-gray-500"
                />
            </div>
        </div>

        {/* Editor Section */}
        <div className="mt-6 bg-gray-50 rounded-lg min-h-[400px] flex flex-col">
          <div className="p-4 flex flex-col flex-1">
            
            {/* Toolbar (visual only) */}
            <div className="bg-white rounded-full shadow-sm border border-gray-100 inline-flex items-center px-4 py-2 gap-4 mb-4 select-none self-start">
              <div className="flex gap-2 border-r border-gray-200 pr-4">
                <Undo className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <Redo className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              <div className="flex gap-4 border-r border-gray-200 pr-4">
                <div className="flex items-center gap-1 cursor-pointer">
                  <Type className="w-4 h-4 text-gray-500" />
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </div>
              </div>
              <div className="flex gap-3 border-r border-gray-200 pr-4">
                <Bold className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-800" />
                <Italic className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <Underline className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              <div className="flex gap-3 border-r border-gray-200 pr-4">
                 <AlignLeft className="w-4 h-4 text-gray-500 cursor-pointer" />
                 <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
              </div>
              <div className="flex gap-3">
                 <Code className="w-4 h-4 text-gray-400 cursor-pointer" />
                 <LinkIcon className="w-4 h-4 text-gray-400 cursor-pointer" />
                 <ImageIcon className="w-4 h-4 text-gray-400 cursor-pointer" />
                 <span className="text-gray-400 font-mono text-sm cursor-pointer hover:text-gray-600">{'{}'}</span>
              </div>
            </div>

            {/* Actual Text Area */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your reply..."
              className="w-full flex-1 bg-transparent resize-none outline-none text-gray-700 placeholder:text-gray-400 placeholder:text-[16px] text-sm p-2"
            />
          </div>
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="py-4 mt-2 flex flex-wrap gap-4 animate-in fade-in">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="relative w-32 h-24 rounded-lg border bg-gray-50 overflow-hidden group"
              >
                {/* IMAGE PREVIEW */}
                {att.isImage ? (
                  <img
                    src={att.preview}
                    alt={att.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* FILE PREVIEW */
                  <div className="flex flex-col items-center justify-center h-full text-xs text-gray-600 px-2 text-center">
                    <span className="font-medium truncate w-full">
                      {att.file.name}
                    </span>
                    <span className="text-gray-400">
                      {(att.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}

                {/* REMOVE BUTTON */}
                <button
                  onClick={() =>
                    setAttachments(prev =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}