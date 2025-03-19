/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_OPENAI_ASSISTANT_ID: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID,
  },
  // Add this to ensure environment variables are reloaded
  serverRuntimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
  },
  publicRuntimeConfig: {
    // Add any public runtime config here if needed
  },
}

module.exports = nextConfig 