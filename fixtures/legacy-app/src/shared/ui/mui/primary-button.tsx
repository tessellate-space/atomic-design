import Button, { type ButtonProps } from "@mui/material/Button";

// SEEDED: button wrapper #2, near-identical to AppButton
export function PrimaryButton(props: ButtonProps) {
  return <Button variant="contained" color="primary" disableElevation sx={{ textTransform: "none" }} {...props} />;
}
