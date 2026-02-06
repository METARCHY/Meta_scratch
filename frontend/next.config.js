/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "fs": false,
            "encoding": false,
            "os": false,
            "path": false,
            "worker_threads": false,
            "crypto": false
        };
        return config;
    }
};

module.exports = nextConfig;
