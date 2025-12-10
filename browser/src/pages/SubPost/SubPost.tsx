import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthConsumer from "../../components/AuthContext";
import InfinitePostsLayout from "../../components/InfinitePosts";
import ManageMods from "../../components/ManageMods";
import Modal from "../../components/Modal";
import NewPost from "../../components/NewPost";
import Loader from "../../components/Loader";

interface PostData {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  created_at: string;
  subscriberCount: number;
  PostsCount: number;
  CommentsCount: number;
  has_subscribed: boolean;
  modList: string[];
}

export function SubPost() {
  const listRef = useRef<HTMLSelectElement>(null);
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<false | JSX.Element>(false);

  const queryClient = useQueryClient();

  const params = useParams<{ postName: string }>();
  const { isAuthenticated, user } = AuthConsumer();

  // ---- Fetch post info ----
  const { data, isFetching } = useQuery({
    queryKey: ["post", params.postName],
    queryFn: async () => {
      const res = await axios.get(`/api/posts/${params.postName}`);
      return res.data as { postData: PostData };
    },
    enabled: !!params.postName,
  });

  const postData = data?.postData;

  // --- Page Title ---
  useEffect(() => {
    document.title = "t/" + params.postName;
    return () => {
      document.title = "Postdit";
    };
  }, [params.postName]);

  // ---- Subscribe/Unsubscribe ----
  const { mutate } = useMutation({
    mutationFn: async (hasSubscribed: boolean) => {
      if (!postData) return;

      if (hasSubscribed) {
        await axios.delete(`/api/posts/subscription/${postData.id}`);
        queryClient.setQueryData(["post", params.postName], (old: any) => ({
          postData: { ...old.postData, has_subscribed: false },
        }));
      } else {
        await axios.post(`/api/posts/subscription/${postData.id}`);
        queryClient.setQueryData(["post", params.postName], (old: any) => ({
          postData: { ...old.postData, has_subscribed: true },
        }));
      }
    },
  });

  // ---- Dropdown handler ----
    function handleChange(value: string) {
    if (!postData) return;

    switch (value) {
        case "more":
        break;

        case "edit":
        setModalData(
            <NewPost ogInfo={postData} edit={true} setShowModal={setModalData} />
        );
        break;

      case "manage-mods":
        setModalData(
          <ManageMods mods={postData.modList} postId={postData.id} />
        );
        break;

      case "logo":
        setModalData(
          <img
            src={postData.logo}
            className="object-cover w-11/12 max-h-5/6 md:w-max md:max-h-screen"
            alt=""
          />
        );
        break;

      default:
        navigate(`/u/${value}`);
    }

    if (listRef.current) listRef.current.value = "more";
  }

  return (
    <div className="flex flex-col flex-1 items-center w-full bg-theme-cultured">
      <div className="flex flex-col p-5 space-y-1 w-full bg-white rounded-md md:pb-3 md:space-y-3">

        {isFetching ? (
          <Loader forPosts={true} />
        ) : (
          postData && (
            <div
              className={`flex p-2 flex-col md:flex-row items-center rounded-md md:rounded-full bg-theme-cultured ${
                !postData.logo && "py-5"
              }`}
            >
              {postData.logo && (
                <img
                  src={postData.logo}
                  className="object-cover w-32 h-32 rounded-full cursor-pointer md:w-36 md:h-36"
                  alt=""
                  onClick={() => handleChange("logo")}
                />
              )}

              <div className="flex flex-col flex-1 justify-around items-center p-2 space-y-1">
                <div className="flex items-center space-x-5">
                  <h1 className="text-xl font-semibold">{postData.name}</h1>
                </div>

                <p className="text-xs">
                  Since: {new Date(postData.created_at).toDateString()}
                </p>

                {postData.description && (
                  <p
                    className={`text-center py-4 md:py-2 text-sm ${
                      postData.description.length > 90 && "text-xs"
                    }`}
                  >
                    {postData.description}
                    {postData.description.length > 90 && "..."}
                  </p>
                )}

                <div className="flex justify-between mt-2 space-x-7 w-full md:w-11/12">
                  <p className="text-sm">{postData.subscriberCount} subscribers</p>
                  <p className="text-sm">{postData.PostsCount} posts</p>
                  <p className="text-sm">{postData.CommentsCount} comments</p>
                </div>
              </div>
            </div>
          )
        )}

{/* JOIN / LEAVE + OPTIONS */}
        <div className="flex flex-col justify-around space-y-3 md:space-x-10 md:flex-row md:space-y-0">
          {isAuthenticated && postData && (
            <button
              className={`px-32 py-2 text-white rounded-full active:scale-90 ${
                postData.has_subscribed ? "bg-blue-400" : "bg-theme-red-coral"
              }`}
              onClick={() => mutate(postData.has_subscribed)}
            >
              {postData.has_subscribed ? "Leave" : "Join"}
            </button>
          )}

          {/* Mod selector */}
          {postData && (
            <select
              ref={listRef}
              defaultValue="more"
              onChange={(e) => handleChange(e.target.value)}
              className="px-10 py-2 text-center rounded-md md:block bg-theme-cultured"
            >
              <option value="more">More</option>

              {isAuthenticated &&
                (user.mod_in.includes(postData.id) ||
                  user.roles.includes("admin")) && (
                  <optgroup label="Subpost Options">
                    <option value="edit">Edit Subpost</option>
                    <option value="manage-mods">Manage Mods</option>
                  </optgroup>
                )}

              <optgroup label="ModList">
                {postData.modList.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </div>
      </div>

      <InfinitePostsLayout
        apiQueryKey={postData?.name}
        linkUrl={`posts/post/${postData?.id}`}
        enabled={!!postData}
      />

      <AnimatePresence>
        {modalData && (
          <Modal setShowModal={setModalData}>{modalData}</Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SubPost;