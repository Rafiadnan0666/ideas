'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Layout from '@/components/Layout';
import type { IPost, INote, IUser } from '@/types/main.db';
import { FiEdit, FiTrash2, FiMessageSquare, FiShare2, FiBookmark, FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function BlogPage() {
  const [authUser, setAuthUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<IPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<IPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMyBlogsModal, setShowMyBlogsModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<IPost | null>(null);
  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    attachment: '',
    visibility: 'public',
    type: 'post'
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
    };

    fetchUser();
  }, [router, supabase]);

  const fetchBlogs = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const { data: blogsData } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'blog')
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * 10, pageNum * 10 - 1);
      
      if (!blogsData || blogsData.length === 0) {
        setHasMore(false);
        return;
      }

      if (pageNum === 1) {
        setBlogs(blogsData);
        setFilteredBlogs(blogsData);
      } else {
        setBlogs(prev => [...prev, ...blogsData]);
        setFilteredBlogs(prev => [...prev, ...blogsData]);
      }

      setHasMore(blogsData.length === 10);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBlogs(page);
  }, [page, fetchBlogs]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBlogs(blogs);
    } else {
      const filtered = blogs.filter(blog => 
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBlogs(filtered);
    }
  }, [searchQuery, blogs]);

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

  const getLinkPreview = (url: string) => {
    if (!url) return null;
    
    // Image extensions
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img 
            src={url} 
            alt="Embedded content" 
            className="max-w-full h-auto max-h-96 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    // Video extensions
    if (/\.(mp4|webm|mov|avi|mkv)$/i.test(url)) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden">
          <video 
            controls 
            className="w-full max-h-96"
          >
            <source src={url} type={`video/${url.split('.').pop()}`} />
          </video>
        </div>
      );
    }
    
    // Audio extensions
    if (/\.(mp3|wav|ogg|flac)$/i.test(url)) {
      return (
        <div className="mt-3">
          <audio controls className="w-full">
            <source src={url} type={`audio/${url.split('.').pop()}`} />
          </audio>
        </div>
      );
    }
    
    // YouTube
