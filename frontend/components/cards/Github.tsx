"use client";

import { Button } from "../ui/button";
import { badgeVariants } from "@/components/ui/badge";
import { IoMdClose } from "react-icons/io";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react";
import { githubLogout, whoAmI } from "@/lib/utils";

export default function Github() {
  const router = useRouter();
  const [session, setSession] = useState<any>();

  useEffect(()=>{
    (async () => {
      const data: any = await whoAmI();
      setSession(data);
    })();
  },[])

  async function githubLogin() {
    router.push('http://localhost:8000/auth/github');
  }
  //callback url to be changed to /#claim
  return (
    <>
      <div className="card_background">
        <section className="flex md:flex-row flex-col justify-between items-center md:p-2 p-0 lg:space-x-5 mr-6 ">
          <div className="flex flex-col space-y-2 m-3 lg:m-3 py-2">
            <span className="flex flex-row space-x-3 items-center ">
            <h3 className="!font-thicccboibold text-3xl text-white ">Github </h3>
            {session ? <>
              <div className={badgeVariants({ variant: "default" })}>
                {session.data.user.displayName}
                <button onClick={() => {
                  githubLogout()
                  setSession(undefined)
                  }} className="ml-2">
                  {" "}
                  <IoMdClose />
                </button>
              </div>
            </>: <>
            </>}
            </span>
            <p className="font-ppmori pt-2 text-lg text-white text-opacity-65 w-[80%]">
              Connect your GitHub account from which you have contributed to the
              repository.
            </p>
          </div>
          {session ? (
            <>
             <h1 className="text-2xl font-thicccboibold text-white">Claimed</h1>
            </>
          ) : (
            <>
              <Button onClick={() => githubLogin()} variant={"primary"} size={"lg"} className="">
                Connect Github
              </Button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
