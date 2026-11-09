import Button, { type ButtonProps } from "@mui/material/Button";

// SEEDED: button wrapper #1
export function AppButton(props: ButtonProps) {
  return <Button variant="contained" disableElevation sx={{ textTransform: "none", borderRadius: "4px" }} {...props} />;
}
