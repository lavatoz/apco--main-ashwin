import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPageWrapper: React.FC<AnimatedPageWrapperProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] // Custom luxury cubic-bezier easeOut
      }}
      className={`min-h-screen bg-black text-white ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPageWrapper;
