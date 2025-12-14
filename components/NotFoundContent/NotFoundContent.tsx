"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/compat/router";
import { useState } from "react";

export function NotFoundContent() {
  const [isBroken, setIsBroken] = useState(false);
  const router = useRouter();
  const goHome = () => {
    if (router?.push) {
      router.push("/");
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 overflow-hidden pt-16 pb-16 mt-8 mb-8">
      <div className="relative flex items-center justify-center text-[clamp(6rem,20vw,12rem)] font-bold leading-none select-none text-[var(--color-text-primary)] mb-8">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          4
        </motion.span>
        
        <motion.div
          drag
          dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
          dragElastic={0.2}
          dragSnapToOrigin={true}
          whileHover={{ scale: 1.1, rotate: 10, color: "var(--color-accent)" }}
          whileTap={{ scale: 0.95 }}
          className="cursor-grab active:cursor-grabbing inline-block mx-2 md:mx-4"
          style={{ 
            color: isBroken ? "var(--color-accent)" : "inherit",
            transition: "color 0.3s ease" 
          }}
          onDragEnd={() => setIsBroken(true)}
        >
          0
        </motion.div>
        
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          4
        </motion.span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-[var(--color-text-primary)]">
            {isBroken ? "Whoops! You broke it." : "Page not found."}
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-md mx-auto">
            The page you’re looking for doesn’t exist or has been moved.
            {isBroken && " (Feel free to keep playing with the zero though.)"}
          </p>
        </div>
        
        <div className="pt-4 flex justify-center">
          <Button 
            variant="primary" 
            size="lg" 
            icon="house" 
            onPress={goHome}
          >
            Go Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
