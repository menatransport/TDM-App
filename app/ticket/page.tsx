"use client";

import { useState } from "react";
import { Navbars } from "@/components/Navbars";
import { Ticket } from "@/components/ticket";
import { Loading } from "@/components/loading";

const Ticketpage = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
  <>
    

    {isLoading && <Loading />}

    
  <div
        className={`
          transition-all duration-400 delay-100 ease-in-out
          ${isLoading ? "hidden" : "block"}
        `}
      >
      <Navbars />
      <Ticket onLoadingChange={(loading: boolean) => setIsLoading(loading)} />
    </div>
  </>
);

};

export default Ticketpage;
