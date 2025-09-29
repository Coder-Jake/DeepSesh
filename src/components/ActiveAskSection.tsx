import React from 'react';
import ExtendSuggestionCard from './ExtendSuggestionCard';
import PollCard from './PollCard';

interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface PollOption {
  id: string;
  text: string;
  votes: { userId: string }[];
}

interface Poll {
  id: string;
  question: string;
  type: 'closed' | 'choice' | 'selection';
  creator: string;
  options: PollOption[];
  status: 'active' | 'closed';
}

type ActiveAskItem = ExtendSuggestion | Poll;

interface ActiveAskSectionProps {
  activeAsks: ActiveAskItem[];
  onVoteExtend: (id: string, vote: 'yes' | 'no') => void;
  onVotePoll: (pollId: string, optionIds: string[]) => void;
  currentUserId: string;
}

const ActiveAskSection: React.FC<ActiveAskSectionProps> = ({ activeAsks, onVoteExtend, onVotePoll, currentUserId }) => {
  if (activeAsks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold text-foreground">Active Asks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeAsks.map(item => {
          if ('minutes' in item) { // It's an ExtendSuggestion
            return (
              <ExtendSuggestionCard 
                key={item.id} 
                suggestion={item} 
                onVote={onVoteExtend} 
                currentUserId={currentUserId} 
              />
            );
          } else { // It's a Poll
            return (
              <PollCard 
                key={item.id} 
                poll={item} 
                onVote={onVotePoll} 
                currentUserId={currentUserId} 
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default ActiveAskSection;