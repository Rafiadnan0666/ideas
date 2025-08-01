'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Layout from '@/components/Layout';
import type { IPost, INote, IUser, ITeam } from '@/types/main.db';
import { FiArrowUp, FiArrowDown, FiMessageSquare, FiShare2, FiBookmark, FiMoreHorizontal, FiUsers } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function Explore() {
  const [authUser, setAuthUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [notesCount, setNotesCount] = useState<{[key: number]: number}>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    attachment: '',
    visibility: 'public',
    team_id: null as number | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/sign-in');
        return;
      }

      setAuthUser({
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? '',
        name: user.user_metadata?.name ?? '',
        password: '',
        created_at: new Date(),
        updated_at: new Date(),
      });
      setLoading(false);
    };

    fetchUser();
  }, [router, supabase]);

  const fetchPublicTeams = useCallback(async () => {
    try {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (teamsData) setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching public teams:', error);
    }
  }, [supabase]);

  const fetchPosts = useCallback(async (pageNum: number) => {
    if (!authUser) return;
    
    setLoading(true);
    try {
      // Fetch posts with pagination
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * 10, pageNum * 10 - 1);
      
      if (!postsData || postsData.length === 0) {
        setHasMore(false);
        return;
      }

      // Fetch notes count for each post
      const postIds = postsData.map(post => post.id);
      const { data: notesData } = await supabase
        .from('notes')
        .select('post_id')
        .in('post_id', postIds);

      const countsMap: { [key: number]: number } = {};
      notesData?.forEach(item => {
        countsMap[item.post_id] = (countsMap[item.post_id] || 0) + 1;
      });

      if (pageNum === 1) {
        setPosts(postsData);
        setNotesCount(countsMap);
      } else {
        setPosts(prev => [...prev, ...postsData]);
        setNotesCount(prev => ({...prev, ...countsMap}));
      }

      // For demo, we'll assume there's more data if we got a full page
      setHasMore(postsData.length === 10);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser, supabase]);

  useEffect(() => {
    fetchPosts(page);
    fetchPublicTeams();
  }, [page, fetchPosts, fetchPublicTeams]);

  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !authUser) return;
    
    setIsSubmitting(true);
    try {
      const randomSuffix = Math.floor(Math.random() * 1000);
      const slugBase = newPost.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      const slug = `${slugBase}-${randomSuffix}`;

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          attachment: newPost.attachment,
          visibility: newPost.visibility,
          user_id: authUser.id,
          type: "post",
          team_id: newPost.team_id,
          slug: slug
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setPosts(prev => [data, ...prev]);
        setShowCreatePost(false);
        setNewPost({
          title: '',
          content: '',
          attachment: '',
          visibility: 'public',
          team_id: null
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttachmentType = (url: string) => {
    if (!url) return null;
    
    // Check for image extensions
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
    // Check for video extensions
    if (/\.(mp4|webm|mov|avi)$/i.test(url)) return 'video';
    // Check for audio extensions
    if (/\.(mp3|wav|ogg)$/i.test(url)) return 'audio';
    // Check if it's a URL
    if (/^https?:\/\//i.test(url)) return 'web';
    
    return null;
  };

  const renderAttachmentPreview = (post: IPost) => {
    const type = getAttachmentType(post.attachment);
    
    if (!type) return null;
    
    switch (type) {
      case 'image':
        return (
          <div className="mt-3">
            <img 
              src={post.attachment} 
              alt="Post attachment" 
              className="max-h-96 w-full object-contain rounded-md bg-gray-100"
            />
          </div>
        );
      case 'video':
        return (
          <div className="mt-3">
            <video 
              controls 
              className="max-h-96 w-full rounded-md bg-black"
            >
              <source src={post.attachment} type={`video/${post.attachment.split('.').pop()}`} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case 'audio':
        return (
          <div className="mt-3">
            <audio 
              controls 
              className="w-full"
            >
              <source src={post.attachment} type={`audio/${post.attachment.split('.').pop()}`} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'web':
        return (
          <div className="mt-3 border rounded-md overflow-hidden">
            <a 
              href={post.attachment} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block hover:bg-gray-50 p-3"
            >
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 truncate">{new URL(post.attachment).hostname}</p>
                  <h4 className="text-sm font-medium text-gray-900 truncate">{post.title || post.attachment}</h4>
                </div>
                {post.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                  <div className="ml-3 flex-shrink-0">
                    <img 
                      src={post.attachment} 
                      alt="Link preview" 
                      className="h-16 w-16 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && page === 1) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 pt-16">
          <div className="max-w-5xl mx-auto p-4">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-md shadow p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-48 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 pt-16">
        <div className="max-w-5xl mx-auto flex gap-6 p-4">
          {/* Main content */}
          <div className="flex-1 space-y-4">
            {/* Create post card */}
            <div className="bg-white rounded-md shadow">
              <div className="p-2 flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                  {authUser?.name?.charAt(0) || authUser?.full_name?.charAt(0) || 'U'}
                </div>
                <input
                  type="text"
                  placeholder="Create Post"
                  className="flex-1 bg-gray-100 rounded-md px-4 py-2 text-sm hover:bg-gray-200 cursor-pointer"
                  onClick={() => setShowCreatePost(true)}
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-4">
              {posts.map(post => (
                <Link key={post.id} href={`/post/${post.slug}`} className="block">
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200">
                    <div className="flex">
                      {/* Vote sidebar */}
                      <div className="bg-gray-50 p-3 flex flex-col items-center justify-start w-14 border-r border-gray-200">
                        <span className="text-sm font-bold text-gray-700 mt-2">{notesCount[post.id] || 0}</span>
                        <span className="text-xs text-gray-500">Notes</span>
                      </div>

                      <div className="flex-1 p-4 sm:p-5">
                        {/* Post header */}
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <span className="font-semibold text-gray-800">Posted by u/{post.user_id}</span>
                          <span className="mx-1.5">•</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          {post.team_id && (
                            <>
                              <span className="mx-1.5">•</span>
                              <span className="flex items-center text-blue-500">
                                <FiUsers className="mr-1" />
                                {teams.find(t => t.id === post.team_id)?.name || 'Team'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Post title and content */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{post.title}</h3>
                        {post.content && <p className="text-base text-gray-700 mb-3 line-clamp-3">{post.content}</p>}

                        {/* Attachment preview */}
                        {post.attachment && renderAttachmentPreview(post)}

                        {/* Post actions */}
                        <div className="flex items-center mt-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                          <button className="flex items-center mr-5 hover:bg-gray-100 p-2 rounded-md transition-colors duration-150">
                            <FiMessageSquare className="mr-2 text-base" />
                            <span>{notesCount[post.id] || 0} Comments</span>
                          </button>
                          <button className="flex items-center mr-5 hover:bg-gray-100 p-2 rounded-md transition-colors duration-150">
                            <FiShare2 className="mr-2 text-base" />
                            <span>Share</span>
                          </button>
                          <button className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors duration-150">
                            <FiMoreHorizontal className="text-base" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {loading && page > 1 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            )}

            {!hasMore && !loading && (
              <div className="text-center py-6 text-gray-500">
                Youve reached the end of the feed
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden md:block w-80 space-y-4">
            {/* Community info */}
            <div className="bg-white rounded-md shadow overflow-hidden">
              <div className="bg-blue-500 h-16"></div>
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 -mt-5 border-4 border-white">
                    <FiUsers size={20} />
                  </div>
                  <h3 className="ml-2 font-medium">Explore</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Browse public posts and teams. Join communities to see more content.
                </p>
                <div className="space-y-3">
                  <button 
                    className="w-full bg-blue-500 text-white py-1 px-4 rounded-full text-sm font-medium hover:bg-blue-600"
                    onClick={() => setShowCreatePost(true)}
                  >
                    Create Post
                  </button>
                </div>
              </div>
            </div>

            {/* Public Teams */}
            <div className="bg-white rounded-md shadow overflow-hidden">
              <div className="p-3 bg-gray-100 border-b">
                <h3 className="font-medium">Public Teams</h3>
              </div>
              <div className="divide-y">
                {teams.map(team => (
                  <Link 
                    key={team.id} 
                    href={`/team/${team.id}`}
                    className="block p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-2">
                        <FiUsers size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">t/{team.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{team.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {teams.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">
                    No public teams found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Create a post</h3>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <textarea
                    placeholder="Text (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Url (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPost.attachment}
                    onChange={(e) => setNewPost({...newPost, attachment: e.target.value})}
                  />
                  {newPost.attachment && (
                    <div className="mt-2 text-xs text-gray-500">
                      {getAttachmentType(newPost.attachment) === 'image' && 'Image detected'}
                      {getAttachmentType(newPost.attachment) === 'video' && 'Video detected'}
                      {getAttachmentType(newPost.attachment) === 'audio' && 'Audio detected'}
                      {getAttachmentType(newPost.attachment) === 'web' && 'Link detected'}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post to (optional)</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPost.team_id || ''}
                    onChange={(e) => setNewPost({...newPost, team_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="">Public post</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>t/{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || isSubmitting}
                  className={`px-4 py-2 rounded-md ${!newPost.title.trim() || isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}