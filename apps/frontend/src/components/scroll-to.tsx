"use client";

import { useEffect } from "react";

/** Glides the viewport to an element once it exists. */
export function ScrollTo({ id }: { id: string }) {
  useEffect(() => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [id]);

  return null;
}
