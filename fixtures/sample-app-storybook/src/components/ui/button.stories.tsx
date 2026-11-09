import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "~/components/ui/button";

const meta = { title: "Atoms/Button", component: Button, args: { children: "Get started" } } satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Outline: Story = { args: { variant: "outline" } };
