'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Layout from '@/components/Layout';
import type { IPost, INote, IUser } from '@/types/main.db';
import { FiMessageSquare, FiShare2, FiBookmark, FiEdit2, FiTrash2, FiCornerUpLeft, FiClock, FiUser, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function BlogPage() {
  const [authUser, setAuthUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<IPost | null>(null);
  const [notes, setNotes] = useState<INote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState<INote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const parallaxStyle = (speed: number) => ({
    transform: `translate(${cursorPosition.x * speed}px, ${cursorPosition.y * speed}px)`
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        setAuthUser({
          id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? '',
          name: '',
          password: '',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    };

    fetchUser();
  }, [supabase]);

  const fetchPostAndNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (postError || !postData) throw new Error('Post not found');

      setPost(postData);

      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('post_id', postData.id)
        .eq('visibility', 'public')
        .order('created_at', { ascending: true });

      if (notesError) throw notesError;
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [slug, supabase]);

  useEffect(() => {
    if (slug) fetchPostAndNotes();
  }, [slug, fetchPostAndNotes]);

  const getLinkPreview = (url: string) => {
    if (!url) return null;
    
    // Image extensions
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all">
          <img 
            src={url} 
            alt="Embedded content" 
            className="w-full h-auto max-h-96 object-contain"
            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
          />
        </div>
      );
    }
    
    // Video extensions
    if (/\.(mp4|webm|mov|avi|mkv)$/i.test(url)) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all">
          <video controls className="w-full max-h-96">
            <source src={url} type={`video/${url.split('.').pop()}`} />
          </video>
        </div>
      );
    }
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = url.match(/v=([^&]+)/)?.[1] || 
                   url.match(/youtu\.be\/([^?&]+)/)?.[1] || 
                   url.match(/embed\/([^?&]+)/)?.[1];
      
      if (videoId) {
        return (
          <div className="mt-3 aspect-w-16 aspect-h-9 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
    }
    
    // Twitter
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const tweetId = url.match(/status\/(\d+)/)?.[1];
      if (tweetId) {
        return (
          <div className="mt-3">
            <blockquote className="twitter-tweet">
              <a href={url}></a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js"></script>
          </div>
        );
      }
    }
    
    // Generic URL
    try {
      const urlObj = new URL(url);
      return (
        <div className="mt-3 border border-gray-800 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-colors">
          <a href={url} target="_blank" rel="noopener noreferrer" className="block p-3">
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 truncate">{urlObj.hostname}</p>
                <h4 className="text-sm font-medium text-gray-200 truncate">{url}</h4>
              </div>
            </div>
          </a>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderContentWithEmbeds = (content: string) => {
    if (!content) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return (
      <div className="prose prose-invert max-w-none">
        {parts.map((part, i) => part.match(urlRegex) ? 
          getLinkPreview(part) || (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline break-all"
            >
              {part}
            </a>
          ) : 
          <p key={i}>{part}</p>
        )}
      </div>
    );
  };

  const openNoteModal = (note: INote | null, isReply = false) => {
    setCurrentNote(note);
    setNoteContent(note?.content || '');
    setReplyingTo(isReply && note ? note.id : null);
    setShowNoteModal(true);
  };

  const handleNoteSubmit = async () => {
    if (!noteContent.trim() || !post) return;
    if (!authUser) {
      router.push('/sign-in');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (currentNote && !replyingTo) {
        const { error } = await supabase
          .from('notes')
          .update({ content: noteContent, updated_at: new Date().toISOString() })
          .eq('id', currentNote.id);
        
        if (error) throw error;
        
        setNotes(prev => prev.map(n => 
          n.id === currentNote.id ? 
          { ...n, content: noteContent, updated_at: new Date() } : 
          n
        ));
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            content: noteContent,
            post_id: post.id,
            user_id: authUser.id,
            visibility: 'public',
            parent_id: replyingTo || null
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setNotes(prev => [...prev, {
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
      
      setShowNoteModal(false);
      setCurrentNote(null);
      setReplyingTo(null);
    } catch (error: any) {
      console.error('Error saving note:', error);
      setError(error.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await supabase.from('notes').delete().eq('parent_id', noteId);
      const { error } = await supabase.from('notes').delete().eq('id', noteId);
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
    }
  };

  const renderNote = (note: INote, depth = 0) => {
    const isOwner = authUser && note.user_id === authUser.id;
    const replies = notes.filter(n => n.parent_id === note.id);
    const maxDepth = 4;
    
    return (
      <div key={note.id} className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-800' : ''}`}>
        <div className="py-4 group">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <FiUser className="text-gray-300" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-sm text-gray-400 mb-1">
                <span className="font-medium text-gray-100">@{note.user_id}</span>
                <span className="mx-1">·</span>
                <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                {note.updated_at > note.created_at && (
                  <span className="text-xs italic ml-1">(edited)</span>
                )}
              </div>
              
              <div className="text-gray-200 whitespace-pre-line mb-2">
                {renderContentWithEmbeds(note.content)}
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <button 
                  onClick={() => openNoteModal(note, true)}
                  className="flex items-center text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <FiMessageSquare className="mr-1" />
                  <span>Reply</span>
                </button>
                {isOwner && (
                  <>
                    <button 
                      onClick={() => openNoteModal(note)}
                      className="flex items-center text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <FiEdit2 className="mr-1" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="flex items-center text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 className="mr-1" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
              
              {depth < maxDepth && replies.length > 0 && (
                <div className="mt-4 space-y-4">
                  {replies.map(reply => renderNote(reply, depth + 1))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] flex items-center justify-center">
        <div className="max-w-md text-center px-4">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Post Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || 'The post you are looking for does not exist or may have been removed.'}
          </p>
          <Link 
            href="/" 
            className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md hover:opacity-90 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const ContentWrapper = authUser ? Layout : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <ContentWrapper>
      <>
        <title>{post?.title ? `${post.title} | Vault Blog` : 'Vault Blog'}</title>
        <meta name="description" content={post?.content?.slice(0, 160) || 'Read and share responses on Vault Blog.'} />
        <meta property="og:title" content={post?.title || 'Vault Blog'} />
        <meta property="og:description" content={post?.content?.slice(0, 160) || 'Read and share responses on Vault Blog.'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://yourdomain.com/blog/${post?.slug || ''}`} />
        {post?.attachment && (
          <meta property="og:image" content={post.attachment} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post?.title || 'Vault Blog'} />
        <meta name="twitter:description" content={post?.content?.slice(0, 160) || 'Read and share responses on Vault Blog.'} />
        {post?.attachment && (
          <meta name="twitter:image" content={post.attachment} />
        )}
      </>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl animate-float"
            style={parallaxStyle(0.02)}
          ></div>
          <div 
            className="absolute top-2/3 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl animate-float-delay"
            style={parallaxStyle(0.03)}
          ></div>
        </div>

        {/* Article Header */}
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-8 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            {post.title}
          </h1>
          
          <div className="flex items-center space-x-4 text-gray-400 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full mr-3 flex items-center justify-center">
                <FiUser className="text-gray-300" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-100">@{post.user_id}</div>
                <div className="flex items-center text-xs">
                  <FiClock className="mr-1" size={12} />
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            {authUser && (
              <div className="flex items-center space-x-4 ml-auto">
                <button className="p-2 text-gray-400 hover:text-purple-400 transition-colors">
                  <FiBookmark size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-purple-400 transition-colors">
                  <FiShare2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Article Content */}
        <div className="max-w-3xl mx-auto px-4 pb-12 relative z-10">
          <div className="prose prose-invert max-w-none text-gray-300 mb-12">
            {renderContentWithEmbeds(post.content)}
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-100">
                {notes.filter(n => !n.parent_id).length} {notes.filter(n => !n.parent_id).length === 1 ? 'Response' : 'Responses'}
              </h2>
              {authUser ? (
                <button 
                  onClick={() => openNoteModal(null)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md hover:opacity-90 transition font-medium text-sm"
                >
                  Write a response
                </button>
              ) : (
                <Link 
                  href="/sign-in" 
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md hover:opacity-90 transition font-medium text-sm"
                >
                  Sign in to comment
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              {notes.filter(note => !note.parent_id).map(note => renderNote(note))}
              
              {notes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No responses yet. Be the first to share what you think.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl shadow-purple-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-100">
                    {replyingTo ? 'Reply to Comment' : currentNote ? 'Edit Comment' : 'Add Comment'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowNoteModal(false);
                      setCurrentNote(null);
                      setReplyingTo(null);
                    }}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                {replyingTo && (
                  <p className="text-sm text-gray-400 mt-1">
                    Replying to comment by u/{notes.find(n => n.id === replyingTo)?.user_id || ''}
                  </p>
                )}
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-md text-sm border border-red-500/30">
                    {error}
                  </div>
                )}
                
                <textarea
                  placeholder={replyingTo ? "Write your reply..." : "What are your thoughts?"}
                  className="w-full px-4 py-3 bg-[#0e0e0e] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px] text-gray-200 placeholder-gray-500"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                
                <div className="mt-4 text-sm text-gray-400">
                  <p>Paste a URL to embed content (images, videos, tweets, etc.)</p>
                </div>
              </div>
              
              <div className="p-6 bg-[#0e0e0e] flex justify-end gap-3 border-t border-gray-800">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setCurrentNote(null);
                    setReplyingTo(null);
                  }}
                  className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800/50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoteSubmit}
                  disabled={!noteContent.trim() || isSubmitting}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    !noteContent.trim() || isSubmitting ? 
                    'bg-gray-700 text-gray-500 cursor-not-allowed' : 
                    'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90'
                  }`}
                >
                  {isSubmitting ? 'Publishing...' : 
                   replyingTo ? 'Publish Reply' : 
                   currentNote ? 'Update Comment' : 'Publish Comment'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-delay {
            animation: float 6s ease-in-out 2s infinite;
          }
          
          .prose-invert a {
            color: #a78bfa;
          }
          .prose-invert a:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    </ContentWrapper>
  );
}