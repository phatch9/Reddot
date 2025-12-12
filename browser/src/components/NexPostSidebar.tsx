import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { FC } from "react";

// Type Definitions

/** Defines the structure of a single thread item */
interface NexPost {
    id: string;
    name: string;
    logo?: string; // logo will be optional
    subscriberCount: number;
}

/** Defines the structure of the data returned by the API */
interface NexPostData {
    subscribed: NexPost[];
    all: NexPost[];
    popular: NexPost[];
}

/** Props for the SideBarComponent */
interface SideBarComponentProps {
    threadList?: NexPost[];
}

// SideBarComponent Implementation

/**
 * Renders a list of thread links for the sidebar.
 * @param {SideBarComponentProps} props The component props containing the list of threads.
 */
const SideBarComponent: FC<SideBarComponentProps> = ({ threadList }) => {
    return (
        <div className="flex flex-col space-y-4 w-48 list-none">
            {/* threadList is now an array of NexPost objects */}
            {threadList?.slice(0, 10).map((thread) => (
                <Link
                    to={`/${thread.name}`}
                    className="flex justify-between w-48 cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-colors" 
                    key={thread.id || thread.name} // Use ID if available, otherwise name
                >
                    <div className={`flex items-center space-x-3 ${!thread.logo && "pl-9"}`}>
                        {/* Note: In a real app, always provide proper width/height for images to prevent CLS */}
                        {thread.logo && (
                            <img
                                loading="lazy"
                                src={thread.logo}
                                alt={`${thread.name} logo`}
                                className="object-cover w-6 h-6 rounded-full"
                                // Added explicit dimensions to prevent Cumulative Layout Shift
                                width={24}
                                height={24}
                            />
                        )}
                        <span className="truncate text-sm font-medium text-gray-800">{thread.name}</span>
                    </div>
                    {/* Format count: ensure two digits for subscriber count */}
                    <span className="p-1 px-2 text-xs font-semibold rounded-full bg-theme-gray-blue text-white">
                        {thread.subscriberCount > 9 ? thread.subscriberCount : `0${thread.subscriberCount}`}
                    </span>
                </Link>
            ))}
        </div>
    );
}

// Sidebar Implementation
/**
 * The main sidebar component displaying subscribed, top, and popular threads.
 * Uses useQuery for data fetching.
 */
export function NexPostSidebar() {
    // Use the RedditData interface for the useQuery response
    const { data, isLoading, isError } = useQuery<NexPostData>({
    queryKey: ["threads/all"],
    queryFn: async (): Promise<NexPostData> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const res = await axios.get<NexPostData>("/api/threads");
        return res.data;
    },
    retry: 2,
});

    // In a production app, use an Error/Loader component here.
    if (isLoading) {
        // Typically use the Loader component here:
        return (
            <aside className="hidden flex-col w-56 md:flex p-5">
                <p className="text-gray-500 font-medium">Loading threads...</p>
            </aside>
        );
    }

    if (isError || !data) {
        // Use the Error component here:
        return (
            <aside className="hidden flex-col w-56 md:flex p-5">
                <p className="text-red-500 font-semibold">Failed to load sidebar content.</p>
            </aside>
        );
    }

    return (
        <aside className="hidden flex-col w-60 md:flex bg-white border-r border-gray-200 shadow-lg">
            {/* Subscribed Threads Section */}
            {data.subscribed.length !== 0 && (
                <>
                    <div className="flex flex-col m-5 space-y-4">
                        <div className="flex justify-between items-center cursor-pointer text-theme-orange hover:text-orange-700">
                            <h2 className="font-extrabold uppercase text-base tracking-wide">Subscribed</h2>
                            <Link to="/subscribed" className="pr-1 text-sm font-medium">ALL</Link>
                        </div>
                        <SideBarComponent threadList={data.subscribed} />
                    </div>
                    <span className="mx-5 border border-gray-200"></span>
                </>
            )}

            {/* Top Threads Section */}
            <div className="flex flex-col m-5 space-y-4">
                <div className="flex justify-between items-center cursor-pointer text-theme-orange hover:text-orange-700">
                    <h2 className="font-extrabold uppercase text-base tracking-wide">Top Threads</h2>
                    <Link to="/top" className="pr-1 text-sm font-medium">ALL</Link>
                </div>
                <SideBarComponent threadList={data.all} />
            </div>
            
            <span className="mx-5 border border-gray-200"></span>
            
            {/* Popular Threads Section */}
            <div className="flex flex-col m-5 space-y-4">
                <div className="flex justify-between items-center cursor-pointer text-theme-orange hover:text-orange-700">
                    <h2 className="font-extrabold uppercase text-base tracking-wide">Popular Threads</h2>
                    <Link to="/popular" className="pr-1 text-sm font-medium">ALL</Link>
                </div>
                <SideBarComponent threadList={data.popular} />
            </div>
        </aside>
    );
}

export default NexPostSidebar;
