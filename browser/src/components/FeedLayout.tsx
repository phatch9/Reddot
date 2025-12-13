import { Outlet } from "react-router-dom";
import NexPostSidebar from "./NexPostSidebar";

export default function FeedLayout() {
    return (
    <div className="flex flex-1 max-w-full bg-theme-cultured">
        <NexPostSidebar />
        <Outlet />
    </div>
    );
}