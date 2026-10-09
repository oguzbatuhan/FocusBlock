import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  base: "/FocusBlock/",
  plugins: [tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  server: {
    host: true, // Ağ üzerindeki diğer cihazların erişimine izin verir
    port: 5173,
  },
});
