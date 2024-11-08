"use client";

import useAppInit from "@/hooks/useAppInit";
import { FC } from "react";
import { Logger } from "@/utils/logger";

/**
 * AppInit component handles application initialization tasks.
 * This component doesn't render anything visible but performs necessary setup tasks.
 */
const AppInit: FC = () => {
  try {
    useAppInit();
  } catch (error: any) {
    Logger.error("ERROR_INITIALISING_APP", error);
  }
  return null;
};

export default AppInit;