if (url.includes('youtube.com') || url.includes('youtu.be')) {
  let videoId: string | null = null;

  // Match common YouTube URL patterns
  const patterns = [
    /v=([^&]+)/,                           // youtube.com/watch?v=VIDEOID
    /youtu\.be\/([^?&]+)/,                // youtu.be/VIDEOID
    /embed\/([^?&]+)/,                    // youtube.com/embed/VIDEOID
    /\/shorts\/([^?&]+)/,                 // youtube.com/shorts/VIDEOID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      videoId = match[1];
      break;
    }
  }

  if (videoId) {
    return (
      <div className="mt-3 aspect-w-16 aspect-h-9">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
            <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
          </div>
        );
      }
    }
    
    // Generic URL - Show as link card
    try {
      const urlObj = new URL(url);
      return (
        <div className="mt-3 border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors">
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            <div className="p-3">
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 truncate">{urlObj.hostname}</p>
                  <h4 className="text-sm font-medium text-gray-900 truncate">{urlObj.pathname}</h4>
                </div>
              </div>
            </div>
          </a>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderContentPreview = (content: string) => {
    if (!content) return null;
    
    // Extract first paragraph and any links
    const firstParagraph = content.split('\n')[0];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];
    
    return (
      <div className="space-y-2">
        <p className="text-gray-700 line-clamp-3">{firstParagraph}</p>
        {urls.slice(0, 1).map((url, i) => (
          <div key={i}>{getLinkPreview(url)}</div>
        ))}
      </div>
    );
  };

  const renderFullContent = (content: string) => {
    if (!content) return null;
    
    // Split content by URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return (
      <div className="prose max-w-none">
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            const preview = getLinkPreview(part);
            return preview || (
              <a 
                key={i} 
                href={part} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {part}
              </a>
            );
          }
          return <p key={i}>{part}</p>;
        })}
      </div>
    );
  };

  const createBlog = async () => {
    if (!newBlog.title.trim() || !authUser) return;
    
    setIsSubmitting(true);
    try {
      const randomSuffix = Math.floor(Math.random() * 1000);
      const slugBase = newBlog.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      const slug = `${slugBase}-${randomSuffix}`;

      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...newBlog,
          user_id: authUser.id,
          slug: slug
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setBlogs(prev => [data, ...prev]);
        setFilteredBlogs(prev => [data, ...prev]);
        setShowCreateModal(false);
        setNewBlog({
          title: '',
          content: '',
          attachment: '',
          visibility: 'public',
          type: 'blog'
        });
      }
    } catch (error) {
      console.error('Error creating blog:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBlog = async () => {
    if (!currentBlog || !currentBlog.title.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          title: currentBlog.title,
          content: currentBlog.content,
          attachment: currentBlog.attachment,
          visibility: currentBlog.visibility
        })
        .eq('id', currentBlog.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setBlogs(prev => prev.map(blog => blog.id === data.id ? data : blog));
        setFilteredBlogs(prev => prev.map(blog => blog.id === data.id ? data : blog));
        setShowEditModal(false);
        setCurrentBlog(null);
      }
    } catch (error) {
      console.error('Error updating blog:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBlog = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setBlogs(prev => prev.filter(blog => blog.id !== id));
      setFilteredBlogs(prev => prev.filter(blog => blog.id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  if (loading && page === 1) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 pt-16">
          <div className="max-w-4xl mx-auto p-4">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-md shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
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
        <div className="max-w-4xl mx-auto p-4">
          {/* Header and Search */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            <div className="flex items-center space-x-3">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search blogs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
              {authUser && (
                <button
                  onClick={() => setShowMyBlogsModal(true)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  My Blogs
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center"
              >
                <FiPlus className="mr-1" />
                <span>New Post</span>
              </button>
            </div>
          </div>

          {/* Blog List */}
          <div className="space-y-6">
            {filteredBlogs.map(blog => (
              <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <Link href={`/blog/${blog.slug}`}>
                    <div className="cursor-pointer">
                      <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                        {blog.title}
                      </h2>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>Posted by {blog.user_id === authUser?.id ? 'you' : `u/${blog.user_id}`}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}</span>
                      </div>
                      {renderContentPreview(blog.content)}
                    </div>
                  </Link>
                </div>
              </div>
            ))}

            {loading && page > 1 && (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {!hasMore && !loading && filteredBlogs.length > 0 && (
              <div className="text-center py-6 text-gray-500">
                Youve reached the end of the blog posts
              </div>
            )}

            {filteredBlogs.length === 0 && !loading && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No blog posts found</h3>
                <p className="mt-2 text-gray-500">
                  {searchQuery ? 'Try a different search term' : 'Be the first to create a blog post'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Create Blog Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Blog Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">Create New Blog Post</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    placeholder="Blog post title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newBlog.title}
                    onChange={(e) => setNewBlog({...newBlog, title: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    placeholder="Write your blog content here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                    value={newBlog.content}
                    onChange={(e) => setNewBlog({...newBlog, content: e.target.value})}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Paste URLs to automatically embed content (images, videos, tweets, etc.)
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL (optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newBlog.attachment}
                    onChange={(e) => setNewBlog({...newBlog, attachment: e.target.value})}
                  />
                  {newBlog.attachment && getLinkPreview(newBlog.attachment)}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newBlog.visibility}
                    onChange={(e) => setNewBlog({...newBlog, visibility: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={createBlog}
                  disabled={!newBlog.title.trim() || isSubmitting}
                  className={`px-4 py-2 rounded-md ${!newBlog.title.trim() || isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Blog Modal */}
        {showEditModal && currentBlog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">Edit Blog Post</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                  <input
                    type="text"
                    placeholder="Blog post title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentBlog.title}
                    onChange={(e) => setCurrentBlog({...currentBlog, title: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    placeholder="Write your blog content here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                    value={currentBlog.content}
                    onChange={(e) => setCurrentBlog({...currentBlog, content: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL (optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentBlog.attachment}
                    onChange={(e) => setCurrentBlog({...currentBlog, attachment: e.target.value})}
                  />
                  {currentBlog.attachment && getLinkPreview(currentBlog.attachment)}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={currentBlog.visibility}
                    onChange={(e) => setCurrentBlog({...currentBlog, visibility: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={updateBlog}
                  disabled={!currentBlog.title.trim() || isSubmitting}
                  className={`px-4 py-2 rounded-md ${!currentBlog.title.trim() || isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {isSubmitting ? 'Updating...' : 'Update Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Blogs Modal */}
        {showMyBlogsModal && authUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">My Blog Posts</h3>
                <button onClick={() => setShowMyBlogsModal(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search my posts..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  {blogs
                    .filter(blog => blog.user_id === authUser.id)
                    .filter(blog => 
                      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      blog.content.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(blog => (
                      <div key={blog.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{blog.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
                              {blog.visibility === 'private' && (
                                <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">Private</span>
                              )}
                            </p>
                            {renderContentPreview(blog.content)}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button 
                              onClick={() => {
                                setCurrentBlog(blog);
                                setShowEditModal(true);
                                setShowMyBlogsModal(false);
                              }}
                              className="text-gray-500 hover:text-blue-500 p-1"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button 
                              onClick={() => deleteBlog(blog.id)}
                              className="text-gray-500 hover:text-red-500 p-1"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}