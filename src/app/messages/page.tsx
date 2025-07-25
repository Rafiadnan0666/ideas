'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Layout from '@/components/Layout';
import type { IMessage, INotification, IProfile } from '@/types/main.db';
import { FiMessageSquare, FiSearch, FiEdit2, FiTrash2, FiChevronLeft, FiBell, FiPaperclip, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<IProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [conversations, setConversations] = useState<{user: IProfile, lastMessage: IMessage}[]>([]);
  const [selectedUser, setSelectedUser] = useState<IProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IProfile[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/sign-in');
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      toast.error('Failed to load user profile');
      return null;
    }

    return profile;
  }, [router, supabase]);

  // Fetch conversations with last messages
  const fetchConversations = useCallback(async (userId: string) => {
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`from_id.eq.${userId},to_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      toast.error('Failed to load messages');
      return [];
    }

    // Get unique conversation partners
    const partnerIds = Array.from(new Set(
      messagesData?.flatMap(msg => 
        msg.from_id === userId ? msg.to_id : msg.from_id
      ) || []
    ));

    if (partnerIds.length === 0) return [];

    // Fetch partner profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', partnerIds);

    if (profilesError) {
      toast.error('Failed to load user profiles');
      return [];
    }

    // Map conversations with last message
    return partnerIds.map(partnerId => {
      const user = profiles?.find(p => p.id === partnerId);
      if (!user) return null;
      
      const lastMessage = messagesData?.find(msg => 
        msg.from_id === partnerId || msg.to_id === partnerId
      );
      return { user, lastMessage: lastMessage! };
    }).filter(Boolean) as {user: IProfile, lastMessage: IMessage}[];
  }, [supabase]);

  // Fetch messages between two users
  const fetchMessages = useCallback(async (userId: string, partnerId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(from_id.eq.${userId},to_id.eq.${partnerId}),and(from_id.eq.${partnerId},to_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load conversation');
      return [];
    }

    return data || [];
  }, [supabase]);

  // Fetch unread notifications
  const fetchNotifications = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load notifications');
      return [];
    }

    return data || [];
  }, [supabase]);

  // Search users with debounce
  const searchUsers = useCallback(async (query: string, currentUserId: string) => {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(10);

    if (error) {
      toast.error('Search failed');
      return [];
    }

    return data || [];
  }, [supabase]);

  // Setup realtime subscriptions
  const setupRealtime = useCallback((userId: string) => {
    // Clean up any existing channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    // Create new channel for messages
    realtimeChannelRef.current = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(from_id.eq.${userId},to_id.eq.${userId})`
        },
        async (payload) => {
          // Handle different event types
          switch (payload.eventType) {
            case 'INSERT':
              // New message added
              if (currentUser && selectedUser) {
                // Check if this message is part of the current conversation
                const message = payload.new as IMessage;
                if (
                  (message.from_id === currentUser.id && message.to_id === selectedUser.id) ||
                  (message.from_id === selectedUser.id && message.to_id === currentUser.id)
                ) {
                  setMessages(prev => [...prev, message]);
                  scrollToBottom('auto');
                }
                
                // Refresh conversations list
                const convs = await fetchConversations(currentUser.id);
                setConversations(convs);
              }
              break;
            
            case 'UPDATE':
              // Message updated
              if (currentUser) {
                const updatedMessage = payload.new as IMessage;
                setMessages(prev => 
                  prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
                );
              }
              break;
            
            case 'DELETE':
              // Message deleted
              if (currentUser) {
                const deletedId = payload.old.id;
                setMessages(prev => prev.filter(msg => msg.id !== deletedId));
              }
              break;
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id.eq.${userId}`
        },
        async () => {
          if (currentUser) {
            const notifs = await fetchNotifications(currentUser.id);
            setNotifications(notifs);
          }
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [supabase, currentUser, selectedUser, fetchConversations, fetchNotifications]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  }, []);

  // Handle sending a message
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedUser || !currentUser) return;

    setIsSubmitting(true);

    try {
      if (editingMessage) {
        const { error } = await supabase
          .from('messages')
          .update({
            content: messageInput,
            attachment: attachmentUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMessage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('messages')
          .insert({
            content: messageInput,
            attachment: attachmentUrl,
            from_id: currentUser.id,
            to_id: selectedUser.id
          });

        if (error) throw error;

        // Create notification for recipient
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedUser.id,
            type: 'message',
            payload: `New message from ${currentUser.full_name || currentUser.email}`,
            read: false
          });
      }

      setMessageInput('');
      setAttachmentUrl('');
      setEditingMessage(null);
      setShowAttachmentInput(false);
      scrollToBottom('auto');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  }, [messageInput, selectedUser, currentUser, editingMessage, attachmentUrl, supabase, scrollToBottom]);

  // Handle message deletion
  const deleteMessage = useCallback(async (messageId: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      toast.error('Failed to delete message');
    }
  }, [supabase]);

  // Start a new conversation
  const startConversation = useCallback(async (user: IProfile) => {
    if (!currentUser) return;

    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    
    const msgs = await fetchMessages(currentUser.id, user.id);
    setMessages(msgs);
    
    // Mark notifications as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', currentUser.id)
      .eq('type', 'message')
      .eq('payload', `like:${user.id}`);

    // Refresh notifications
    const notifs = await fetchNotifications(currentUser.id);
    setNotifications(notifs);
    
    scrollToBottom('auto');
  }, [currentUser, fetchMessages, fetchNotifications, supabase, scrollToBottom]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        setLoading(false);
        
        // Fetch initial data
        const [convs, notifs] = await Promise.all([
          fetchConversations(user.id),
          fetchNotifications(user.id)
        ]);
        setConversations(convs);
        setNotifications(notifs);
        
        // Setup realtime
        setupRealtime(user.id);
      }
    };

    init();

    return () => {
      // Clean up realtime subscription
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [fetchCurrentUser, fetchConversations, fetchNotifications, setupRealtime, supabase]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim() && currentUser) {
        const results = await searchUsers(searchQuery, currentUser.id);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser, searchUsers]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom('auto');
  }, [messages, scrollToBottom]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen bg-gray-50">
          <div className="w-full max-w-4xl mx-auto flex border rounded-lg bg-white my-8">
            <div className="w-1/3 border-r p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="flex-1 p-4 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-12 bg-gray-100 rounded-lg animate-pulse ${i % 2 ? 'ml-auto w-2/3' : 'mr-auto w-1/2'}`} />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view messages</p>
            <button 
              onClick={() => router.push('/sign-in')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        <div className="w-full max-w-4xl mx-auto flex border rounded-lg bg-white my-4 overflow-hidden">
          {/* Sidebar */}
          <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r`}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Messages</h2>
                <div className="relative">
                  <FiBell className="text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                    onClick={() => startConversation(user)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || user.email}</p>
                      <p className="text-xs text-gray-500">Start conversation</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <FiMessageSquare className="text-4xl mb-2" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  conversations.map(({user, lastMessage}) => (
                    <div
                      key={user.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                      onClick={() => startConversation(user)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="font-medium truncate">{user.full_name || user.email}</p>
                          {lastMessage && (
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {lastMessage.from_id === currentUser.id ? 'You: ' : ''}
                            {lastMessage.content || 'Attachment'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Messages area */}
          <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedUser ? (
              <>
                <div className="p-4 border-b flex items-center">
                  <button
                    className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedUser(null)}
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    {selectedUser.full_name?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedUser.full_name || selectedUser.email}</p>
                    <p className="text-xs text-gray-500">
                      {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
                    </p>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FiMessageSquare className="text-4xl mb-2" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.from_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md rounded-xl p-3 ${message.from_id === currentUser.id ? 'bg-blue-500 text-white' : 'bg-white border'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs opacity-80">
                              {message.from_id === currentUser.id ? 'You' : selectedUser.full_name}
                            </span>
                            <span className="text-xs opacity-80">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.attachment && (
                            <div className="mt-2">
                              <a
                                href={message.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm underline ${message.from_id === currentUser.id ? 'text-blue-100 hover:text-white' : 'text-blue-500 hover:text-blue-700'}`}
                              >
                                <FiPaperclip className="inline mr-1" />
                                View attachment
                              </a>
                            </div>
                          )}
                          {message.from_id === currentUser.id && (
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setEditingMessage(message);
                                  setMessageInput(message.content);
                                  setAttachmentUrl(message.attachment || '');
                                  setShowAttachmentInput(!!message.attachment);
                                }}
                                className="p-1 rounded-full hover:bg-blue-600"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="p-1 rounded-full hover:bg-blue-600"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                  {editingMessage && (
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                      <span>Editing message</span>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setMessageInput('');
                          setAttachmentUrl('');
                          setShowAttachmentInput(false);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {showAttachmentInput && (
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Attachment URL"
                        className="w-full pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          setAttachmentUrl('');
                          setShowAttachmentInput(false);
                        }}
                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <FiPaperclip size={20} />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || isSubmitting}
                      className={`px-4 py-2 rounded-lg ${!messageInput.trim() || isSubmitting ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <FiMessageSquare className="text-4xl mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-center mb-4">Choose an existing conversation or search for a user to start a new one</p>
                <div className="relative w-full max-w-md">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}