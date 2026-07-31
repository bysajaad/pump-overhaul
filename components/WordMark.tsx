import { MAP } from "@/lib/brand/wordmark-map";

function runs(row: string) {
  const output: Array<[number, number]> = [];
  let start = -1;
  for (let x = 0; x <= row.length; x++) {
    if (row[x] === "1" && start < 0) start = x;
    if (row[x] !== "1" && start >= 0) {
      output.push([start, x - start]);
      start = -1;
    }
  }
  return output;
}

export function WordMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${MAP[0].length} ${MAP.length}`}
      role="img"
      aria-label="پامپ"
    >
      {MAP.flatMap((row, y) =>
        runs(row).map(([x, width]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={width} height="1" rx="0.12" />
        )),
      )}
    </svg>
  );
}
