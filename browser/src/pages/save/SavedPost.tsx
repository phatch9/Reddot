import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";

// --- STUBBED DEPENDENCIES ---
// These mocks make the component runnable without external libraries/files.

// Mock for 'axios'
const axios = {
    get: async (url) => {
        console.log(`Mock Fetching: ${url}`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(500)); 
        
        const params = new URLSearchParams(url.split('?')[1]);
        const offset = parseInt(params.get('offset')) || 0;
        const limit = parseInt(params.get('limit')) || 20;

        // Use a different, consistent mock for saved posts
        const totalMockPosts = 38; 
        const posts = [];
        
        for (let i = 0; i < limit; i++) {
            const postIndex = offset + i;
            if (postIndex >= totalMockPosts) break;
            
            posts.push({
                post_info: { 
                    id: `saved${postIndex}`, 
                    title: `[SAVED] Post ${postIndex + 1} from ${params.get('linkUrl')}`,
                    post_karma: Math.floor(Math.random() * 500)
                },
                user_info: { user_name: 'archivedUser' },
                thread_info: { thread_name: 'r/history' },
            });
        }
        
        return { data: posts };
    },
};

// Mock for 'react-router-dom' useSearchParams
const useSearchParamsMock = () => {
    // Saved posts don't usually use sortBy/duration, but we keep the params available
    const [params, setParams] = useState({ sortBy: 'new', duration: 'alltime' });
    const searchParams = useMemo(() => ({
        get: (key) => params[key],
    }), [params]);
    
    const setSearchParams = useCallback((newParams, options) => {
        setParams(prev => ({ ...prev, ...Object.fromEntries(newParams.entries()) }));
        console.log("Search Params Updated:", Object.fromEntries(newParams.entries()));
    }, []);

    const MockURLSearchParams = useMemo(() => {
        const urlParams = new Map(Object.entries(params));
        return {
            get: (key) => urlParams.get(key),
            set: (key, value) => { urlParams.set(key, value); return urlParams; },
            entries: () => urlParams.entries(),
        };
    }, [params]);

    return [MockURLSearchParams, setSearchParams];
};

// Mock for 'framer-motion'
const motion = {
    div: ({ children, className, initial, animate, transition }) => <div className={className}>{children}</div>,
    li: ({ children, className, variants, initial, animate, exit, transition }) => <li className={className}>{children}</li>,
};
const AnimatePresence = ({ children }) => <>{children}</>;

// Mock for 'Loader'
const Loader = ({ forPosts }) => (
    <div className="flex justify-center items-center p-8 text-lg text-gray-500">
        Loading {forPosts ? 'Posts...' : 'Data...'}
    </div>
);

// Mock for PropTypes
const PropTypes = { 
    string: () => null, 
    bool: () => null,
    number: () => null, 
    any: () => null 
};

// Mock for 'Post' component (minimal implementation)
const Post = ({ post, postIndex }) => (
    <motion.li
        className="flex flex-col p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm transition-shadow duration-300 hover:shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: postIndex * 0.02 }}>
        <div className='flex items-center space-x-2 text-sm text-blue-600 font-semibold'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span>Saved Item</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mt-1">{post.post_info.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
            Posted by u/{post.user_info.user_name} in {post.thread_info.thread_name}
        </p>
        <span className='text-xs text-gray-400'>Post ID: {post.post_info.id}</span>
    </motion.li>
);
Post.propTypes = { post: PropTypes.any, postIndex: PropTypes.number };

// --- INFINITE POSTS LAYOUT COMPONENT (From previous file) ---

function InfinitePostsLayout({ linkUrl, apiQueryKey, forSaved = false, enabled = true }) {
    // useSearchParamsMock is now the mock for useSearchParams
    const [searchParams, setSearchParams] = useSearchParamsMock(); 
    
    // For saved posts, we often ignore sortBy/duration, but we read them from URL if present
    const sortBy = searchParams.get("sortBy") || "new"; 
    const duration = searchParams.get("duration") || "alltime";

    const { data, isFetching, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
        queryKey: ["posts", apiQueryKey, sortBy, duration],
        queryFn: async ({ pageParam = 0 }) => {
            // Mock API call using stubbed axios
            return await axios
                .get(`/api/${linkUrl}?limit=${20}&offset=${pageParam * 20}&sortby=${sortBy}&duration=${duration}&linkUrl=${linkUrl}`)
                .then((data) => data.data);
        },
        enabled: enabled,
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.length < 20) return undefined;
            return pages.length;
        },
        initialPageParam: 0,
    });
    
    // For general feeds, trigger refetch when filters change. For saved, we might only care about refetching on mount.
    useEffect(() => {
        if (!forSaved) {
            refetch();
        }
    }, [sortBy, duration, refetch, forSaved]);

    // Infinite Scrolling Logic
    useEffect(() => {
        const onScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            if (scrollHeight - scrollTop <= clientHeight * 2 && hasNextPage && !isFetching) {
                console.log("Fetching next page...");
                fetchNextPage();
            }
        };
        
        window.addEventListener("scroll", onScroll);
        
        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, [fetchNextPage, isFetching, hasNextPage]);

