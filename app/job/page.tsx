"use client";
import { useState } from "react";
import { Navbars } from "@/components/Navbars";
import { Jobcomponent } from "@/components/Job";
import { Loading } from "@/components/loading";

const Jobpage = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      
      {isLoading && <Loading />}
       <div
        className={`
          transition-all duration-700 delay-300 ease-in-out
          ${isLoading ? "hidden" : "block"}
        `}
      >
      <Navbars /> 
      <Jobcomponent onLoadingChange={(loading: boolean) => setIsLoading(loading)} />
      </div>
    </>
  );
};

export default Jobpage;
