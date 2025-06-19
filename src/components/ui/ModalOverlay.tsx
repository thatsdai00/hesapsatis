'use client';

import { motion } from 'framer-motion';

interface ModalOverlayProps {
  onClick?: () => void;
}

/**
 * A reusable modal overlay component with consistent styling
 * that provides a dark background with blur effect
 */
export default function ModalOverlay({ onClick }: ModalOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ backdropFilter: 'blur(8px)' }}
      onClick={onClick}
    />
  );
} 