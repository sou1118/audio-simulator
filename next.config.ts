import type { NextConfig } from "next"
const urlPrefix = process.env.URL_PREFIX ? `/${process.env.URL_PREFIX}` : ""
const nextConfig: NextConfig = {
	/* config options here */
	output: "export",
	assetPrefix: urlPrefix,
	basePath: urlPrefix,
	trailingSlash: true,
}

export default nextConfig
