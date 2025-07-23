import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function Login({ setLoaded, setUserName }) {
  const { register, handleSubmit } = useForm();

  const submit = (data) => {
    setUserName(data.nombreUsuario);
    setLoaded(true);
  };

  return (
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
            className="p-2 bg-red-700 rounded-lg text-white  hover:bg-red-300 transition duration-300 "
            type="submit"
          >
            <p>Set Name &</p>
            <p>select your screen</p>
          </button>
        </form>
      </div>
    </>
  );
}
