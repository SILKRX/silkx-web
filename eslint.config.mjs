import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "public/**", "_backup_*/**"] },
  ...next,
  {
    // Новые правила React Compiler (eslint-config-next 16) — существующий код их пока нарушает.
    // Держим как предупреждения, чинить постепенно.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default config;
