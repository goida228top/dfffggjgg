import React from 'react';
import { motion } from 'motion/react';
import { Dice5, DollarSign, Home } from 'lucide-react';

export const LiveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {/* Animated glowing orbs for smooth glassmorphism effect */}
      <motion.div
        animate={{
          x: ['0vw', '10vw', '-10vw', '0vw'],
          y: ['0vh', '-10vh', '10vh', '0vh'],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-500/20 blur-[100px]"
      />
      <motion.div
        animate={{
          x: ['0vw', '-15vw', '10vw', '0vw'],
          y: ['0vh', '15vh', '-5vh', '0vh'],
          scale: [1, 1.5, 0.9, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-purple-500/20 blur-[100px]"
      />
      <motion.div
        animate={{
          x: ['0vw', '5vw', '-15vw', '0vw'],
          y: ['0vh', '10vh', '-15vh', '0vh'],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] left-[50%] w-[30vw] h-[30vw] rounded-full bg-emerald-500/20 blur-[100px]"
      />
      <motion.div
        animate={{
          x: ['0vw', '-10vw', '15vw', '0vw'],
          y: ['0vh', '-15vh', '5vh', '0vh'],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[30%] left-[10%] w-[25vw] h-[25vw] rounded-full bg-yellow-500/20 blur-[100px]"
      />

      {/* Floating Monopoly Elements */}
      <motion.div
        animate={{
          y: ['110vh', '-10vh'],
          rotate: [0, 360],
          x: ['10vw', '15vw']
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute opacity-10 text-emerald-600"
      >
        <DollarSign size={120} />
      </motion.div>

      <motion.div
        animate={{
          y: ['110vh', '-10vh'],
          rotate: [0, -360],
          x: ['80vw', '70vw']
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 5 }}
        className="absolute opacity-10 text-blue-600"
      >
        <Dice5 size={100} />
      </motion.div>

      <motion.div
        animate={{
          y: ['110vh', '-10vh'],
          rotate: [-45, 45],
          x: ['40vw', '50vw']
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute opacity-10 text-red-600"
      >
        <Home size={80} />
      </motion.div>

      {/* Subtle Dot Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]" />
    </div>
  );
};
