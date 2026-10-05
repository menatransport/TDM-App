"use client";
import { useState } from "react";
import { Navbars } from "@/components/Navbars";
import { Jobcomponent } from "@/components/Job";
import { Loading } from "@/components/loading";

const Jobpage = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      <Navbars />
      {isLoading && <Loading variant="list" />}
      <div className={isLoading ? "hidden" : "block"}>
        <Jobcomponent onLoadingChange={setIsLoading} />
      </div>
    </>
  );
};

export default Jobpage;
