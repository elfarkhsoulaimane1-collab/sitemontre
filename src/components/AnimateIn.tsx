'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

interface BaseProps {
  children: ReactNode
  className?: string
}

interface AnimateInProps extends BaseProps {
  delay?: number
}

export function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className }: BaseProps) {
  return (
    <motion.div
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: BaseProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : 32 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HeroAnimate({ children, delay = 0, className }: AnimateInProps) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
