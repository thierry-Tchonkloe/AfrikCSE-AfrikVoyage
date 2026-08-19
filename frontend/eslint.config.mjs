import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Pattern volontaire et systématique dans ce projet : chargement de
      // données au montage via `useEffect(() => { load(); }, [load])`, où
      // `load` est un callback async qui ne met à jour l'état qu'après l'await
      // (jamais de façon synchrone). C'est le pattern standard de data-fetching
      // côté client (React docs), utilisé à l'identique dans des dizaines de
      // pages — pas un défaut à corriger fichier par fichier.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
