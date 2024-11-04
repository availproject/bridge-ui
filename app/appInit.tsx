"use client";

import useAppInit from "@/hooks/useAppInit";
import { FC } from "react";

/**
 * AppInit component handles application initialization tasks.
 * This component doesn't render anything visible but performs necessary setup tasks.
 */
const AppInit: FC = () => {
  useAppInit();
  return null;
};

export default AppInit;