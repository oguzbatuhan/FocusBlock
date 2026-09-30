import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/Pomodoro",
  plugins: [tailwindcss()],
  server: {
    host: true, // Ağ üzerindeki diğer cihazların erişimine izin verir
    port: 5173, // Dilersen portu buradan sabitleyebilirsin
  },
});
