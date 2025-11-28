import { useEffect, useRef } from "react";

function randomRadius(min = 8, max = 16): number {
  return Math.floor(Math.random() * (max - min) + min);
}

function randomStrokeWidth(min = 1.5, max = 2.5): number {
  return Math.random() * (max - min) + min;
}

export function useRandomBorderRadius<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tlRadius = randomRadius(5, 25);
    const trRadius = randomRadius(8, 14);
    const brRadius = randomRadius(8, 14);
    const blRadius = randomRadius(8, 14);

    const topStroke = randomStrokeWidth(1.5, 2.5);
    const rightStroke = randomStrokeWidth(1.5, 2.5);
    const bottomStroke = randomStrokeWidth(1.5, 2.5);
    const leftStroke = randomStrokeWidth(1.5, 2.5);

    el.style.setProperty("--tl-radius", `${tlRadius}px`);
    el.style.setProperty("--tr-radius", `${trRadius}px`);
    el.style.setProperty("--br-radius", `${brRadius}px`);
    el.style.setProperty("--bl-radius", `${blRadius}px`);

    el.style.setProperty("--top-stroke", `${topStroke}px`);
    el.style.setProperty("--right-stroke", `${rightStroke}px`);
    el.style.setProperty("--bottom-stroke", `${bottomStroke}px`);
    el.style.setProperty("--left-stroke", `${leftStroke}px`);
  }, []);

  return ref;
}