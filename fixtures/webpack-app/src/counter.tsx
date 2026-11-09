import styles from "./counter.module.css";

export type CounterProps = { value: number; onIncrement: () => void; label?: string };

export function Counter({ value, onIncrement, label = "Count" }: CounterProps) {
  return (
    <div className={styles.root}>
      <span>{label}</span>
      <output className={styles.value}>{value}</output>
      <button type="button" onClick={onIncrement}>
        Add one
      </button>
    </div>
  );
}
