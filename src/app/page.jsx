"use client";

import React, { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";



function App() {
  const Login = dynamic(() => import("@/components/login"), {
    suspense: true,
  });
  const Caller = dynamic(() => import("@/components/caller"), {
    suspense: true,
  });

  const [userName, setUserName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);

  const reloadChild = () => {
    setKey((prevKey) => prevKey + 1);
  };



  return (
    <div className="h-full w-screen flex flex-col items-center bg-black">
      <div className="h-full grid justify-center items-start text-black">
        {loaded ? (
          <Suspense fallback={<div></div>}>
            <Caller
              key={key}
              reloadFuction={reloadChild}
              userName={userName}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<div></div>}>
            <Login
              setLoaded={setLoaded}
              setUserName={setUserName}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default App;
