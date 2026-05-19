import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "@/lib/sdk";
import { useAuth } from "@/auth/AuthProvider";

export function useDevices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["devices", user?.id],
    queryFn: () => sdk.getUserDevices(user!.id),
    enabled: Boolean(user?.id),
    select: (r) => r.devices,
  });
}

export function useRemoveDevice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => sdk.removeDevice(deviceId, user!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices", user?.id] }),
  });
}

export function useOnboardDevice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      product_id: string;
      device_name: string;
      device_identifier?: string;
    }) =>
      sdk.onboardDevice({
        user_id: user!.id,
        product_id: input.product_id,
        device_name: input.device_name,
        device_identifier: input.device_identifier,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices", user?.id] }),
  });
}
