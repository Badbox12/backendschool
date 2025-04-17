import { Elysia } from "elysia";

export const rateLimit = (limit: number, windowMs: number) => {
  const ipMap = new Map();

  return async ({ headers }: any) => {
    const ip = headers["x-forwarded-for"] || headers["remote-addr"];

    const now = Date.now();
    if (!ipMap.has(ip)) {
      ipMap.set(ip, { count: 1, firstRequestTime: now });
    } else {
      const { count, firstRequestTime } = ipMap.get(ip);
      if (now - firstRequestTime < windowMs) {
        if (count >= limit) {
          throw new Error("Too many requests, please try again later.");
        }
        ipMap.set(ip, { count: count + 1, firstRequestTime });
      } else {
        ipMap.set(ip, { count: 1, firstRequestTime: now });
      }
    }
  };
};

