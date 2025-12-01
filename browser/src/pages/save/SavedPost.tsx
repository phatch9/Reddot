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

    // Handlers for filter changes (only visible/useful for non-saved feeds)
    function handleDurationChange(newDuration) {
        const newParams = searchParams.set("duration", newDuration);
        setSearchParams(newParams, { replace: true });
    }

    function handleSortByChange(newSortBy) {
        const newParams = searchParams.set("sortBy", newSortBy);
        setSearchParams(newParams, { replace: true });
    }

    const isLoadingInitial = isFetching && data?.pages.length === 0;

    return (
        <div
            id="main-content"
            className="flex w-full flex-col flex-1 p-2 space-y-4 rounded-lg bg-gray-50 md:bg-white md:m-3 max-w-2xl mx-auto">
            
            {/* Filtering Header (Hidden for Saved Posts as requested) */}
            {!forSaved && (
                <header className="flex justify-between items-center p-3 bg-white rounded-xl shadow-md border border-gray-100">
                    {/* ... (Mobile and Desktop controls omitted for brevity, but exist in the logic) ... */}
                    <div className="flex space-x-4 md:hidden text-sm">
                        {/* Mobile Sort */}
                        <div className="flex items-center space-x-2">
                            <span>Sort by</span>
                            <select
                                name="sort"
                                id="sort-mobile"
                                className="p-1.5 px-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleSortByChange(e.target.value)}
                                value={sortBy}>
                                <option value="top">Top</option>
                                <option value="hot">Hot</option>
                                <option value="new">New</option>
                            </select>
                        </div>
                        {/* Mobile Duration */}
                        <div className="flex items-center space-x-2">
                            <span>Of</span>
                            <select
                                name="duration"
                                id="duration-mobile"
                                className="p-1.5 px-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleDurationChange(e.target.value)}
                                value={duration}>
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                                <option value="alltime">All Time</option>
                            </select>
                        </div>
                    </div>
                    {/* Desktop Duration Tabs */}
                    <ul className="hidden space-x-2 list-none md:flex">
                        {['day', 'week', 'month', 'alltime'].map(d => (
                            <li
                                key={d}
                                className={`p-2 rounded-md px-4 text-sm font-medium cursor-pointer transition-colors duration-150 ${duration === d ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                                }`}
                                onClick={() => handleDurationChange(d)}>
                                {d === 'alltime' ? 'All Time' : d.charAt(0).toUpperCase() + d.slice(1)}
                            </li>
                        ))}
                    </ul>
                    {/* Desktop SortBy Tabs */}
                    <ul className="hidden mr-5 space-x-2 list-none md:flex">
                        {['hot', 'new', 'top'].map(s => (
                            <li
                                key={s}
                                className={`p-2 rounded-md px-4 text-sm font-medium cursor-pointer transition-colors duration-150 ${sortBy === s ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100 text-gray-700"
                                }`}
                                onClick={() => handleSortByChange(s)}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </li>
                        ))}
                    </ul>
                </header>
            )}

            {/* Loading Indicator */}
            {isLoadingInitial && <Loader forPosts={true} />}

            {/* No Posts Found Message */}
            {!isLoadingInitial && data?.pages[0]?.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <p className="p-5 bg-white rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-600">
                        No saved posts found. Go save some!
                    </p>
                </motion.div>
            ) : (
                // Posts List
                <div className="flex flex-col space-y-3">
                    {data?.pages.map((pageData, index) => (
                        <ul className="flex flex-col space-y-3" key={index}>
                            <AnimatePresence initial={index === 0}>
                                {pageData?.map((post, postIndex) => (
                                    <Post post={post} key={post.post_info.id} postIndex={postIndex} />
                                ))}
                            </AnimatePresence>
                        </ul>
                    ))}
                </div>
            )}
            
            {/* Fetching Next Page Indicator */}
            {hasNextPage && isFetching && (
                <div className="py-4 text-center text-blue-500 font-medium">
                    Loading more saved items...
                </div>
            )}

            {/* End of Content Indicator */}
            {!hasNextPage && data?.pages[0]?.length > 0 && (
                <div className="py-4 text-center text-gray-400 text-sm">
                    — End of saved posts —
                </div>
            )}
        </div>
    );
}


// --- SAVED POSTS COMPONENT (Requested File) ---

function SavedPosts() {
    // Title management logic from the user's request
    useEffect(() => {
        document.title = "Threaddit | saved";
        return () => {
            document.title = "Threaddit";
        };
    }, [])

    return (
        <div className="flex flex-col items-center p-2 w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 w-full max-w-2xl mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 inline-block text-blue-500 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 10.5V13h-3.951l-4.73 4.73A6 6 0 115 10a6 6 0 0110.5-3.5L17.5 10.5z" />
                </svg>
                Saved Posts
            </h2>
            {/* Renders the InfinitePostsLayout configured for saved posts */}
            <InfinitePostsLayout 
                apiQueryKey="saved" 
                linkUrl={`posts/saved`} 
                forSaved={true} 
            />
        </div>
    );
}


// --- APP WRAPPER (Main Export) ---
// Required to provide the QueryClient context.
const queryClient = new QueryClient();

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-100 p-4">
                <SavedPosts />
            </div>
        </QueryClientProvider>
    );
}