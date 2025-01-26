"use client";

import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import {
  IconVolume2,
  IconVolume3,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconClipboardList,
} from "@tabler/icons-react";

import Peer from "simple-peer";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Maximize } from "@mui/icons-material";

export default function Caller({ reloadFuction, socket, userId, userName }) {
  const [me, setMe] = useState(userId);
  const [you, setYou] = useState("");
  const [myName, setMyName] = useState(userName);
  const [stream, setStream] = useState("");
  const [shared, setShared] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [isMutedMe, setIsMutedMe] = useState(false);
  const [isMutedYou, setIsMutedYou] = useState(false);
  const [fullScreenMe, setFullScreenMe] = useState(false);
  const [fullScreenYou, setFullScreenYou] = useState(false);
  const [name, setName] = useState("");
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const { register, handleSubmit } = useForm();

  const shareScreen = () => {
    try {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);

          if (myVideo.current) {
            myVideo.current.srcObject = stream;
          }
        });
      setShared(true);
    } catch (error) {
      console.error("Error al compartir pantalla:", error.message);
    }
  };

  const callUser = (id) => {
    const idUser = id.idUser.trim();

    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });
      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: idUser,
          signalData: data,
          from: me,
          name: myName,
        });
      });
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream;
      });
      socket.on("callAccepted", (data) => {
        setYou(data.name);
        setCallAccepted(true);
        peer.signal(data.signal);
      });

      connectionRef.current = peer;
    } catch (error) {
      console.log(error);
    }
  };

  const answerCall = () => {
    connectionRef.current = null;

    try {
      setCallAccepted(true);
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });
      peer.on("signal", (data) => {
        socket.emit("answerCall", {
          signal: data,
          to: caller,
          userName: myName,
        });
      });
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream;
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;
    } catch (error) {
      console.log(error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Texto copiado al portapapeles");
      })
      .catch((error) => {
        console.error("Error al copiar al portapapeles:", error);
      });
  };

  const toggleMuteMe = () => {
    if (myVideo.current) {
      myVideo.current.muted = !isMutedMe;
      setIsMutedMe(!isMutedMe);
    }
  };

  const toggleMuteYou = () => {
    if (userVideo.current) {
      userVideo.current.muted = !isMutedYou;
      setIsMutedYou(!isMutedYou);
    }
  };

  const fullMe = () => {
    setFullScreenMe((prevState) => !prevState);
  };

  const fullYou = () => {
    setFullScreenYou((prevState) => !prevState);
  };

  const leaveCall = () => {
    reloadFuction();
  };

  useEffect(() => {
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);

  useEffect(() => {
    shareScreen();
  }, []);

  return (
    <div className="h-full w-screen ">
      <div className="h-full grid items-center  justify-center ">
        <form
          className={`w-screen h-full  grid-cols-[1fr,1fr,1fr,1fr] grid  justify-center items-center  border-white border-2 rounded-t-xl bg-white gap-1 ${
            fullScreenMe || fullScreenYou ? "hidden" : ""
          }`}
          onSubmit={handleSubmit(callUser)}
        >
          <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 items-center justify-center p-2">
            <div className="text-center font-bold">My Name:</div>
            <p className="p-2 bg-white font-bold   rounded-xl text-center">
              {myName}
            </p>
          </div>
          <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 items-center justify-center ">
            <p className="text-center font-bold">My ID code:</p>
            <div className="text-center ">{me}</div>

            <div className="  flex items-center justify-center">
              <div
                onClick={() => {
                  copyToClipboard(me);
                }}
                className=" flex items-center justify-center bg-white p-2 m-1 rounded-xl active:scale-105 active:bg-black active:text-white"
              >
                <div className="font-bold">COPY</div>
                <div>
                  <IconClipboardList />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 items-center justify-center p-2">
            <p className="text-center font-bold">To call:</p>
            <input
              className="p-2 font-bold  border-black border-2 rounded-xl text-center"
              placeholder="write a code to call"
              onChange={(e) => setIdToCall(e.target.value)}
              {...register("idUser", {
                required: "to call is required",
              })}
            />
          </div>
          <div className="bg-red-500 w-full h-full grid items-center justify-center   ">
            {receivingCall ? (
              <>
                {!callAccepted ? (
                  <div className="  grid items-center justify-center text-center">
                    <h1 className="text-center">{name} is calling...</h1>
                  </div>
                ) : (
                  <div className="h-full w-full grid items-center grid-rows-2 justify-center text-center ">
                    <div className="text-center font-bold">In call with:</div>
                    <div className="">{name === "" ? you : name}</div>
                  </div>
                )}
              </>
            ) : (
              <button type="submit">
                <div className="h-full bg-white border-black border-2 p-4 rounded-full">
                  <LocalPhoneIcon
                    className="h-full  text-black "
                    fontSize="large"
                    aria-label="call"
                    onClick={() => callUser(idToCall)}
                  />
                </div>
              </button>
            )}
          </div>
        </form>
        <div className="bg-black h-full grid grid-cols-2  text-white gap-1 items-center">
          <div
            className={`h-full  grid grid-rows-[1fr,5fr,1fr] items-center  border-white border-2  text-center ${
              fullScreenMe ? "col-span-2 grid-rows-1" : ""
            } ${fullScreenYou ? "hidden" : ""}`}
          >
            {shared ? (
              <>
                <p className="font-bold h-14 grid items-center justify-center">
                  {myName}
                </p>
                <video
                  className={` h-96 w-full  border-white border-y-2 ${
                    fullScreenMe ? "h-screen" : ""
                  } `}
                  playsInline
                  ref={myVideo}
                  autoPlay
                />
                <div className=" h-20 grid justify-center items-center grid-cols-2">
                  <button
                    className="grid items-center justify-center"
                    onClick={() => toggleMuteMe()}
                  >
                    {isMutedMe ? (
                      <div className="bg-green-400 p-3 rounded-full active:scale-125">
                        <div>
                          <IconVolume2 />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-400 p-3 rounded-full active:scale-125">
                        <IconVolume3 />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      fullMe();
                    }}
                    className="grid items-center justify-center"
                  >
                    {!fullScreenMe ? (
                      <div className="bg-red-400  p-3 rounded-full active:scale-125">
                        <IconArrowsMaximize />
                      </div>
                    ) : (
                      <div className="bg-red-400  p-3 rounded-full active:scale-125">
                        <IconArrowsMinimize />
                      </div>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div></div>
                <div className="h-96 grid border-white border-y-2 items-center  justify-center ">
                  <p className="h-32 w-32 bg-white text-black rounded-full flex items-center justify-center font-bold">
                    No shared screen
                  </p>
                </div>
                <div></div>
              </>
            )}
          </div>
          <div
            className={`h-full  grid grid-rows-[1fr,5fr,1fr] items-center  border-white border-2  text-center ${
              fullScreenMe ? "hidden" : ""
            } ${fullScreenYou ? "col-span-2 grid-rows-1" : ""}`}
          >
            {callAccepted ? (
              <>
                <p className="font-bold h-14 grid items-center justify-center">
                  {you === "" ? name : you}
                </p>
                {callAccepted ? (
                  <video
                    className={` h-96 w-full  border-white border-y-2 ${
                      fullScreenYou ? "h-screen" : ""
                    }`}
                    playsInline
                    ref={userVideo}
                    autoPlay
                  />
                ) : (
                  <div className=""></div>
                )}
                {callAccepted ? (
                  <div className="h-20 grid justify-center items-center grid-cols-3">
                    <button
                      className="grid items-center justify-center"
                      onClick={() => toggleMuteYou()}
                    >
                      {isMutedYou ? (
                        <div className="bg-green-400 p-3 rounded-full active:scale-125">
                          <IconVolume2 />
                        </div>
                      ) : (
                        <div className="bg-red-400 p-3 rounded-full active:scale-125">
                          <IconVolume3 />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={leaveCall}
                      className=" p-2 bg-white text-black rounded-xl hover:bg-red-900 hover:text-black "
                    >
                      <div className="font-bold ">End Call</div>
                    </button>
                    <button
                      className="grid items-center justify-center"
                      onClick={() => {
                        fullYou();
                      }}
                    >
                      {!fullScreenYou ? (
                        <div className="bg-red-400 p-3 rounded-full active:scale-125">
                          <IconArrowsMaximize />
                        </div>
                      ) : (
                        <div className="bg-red-400 p-3 rounded-full active:scale-125">
                          <IconArrowsMinimize />
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
              </>
            ) : (
              <>
                <div></div>
                <div className="h-96 grid border-white border-y-2 items-center  justify-center ">
                  {!receivingCall ? (
                    <div className="grid grid-rows-[4fr,1fr]">
                      <p className="h-32 w-32 bg-white text-black rounded-full flex items-center justify-center font-bold">
                        No signal
                      </p>
                      <div></div>
                    </div>
                  ) : (
                    <div className="grid grid-rows-[4fr,1fr]">
                      <p
                        className="h-32 w-32 bg-red-600 text-white rounded-full flex items-center justify-center font-bold"
                        style={{
                          animation: "pulseCircle 2s infinite ease-in-out",
                        }}
                      >
                        {`Receiving call from: ${name}`}
                      </p>
                      <style>
                        {`
                     @keyframes pulseCircle {
      0% {
        transform: scale(1);
        background-color: red
      }
    
      50% {
        transform: scale(1.4);
        background-color: white;
        color:black
      }
    
                       `}
                      </style>
                      <button
                        className="p-3 bg-red-900 grid items-center justify-center  rounded-full hover:bg-black "
                        onClick={answerCall}
                      >
                        <div className="text-white font-bold ">Answer</div>
                      </button>
                    </div>
                  )}
                </div>
                <div></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
