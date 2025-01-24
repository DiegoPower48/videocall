"use client";

import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import Peer from "simple-peer";
import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

const socket = io.connect(process.env.NEXT_PUBLIC_API_URL);

function App() {
  const [me, setMe] = useState("");
  const [you, setYou] = useState("");
  const [myName, setMyName] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [logged, setLogged] = useState(false);
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
      setLogged(true);
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
    setReceivingCall(false);
    setCallAccepted(false);
    setCallEnded(true);
    connectionRef.current.destroy();
    userVideo.current.destroy();
    setCaller("");
    setCallerSignal(null);
    setIdToCall("");
  };

  const submit = (data) => {
    setMyName(data.nombreusuario);
    shareScreen();
  };

  useEffect(() => {
    socket.on("me", (id) => {
      setMe(id);
      console.log(id);
    }),
      [];
  });

  useEffect(() => {
    console.log(userVideo.current);
  }, [userVideo]);

  return (
    <div className="h-5/6 w-screen ">
      <div className="w-full h-full grid justify-center items-center grid-rows-[1fr,10fr] text-black">
        <p className="h-full flex text-2xl items-center justify-center text-white">
          Videochat
        </p>
        <div className="h-full grid items-center  justify-center grid-rows-[1fr,4fr]">
          {logged ? (
            <form
              className="w-screen h-full  grid-cols-[3fr,3fr,3fr,3fr,2fr] grid  justify-center items-center  border-white border-2 rounded-t-xl   bg-red-500"
              onSubmit={handleSubmit(callUser)}
            >
              <div className="grid grid-rows-2 items-center justify-center">
                <div className="font-bold ">My Name:</div>
                <p>{myName}</p>
              </div>
              <div>
                <p className="text-left font-bold">My ID code:</p>
                <div className="text-black ">{me}</div>
              </div>

              <div className="w-full h-4/6 grid grid-rows-2 grid-cols-1 items-center justify-center p-2">
                <p className="text-center font-bold">To call:</p>
                <textarea
                  id="filled-basic"
                  label="ID to call"
                  className="text-black resize-none w-full "
                  placeholder="write a code to call"
                  onChange={(e) => setIdToCall(e.target.value)}
                  {...register("idUser", {
                    required: "to call is required",
                  })}
                />
              </div>
              <div className="h-full bg-white w-full grid items-center justify-center   ">
                {callAccepted && !callEnded ? (
                  <>
                    <div>In call with:</div>

                    <div className="font-bold"> {name === "" ? you : name}</div>

                    <button onClick={leaveCall}>End Call</button>
                  </>
                ) : (
                  <button type="submit">
                    <LocalPhoneIcon
                      className="h-full bg-red-600 rounded-full"
                      fontSize="large"
                      color="primary"
                      aria-label="call"
                      onClick={() => callUser(idToCall)}
                    />
                  </button>
                )}
              </div>
              <div className=" ">
                {receivingCall && !callAccepted && (
                  <div className=" bg-white w-4/6 grid items-center justify-center text-center">
                    <h1>{name} is calling...</h1>
                    <button className="p-5 " onClick={answerCall}>
                      Answer
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <>
              <div className="w-screen p-5 bg-red-500 grid  items-center justify-center">
                <form
                  onSubmit={handleSubmit(submit)}
                  className=" p-2 text-black grid grid-cols-[1fr,5fr,1fr] gap-5 items-center justify-center "
                >
                  <p className="text-left text-xl flex align-bottom font-bold ">
                    Name:
                  </p>
                  <textarea
                    className="p-2 font-bold border-2 rounded-xl"
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
          <div className="bg-black h-full grid grid-cols-2  text-white gap-1 items-center">
            <div className=" h-full  grid grid-rows-[1fr,5fr,1fr] items-center  border-white border-2  text-center">
              {logged ? <p className="font-bold ">{myName}</p> : <div></div>}
              <video
                className=" h-96  border-white border-y-2"
                playsInline
                ref={myVideo}
                autoPlay
              />
              {logged ? (
                <button onClick={() => toggleMuteMe()}>Turn off Mic</button>
              ) : (
                ""
              )}
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
                    <button onClick={() => toggleMuteYou()}>
                      Turn off Mic
                    </button>
                  ) : (
                    <div></div>
                  )}
                </>
              ) : (
                <div>no signal</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
