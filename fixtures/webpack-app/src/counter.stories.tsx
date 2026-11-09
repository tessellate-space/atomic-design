import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Counter } from "./counter";

const meta = { title: "Molecules/Counter", component: Counter, args: { value: 3, onIncrement: () => {} } } satisfies Meta<typeof Counter>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Zero: Story = { args: { value: 0 } };
