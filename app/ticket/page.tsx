"use client";

import { useState } from "react";
import { Navbars } from "@/components/Navbars";
import { Ticket } from "@/components/ticket";
import { Loading } from "@/components/loading";

const Ticketpage = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <Navbars />
      {isLoading && <Loading variant="detail" />}
      <div className={isLoading ? "hidden" : "block"}>
        <Ticket onLoadingChange={setIsLoading} />
      </div>
    </>
  );
};

export default Ticketpage;
