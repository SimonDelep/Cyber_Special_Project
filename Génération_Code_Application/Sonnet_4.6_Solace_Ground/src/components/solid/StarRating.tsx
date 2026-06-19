type Props = {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
};

export default function StarRating(props: Props) {
  const max = () => props.max ?? 5;
  const sizeClass = () => (props.size === 'sm' ? 'text-sm' : 'text-base');

  return (
    <span class={`inline-flex gap-0.5 text-amber-600 ${sizeClass()}`} aria-label={`${props.value} out of ${max()} stars`}>
      {Array.from({ length: max() }, (_, i) => (
        <span aria-hidden="true">{i < Math.round(props.value) ? '★' : '☆'}</span>
      ))}
    </span>
  );
}
