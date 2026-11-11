import { getVerificationStatus } from "../api/verificationApi";
import useTaskPolling from "./useTaskPolling";

/** Polls the SIGNATURE VERIFICATION status endpoint only. */
export default function useVerificationPolling(taskId) {
  return useTaskPolling(taskId, getVerificationStatus);
}
