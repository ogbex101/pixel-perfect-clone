import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  vercel: {
    functions: {
      runtime: "nodejs22.x",
    },
  },
});
