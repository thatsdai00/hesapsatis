'use client';

import { FaBolt, FaHeadset, FaShieldAlt, FaTags } from 'react-icons/fa';
import { motion } from 'framer-motion';

const features = [
  {
    icon: FaBolt,
    text: 'Anında Teslimat',
    color: 'purple',
    description: 'Satın aldıktan sonra anında teslim edilir',
  },
  {
    icon: FaHeadset,
    text: '7/24 Destek',
    color: 'blue',
    description: 'Her zaman yanınızdayız',
  },
  {
    icon: FaShieldAlt,
    text: 'Güvenli Ödeme',
    color: 'green',
    description: 'Güvenli ödeme sistemleri',
  },
  {
    icon: FaTags,
    text: 'Uygun Fiyat',
    color: 'yellow',
    description: 'En uygun fiyat garantisi',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
};

// Map feature colors to tailwind classes for gradient backgrounds
const getGradientClasses = (color: string) => {
  const colorMap: { [key: string]: string } = {
    purple: 'from-purple-900/40 via-purple-800/30 to-purple-900/20 border-purple-700/30',
    blue: 'from-blue-900/40 via-blue-800/30 to-blue-900/20 border-blue-700/30',
    green: 'from-green-900/40 via-green-800/30 to-green-900/20 border-green-700/30',
    yellow: 'from-amber-900/40 via-amber-800/30 to-amber-900/20 border-amber-700/30',
  };
  return colorMap[color] || 'from-gray-900/40 via-gray-800/30 to-gray-900/20 border-gray-700/30';
};

// Map feature colors to tailwind classes for glow effects
const getGlowEffect = (color: string) => {
  const colorMap: { [key: string]: string } = {
    purple: 'group-hover:shadow-[0_0_15px_rgba(192,132,252,0.3)]',
    blue: 'group-hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]',
    green: 'group-hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]',
    yellow: 'group-hover:shadow-[0_0_15px_rgba(250,204,21,0.3)]',
  };
  return colorMap[color] || 'group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]';
};

// Map feature colors to tailwind classes for icon colors
const getIconColor = (color: string) => {
  const colorMap: { [key: string]: string } = {
    purple: 'text-purple-400 group-hover:text-purple-300',
    blue: 'text-blue-400 group-hover:text-blue-300',
    green: 'text-green-400 group-hover:text-green-300',
    yellow: 'text-amber-400 group-hover:text-amber-300',
  };
  return colorMap[color] || 'text-gray-400 group-hover:text-gray-300';
};

// Map feature colors to tailwind classes for icon background
const getIconBgColor = (color: string) => {
  const colorMap: { [key: string]: string } = {
    purple: 'bg-purple-900/50 group-hover:bg-purple-800/60',
    blue: 'bg-blue-900/50 group-hover:bg-blue-800/60',
    green: 'bg-green-900/50 group-hover:bg-green-800/60',
    yellow: 'bg-amber-900/50 group-hover:bg-amber-800/60',
  };
  return colorMap[color] || 'bg-gray-800/50 group-hover:bg-gray-700/60';
};

export default function ProductFeatures() {
  return (
    <motion.div 
      className="grid grid-cols-2 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {features.map((feature) => (
        <motion.div 
          key={feature.text} 
          className={`
            group flex flex-col items-center justify-center p-4 rounded-xl
            bg-gradient-to-br ${getGradientClasses(feature.color)}
            border transition-all duration-300 ${getGlowEffect(feature.color)}
            hover:-translate-y-1 relative overflow-hidden
          `}
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-20 bg-grid-pattern"></div>
          
          {/* Icon with background */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${getIconBgColor(feature.color)} transition-colors duration-300`}>
            <feature.icon className={`w-6 h-6 transition-colors duration-300 ${getIconColor(feature.color)}`} />
          </div>
          
          {/* Text content */}
          <span className="text-sm text-center text-white font-semibold mb-1">{feature.text}</span>
          <span className="text-xs text-center text-gray-400 hidden sm:block">{feature.description}</span>
        </motion.div>
      ))}
    </motion.div>
  );
} 