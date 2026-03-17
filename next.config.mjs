/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", //VERY IMPORTANT for Azure

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
};

export default nextConfig;
