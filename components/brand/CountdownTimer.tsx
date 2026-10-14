'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CountdownTimerProps {
  /** Target ISO date or timestamp. Defaults to 14 days from current date if not specified. */
  targetDate?: string | Date
  title?: string
  subtitle?: string
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - new Date().getTime()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  }
}

export function CountdownTimer({
  targetDate,
  title = 'Yearbook Ceremony & Print Lock',
  subtitle = 'The active signing phase is live! Lock-in your signatures before the flip.',
  className = '',
}: CountdownTimerProps) {
  // Default target: August 15, 2026 or 14 days from now if not passed
  const target = useState<Date>(() => {
    if (targetDate) return new Date(targetDate)
    const defaultTarget = new Date('2026-08-15T23:59:59+05:30')
    if (defaultTarget.getTime() > Date.now()) return defaultTarget
    // Fallback: 14 days from now
    const now = new Date()
    now.setDate(now.getDate() + 14)
    return now
  })[0]

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(target))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target))
    }, 1000)
    return () => clearInterval(timer)
  }, [target])

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-paper-100/90 backdrop-blur-md rounded-3xl border-2 border-[color:var(--line-soft,#e5dfd3)] shadow-xl ${className}`}>
      {title && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
          ✨ {title}
        </span>
      )}
      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-600 text-center mb-6 max-w-md font-sans">
          {subtitle}
        </p>
      )}

      {timeLeft.isExpired ? (
        <div className="text-center py-4">
          <h3 className="text-2xl font-bold font-display text-amber-900">🎓 The Yearbook is Flipping!</h3>
          <p className="text-sm text-gray-500 mt-1">Preparing final high-resolution shirt prints...</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-md">
          {timeUnits.map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center justify-center p-2 sm:p-3 bg-white rounded-2xl border border-paper-300 shadow-sm relative overflow-hidden group"
            >
              <div className="text-2xl sm:text-4xl font-extrabold font-display text-ink-900 tracking-tight">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={unit.value}
                    initial={{ y: -15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 15, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="inline-block"
                  >
                    {String(unit.value).padStart(2, '0')}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CountdownTimer
