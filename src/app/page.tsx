"use client";
import React, { useEffect, useRef, useState } from "react";
import { ShootingStars } from "../components/ui/ShootingStars";
import { StarsBackground } from "../components/ui/StarsBackground";
import { useAmplifyAuthenticatedUser } from "../hooks/useAmplifyAuthenticatedUser";
import gsap from "gsap";

const Home = () => {
  const { dbUser: user, loading } = useAmplifyAuthenticatedUser();
  const contentRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setIsReady(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (isReady && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { scale: 0.99, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }
      );
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <div
      ref={contentRef}
      className="h-full w-full bg-base-300 flex flex-col items-start justify-start p-8 relative rounded-md"
    >
      <h2 className="relative text-left text-4xl tracking-tight font-medium bg-clip-text text-transparent bg-gradient-to-b from-slate-600 via-slate-400 to-slate-300 flex gap-3">
        <span>Welcome,</span>
        <span>{user?.username}</span>
      </h2>
      <ShootingStars minDelay={2000} maxDelay={4000} />
      <StarsBackground starDensity={0.0003} />
    </div>
  );
};

export default Home;
