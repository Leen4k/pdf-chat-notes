"use client";

import { motion } from "framer-motion";

const cursorVariants = {
  blinking: {
    opacity: [0, 0, 1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatDelay: 0,
      ease: "linear",
      times: [0, 0.5, 0.5, 1],
    },
  },
};

export default function CursorBlinker() {
  return (
    <motion.div
      variants={cursorVariants}
      animate="blinking"
      className="inline-block h-[30px] w-[3px] flex-1 translate-y-1 bg-gradient-to-tr from-[#8ec5fc] to-[#e0c3fc] pb-9 md:h-[50px] md:pb-[3.25rem]"
    />
  );
}
