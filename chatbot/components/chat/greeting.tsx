import { motion } from "framer-motion";
import { GraduationCapIcon, SparklesIcon } from "lucide-react";

export const Greeting = () => (
  <div className="flex w-full max-w-xl flex-col items-center px-4" key="overview">
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-(--shadow-float)"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <GraduationCapIcon className="size-7" />
    </motion.div>
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <SparklesIcon className="size-3.5" />
      Otago Polytechnic Assistant
    </motion.div>
    <motion.h1
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 text-center font-semibold text-3xl tracking-tight text-foreground md:text-4xl"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.42, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      Ready to learn something new?
    </motion.h1>
    <motion.p
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 max-w-md text-center text-sm leading-6 text-muted-foreground"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.58, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      Ask for study help, plan your next assignment, or explore a difficult
      topic with your personal learning assistant.
    </motion.p>
  </div>
);
