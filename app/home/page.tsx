'use client' 
import React from 'react';
import { Navbars } from '@/components/Navbars';
import { Jobcards } from '@/components/Jobcards';


const Home = () => {
  return (
    <>
    <Navbars />
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex justify-center p-10 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full "></div>
        <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full "></div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full "></div>
      </div>
      <div className='flex flex-col z-1 w-full space-y-2 mt-1.5'>
        <Jobcards />
      </div>
    </div>
    
    </>
  );
};

export default Home;
