"use client";

import { useEffect, useState } from "react";
import { X, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../../utils/image";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    backdropFilter: 'blur(4px)',
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.2 }
  }
};

const modalVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 500
    }
  },
  exit: { 
    y: 20, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export default function SelectFollowersModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialSelected = [] 
}) {
  const [followers, setFollowers] = useState([]);
  const [selectedFollowers, setSelectedFollowers] = useState(initialSelected);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen]);

  const fetchFollowers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/followers');
      if (!response.ok) throw new Error('Failed to fetch followers');
      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error('Error fetching followers:', error);
      alert('Failed to load followers');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollower = (followerId) => {
    setSelectedFollowers(prev => 
      prev.includes(followerId)
        ? prev.filter(id => id !== followerId)
        : [...prev, followerId]
    );
  };

  const handleSave = () => {
    onSave(selectedFollowers);
    onClose();
  };

  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFollowers = followers.filter(follower => 
    `${follower.first_name} ${follower.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            className="rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'rgb(var(--color-surface))',
              border: '1px solid rgba(var(--color-border), 0.5)'
            }}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{color: 'rgb(var(--color-text-primary))'}}>Select Followers</h3>
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-full transition-colors"
                  style={{color: 'rgb(var(--color-text-secondary))'}}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{color: 'rgb(var(--color-text-secondary))'}} />
                <input
                  type="text"
                  placeholder="Search followers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                  style={{
                    backgroundColor: 'rgba(var(--color-background), 0.5)',
                    border: '1px solid rgb(var(--color-border))',
                    color: 'rgb(var(--color-text-primary))'
                  }}
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-2 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12" style={{color: 'rgb(var(--color-text-secondary))'}}>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mb-3" style={{borderColor: 'rgb(var(--color-primary))'}}></div>
                  <p>Loading followers...</p>
                </div>
              ) : filteredFollowers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12" style={{color: 'rgb(var(--color-text-secondary))'}}>
                  <p className="mb-2">No followers found</p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-sm hover:underline"
                      style={{color: 'rgb(var(--color-primary))'}}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  {filteredFollowers.map(follower => {
                    const isSelected = selectedFollowers.includes(follower.id);
                    return (
                      <div 
                        key={follower.id}
                        onClick={() => toggleFollower(follower.id)}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-background-darker border border-transparent hover:border-border/30'
                        }`}
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 bg-background-darker flex-shrink-0">
                          {follower.avatar ? (
                            <img
                              src={getImageUrl(follower.avatar)}
                              alt={`${follower.first_name} ${follower.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                              {follower.first_name[0]}{follower.last_name?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {follower.first_name} {follower.last_name}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            @{follower.username || `${follower.first_name.toLowerCase()}${follower.last_name ? follower.last_name.toLowerCase() : ''}`}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-primary text-white' 
                            : 'border-2 border-border bg-white'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-sm">
              <div className="text-sm text-text-secondary">
                {selectedFollowers.length} {selectedFollowers.length === 1 ? 'follower' : 'followers'} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-text hover:bg-background-darker rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading || selectedFollowers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
