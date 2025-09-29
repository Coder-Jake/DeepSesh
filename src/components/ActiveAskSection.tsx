import React, { useState } from 'react';
import ExtendSuggestionCard from './ExtendSuggestionCard';
import PollCard from './PollCard';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Import icons for toggle

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
  allowCustomResponses: boolean; // New prop
}

type ActiveAskItem = ExtendSuggestion | Poll;

interface ActiveAskSectionProps {
  activeAsks: ActiveAskItem[];
  onVoteExtend: (id: string, vote: 'yes' | 'no' | null) => void; // Updated prop type
  onVotePoll: (pollId: string, optionIds: string[], customOptionText?: string) => void; // Updated prop
  currentUserId: string;
}

const ActiveAskSection: React.FC<ActiveAskSectionProps> = ({ activeAsks, onVoteExtend, onVotePoll, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(true); // State to manage toggle

  if (activeAsks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
      >
        <h2>Active Asks</h2>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isOpen && (
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
      )}
    </div>
  );
};

export default ActiveAskSection;