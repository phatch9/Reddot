import { useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, ChangeEvent, UIEvent } from "react";
import { useSearchParams } from "react-router-dom";
import Post from "./PostCurrent";
import Loader from "./Loader";

// Type Definitions

/**
 * Interface for the post structure. We only define the parts necessary for keying and rendering.
 * Assuming the post object contains a nested post_info structure with an ID.
 */
interface PostData {
post_info: {
    id: string;
    // Add other necessary properties here as your API defines them (e.g., title, body)
    };
}

/** Interface for the API response page data/ an array of posts*/
type PageData = PostData[];

/** Interface for the props of the InfinitePostsLayout component. */
interface InfinitePostsLayoutProps {
linkUrl: string;
apiQueryKey: string;
forSaved?: boolean;
enabled?: boolean;
}

// Component Implementation
/**
 * A layout component that fetches and displays posts using infinite scrolling.
 * It also includes options for sorting and filtering posts by duration.
 */
export const InfinitePostsLayout: FC<InfinitePostsLayoutProps> = ({
linkUrl,
apiQueryKey,
forSaved = false,
enabled = true,
}) => {
const [searchParams, setSearchParams] = useSearchParams();
// Get and type the query parameters, defaulting to 'top' and 'alltime'
const sortBy = searchParams.get("sortBy") || "top";
const duration = searchParams.get("duration") || "alltime";

const { data, isFetching, hasNextPage, fetchNextPage } = useInfiniteQuery<
        PageData,
        Error,
        InfiniteData<PageData>, // Use InfiniteData wrapper
        [string, string, string, string],
        number >({ // Page parameter type
        
        queryKey: ["posts", apiQueryKey, sortBy, duration],
        queryFn: async ({ pageParam = 0 }) => {
            const offset = pageParam * 20; // 20 posts per page
            const apiUrl = `/api/${linkUrl}?limit=20&offset=${offset}&sortby=${sortBy}&duration=${duration}`;
            const response = await axios.get<PageData>(apiUrl);
            return response.data;
        },
        enabled: enabled,
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.length < 20) return undefined;
            return pages.length;
        },
        staleTime: 5 * 60 * 1000,
        initialPageParam: 0,
});

// --- Infinite Scrolling Logic ---
useEffect(() => {
    // We use UIEvent for the scroll event
    const onScroll = (event: Event) => {
    // Type assertion is necessary to access scrollingElement properties on the event target
    const target = (event.target as Document).scrollingElement;
    if (!target) return;

    const { scrollTop, scrollHeight, clientHeight } = target;

    // Check if the user is near the bottom (within 2 viewports)
    if (scrollHeight - scrollTop <= clientHeight * 2 && hasNextPage && !isFetching) {
        fetchNextPage();
    }
    };

    window.addEventListener("scroll", onScroll);
    return () => {
    window.removeEventListener("scroll", onScroll);
    };
}, [fetchNextPage, isFetching, hasNextPage]);

// Filter Handlers

function handleDurationChange(newDuration: string) {
    searchParams.set("duration", newDuration);
    setSearchParams(searchParams, { replace: true });
}

function handleSortByChange(newSortBy: string) {
    searchParams.set("sortBy", newSortBy);
    setSearchParams(searchParams, { replace: true });
}

// Handler for mobile dropdowns
function handleSelectChange(e: ChangeEvent<HTMLSelectElement>, type: 'sortBy' | 'duration') {
    if (type === 'sortBy') {
    handleSortByChange(e.target.value);
    } else {
    handleDurationChange(e.target.value);
    }
}

// Render logic
// Check if the first page exists and is empty
const noPostsFound = data?.pages[0]?.length === 0;

return (
    <div
    id="main-content"
    className="flex w-full flex-col flex-1 p-2 space-y-3 rounded-lg m-0.5 bg-theme-cultured md:bg-white md:m-3">
    
    {/* Post Filtering and Sorting Header */}
    {!forSaved && (
        <header className="flex justify-between items-center">
        
        {/* Mobile Sort and Duration Dropdowns */}
        <div className="flex items-center space-x-2 md:hidden">
            <span>Sort by</span>
            <select
            name="sort"
            id="sort"
            className="p-2 px-4 bg-white rounded-md md:bg-theme-cultured"
            onChange={(e) => handleSelectChange(e, 'sortBy')}
            value={sortBy}>
            <option value="top">Top</option>
            <option value="hot">Hot</option>
            <option value="new">New</option>
            </select>
        </div>
        <div className="flex items-center space-x-2 md:hidden">
            <span>Of</span>
            <select
            name="duration"
            id="duration"
            className="p-2 px-4 bg-white rounded-md md:bg-theme-cultured"
            onChange={(e) => handleSelectChange(e, 'duration')}
            value={duration}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="alltime">All Time</option>
            </select>
        </div>

        {/* Desktop Duration Filters */}
        <ul className="hidden space-x-2 list-none md:flex">
            {["day", "week", "month", "alltime"].map((d) => (
            <li
                key={d}
                className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${
                duration === d && "bg-theme-gray-blue"
                }`}
                onClick={() => handleDurationChange(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1).replace('time', ' Time')}
            </li>
            ))}
        </ul>
        
        {/* Desktop Sort By Filters */}
        <ul className="hidden mr-5 space-x-5 list-none md:flex">
            {["hot", "new", "top"].map((s) => (
            <li
                key={s}
                className={`p-2 hover:bg-theme-gray-blue rounded-md px-4 text-lg cursor-pointer ${
                sortBy === s && "bg-theme-gray-blue"
                }`}
                onClick={() => handleSortByChange(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
            </li>
            ))}
        </ul>
        </header>
    )}

    {/* Loading Indicator */}
    {isFetching && <Loader forPosts={true} />}

    {/* No Posts Found Message */}
    {noPostsFound ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <p className="p-5 bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
            No posts with this filter were found, <br className="md:hidden" />
            Be the first to add one!
        </p>
        </motion.div>
    ) : (
        /* Post List */
        <div className="flex flex-col space-y-2 md:space-y-3">
        {data?.pages.map((pageData, index) => (
            <ul className="flex flex-col space-y-2 md:space-y-3" key={index}>
            {/* AnimatePresence on the page level can cause issues on infinite scroll,
                but we'll keep the inner AnimatePresence for individual post animations if needed.
                We remove the initial={index == 0} property as it's not a standard prop
                and might cause warnings unless it's a custom variant or state. */}
            <AnimatePresence>
                {pageData?.map((post, postIndex) => (
                <Post post={post} key={post.post_info.id} postIndex={postIndex} />
                ))}
            </AnimatePresence>
            </ul>
        ))}
        </div>
    )}
    
    {/* Loading indicator for fetching next page */}
    {isFetching && hasNextPage && <Loader forPosts={true} />}
    </div>
    );
}

export default InfinitePostsLayout;
