"use client";

import { useState } from "react";
import { Navbars } from "@/components/Navbars";
import { Picture } from "@/components/picture";
import { Loading } from "@/components/loading";

const Imagespage = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      <Navbars />
      {isLoading && <Loading variant="grid" />}
      <div className={isLoading ? "hidden" : "block"}>
        <Picture onLoadingChange={setIsLoading} />
      </div>
    </>
  );
};

export default Imagespage;
