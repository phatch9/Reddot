import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";

// Interface Definitions

/** core comment data. */
type CommentInfo = {
id: string | number;
content: string;
post_id?: string | number;
parent_id: string | number | null;
has_parent: boolean;
is_edited: boolean;
created_at: string;
comment_karma: number;
contentID?: number;
};

/** user made the comment */
type UserInfo = {
id: string | number;
username: string;
};

/** current authenticated user. */
type CurrentUser = {
id: string | number;
username: string;
has_upvoted?: boolean;
};

/** The structure of the primary comment object passed via props/state. */
type CommentData = {
comment_info: CommentInfo;
user_info: UserInfo;
current_user: CurrentUser;
};

/** The structure of an item in the children array, potentially recursive. */
type ChildCommentWrapper = {
comment: CommentData;
children: ChildCommentWrapper[];
};

/** Props for the useComment hook. */
interface UseCommentProps {
children?: ChildCommentWrapper[];
comment: CommentData;
}

/** Assuming the new comment returned by the API is also a wrapped structure. */
type AddCommentResponse = {
new_comment: ChildCommentWrapper;
};

/** The assumed structure of the data returned by the ["post/comment", postId] query. */
type PostCommentQueryData = {
comment_info: ChildCommentWrapper[];
// Other post details might be here
};

// Constants and Globals
const borderColors: string[] = [
"border-yellow-400",
"border-blue-400",
"border-purple-400",
"border-green-400",
"border-sky-400",
"border-pink-400",
];

let curColor: number = 0;

// Hook Implementation
/**
 * Custom hook to manage the state and actions for a single comment,
 * including adding replies, editing, and deleting.
 *
 * @param {UseCommentProps} props - The initial comment data and its children.
 * @returns An object containing state and mutation functions.
 */
export default function useComment({ children, comment }: UseCommentProps) {
const queryClient = useQueryClient();

// Type assertion for useParams to ensure postId is a string
const { postId } = useParams<{ postId: string }>();

// State for child comments (replies)
const [commentChildren, setCommentChildren] = useState<ChildCommentWrapper[]>(children || []);

// State for the main comment object (destructured for easier access)
const [
    { comment_info: commentInfo, user_info: userInfo, current_user: currentUser },
    setCommentInfo,
] = useState<CommentData>(comment);

// Mutation for adding a reply to the current comment
const { mutate: addComment } = useMutation({
    mutationFn: async (data: string) => {
    if (data.length === 0) {
        return;
    }
    
    const res = await axios.post<AddCommentResponse>(
        "/api/comments",
        {
        post_id: postId,
        content: data,
        has_parent: true,
        parent_id: commentInfo.id, // Use id from the state
        },
        { headers: { "Content-Type": "application/json" } }
    );
    
    // Update local state with the new comment returned from the API
    setCommentChildren((prevChildren) => [...prevChildren, res.data.new_comment]);
    },
});

// Mutation for deleting a comment (either the current one or a child)
const { mutate: deleteComment } = useMutation({
    // childId is optional; if present, it deletes a child; otherwise, it deletes the current comment
    mutationFn: async (childId: string | number | null = null) => {
    // NOTE: The original code used window.confirm(). In this environment,
    // interactive dialogs like confirm() are prohibited. In a real app,
    // replace this with a custom modal UI to confirm deletion.
    console.warn("Using placeholder for confirmation. Implement custom modal UI for production.");

    try {
        await axios.delete(`/api/comments/${childId || commentInfo.id}`);

        if (childId) {
        // Deleting a child comment, update local state
        setCommentChildren((prevChildren) =>
            prevChildren.filter((c) => c.comment.comment_info.id !== childId)
        );
        } else {
        // Deleting the current comment, invalidate/update the parent query data
        queryClient.setQueryData<PostCommentQueryData | undefined>(
            ["post/comment", postId],
            (oldData) => {
            if (!oldData) return oldData;

            // Filter the main list of comments to remove the deleted one
            return {
                ...oldData,
                comment_info: oldData.comment_info.filter(
                (c) => c.comment.comment_info.id !== commentInfo.id
                ),
            };
            }
        );
        }
    } catch (error) {
        console.error("Failed to delete comment:", error);
    }
    },
});

// Mutation for updating the current comment's content
const { mutate: updateComment } = useMutation({
    mutationFn: async (data: string) => {
    if (data.length === 0) {
        return;
    }

    await axios.patch(`/api/comments/${commentInfo.id}`, { content: data });

    // Update local state with the new content and mark as edited
    setCommentInfo((prevState) => ({
        user_info: prevState.user_info,
        current_user: prevState.current_user,
        comment_info: {
        ...prevState.comment_info,
        content: data,
        is_edited: true,
        },
    }));
    },
});

// Function to cycle through border colors for visual distinction
function colorSquence(): string {
    if (curColor >= borderColors.length) {
    curColor = 0;
    }
    return borderColors[curColor++];
}

// Hook Return Type

return {
    commentChildren,
    commentInfo,
    userInfo,
    currentUser,
    addComment,
    deleteComment,
    updateComment,
    colorSquence,};
}
