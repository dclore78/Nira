import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Trash2 } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('nira-journal-entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save entries to localStorage when entries change
  useEffect(() => {
    localStorage.setItem('nira-journal-entries', JSON.stringify(entries));
  }, [entries]);

  const createNewEntry = () => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: 'New Entry',
      content: '',
      timestamp: new Date().toISOString()
    };
    
    setEntries(prev => [newEntry, ...prev]);
    setSelectedEntry(newEntry.id);
    setEditTitle(newEntry.title);
    setEditContent(newEntry.content);
    setIsEditing(true);
  };

  const saveEntry = () => {
    if (!selectedEntry) return;
    
    setEntries(prev => prev.map(entry => 
      entry.id === selectedEntry
        ? { ...entry, title: editTitle, content: editContent, timestamp: new Date().toISOString() }
        : entry
    ));
    setIsEditing(false);
  };

  const deleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    if (selectedEntry === entryId) {
      setSelectedEntry(null);
      setIsEditing(false);
    }
  };

  const selectEntry = (entry: JournalEntry) => {
    if (isEditing) {
      saveEntry();
    }
    setSelectedEntry(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setIsEditing(false);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedEntryData = entries.find(entry => entry.id === selectedEntry);

  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-md border-l border-t border-gray-700/50 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-cyan-400">Journal</h3>
          <p className="text-sm text-gray-400">Your thoughts & notes</p>
        </div>
        <button
          onClick={createNewEntry}
          className="btn-secondary p-2"
          title="New entry"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Entry List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {entries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No journal entries yet</p>
              <button
                onClick={createNewEntry}
                className="btn mt-3 text-sm"
              >
                Create First Entry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Entry List */}
            <div className="mb-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => selectEntry(entry)}
                    className={`card p-2 cursor-pointer transition-all hover:bg-gray-700/30 ${
                      selectedEntry === entry.id ? 'border-cyan-400 bg-cyan-400/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{entry.title}</h4>
                        <p className="text-xs text-gray-400">{formatDate(entry.timestamp)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEntry(entry.id);
                        }}
                        className="text-gray-500 hover:text-red-400 p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Editor */}
            {selectedEntryData && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-300">
                    {isEditing ? 'Editing Entry' : 'View Entry'}
                  </h4>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <button
                        onClick={saveEntry}
                        className="btn-secondary p-1"
                        title="Save"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary p-1"
                        title="Edit"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input text-sm py-2"
                      placeholder="Entry title..."
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input flex-1 resize-none text-sm py-2"
                      placeholder="Write your thoughts..."
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <h5 className="font-medium mb-2">{selectedEntryData.title}</h5>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {selectedEntryData.content || 'No content...'}
                    </div>
                    <div className="text-xs text-gray-500 mt-3">
                      Last modified: {formatDate(selectedEntryData.timestamp)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};