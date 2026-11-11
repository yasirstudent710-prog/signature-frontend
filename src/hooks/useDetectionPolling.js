import { getDetectionStatus } from "../api/detectionApi";
import useTaskPolling from "./useTaskPolling";

/** Polls the SIGNATURE DETECTION status endpoint only. */
export default function useDetectionPolling(taskId) {
  return useTaskPolling(taskId, getDetectionStatus);
}
