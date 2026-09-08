type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  return (
    <span
      className={`status-badge status-${normalizedStatus.replace(
        /\s+/g,
        "-"
      )}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;