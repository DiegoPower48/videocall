"use client";

import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import Peer from "simple-peer";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export default function Caller({ reloadFuction, socket, userId }) {
  const [me, setMe] = useState(userId);
  const [you, setYou] = useState("");
  const [myName, setMyName] = useState("userName");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
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

      socket.on("callUser", (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setName(data.name);
        setCallerSignal(data.signal);
      });
    } catch (error) {
      console.error("Error al compartir pantalla:", error.message);
    }
  };

  const callUser = (id) => {
    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });
      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: id.idUser,
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

  const [isMutedMe, setIsMutedMe] = useState(false); // Estado para el botón de mute
  const [isMutedYou, setIsMutedYou] = useState(false); // Estado para el botón de mute

  const toggleMuteMe = () => {
    if (myVideo.current) {
      myVideo.current.muted = !isMutedMe; // Cambiar el estado de mute
      setIsMutedMe(!isMutedMe); // Actualizar el estado
    }
  };
  const toggleMuteYou = () => {
    if (userVideo.current) {
      userVideo.current.muted = !isMutedYou; // Cambiar el estado de mute
      setIsMutedYou(!isMutedYou); // Actualizar el estado
    }
  };

  const leaveCall = () => {
    reloadFuction();
  };

  useEffect(() => {
    shareScreen();
    console.log("cargado");
  }, []);

  return (
    <div className="h-5/6 w-screen ">
      <div className="h-full grid items-center  justify-center grid-rows-[1fr,4fr]">
        <form
          className="w-screen h-full  grid-cols-[1fr,1fr,1fr,1fr] grid  justify-center items-center  border-white border-2 rounded-t-xl bg-white gap-1"
          onSubmit={handleSubmit(callUser)}
        >
          <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 items-center justify-center p-2">
            <div className="text-center font-bold">My Name:</div>
            <p className="p-2 bg-white border-green-700 border-2 font-bold   rounded-xl text-center">
              {myName}
            </p>
          </div>
          <div className="bg-red-500 w-full h-full grid grid-rows-2 grid-cols-1 items-center justify-center p-2">
            <p className="text-center font-bold">My ID code:</p>
            <div className="text-center ">{me}</div>
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
                  <div className="  grid items-center grid-rows-2 justify-center text-center">
                    <h1 className="text-center">{name} is calling...</h1>
                    <button
                      className="p-3 bg-red-900 grid items-center justify-center  rounded-full hover:bg-black "
                      onClick={answerCall}
                    >
                      <div className="text-white font-bold ">Answer</div>
                    </button>
                  </div>
                ) : (
                  <div className="h-full w-full grid items-center grid-rows-4 justify-center text-center">
                    <div className="text-center">In call with:</div>
                    <div className="font-bold">{name === "" ? you : name}</div>
                    <div className="row-span-2 p-2 bg-black text-white grid items-center justify-center  rounded-full hover:bg-white hover:text-black ">
                      <button className="font-bold " onClick={leaveCall}>
                        End Call
                      </button>
                    </div>
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
          <div className=" h-full  grid grid-rows-[1fr,5fr,1fr] items-center  border-white border-2  text-center">
            <p className="font-bold ">{myName}</p>
            <video
              className=" h-96 w-full  border-white border-y-2"
              playsInline
              ref={myVideo}
              autoPlay
            />

            <button onClick={() => toggleMuteMe()}>Turn off Mic</button>
          </div>

          <div className="h-full  grid grid-rows-[1fr,5fr,1fr] items-center  border-white border-2  text-center">
            {callAccepted ? (
              <>
                <p className="font-bold">{you === "" ? name : you}</p>
                {callAccepted ? (
                  <video
                    className="h-96 border-white border-y-2 "
                    playsInline
                    ref={userVideo}
                    autoPlay
                  />
                ) : (
                  <div className=""></div>
                )}
                {callAccepted ? (
                  <button onClick={() => toggleMuteYou()}>Turn off Mic</button>
                ) : (
                  <div></div>
                )}
              </>
            ) : (
              <>
                <div></div>
                <div className="h-96 grid border-white border-y-2 items-center  justify-center ">
                  <p className="h-32 w-32 bg-white text-black rounded-full flex items-center justify-center font-bold">
                    No signal
                  </p>
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
