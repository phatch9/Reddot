// Have mercy on this code
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import avatar from "../../assets/avatar.png";
import AuthConsumer from "../../components/AuthContext";
import Svg from "../../components/Svg";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";

// Types and definition
// -------------------------

export interface User {
  avatar?: string;
  name?: string;
  username: string;
}

export interface MessageType {
  message_id: number;
  sender: User;
  receiver: User;
  content: string;
  seen: boolean;
  latest_from_user: boolean;
  created_at: string;
}

interface ChatProps {
  sender: User;
  setCurChat: React.Dispatch<React.SetStateAction<User | false>>;
  newChat?: boolean;
}

interface MessageProps {
  message: MessageType;
  toUser: boolean;
  messageIndex: number;
}

// Inbox Component
// -------------------------

export function Inbox() {
  const [curChat, setCurChat] = useState<User | false>(false);

  const { data } = useQuery<MessageType[]>({
    queryKey: ["inbox"],
    queryFn: async () => {
      const res = await axios.get("/api/messages/inbox");
      return res.data;
    },
  });

  // Set tab title
  useEffect(() => {
    if (curChat) document.title = `Inbox | ${curChat.username}`;
    else document.title = "Threaddit | Inbox";

    return () => {
      document.title = "Threaddit";
    };
  }, [curChat]);

  return (
    <div className="flex flex-1">
      {/* Mobile list */}
      {!curChat && (
        <ul className="md:hidden p-4 m-2.5 space-y-2 list-none bg-white rounded-md w-full">
          <div className="flex justify-between items-center py-3 border-b-2">
            <h1 className="text-2xl font-semibold text-blue-600">Messages</h1>
          </div>

          {data?.map((message) => (
            <li
              key={message.message_id}
              onClick={() => setCurChat(message.sender)}
              className={`w-full flex items-center p-3 space-x-2 rounded-xl cursor-pointer ${
                curChat && curChat.username === message.sender.username
                  ? "bg-blue-200"
                  : "hover:bg-blue-200"
              }`}
            >
              <img
                src={message.sender.avatar || avatar}
                className="object-cover w-14 h-14 rounded-full"
                alt=""
              />
              <div className="flex flex-col space-y-1 w-full">
                <div className="flex justify-between items-center w-full">
                  <p className="font-medium">{message.sender.username}</p>
                  {!message.latest_from_user && !message.seen && (
                    <Svg type="mail" className="w-4 h-4 text-theme-orange" />
                  )}
                </div>

                <p className="text-sm">
                  {message.latest_from_user
                    ? "You: "
                    : `${message.receiver.username}: `}
                  {message.content.slice(0, 15)}
                  {message.content.length > 15 ? "..." : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Desktop list */}
      <ul className="hidden md:block p-4 w-1/5 m-2.5 space-y-2 list-none bg-white rounded-md">
        <div className="flex justify-between items-center py-3 border-b-2">
          <h1 className="text-2xl font-semibold text-blue-600">Messages</h1>
        </div>

        {data?.map((message, index) => (
          <motion.li
            key={message.message_id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.25 }}
            onClick={() => setCurChat(message.sender)}
            className={`flex items-center w-full p-3 space-x-2 rounded-xl cursor-pointer ${
              curChat && curChat.username === message.sender.username
                ? "bg-blue-200"
                : "hover:bg-blue-200"
            }`}
          >
            <img
              src={message.sender.avatar || avatar}
              className="object-cover w-14 h-14 rounded-full"
              alt=""
            />

            <div className="flex flex-col space-y-1 w-full">
              <div className="flex justify-between items-center w-full">
                <p className="font-medium">{message.sender.username}</p>
                {!message.latest_from_user && !message.seen && (
                  <Svg type="mail" className="w-4 h-4 text-theme-orange" />
                )}
              </div>
              <p className="text-sm">
                {message.latest_from_user
                  ? "You: "
                  : `${message.receiver.username}: `}
                {message.content.slice(0, 15)}
                {message.content.length > 15 ? "..." : ""}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      {/* Chat Window */}
      <AnimatePresence>
        {curChat && (
          <div className={`flex-1 m-2.5 bg-white rounded-md`}>
            <Chat sender={curChat} setCurChat={setCurChat} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
