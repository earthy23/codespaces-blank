import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth';

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  authorId: string;
  publishedAt: string;
  updatedAt: string;
  published: boolean;
  category: 'announcement' | 'update' | 'event' | 'maintenance';
  imageUrl?: string;
}

interface NewsContextType {
  posts: NewsPost[];
  publishedPosts: NewsPost[];
  addPost: (post: Omit<NewsPost, 'id' | 'publishedAt' | 'updatedAt'>) => void;
  updatePost: (id: string, post: Partial<NewsPost>) => void;
  deletePost: (id: string) => void;
  publishPost: (id: string) => void;
  unpublishPost: (id: string) => void;
  getPostById: (id: string) => NewsPost | undefined;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);



export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadNewsData();
  }, []);

  const loadNewsData = () => {
    const storedPosts = JSON.parse(localStorage.getItem('uec_news_posts') || '[]');
    setPosts(storedPosts);
  };

  const savePosts = (newPosts: NewsPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('uec_news_posts', JSON.stringify(newPosts));
  };

  const addPost = (postData: Omit<NewsPost, 'id' | 'publishedAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newPost: NewsPost = {
      ...postData,
      id: `news-${Date.now()}`,
      publishedAt: postData.published ? new Date().toISOString() : '',
      updatedAt: new Date().toISOString(),
    };
    
    const newPosts = [newPost, ...posts];
    savePosts(newPosts);
  };

  const updatePost = (id: string, updatedData: Partial<NewsPost>) => {
    const newPosts = posts.map(post => 
      post.id === id 
        ? { 
            ...post, 
            ...updatedData, 
            updatedAt: new Date().toISOString(),
            publishedAt: updatedData.published && !post.published 
              ? new Date().toISOString() 
              : post.publishedAt
          }
        : post
    );
    savePosts(newPosts);
  };

  const deletePost = (id: string) => {
    const newPosts = posts.filter(post => post.id !== id);
    savePosts(newPosts);
  };

  const publishPost = (id: string) => {
    updatePost(id, { 
      published: true, 
      publishedAt: new Date().toISOString() 
    });
  };

  const unpublishPost = (id: string) => {
    updatePost(id, { published: false });
  };

  const getPostById = (id: string): NewsPost | undefined => {
    return posts.find(post => post.id === id);
  };

  const publishedPosts = posts
    .filter(post => post.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <NewsContext.Provider value={{
      posts,
      publishedPosts,
      addPost,
      updatePost,
      deletePost,
      publishPost,
      unpublishPost,
      getPostById,
    }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
