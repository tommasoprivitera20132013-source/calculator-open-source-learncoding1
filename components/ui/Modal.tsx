'use client'

import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: ModalSize
  className?: string
  /** Hide the built-in close button */
  hideCloseButton?: boolean
  /** Prevent closing when clicking the backdrop */
  disableBackdropClose?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-[calc(100vw-2rem)]',
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 28, stiffness: 380 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
  hideCloseButton = false,
  disableBackdropClose = false,
}: ModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [open])

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  const handleBackdropClick = () => {
    if (!disableBackdropClose) onClose()
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className={cn(
              'relative w-full glass rounded-2xl shadow-2xl',
              'flex flex-col max-h-[90vh]',
              sizeClasses[size],
              className
            )}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between gap-4 p-6 pb-4 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-white leading-tight"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="mt-1 text-sm text-[#999]"
                    >
                      {description}
                    </p>
                  )}
                </div>

                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      'flex-shrink-0 p-1.5 rounded-lg text-[#999]',
                      'hover:text-white hover:bg-white/10',
                      'transition-colors duration-150 outline-none',
                      'focus-visible:ring-2 focus-visible:ring-white/30'
                    )}
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Divider if header exists */}
            {title && (
              <div className="border-t border-white/[0.08] mx-6 flex-shrink-0" />
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ─── Convenience sub-components ───────────────────────────────────────────────

function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08] mt-4',
        className
      )}
    >
      {children}
    </div>
  )
}

export { Modal, ModalFooter }
export type { ModalProps, ModalSize }
