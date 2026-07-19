"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeCanvasProps {
  value: string;
  size?: number;
  /** Foreground color */
  color?: string;
  /** Background color */
  bgColor?: string;
  className?: string;
}

/**
 * Renders a QR code onto a <canvas> using the `qrcode` npm library.
 * Hardware-accelerated — no layout thrash, no SVG parsing overhead.
 */
export default function QRCodeCanvas({
  value,
  size = 160,
  color = "#0d1b2a",
  bgColor = "#ffffff",
  className,
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: {
        dark: color,
        light: bgColor,
      },
      errorCorrectionLevel: "M",
    }).catch(console.error);
  }, [value, size, color, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label={`QR code for: ${value}`}
    />
  );
}
