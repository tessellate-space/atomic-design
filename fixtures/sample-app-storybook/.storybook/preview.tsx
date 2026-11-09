import type { Preview } from "@storybook/react-vite";
import "../src/lib/i18n";
import "../src/styles.css";

const preview: Preview = {
  parameters: { controls: { expanded: true } },
};
export default preview;
