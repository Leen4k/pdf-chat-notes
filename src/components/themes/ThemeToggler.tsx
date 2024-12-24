"use client";
import * as React from "react";
import { useTheme } from "next-themes";
import { TbMoonStars, TbSun, TbDeviceDesktop } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ThemeToggleV2 = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: TbSun,
    },
    {
      value: "dark",
      label: "Dark",
      icon: TbMoonStars,
    },
    {
      value: "system",
      label: "System",
      icon: TbDeviceDesktop,
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="
            relative 
            border-none 
            focus-visible:outline-none 
            shadow-none 
            hover:bg-transparent 
            group
            dark:bg-transparent
            p-0
            m-0
          "
          size="icon"
        >
          {/* Animated theme icons */}
          <motion.div
            initial={false}
            animate={{
              rotate: theme === "dark" ? -90 : 0,
              scale: theme === "dark" ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="absolute text-primary"
          >
            <TbSun className="h-[1.2rem] w-[1.2rem]" />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              rotate: theme === "dark" ? 0 : 90,
              scale: theme === "dark" ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="absolute text-primary"
          >
            <TbMoonStars className="h-[1.2rem] w-[1.2rem]" />
          </motion.div>

          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="
          z-[10000] 
          min-w-[180px] 
          border-primary/10 
          shadow-lg 
          bg-background
        "
        align="end"
      >
        <AnimatePresence>
          {themeOptions.map((themeOption) => (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`
                cursor-pointer 
                flex 
                items-center 
                gap-3 
                px-3 
                py-2 
                ${
                  theme === themeOption.value
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-primary/5"
                }
              `}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <themeOption.icon
                  className={`
                     p-0
                    ${
                      theme === themeOption.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  `}
                />
              </motion.div>
              <span>{themeOption.label}</span>

              {theme === themeOption.value && (
                <motion.div
                  layoutId="active-theme-indicator"
                  className="
                    ml-auto 
                    h-2 
                    w-2 
                    bg-primary 
                    rounded-full
                  "
                />
              )}
            </DropdownMenuItem>
          ))}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggleV2;
