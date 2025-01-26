import React, { useEffect } from "react";

export default function Prueba() {
  useEffect(() => {
    console.log("prueba");
  }, []);
  return <div className="text-white">prueba</div>;
}
