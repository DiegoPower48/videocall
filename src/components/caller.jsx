"use client";

import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import {
  IconVolume2,
  IconVolume3,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconClipboardList,
} from "@tabler/icons-react";
import toast, { Toaster } from "react-hot-toast";
import Peer from "simple-peer";
import { Children, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import io, { Socket } from "socket.io-client";

export default function Caller({ reloadFuction, userName }) {
  const [userId, setUserId] = useState("");
  const [you, setYou] = useState("");
  const [stream, setStream] = useState("");
  const [shared, setShared] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [calling, setCalling] = useState(false);
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
  const socketRef = useRef(null);
  const { register, handleSubmit, watch } = useForm();

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
    try {
      const idUser = id.idUser.trim();
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });
      peer.on("signal", (data) => {
        socketRef.current.emit("callUser", {
          userToCall: idUser,
          signalData: data,
          from: userId,
          name: userName,
        });
        setCalling(true);
      });
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream;
      });
      socketRef.current.on("callAccepted", (data) => {
        setYou(data.name);
        setCallAccepted(true);
        peer.signal(data.signal);
        setInCall(true);
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
        socketRef.current.emit("answerCall", {
          signal: data,
          to: caller,
          userName: userName,
        });
      });
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream;
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;
      setInCall(true);
       setReceivingCall(false)
      setCalling(false)
    } catch (error) {
      console.log(error);
    }
  };

  const rejectCall = () => {
    socketRef.current.emit("rejectCall", { to: caller, name: userName });
    setReceivingCall(false);
    setCaller("");
    connectionRef.current = null;
    setCallerSignal(null);
    setName("");
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
    socketRef.current.emit("endCall", { to: caller, name: userName });

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null); // Limpia el estado del stream
      setShared(false); // Opcional: tu estado de "compartiendo"
    }
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
    }
    setInCall(false);
    setCallAccepted(false);
    setCalling(false);
    setCaller("");
    setName("");
    setCallerSignal(null);
    reloadFuction();
  };

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL);
    socketRef.current = socket;

    console.log("Conectando a:", process.env.NEXT_PUBLIC_API_URL);

    socket.on("connect", () => {
      console.log("Socket conectado:", socket.id);
      setUserId(socket.id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("callAccepted", (data) => {
      console.log(data);
      setCallAccepted(true);      
      setInCall(true);
    });

    socket.on("callRejected", () => {
      toast.error("Llamada rechazada!!!");      
      setCalling(false);
      setInCall(false);
      connectionRef.current = null;      
    });

     socket.on("callEnded", () => {
      toast.error("Llamada terminada!!!");      
   setReceivingCall(false)
      setCallAccepted(false);
      setCalling(false);
      setInCall(false);
      setCaller("");
      setName("");
      connectionRef.current = null;
      setCallerSignal(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setShared(false);
      }
    });

    return () => {
      socket.disconnect(); // 🔴 Importante para limpiar conexión
    };
  }, []);

  useEffect(() => {
    shareScreen();
  }, []);

  return (
    <>
      {!userId ? (
        <div>Cargando...</div>
      ) : (
        <div className="h-full w-screen">
          <div
            className={`h-full grid ${
              fullScreenMe || fullScreenYou
                ? "grid-rows-1"
                : "grid-rows-[1fr,4fr]"
            } items-center  justify-center`}
          >
            <form
              className={`w-screen h-full grid-cols-[1fr,1fr,1fr,1fr] grid  justify-center items-center  border-white border-2 rounded-t-xl bg-white gap-1 ${
                fullScreenMe || fullScreenYou ? "hidden" : ""
              }`}
              onSubmit={handleSubmit(callUser)}
            >
              <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 items-center justify-center p-4">
                <div className="text-center font-bold">My Name:</div>
                <p className="p-2 bg-white font-bold   rounded-xl text-center">
                  {userName}
                </p>
              </div>
              <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 py-4 items-center justify-center ">
                <p className="text-center font-bold">My ID code:</p>
                <div className="text-center ">{userId}</div>

                <div className="  flex items-center justify-center">
                  <div
                    onClick={() => {
                      copyToClipboard(userId);
                    }}
                    className=" flex items-center justify-center bg-white p-2 m-1 rounded-xl active:scale-105 active:bg-black active:text-white"
                  >
                    <div className="font-bold cursor-pointer">COPY</div>
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

              {/* CAMBIAR */}
              <div className="bg-red-500 w-full h-full grid items-center justify-center">
                {inCall ? (
                  <>
                    <div className="h-full w-full grid items-center grid-rows-2 justify-center text-center p-4 ">
                      <div className="text-center font-bold">In call with:</div>
                      <div className="">{name === "" ? you : name}</div>

                      <button
                        onClick={leaveCall}
                        className=" p-2 bg-white text-black rounded-xl hover:bg-red-900 hover:text-white active:scale-110 transform duration-100 "
                      >
                        <div className="font-bold ">End Call</div>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {callAccepted ? (
                      <div className="  grid items-center justify-center text-center">
                        <h1 className="text-center text-white font-bold uppercase">
                          {name} is calling...
                        </h1>
                      </div>
                    ) : (
                      <>
                        {calling ? (
                          <div className=" h-full w-full items-center justify-center gap-4 flex flex-col">
                            <div>calling to</div>
                            <div>{userId}</div>
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-center p-4 ">
                            <button type="submit">
                              <div
                                className={`h-full  border-black border-2 p-4 rounded-full ${
                                  !watch("idUser")
                                    ? "bg-gray-500"
                                    : "bg-blue-600 hover:scale-110 transform duration-200 active:scale-125"
                                }`}
                              >
                                <LocalPhoneIcon
                                  className={`h-full  ${
                                    !watch("idUser")
                                      ? "text-black"
                                      : "text-white "
                                  } `}
                                  fontSize="large"
                                  aria-label="call"
                                  onClick={() => callUser(idToCall)}
                                />
                              </div>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* CAMBIAR */}
            </form>
            <div
              className={`bg-black h-full max-w-screen flex flex-row text-white items-center ${
                fullScreenMe && "z-50 fixed inset-0 bg-black flex-col  h-screen"
              }  ${
                fullScreenYou && "z-50 fixed inset-0 bg-black flex-col h-screen"
              }  `}
            >
              <div
                className={`w-full h-full flex flex-col items-center border-white border-2 text-center
              ${fullScreenMe && " max-h-screen overflow-hidden"} ${
                  fullScreenYou && "hidden"
                }`}
              >
                {shared ? (
                  <>
                    <div className="w-full h-full row-start-1 row-end-2">
                      <p className="h-full font-bold grid items-center justify-center">
                        {userName}
                      </p>
                    </div>
                    <div className="w-full h-full flex items-center justify-center">
                      <video
                        className="max-w-4xl w-11/12 h-full object-contain border-white max-h-screen"
                        playsInline
                        ref={myVideo}
                        autoPlay
                      />
                    </div>
                    <div className="w-full h-full grid justify-center items-center grid-cols-2">
                      <div className="h-full w-full flex justify-center items-center">
                        {isMutedMe ? (
                          <button
                            className="grid items-center justify-center bg-green-400 p-3 rounded-full active:scale-125"
                            onClick={() => toggleMuteMe()}
                          >
                            <IconVolume2 />
                          </button>
                        ) : (
                          <button
                            className="grid items-center justify-center bg-red-400 p-3 rounded-full active:scale-125"
                            onClick={() => toggleMuteMe()}
                          >
                            <IconVolume3 />
                          </button>
                        )}
                      </div>
                      <div className="h-full w-full flex justify-center items-center">
                        {!fullScreenMe ? (
                          <button
                            onClick={() => {
                              fullMe();
                            }}
                            className="grid items-center justify-center bg-red-400  p-3 rounded-full active:scale-125"
                          >
                            <IconArrowsMaximize />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              fullMe();
                            }}
                            className="grid items-center justify-center bg-red-400  p-3 rounded-full active:scale-125"
                          >
                            <IconArrowsMinimize />
                          </button>
                        )}
                      </div>
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
                className={`w-full h-full flex flex-col items-center border-white border-2 text-center
              ${fullScreenYou && " max-h-screen overflow-hidden"} ${
                  fullScreenMe && "hidden"
                }`}
              >
                {callAccepted ? (
                  <>
                    <div className="w-full h-full row-start-1 row-end-2">
                      <p className="h-full font-bold grid items-center justify-center">
                        {you === "" ? name : you}
                      </p>
                    </div>

                    {callAccepted ? (
                      <div className="w-full h-full row-start-2 row-end-3 flex items-center justify-center">
                        <video
                          className="max-w-4xl w-11/12 h-full object-contain border-white max-h-screen"
                          playsInline
                          ref={userVideo}
                          autoPlay
                        />
                      </div>
                    ) : (
                      <div className=""></div>
                    )}
                    {callAccepted ? (
                      <div className="w-full h-full grid justify-center items-center grid-cols-2">
                        <div className="h-full w-full flex justify-center items-center">
                          {isMutedYou ? (
                            <button
                              className="grid items-center justify-center bg-green-400 p-3 rounded-full active:scale-125"
                              onClick={() => toggleMuteYou()}
                            >
                              <IconVolume2 />
                            </button>
                          ) : (
                            <button
                              className="grid items-center justify-center bg-red-400 p-3 rounded-full active:scale-125"
                              onClick={() => toggleMuteYou()}
                            >
                              <IconVolume3 />
                            </button>
                          )}
                        </div>
                        <div className="h-full w-full flex justify-center items-center">
                          {!fullScreenYou ? (
                            <button
                              onClick={() => {
                                fullYou();
                              }}
                              className="grid items-center justify-center bg-red-400  p-3 rounded-full active:scale-125"
                            >
                              <IconArrowsMaximize />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                fullYou();
                              }}
                              className="grid items-center justify-center bg-red-400  p-3 rounded-full active:scale-125"
                            >
                              <IconArrowsMinimize />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </>
                ) : (
                  <>
                    <div></div>
                    <div className="w-full h-full grid items-center justify-center grid-cols-1 ">
                      {!receivingCall ? (
                        <div className="grid grid-rows-[4fr,1fr] items-center justify-center">
                          <p className="h-32 w-32 bg-white text-black rounded-full flex items-center justify-center font-bold">
                            No signal
                          </p>
                          <div></div>
                        </div>
                      ) : (
                        <div className="w-full h-full grid grid-rows-[2fr,1fr]">
                          <div className="w-full flex items-center justify-center">
                            <p
                              className="h-32 w-32 bg-red-600 text-white rounded-full flex items-center justify-center font-bold"
                              style={{
                                animation:
                                  "pulseCircle 2s infinite ease-in-out",
                              }}
                            >
                              {name}
                            </p>
                          </div>
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
                          <div className="w-full flex items-center gap-8 justify-center ">
                            <button
                              className="w-32 h-32 scale-75 p-2 hover:scale-90 transform duration-200 bg-lime-600 grid items-center justify-center  rounded-full hover:bg-lime-500    "
                              onClick={answerCall}
                            >
                              <div className="text-white font-bold ">
                                Answer
                              </div>
                            </button>
                            <button
                              className="w-32 h-32 scale-75  p-2 hover:scale-90 transform duration-200 bg-red-800 text-white rounded-full hover:bg-red-500  m-4"
                              onClick={rejectCall}
                            >
                              <div className="font-bold">Reject</div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div></div>
                  </>
                )}
              </div>
            </div>
          </div>
          <Toaster />
        </div>
      )}
    </>
  );
}
