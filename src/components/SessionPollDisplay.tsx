import React from 'react';
import { ActiveAskItem, ExtendSuggestion, Poll, PollOption } from '@/types/timer';
import { MessageSquarePlus, PlusCircle, ThumbsUp, ThumbsDown, Minus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionPollDisplayProps {
  activeAsks: ActiveAskItem[];
}

const SessionPollDisplay: React.FC<SessionPollDisplayProps> = ({ activeAsks }) => {
  if (!activeAsks || activeAsks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <h4 className="text-md font-semibold text-foreground">Session Asks:</h4>
      {activeAsks.map((ask, index) => (
        <div key={ask.id} className="p-3 rounded-md bg-muted/50 border border-border">
          {'minutes' in ask ? ( // It's an ExtendSuggestion
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>Extend Timer by {ask.minutes} minutes</span>
              </div>
              <p className="text-xs text-muted-foreground">Suggested by {ask.creator}</p>
              <div className="flex items-center justify-around text-sm mt-2">
                <div className="flex items-center gap-1 text-green-600">
                  <ThumbsUp className="h-4 w-4" /> {ask.votes.filter(v => v.vote === 'yes').length}
                </div>
                <div className="flex items-center gap-1 text-blue-500">
                  <Minus className="h-4 w-4" /> {ask.votes.filter(v => v.vote === 'neutral').length}
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="h-4 w-4" /> {ask.votes.filter(v => v.vote === 'no').length}
                </div>
              </div>
              {ask.status !== 'pending' && (
                <p className={cn(
                  "text-xs font-medium text-center mt-2",
                  ask.status === 'accepted' ? 'text-green-600' : 'text-red-600'
                )}>
                  Status: {ask.status.charAt(0).toUpperCase() + ask.status.slice(1)}
                </p>
              )}
            </div>
          ) : ( // It's a Poll
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquarePlus className="h-4 w-4 text-primary" />
                <span>{ask.question}</span>
              </div>
              <p className="text-xs text-muted-foreground">Asked by {ask.creator}</p>
              <div className="mt-2 space-y-1">
                {ask.options.map(option => (
                  <div key={option.id} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{option.text}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {option.votes.length}
                    </span>
                  </div>
                ))}
              </div>
              {ask.allowCustomResponses && (
                <p className="text-xs text-muted-foreground italic mt-2">Custom responses were allowed.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SessionPollDisplay;