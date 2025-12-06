import React, { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";                   // <-- real react-query
import  useAuth from "../../components/AuthContext";               // <-- real auth consumer
import Loader from "../../components/Loader";
import InfinitePostsLayout from "../../components/InfinitePosts";
import Modal from "../../components/Modal";
import { Chat } from "../inbox/Inbox";
import UpdateUser from "../../components/UpdateUser";

// Types and Interfaces
interface Karma {
    user_karma: number;
    posts_count: number;
    posts_karma: number;
    comments_count: number;
    comments_karma: number;
}

interface UserProfileData {
    username: string;
    avatar: string | null;
    bio: string | null;
    registrationDate: string;
    karma: Karma;
}

type ActionKey = false | "message" | "edit" | "delete";
type ActionState = ActionKey | "delete_confirm" | React.ReactNode;


export function Profile() {
    const { logout, user } = useAuth();
    const { username } = useParams<{ username: string }>();

    const [action, setAction] = useState<ActionState>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data, isFetching: userIsFetching } = useQuery<UserProfileData>({
        queryKey: ["user", username],
        queryFn: async () => {
            return await axios.get(`/api/user/${username}`).then(res => res.data);
        },
    });

    useEffect(() => {
        if (typeof action === "string") {
            switch (action) {
                case "message":
                    setAction(
                        <Chat sender={data as any} setCurChat={setAction as any} newChat={true} />
                    );
                    break;

                case "edit":
                    setAction(<UpdateUser setModal={setAction as any} />);
                    break;

                case "delete":
                    setShowDeleteConfirm(true);
                    setAction(false);
                    break;

                default:
                    setAction(false);
            }
        }
    }, [action, data]);

    useEffect(() => {
        document.title = "u/" + username;
        return () => { document.title = "Reddot"; };
    }, [username]);

    const handleAccountDelete = useCallback(() => {
        setShowDeleteConfirm(false);

        axios.delete(`/api/user`)
            .then(() => logout())
            .catch((err: AxiosError) => console.error(err));
    }, [logout]);

    const isModalOpen = action !== false && typeof action !== "string";

    return (
        <div className="flex flex-col flex-1 items-center w-full bg-gray-50 min-h-screen font-inter">
            <div className="w-full max-w-3xl p-4">

                {userIsFetching ? (
                    <div className="mt-10">
                        <Loader forPosts={true} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full bg-gray-50">
                        <div className="flex flex-col p-4 w-full bg-white rounded-xl shadow-lg">

                            {/* Profile Header */}
                            <div className="flex flex-col md:flex-row justify-between items-center p-4 w-full rounded-xl bg-gray-100 border">
                                <img
                                    src={data?.avatar || "/default_avatar.png"}
                                    className="object-cover w-28 h-28 md:w-40 md:h-40 rounded-full shadow-md cursor-pointer hover:shadow-xl"
                                    alt="User Avatar"
                                    onClick={() =>
                                        setAction(
                                            <img
                                                src={data?.avatar || "/default_avatar.png"}
                                                className="object-cover w-full max-h-[80vh] rounded-md"
                                                alt="Full Avatar"
                                            />
                                        )
                                    }
                                />

                                <div className="flex flex-col flex-1 items-center md:items-start mt-4 md:mt-0 md:p-4">
                                    <h1 className="text-2xl font-bold">u/{data?.username}</h1>
                                    <p className="my-2 text-sm md:text-base text-gray-600 italic">
                                        {data?.bio || "No bio provided."}
                                    </p>

                                    <div className="flex justify-between w-full px-4 md:px-0 mt-2">
                                        <p className="font-medium">Karma: {data?.karma.user_karma}</p>
                                        <p className="text-xs text-gray-500">
                                            Cake Day: {new Date(data?.registrationDate ?? Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Karma Summary */}
                            <div className="flex flex-col mt-4 p-2 text-sm bg-gray-50 rounded-lg border">
                                <div className="flex justify-between p-1 border-b">
                                    <p className="font-semibold">Total Posts:</p>
                                    <p>{data?.karma.posts_count}</p>
                                </div>
                                <div className="flex justify-between p-1 border-b">
                                    <p className="font-semibold">Posts Karma:</p>
                                    <p>{data?.karma.posts_karma}</p>
                                </div>
                                <div className="flex justify-between p-1 border-b">
                                    <p className="font-semibold">Total Comments:</p>
                                    <p>{data?.karma.comments_count}</p>
                                </div>
                                <div className="flex justify-between p-1">
                                    <p className="font-semibold">Comments Karma:</p>
                                    <p>{data?.karma.comments_karma}</p>
                                </div>
                            </div>

                            {/* Dropdown */}
                            <select
                                name="options"
                                id="options"
                                className="p-3 mt-4 rounded-lg border-2 border-gray-300 cursor-pointer"
                                value={typeof action === "string" ? action : ""}
                                onChange={(e) => setAction(e.target.value === "" ? false : (e.target.value as ActionKey))}
                            >
                                <option value="">Choose an action</option>

                                {user.username === data?.username && (
                                    <>
                                        <option value="edit">Update Profile</option>
                                        <option value="delete">Delete Account</option>
                                    </>
                                )}

                                {user.username !== data?.username && (
                                    <option value="message">Message {data?.username}</option>
                                )}
                            </select>

                        </div>
                    </div>
                )}

                {/* Posts */}
                <InfinitePostsLayout
                    apiQueryKey={data?.username}
                    linkUrl={`posts/user/${data?.username}`}
                    enabled={!!data?.username}
                />

                {/* Modal for Chat / Edit / Image */}
                <AnimatePresence>
                    {isModalOpen && (
                        <Modal showModal={action} setShowModal={setAction}>
                            {action as React.ReactNode}
                        </Modal>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <Modal showModal={showDeleteConfirm} setShowModal={setShowDeleteConfirm}>
                            <div className="p-4 space-y-4">
                                <h2 className="text-xl font-bold text-red-600">Confirm Account Deletion</h2>
                                <p className="text-gray-700">Are you sure? This cannot be undone.</p>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 bg-gray-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleAccountDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

export default Profile;
