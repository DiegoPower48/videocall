"use client";

import Caller from "@/components/caller";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useForm } from "react-hook-form";
import Prueba from "@/components/prueba";

const socket = io.connect(process.env.NEXT_PUBLIC_API_URL);

function App() {
  const [userId, setUserId] = useState("");
  const [key, setKey] = useState(0);
  const [userName, setUserName] = useState("");

  const { register, handleSubmit, watch } = useForm();

  const reloadChild = () => {
    setKey((prevKey) => prevKey + 1);
  };
  const submit = (data) => {
    setUserName(data.nombreusuario);
  };

  useEffect(() => {
    socket.on("me", (id) => {
      setUserId(id);
      console.log(id);
    }),
      [];
  });

  return (
    <>
      <p className="h-full flex text-2xl items-center justify-center text-white">
        Videochat
      </p>
      <div className="w-full h-full grid justify-center items-center grid-rows-[1fr,10fr] text-black">
        {userName != "" ? (
          <Caller
            key={key}
            reloadFuction={reloadChild}
            socket={socket}
            userId={userId}
            setUserName={setUserName}
            userName={userName}
          />
        ) : (
          <>
            <div className="w-screen p-5 bg-red-500 grid  items-center justify-center">
              <form
                onSubmit={submit}
                className=" p-2 text-black grid grid-cols-[1fr,5fr,1fr] gap-5 items-center justify-center "
              >
                <p className="text-left text-xl flex align-bottom font-bold ">
                  Name:
                </p>
                <input
                  type="text"
                  maxLength={20}
                  className="p-2 font-bold  border-black border-2 rounded-xl text-center"
                  {...register("nombreusuario", {
                    required: "Name is required",
                  })}
                />
                <button
                  className="p-2 bg-red-700 rounded-lg hover:bg-red-300"
                  type="submit"
                >
                  Set Name
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default App;
