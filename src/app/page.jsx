"use client";

import Caller from "@/components/caller";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useForm } from "react-hook-form";

const socket = io.connect(process.env.NEXT_PUBLIC_API_URL);

function App() {
  const [userId, setUserId] = useState("");
  const [key, setKey] = useState(0);
  const [userName, setUserName] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { register, handleSubmit } = useForm();

  const reloadChild = () => {
    setKey((prevKey) => prevKey + 1);
  };
  const submit = (data) => {
    setUserName(data.nombreUsuario);
    setLoaded(true);
  };

  useEffect(() => {
    socket.on("me", (id) => {
      setUserId(id);
      console.log(id);
    }),
      [];
  });

  return (
    <div className="max-h-screen w-screen grid ">
      <p className="h-20  flex text-4xl items-center justify-center text-white">
        Videochat
      </p>
      <div className="h-full grid justify-center items-center  text-black">
        {loaded ? (
          <Caller
            key={key}
            reloadFuction={reloadChild}
            socket={socket}
            userId={userId}
            userName={userName}
          />
        ) : (
          <>
            <div className=" w-screen p-5 bg-red-500 grid  items-center justify-center">
              <form
                onSubmit={handleSubmit(submit)}
                className=" p-2 text-black grid grid-cols-[1fr,5fr,1fr] gap-5 items-center justify-center "
              >
                <p className="text-left text-xl flex align-bottom font-bold ">
                  Name:
                </p>
                <input
                  type="text"
                  maxLength={20}
                  className="p-2 font-bold  border-black border-2 rounded-xl text-center"
                  {...register("nombreUsuario", {
                    required: "Name is required",
                  })}
                />
                <button
                  className="p-2 bg-red-700 rounded-lg hover:bg-red-300"
                  type="submit"
                >
                  <p>Set Name &</p>
                  <p>select your screen</p>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
