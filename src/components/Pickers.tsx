import { useState } from 'react'
import { SPECIES } from '../data/species'
import { useI18n } from '../i18n'
import { createTag, tagColor, useDark, useOwns, useTags } from '../store'
import { Tree } from './Tree'
import { Icon, Sheet } from './ui'
import type { Tag } from '../types'

export function TagDot({ tag }: { tag: Tag | undefined }) {
  const dark = useDark()
  return <span className="tag-dot" style={{ background: tagColor(tag, dark) }} />
}

export function TagChip({ tag, onClick }: { tag: Tag | undefined; onClick?: () => void }) {
  const { t } = useI18n()
  return (
    <button type="button" className="chip" onClick={onClick}>
      <TagDot tag={tag} />
      {tag?.name ?? t.common.noTag}
    </button>
  )
}

/** Inline tag picker: chips for each tag plus a "new tag" field. */
export function TagPicker({ value, onChange }: {
  value: string | null
  onChange: (id: string | null) => void
}) {
  const { t } = useI18n()
  const tags = useTags()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const add = async () => {
    if (!name.trim()) return
    const tag = await createTag(name)
    onChange(tag.id)
    setName('')
    setAdding(false)
  }

  return (
    <div className="chip-row">
      <button type="button" className={`chip${value === null ? ' selected' : ''}`} onClick={() => onChange(null)}>
        <TagDot tag={undefined} /> {t.common.noTag}
      </button>
      {tags.map((tag) => (
        <button type="button" key={tag.id} className={`chip${value === tag.id ? ' selected' : ''}`} onClick={() => onChange(tag.id)}>
          <TagDot tag={tag} /> {tag.name}
        </button>
      ))}
      {adding ? (
        <form className="chip-input" onSubmit={(e) => { e.preventDefault(); void add() }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t.pickers.tagPlaceholder} maxLength={24} onBlur={() => !name && setAdding(false)} />
          <button type="submit" className="chip selected">{t.common.add}</button>
        </form>
      ) : (
        <button type="button" className="chip ghost" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> {t.pickers.newTag}
        </button>
      )}
    </div>
  )
}

export function TagSheet({ open, onClose, value, onChange }: {
  open: boolean
  onClose: () => void
  value: string | null
  onChange: (id: string | null) => void
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onClose={onClose} title={t.pickers.tagSheetTitle}>
      <TagPicker value={value} onChange={(id) => { onChange(id); onClose() }} />
    </Sheet>
  )
}

/** Grid of owned tree species. */
export function SpeciesPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t } = useI18n()
  const owns = useOwns()
  return (
    <div className="species-grid">
      {SPECIES.filter(owns).map((s) => (
        <button type="button" key={s.id} className={`species-option${s.id === value ? ' selected' : ''}`} onClick={() => onChange(s.id)}>
          <Tree species={s} size={52} />
          <span>{t.species[s.id].name}</span>
        </button>
      ))}
    </div>
  )
}

export function SpeciesSheet({ open, onClose, value, onChange }: {
  open: boolean
  onClose: () => void
  value: string
  onChange: (id: string) => void
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onClose={onClose} title={t.pickers.treeSheetTitle}>
      <SpeciesPicker value={value} onChange={(id) => { onChange(id); onClose() }} />
      <p className="hint center">{t.pickers.unlockMore}</p>
    </Sheet>
  )
}
