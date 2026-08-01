import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "lash-unhook-rebirth.ngrok-free.dev",
  ],
}

export default nextConfig
