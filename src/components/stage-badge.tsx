const stageConfig: Record<string, { label: string; className: string }> = {
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600' },
  ready_for_editing: { label: 'Ready for Editing', className: 'bg-gray-100 text-gray-600' },
  pending:           { label: 'Pending',            className: 'bg-yellow-50 text-yellow-700' },
  in_progress:       { label: 'In Progress',        className: 'bg-blue-50 text-blue-700' },
  needs_review:      { label: 'Needs Review',       className: 'bg-purple-50 text-purple-700' },
  feedback_given:    { label: 'Feedback Given',     className: 'bg-orange-50 text-orange-700' },
  working_on_revisions: { label: 'Working on Revisions', className: 'bg-indigo-50 text-indigo-700' },
  done_with_revisions:  { label: 'Done with Revisions',  className: 'bg-green-50 text-green-700' },
}

export default function StageBadge({ stage }: { stage: string }) {
  const config = stageConfig[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}