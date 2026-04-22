export async function simulateNetwork<T>(
  payload: T,
  options?: { delayMs?: number; shouldFail?: boolean; errorMessage?: string },
): Promise<T> {
  const delayMs = options?.delayMs ?? 650;
  const shouldFail = options?.shouldFail ?? false;

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  if (shouldFail) {
    throw new Error(options?.errorMessage ?? "Request failed. Please try again.");
  }

  return payload;
}
