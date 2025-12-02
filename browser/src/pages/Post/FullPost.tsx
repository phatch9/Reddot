import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import { useState, FC } from "react";
import { useParams } from "react-router-dom";
import  useAuth from "../../components/AuthContext";
import Comment, { CommentMode, CommentDataType } from "../../components/Comment";
import Loader from "../../components/Loader";
// Post.tsx exports PostDataType and PostProps
import Post, { PostDataType } from "../../components/PostCurrent";

// Type Definition

/** the URL parameters. */
interface FullPostParams extends Record<string, string> {
    postId: string;
}

/**
 * The expected data structure from the API endpoint.
 * This is based on the provided query and component usage.
 */
interface FullPostData {
  post_info: PostDataType; // Using the type from PostCurrent
  comment_info: CommentDataType[]; // Using the type from Comment.tsx
}

// Implementation

export const FullPost: FC = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth(); // Use typed hook
  const { postId } = useParams<FullPostParams>();
  const [commentMode, setCommentMode] = useState(false);

  /**
   * Query to fetch the full post details and all associated comments.
   */
  const { data, isFetching, isError } = useQuery<FullPostData, Error>({
    queryKey: ["post/comment", postId],
    queryFn: async () => {
        return await axios
            .get(`/api/posts/${postId}/comments`)
            .then((res) => res.data);
        },
    enabled: !!postId, // Ensure postId is available before querying
  });

  /* Mutation to add a new top-level comment to the post.*/

    const { mutate: newComment, isPending: isCommenting } = useMutation <
    { new_comment: CommentDataType },
    Error,
    string
    >({
    mutationFn: async (content: string) => {
        return await axios
        .post("/api/comments", { post_id: postId, content }) // axios.post() returns AxiosResponse<any>, so res.data is inferred as unknown
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      // Optimistically update the query data with the new comment
    queryClient.setQueryData<FullPostData>(
        ["post/comment", postId],
        (oldData) => {
            if (!oldData) return undefined;
            return {
                ...oldData,
            comment_info: [...oldData.comment_info, data.new_comment],
            };
        }
    );
        setCommentMode(false); // Hide the comment box after success
    },
    onError: (error) => {
        console.error("Failed to post comment:", error);
        // In a real app, it will set an error state to show the user
        },
    });

    /* Render Logic */

    if (isFetching) {
        return (
            <div className="flex flex-col justify-center items-center w-full h-screen">
            {/* Use full screen loader */}
            <Loader forPosts={false} />
        </div>
        )
    ;}

    if (isError || !data) {
    // Handle case where data isn't fetched (e.g., error or post not found)
    return (
      <div className="flex flex-col p-2 space-y-2 w-full">
        <p className="p-5 text-lg bg-white rounded-xl border-2 hover:shadow-sm border-theme-gray-blue">
          Sorry, this post could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 space-y-2 w-full">
      <ul>
        {/* Render the main post */}
        <Post
          post={data.post_info}
          isExpanded={true}
          setCommentMode={setCommentMode} // Pass setter to allow Post to toggle comment box
          postIndex={0} // postIndex is required by Post.tsx
        />
      </ul>

    {/* Show top-level comment input box if toggled */}
      {commentMode && isAuthenticated && user && (
        <div className="py-3 pl-2 space-y-2 w-full bg-white rounded-xl md:text-base">
          <CommentMode
            user={user as UserType} // Assert user type
            defaultValue=""
            callBackSubmit={newComment} // Pass the mutation function
            callBackCancel={() => setCommentMode(false)}
            isSubmitting={isCommenting}
          />
        </div>
      )}

      {/* Render the list of comments */}
      {data.comment_info.length > 0 ? (
        <ul className="space-y-2 rounded-xl md:border-2 md:p-2 hover:shadow-sm border-theme-gray-blue">
          <AnimatePresence>
            {data.comment_info.map((comment, index) => (
              <Comment
                key={comment.comment.comment_info.id}
                {...comment}
                commentIndex={index}
                // Pass the threadID from the post_info, as required by Comment.tsx
                threadID={data.post_info.post_info.subthread_id}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div>
          <p className="p-5 text-sm bg-white rounded-xl border-2 md:text-base hover:shadow-sm border-theme-gray-blue">
            This post has no comments, be the first to reply!
          </p>
        </div>
      )}
    </div>
  );
}

export default FullPost;

