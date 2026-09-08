type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

function PageHeader({
  eyebrow = "VOLTDESK",
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>

      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export default PageHeader;