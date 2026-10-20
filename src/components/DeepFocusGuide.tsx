import { useI18n } from '../i18n'
import { Sheet } from './ui'

/** Step-by-step setup for blocking apps with an iOS Focus mode + Shortcuts automation. */
export function DeepFocusSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t: { deepFocus: t } } = useI18n()
  return (
    <Sheet open={open} onClose={onClose} title={t.title}>
      <p className="guide-intro">{t.intro}</p>
      <ol className="guide-steps">
        {t.steps.map((step, i) => (
          <li key={i}>
            <span className="guide-num" aria-hidden="true">{i + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
              {step.actions && (
                <ol className="guide-actions">
                  {step.actions.map((action) => <li key={action}>{action}</li>)}
                </ol>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="guide-tips">
        <strong>{t.tipsTitle}</strong>
        <ul>
          {t.tips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </div>
    </Sheet>
  )
}
