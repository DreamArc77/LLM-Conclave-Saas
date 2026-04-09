'use client';

import { UserBubble } from './UserBubble';
import { AiBubble } from './AiBubble';
import { ErrorBubble } from './ErrorBubble';
import { SystemBubble } from './SystemBubble';
import { VotingBubble } from './VotingBubble';
import type { ChatMessage } from '@/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.voteCard) {
    return <VotingBubble message={message} />;
  }

  if (message.isSystem) {
    return <SystemBubble message={message} />;
  }

  if (message.role === 'user') {
    return <UserBubble message={message} />;
  }

  if (message.isError) {
    return <ErrorBubble message={message} />;
  }

  return <AiBubble message={message} />;
}
