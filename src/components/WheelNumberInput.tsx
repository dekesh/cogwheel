import { NumberInput, type NumberInputProps } from '@mantine/core';

type WheelNumberInputProps = Omit<NumberInputProps, 'onChange'> & {
  onChange: (value: number) => void;
};

function clamp(value: number, min?: number, max?: number): number {
  if (typeof min === 'number' && value < min) {
    return min;
  }

  if (typeof max === 'number' && value > max) {
    return max;
  }

  return value;
}

function getPrecision(step?: number): number {
  if (!step || Number.isInteger(step)) {
    return 0;
  }

  const decimalPart = step.toString().split('.')[1];

  return decimalPart ? decimalPart.length : 0;
}

export function WheelNumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  ...props
}: WheelNumberInputProps) {
  return (
    <NumberInput
      {...props}
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(nextValue) => {
        if (typeof nextValue === 'number') {
          onChange(nextValue);
        }
      }}
      onWheel={(event) => {
        if (
          !(event.currentTarget instanceof HTMLElement) ||
          !event.currentTarget.matches(':focus-within')
        ) {
          return;
        }

        event.preventDefault();

        const currentValue =
          typeof value === 'number' ? value : Number.parseFloat(String(value || 0)) || 0;
        const nextValue = currentValue + (event.deltaY < 0 ? step : -step);
        const precision = getPrecision(step);

        onChange(Number(clamp(nextValue, min, max).toFixed(precision)));
      }}
    />
  );
}
