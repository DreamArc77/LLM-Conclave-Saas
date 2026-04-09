'use client';

import { useState } from 'react';
import { Vote } from 'lucide-react';
import { ModelLogo } from '@/components/common/ModelLogo';
import { useT } from '@/hooks/useT';
import { runVoting } from '@/lib/vote/vote-engine';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage, VoteResult } from '@/types/chat';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

interface VotingBubbleProps {
  message: ChatMessage;
}

function ModelAvatar({ modelId, displayName }: { modelId?: string; displayName: string }) {
  return <ModelLogo modelId={modelId} displayName={displayName} size={28} />;
}

// A compact voter chip — avatar + name, no statement
function VoterChip({ vote }: { vote: VoteResult }) {
  return (
    <div className="flex items-center gap-1.5">
      <ModelAvatar modelId={vote.modelId} displayName={vote.displayName} />
      <span className="text-xs text-gray-500 dark:text-gray-400">{vote.displayName}</span>
    </div>
  );
}

export function VotingBubble({ message }: VotingBubbleProps) {
  const [isStarting, setIsStarting] = useState(false);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const t = useT();

  const card = message.voteCard;
  if (!card) return null;

  const { phase, alternatives, votes, activeVoterIndex, totalVoters, query } = card;

  // Count votes per option letter
  const tallyMap: Record<string, number> = {};
  for (const letter of OPTION_LETTERS.slice(0, alternatives.length)) {
    tallyMap[letter] = 0;
  }
  for (const v of votes) {
    tallyMap[v.choice] = (tallyMap[v.choice] ?? 0) + 1;
  }

  // Determine winner (letter with most votes)
  const winner = Object.entries(tallyMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const winnerVotes = winner ? tallyMap[winner] : 0;
  const maxTally = Math.max(...Object.values(tallyMap), 1);

  const handleStartVoting = async () => {
    if (!activeSessionId || isStarting) return;
    setIsStarting(true);
    try {
      await runVoting(message.id, activeSessionId);
    } finally {
      setIsStarting(false);
    }
  };

  // Header label
  let headerLabel: string;
  if (phase === 'loading') {
    headerLabel = t('voting.loadingAlternatives');
  } else if (phase === 'voting') {
    headerLabel = t('voting.inProgress');
  } else if (phase === 'complete') {
    headerLabel = query ?? t('voting.readyToDecide');
  } else {
    headerLabel = t('voting.readyToDecide');
  }

  return (
    <div className="flex justify-center px-4 py-2">
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-950/20">
          <div className="flex items-center gap-2 mb-1">
            <Vote className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
              Council Vote
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">
            {headerLabel}
          </p>
          {phase === 'setup' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('voting.alternativesIntro')}
            </p>
          )}
        </div>

        {/* Loading state */}
        {phase === 'loading' && (
          <div className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Alternatives list */}
        {(phase === 'setup' || phase === 'voting' || phase === 'complete') && alternatives.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {alternatives.map((alt, idx) => {
              const letter = OPTION_LETTERS[idx];
              const optionVotes = votes.filter((v) => v.choice === letter);
              const optionTally = tallyMap[letter] ?? 0;
              const isWinner = phase === 'complete' && letter === winner && winnerVotes > 0;
              // Models currently voting on this option (for the "voting" phase active row)
              const isActiveOption =
                phase === 'voting' &&
                activeVoterIndex !== undefined;

              return (
                <div
                  key={letter}
                  className={`px-5 py-4 transition-colors ${
                    isWinner
                      ? 'bg-blue-50/50 dark:bg-blue-950/20'
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  {/* Option header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isWinner
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">
                        {isWinner && <span className="mr-1">✨</span>}
                        {alt}
                      </p>
                    </div>
                    {/* Vote count badge + tally bar */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isWinner
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {t('voting.voteCount', { count: optionTally })}
                      </span>
                      {/* Progress bar (visible during voting + complete) */}
                      {(phase === 'voting' || phase === 'complete') && totalVoters && totalVoters > 0 && (
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isWinner ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            style={{ width: `${(optionTally / maxTally) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voters for this option */}
                  {optionVotes.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 ml-8 mt-1">
                      {optionVotes.map((v) => (
                        <VoterChip key={v.modelId} vote={v} />
                      ))}
                    </div>
                  )}

                  {/* Active voter indicator (voting in progress) */}
                  {isActiveOption && idx === alternatives.length - 1 && (
                    <div className="mt-2 ml-8 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">···</span>
                    </div>
                  )}

                  {/* No votes placeholder in setup */}
                  {phase === 'setup' && (
                    <p className="ml-8 text-xs text-gray-400 dark:text-gray-600 italic">
                      {t('voting.noVotesYet')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: Start Voting button (setup only) */}
        {phase === 'setup' && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              onClick={handleStartVoting}
              disabled={isStarting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Vote className="w-4 h-4" />
              {isStarting ? t('voting.loadingAlternatives') : t('voting.startVoting')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
