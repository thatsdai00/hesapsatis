'use client'

import { motion } from "framer-motion";

export const MotionDiv = motion.div;

export const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut'
        }
    },
}; 