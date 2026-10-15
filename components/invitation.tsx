'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Music,
  Snowflake,
  Sparkles,
  VolumeX,
  X,
  Minus,
  Plus,
  User,
  Utensils,
  Flower2,
} from 'lucide-react'

const photos = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?auto=format&fit=crop&w=900&q=85',
]

function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}

export function FloatingAudio({ entered }: { entered: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (entered && audioRef.current) {
      audioRef.current.volume = 0.4
      audioRef.current.currentTime = 29
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => console.warn('Autoplay bloqueado por el navegador'))
    }
  }, [entered])

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <>
      <audio ref={audioRef} loop src="/hello.mp3" /> 
      
      <AnimatePresence>
        {entered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            onClick={toggleAudio}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-[#ff4d9d]/40 hover:bg-[#ff4d9d]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d9d]"
            aria-label="Toggle music"
          >
            {isPlaying ? (
              <Music size={18} className="animate-pulse text-[#ff83ba]" />
            ) : (
              <VolumeX size={18} className="text-white/50" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}

export function InvitationShell({ onEnter }: { onEnter: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  const handleEnter = () => {
    setIsVisible(false)
    onEnter()
  }
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#080205] px-6 text-center transform-gpu"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute left-1/2 top-1/2 h-[45rem] w-[45rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,42,133,0.15)_0%,transparent_60%)] will-change-transform"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="relative z-10 max-w-md">
            <motion.p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-[#ff83ba]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            >
              Estás invitado a
            </motion.p>
            
            <motion.h1
              className="font-serif text-5xl italic tracking-tight text-white sm:text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            >
              Los 15 de Ángela
            </motion.h1>
            
            <motion.div
              className="mx-auto my-9 h-px bg-gradient-to-r from-transparent via-[#ff4d9d] to-transparent"
              initial={{ opacity: 0, width: "0px" }}
              animate={{ opacity: 1, width: "100px" }}
              transition={{ duration: 1, delay: 0.7, ease: "circOut" }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
              className="relative mx-auto inline-block"
            >
              <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-[#ff2a85] to-[#8d1d4c] opacity-40 blur-md transition-opacity duration-500" />
              <button
                onClick={handleEnter}
                className="group relative flex items-center gap-3 rounded-full border border-white/20 bg-[#080205]/90 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white backdrop-blur-xl transition-all duration-300 hover:border-[#ff4d9d] hover:bg-[#ff4d9d]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d9d]"
              >
                Ingresar a la invitación
                <Sparkles size={15} className="text-[#ff83ba] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ClubBackdrop() {
  const lights = Array.from({ length: 8 })
  const flowers = Array.from({ length: 4 })

  return (
    <div className="pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-[#080205] transform-gpu">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#4a041f_0%,transparent_50%),linear-gradient(150deg,#080205,#12030a)]" />
      
      <div className="absolute -left-28 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,42,133,0.15)_0%,transparent_70%)] will-change-transform" />
      <div className="absolute -right-28 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(74,4,31,0.3)_0%,transparent_70%)] will-change-transform" />
      
      {flowers.map((_, i) => (
        <motion.div
          key={`flower-${i}`}
          className="absolute text-[#ff2a85]/15 will-change-transform"
          style={{
            left: `${15 + i * 25}%`,
            top: `${15 + (i * 35) % 65}%`,
          }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 8 + (i % 3),
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.5,
          }}
        >
          <Flower2 size={80 + (i * 35)} strokeWidth={1.5} />
        </motion.div>
      ))}

      {lights.map((_, i) => (
        <motion.span
          key={`light-${i}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#ff83ba] will-change-transform shadow-[0_0_8px_rgba(255,131,186,0.8)]"
          style={{ left: `${8 + i * 12}%`, top: `${15 + (i * 20) % 75}%` }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.7, 1.5, 0.7] }}
          transition={{ duration: 3 + (i % 2), repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
        />
      ))}
    </div>
  )
}

function Countdown() {
  const target = new Date('2026-12-07T21:30:00-03:00').getTime()
  const [time, setTime] = useState({ días: 0, horas: 0, min: 0, seg: 0 })

  useEffect(() => {
    const update = () => {
      const delta = Math.max(0, target - Date.now())
      setTime({
        días: Math.floor(delta / 86400000),
        horas: Math.floor(delta / 3600000) % 24,
        min: Math.floor(delta / 60000) % 60,
        seg: Math.floor(delta / 1000) % 60,
      })
    }
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [target])

  return (
    <div className="mt-8 grid max-w-lg grid-cols-4 gap-2.5 sm:gap-4">
      {Object.entries(time).map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-2 py-3.5 backdrop-blur-md transition-colors hover:border-[#ff4d9d]/30"
        >
          <div className="font-serif text-2xl font-light text-white sm:text-4xl">
            {String(value).padStart(2, '0')}
          </div>
          <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] text-[#ff83ba]/75 sm:text-[10px]">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-16 text-center">
      <img
        src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=2200&q=90"
        alt="Luces de fiesta"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,2,5,.4),#080205_95%)]" />

      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.42em] text-[#ff83ba]">
          Mis 15 años
        </p>
        <h1 className="font-serif text-[clamp(4.2rem,16vw,8rem)] leading-[0.88] tracking-tight text-white drop-shadow-[0_10px_35px_rgba(255,42,133,0.4)]">
          Ángela
        </h1>
        <div className="my-6 h-px w-36 bg-gradient-to-r from-transparent via-[#ff4d9d] to-transparent" />
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/85 sm:text-sm">
          7 · DICIEMBRE · 2026
        </p>

        <div className="w-full">
          <Countdown />
        </div>
      </div>
    </section>
  )
}

export function Quote() {
  return (
    <section className="px-6 py-28 text-center sm:py-36">
      <Reveal>
        <p className="mx-auto max-w-3xl font-serif text-2xl italic leading-relaxed text-white/90 sm:text-4xl sm:leading-snug">
          “La vida es una fiesta, y esta noche la celebramos juntos.”
        </p>
        <div className="mx-auto mt-7 h-px w-12 bg-[#ff4d9d]/40" />
      </Reveal>
    </section>
  )
}

const details = [
  { icon: CalendarDays, label: 'Fecha', value: 'Lunes 7 de Diciembre 2026' },
  { icon: Clock3, label: 'Horario', value: '21:30 hs.' },
  {
    icon: Sparkles,
    label: 'Dress code',
    value: 'Bresh vibes',
    sub: 'Cero formalidad, 100% Actitud',
  },
  {
    icon: MapPin,
    label: 'Lugar',
    value: 'Casona del Francés',
    sub: 'Pinar del Río 1792, Villa del Rosario, Córdoba',
  },
]

export function EventDetails() {
  return (
    <section className="px-6 py-24 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.38em] text-[#ff83ba]">
            La celebración
          </p>
          <h2 className="mt-3 font-serif text-4xl text-white sm:text-6xl">
            Nos vemos ahí.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value, sub }) => (
            <Reveal key={label}>
              <div className="h-full rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-colors hover:border-[#ff4d9d]/25">
                <Icon size={20} className="mb-8 text-[#ff4d9d]" />
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
                  {label}
                </p>
                <p className="mt-2 text-lg font-medium text-white">{value}</p>
                {sub && (
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                    {sub}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-[#ff4d9d]/30 bg-[#4a041f]/20 p-5 text-sm leading-relaxed text-white/80 backdrop-blur-sm">
            <Snowflake size={20} className="shrink-0 text-[#ff83ba]" />
            <span>
              <strong className="font-semibold text-white">Aviso importante:</strong> A
              partir del horario del brindis la fiesta es en exterior, llevar
              abrigo 🧥✨
            </span>
          </div>
        </Reveal>

        <Reveal className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <iframe
            title="Mapa de Casona del Francés"
            src="https://www.google.com/maps?q=Casona%20del%20Franc%C3%A9s%20Villa%20del%20Rosario%20C%C3%B3rdoba&output=embed"
            className="h-72 w-full grayscale invert-[.88] contrast-125 sm:h-96"
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  )
}

export function Gallery() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section className="px-6 py-24 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.38em] text-[#ff83ba]">
            Momentos
          </p>
          <h2 className="mt-3 font-serif text-4xl text-white sm:text-6xl">
            Book de Fotos
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((src, i) => (
            <Reveal
              key={src}
              className={i === 1 || i === 4 ? 'sm:translate-y-8' : ''}
            >
              <button
                onClick={() => setSelected(i)}
                className="group block w-full overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d9d]"
              >
                <img
                  src={src}
                  alt={`Book foto ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#080205]/95 p-5 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Cerrar foto"
              onClick={() => setSelected(null)}
              className="absolute right-5 top-5 rounded-full border border-white/15 p-3 text-white transition hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <button
              aria-label="Foto anterior"
              onClick={() =>
                setSelected((selected + photos.length - 1) % photos.length)
              }
              className="absolute left-3 rounded-full border border-white/15 p-3 text-white transition hover:bg-white/10 sm:left-8"
            >
              <ChevronLeft />
            </button>
            <motion.img
              src={photos[selected]}
              alt={`Foto ampliada ${selected + 1}`}
              className="max-h-[85vh] max-w-[86vw] rounded-2xl object-contain shadow-2xl"
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
            />
            <button
              aria-label="Foto siguiente"
              onClick={() => setSelected((selected + 1) % photos.length)}
              className="absolute right-3 rounded-full border border-white/15 p-3 text-white transition hover:bg-white/10 sm:right-8"
            >
              <ChevronRight />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function Gifts() {
  const [copied, setCopied] = useState(false)
  const alias = 'ange.alvarez4'

  const copy = async () => {
    await navigator.clipboard.writeText(alias)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  return (
    <section className="px-6 py-24 sm:py-36">
      <Reveal>
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-md sm:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.38em] text-[#ff83ba]">
            Un mimo para Ángela
          </p>
          <h2 className="mt-3 font-serif text-3xl text-white sm:text-5xl">
            Regalo
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-white/60 sm:text-sm">
            Tu presencia es mi mejor regalo. Si querés hacerme un mimo, podés
            colaborar a través de mi alias:
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ff4d9d]/20 bg-[#12030a]/70 p-4 sm:flex-row sm:justify-between sm:px-6">
            <span className="font-mono text-base font-semibold tracking-wider text-white sm:text-lg">
              {alias}
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full border border-[#ff4d9d]/60 bg-[#ff2a85]/10 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-[#ff2a85] hover:shadow-[0_0_20px_rgba(255,42,133,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d9d]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function Rsvp() {
  const [guestCount, setGuestCount] = useState(1)
  const [guests, setGuests] = useState([
    { name: '', dietary: 'Ninguna', song: '' },
  ])

  const handleGuestCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(5, guestCount + delta))
    setGuestCount(newCount)

    if (newCount > guests.length) {
      setGuests([
        ...guests,
        ...Array(newCount - guests.length).fill({
          name: '',
          dietary: 'Ninguna',
          song: '',
        }),
      ])
    } else if (newCount < guests.length) {
      setGuests(guests.slice(0, newCount))
    }
  }

  const updateGuest = (index: number, field: string, value: string) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [field]: value }
    setGuests(newGuests)
  }

  const handleConfirm = () => {
    let message = `Hola Ángela! Confirmo asistencia a tus 15 💖\n\n`
    guests.forEach((g, i) => {
      message += `*Invitado ${i + 1}*\n`
      message += `Nombre: ${g.name || 'Sin especificar'}\n`
      message += `Menú: ${g.dietary}\n`
      if (g.song) message += `Canción: ${g.song}\n`
      message += `\n`
    })

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/543573434007?text=${encodedMessage}`, '_blank')
  }

  return (
    <section className="px-6 py-24 sm:py-36">
      <div className="mx-auto max-w-2xl">
        <Reveal className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.38em] text-[#ff83ba]">
            Confirmación
          </p>
          <h2 className="mt-3 font-serif text-4xl text-white sm:text-6xl">
            Confirmá tu lugar
          </h2>
        </Reveal>

        <div className="mt-12 space-y-6">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-center backdrop-blur-md sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ff83ba]">
                ¿Cuántas personas confirman?
              </p>
              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  onClick={() => handleGuestCountChange(-1)}
                  disabled={guestCount <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-[#ff4d9d] hover:text-[#ff4d9d] disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="font-serif text-3xl text-white">
                  {guestCount}
                </span>
                <button
                  onClick={() => handleGuestCountChange(1)}
                  disabled={guestCount >= 5}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-[#ff4d9d] hover:text-[#ff4d9d] disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </Reveal>

          {guests.map((g, i) => (
            <Reveal key={i}>
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md sm:p-8">
                <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                  <User size={16} className="text-[#ff4d9d]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    Invitado {i + 1}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre y Apellido"
                      value={g.name}
                      onChange={(e) => updateGuest(i, 'name', e.target.value)}
                      className="w-full border-b border-white/20 bg-transparent py-2 text-white placeholder:text-white/30 focus:border-[#ff4d9d] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#ff83ba]/80">
                      <Utensils size={12} /> Restricción Alimentaria
                    </label>
                    <select
                      value={g.dietary}
                      onChange={(e) =>
                        updateGuest(i, 'dietary', e.target.value)
                      }
                      className="w-full appearance-none border-b border-white/20 bg-transparent py-2 text-white focus:border-[#ff4d9d] focus:outline-none"
                    >
                      <option value="Ninguna" className="bg-[#080205]">
                        Ninguna
                      </option>
                      <option value="Vegetariano/a" className="bg-[#080205]">
                        Vegetariano/a
                      </option>
                      <option value="Vegano/a" className="bg-[#080205]">
                        Vegano/a
                      </option>
                      <option value="Celíaco/a" className="bg-[#080205]">
                        Celíaco/a
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#ff83ba]/80">
                      <Music size={12} /> Canción que no puede faltar
                    </label>
                    <input
                      type="text"
                      placeholder="Título y Artista"
                      value={g.song}
                      onChange={(e) => updateGuest(i, 'song', e.target.value)}
                      className="w-full border-b border-white/20 bg-transparent py-2 text-white placeholder:text-white/30 focus:border-[#ff4d9d] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}

          <Reveal className="mt-8 text-center">
            <button
              onClick={handleConfirm}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#ff2a85] px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_35px_rgba(255,42,133,0.35)] transition-all duration-300 hover:bg-[#ff4d9d] hover:shadow-[0_0_45px_rgba(255,77,157,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d9d] sm:w-auto"
            >
              <MessageCircle size={18} />
              Confirmar Asistencia
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="px-6 pb-12 pt-16 text-center select-none">
      <div className="mx-auto mb-10 h-px max-w-4xl bg-gradient-to-r from-transparent via-[#8d1d4c] to-transparent" />
      <a
        href="https://instagram.com/festa_invitaciones"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-xs font-medium text-white/70 transition hover:text-[#ff83ba]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
        @festa_invitaciones <ExternalLink size={12} />
      </a>
      <p className="mt-6 text-[9px] uppercase tracking-[0.35em] text-white/35">
        Diseño exclusivo para eventos
      </p>
      <p className="mt-3 font-serif text-lg italic text-white/60">
        Hecho con amor por Festa
      </p>
    </footer>
  )
}

export function Invitation() {
  const [entered, setEntered] = useState(false)

  return (
    <>
      <InvitationShell onEnter={() => setEntered(true)} />
      <FloatingAudio entered={entered} />
      <ClubBackdrop />
      <main className="overflow-hidden">
        <Hero />
        <Quote />
        <EventDetails />
        <Gallery />
        <Gifts />
        <Rsvp />
        <Footer />
      </main>
    </>
  )
}