"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const AnimateWord = ({
  word,
  className,
}: {
  word: string;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 10,
      }}
      className={cn(
        "z-10 inline-block relative text-left font-bold text-white px-2",
        className
      )}
    >
      {word.split("").map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: index * 0.05,
            duration: 0.2,
          }}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};
