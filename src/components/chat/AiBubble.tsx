'use client';

import { useState, useRef, useEffect } from'react';
import { ChevronDown, ChevronUp } from'lucide-react';
import { ModelLogo } from'@/components/common/ModelLogo';
import { useT } from'@/hooks/useT';
import type { ChatMessage } from'@/types/chat';

// Only show collapse toggle when content is taller than this (px)
const COLLAPSE_THRESHOLD = 160;
// Collapsed height = ~3 lines (prose line-height ~1.75 × 16px × 3)
const COLLAPSED_HEIGHT ='5.25rem';

interface AiBubbleProps {
 message: ChatMessage;
 isStreaming?: boolean;
}

export function AiBubble({ message, isStreaming }: AiBubbleProps) {
 const [collapsed, setCollapsed] = useState(false);
 const [canCollapse, setCanCollapse] = useState(false);
 const contentRef = useRef<HTMLDivElement>(null);
 const t = useT();

 // After streaming ends, check if content is tall enough to warrant collapsing
 useEffect(() => {
 if (isStreaming) return;
 const el = contentRef.current;
 if (!el) return;
 if (el.scrollHeight > COLLAPSE_THRESHOLD) {
 setCanCollapse(true);
 }
 }, [isStreaming, message.content]);

 return (
 <div className="flex justify-start mb-4">
 <div className="max-w-[80%]">
 <div className="flex items-center gap-2 mb-1">
 {message.modelId && (
 <ModelLogo modelId={message.modelId} displayName={message.displayName || message.modelId} size={20} />
 )}
 <span className="text-sm font-medium text-gray-500">
 {message.displayName || message.modelId}
 </span>
 {canCollapse && !isStreaming && (
 <button
 onClick={() => setCollapsed((c) => !c)}
 className="ml-auto flex items-center gap-0.5 text-xs text-[#5D5C5A] hover:text-gray-500 transition-colors"
 >
 {collapsed
 ? <><ChevronDown className="w-3 h-3"/>{t('chat.expand')}</>
 : <><ChevronUp className="w-3 h-3"/>{t('chat.collapse')}</>
 }
 </button>
 )}
 </div>
 <div className="rounded-2xl rounded-bl-sm bg-[#FAFAFA] px-4 py-3">
 <div
 className="relative"
 style={collapsed ? { maxHeight: COLLAPSED_HEIGHT, overflow:'hidden'} : undefined}
 >
 <div ref={contentRef} className="prose max-w-none whitespace-pre-wrap text-base">
 {message.content}
 {isStreaming && (
 <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-0.5"/>
 )}
 </div>
 {collapsed && (
 <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none"/>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
