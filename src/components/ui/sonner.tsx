"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#0b1d3a",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255, 255, 255, 0.12)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !bg-[#0b1d3a] !text-white !border-white/10 shadow-xl",
          title: "!text-white font-semibold text-xs",
          description: "!text-slate-300 text-[11px]",
          actionButton: "!bg-white !text-[#0b1d3a] font-bold text-xs",
          cancelButton: "!bg-white/10 !text-white text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
