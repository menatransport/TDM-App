"use client";
import { Navbars } from "@/components/Navbars";
import { Admintool } from "@/components/Admin";


const Jobpage = () => {
//   const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      
      {/* {isLoading && <Loading />}
       <div
        className={`
          transition-all duration-700 delay-300 ease-in-out
          ${isLoading ? "hidden" : "block"}
        `}
      > */}
      <Navbars /> 
      <Admintool /> 
      {/* </div> */}
    </>
  );
};

export default Jobpage;
