import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" },
    // hardcoded outside the palette on purpose: these greys are repeated in components
    background: { default: "#f5f5f5" },
    text: { secondary: "#888888" },
  },
  shape: { borderRadius: 4 },
});
