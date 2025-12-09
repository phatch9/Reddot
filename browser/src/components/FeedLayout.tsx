import { Outlet } from "react-router-dom";
import ReddotSidebar from "./ReddotSidebar";

export default function FeedLayout() {
    return (
    <div className="flex flex-1 max-w-full bg-theme-cultured">
        <ReddotSidebar />
        <Outlet />
    </div>
    );
}