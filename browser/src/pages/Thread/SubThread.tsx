import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthConsumer from "../../components/AuthContext";
import InfinitePostsLayout from "../../components/InfinitePosts";
import ManageMods from "../../components/ManageMods";
import Modal from "../../components/Modal";
import { NewThread } from "../../components/NewThread";
import Loader from "../../components/Loader";

interface ThreadData {
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

export function SubThread() {
  const listRef = useRef<HTMLSelectElement>(null);
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<false | JSX.Element>(false);

  const queryClient = useQueryClient();

  const params = useParams<{ threadName: string }>();
  const { isAuthenticated, user } = AuthConsumer();

  // ---- Fetch thread info ----
  const { data, isFetching } = useQuery({
    queryKey: ["thread", params.threadName],
    queryFn: async () => {
      const res = await axios.get(`/api/threads/${params.threadName}`);
      return res.data as { threadData: ThreadData };
    },
    enabled: !!params.threadName,
  });

  const threadData = data?.threadData;

  // ---- Page Title ----
  useEffect(() => {
    document.title = "t/" + params.threadName;
    return () => {
      document.title = "Threaddit";
    };
  }, [params.threadName]);

  // ---- Subscribe/Unsubscribe ----
  const { mutate } = useMutation({
    mutationFn: async (hasSubscribed: boolean) => {
      if (!threadData) return;

      if (hasSubscribed) {
        await axios.delete(`/api/threads/subscription/${threadData.id}`);
        queryClient.setQueryData(["thread", params.threadName], (old: any) => ({
          threadData: { ...old.threadData, has_subscribed: false },
        }));
      } else {
        await axios.post(`/api/threads/subscription/${threadData.id}`);
        queryClient.setQueryData(["thread", params.threadName], (old: any) => ({
          threadData: { ...old.threadData, has_subscribed: true },
        }));
      }
    },
  });


