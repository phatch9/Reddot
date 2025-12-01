// Have mercy on this code
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import avatar from "../../assets/avatar.png";
import AuthConsumer from "../../components/AuthContext";
import Svg from "../../components/Svg";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";

export function Inbox() {
  const [curChat, setCurChat] = useState(false);
  const { data } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      return await axios.get("/api/messages/inbox").then((res) => res.data);
    },
  });
  useEffect(() => {
    if (curChat) {
      document.title = `Inbox | ${curChat.username}`;
    }
    else {
      document.title = "Threaddit | Inbox";
    }
    return () => {
      document.title = "Threaddit";
    };
  })
  return (
    <div className="flex flex-1">
      {!curChat && (
        <ul className="md:hidden p-4 m-2.5 space-y-2 list-none bg-white rounded-md w-full">
          <div className="flex justify-between items-center py-3 border-b-2">
            <h1 className="text-2xl font-semibold text-blue-600">Messages</h1>
          </div>
          {data?.map((message) => (
            <li
              className={`w-full flex items-center p-3 space-x-2 rounded-xl cursor-pointer ${curChat.username === message.sender.username ? "bg-blue-200" : "hover:bg-blue-200"
                }`}
              key={message.message_id}
              onClick={() => setCurChat(message.sender)}>
              <img src={message.sender.avatar || avatar} className="object-cover w-14 h-14 rounded-full" alt="" />
              <div className="flex flex-col space-y-1 w-full">
                <div className="flex justify-between items-center w-full">
                  <p className="font-medium">{message.sender.username}</p>
                  {!message.latest_from_user && !message.seen && (
                    <Svg type="mail" className="w-4 h-4 text-theme-orange" />
                  )}
                </div>
                <p className="text-sm">
                  {message.latest_from_user ? "You: " : `${message.receiver.username}: `}
                  {message.content.slice(0, 15)}
                  {message.content.length > 15 ? "..." : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ul className="hidden md:block p-4 w-1/5 m-2.5 space-y-2 list-none bg-white rounded-md">
        <div className="flex justify-between items-center py-3 border-b-2">
          <h1 className="text-2xl font-semibold text-blue-600">Messages</h1>
        </div>
        {data?.map((message, index) => (
          <motion.li
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.25 }}
            className={`flex items-center w-full p-3 space-x-2 rounded-xl cursor-pointer ${curChat.username === message.sender.username ? "bg-blue-200" : "hover:bg-blue-200"
              }`}
            key={message.message_id}
            onClick={() => setCurChat(message.sender)}>
            <img src={message.sender.avatar || avatar} className="object-cover w-14 h-14 rounded-full" alt="" />
            <div className="flex flex-col space-y-1 w-full">
              <div className="flex justify-between items-center w-full">
                <p className="font-medium">{message.sender.username}</p>
                {!message.latest_from_user && !message.seen && (
                  <Svg type="mail" className="w-4 h-4 text-theme-orange" />
                )}
              </div>
              <p className="text-sm">
                {message.latest_from_user ? "You: " : `${message.receiver.username}: `}
                {message.content.slice(0, 15)}
                {message.content.length > 15 ? "..." : ""}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
      <AnimatePresence>
        {curChat && (
          <div className={`flex-1 m-2.5 bg-white rounded-md ${!curChat && "flex justify-center items-center"}`}>
            <Chat sender={curChat} setCurChat={setCurChat} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

