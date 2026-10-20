import { useState } from 'react'
import { SPECIES } from '../data/species'
import { createTag, tagColor, useDark, useOwns, useTags } from '../store'
import { Tree } from './Tree'
import { Icon, Sheet } from './ui'
import type { Tag } from '../types'

export function TagDot({ tag }: { tag: Tag | undefined }) {
  const dark = useDark()
  return <span className="tag-dot" style={{ background: tagColor(tag, dark) }} />
}

export function TagChip({ tag, onClick }: { tag: Tag | undefined; onClick?: () => void }) {
  return (
    <button type="button" className="chip" onClick={onClick}>
      <TagDot tag={tag} />
      {tag?.name ?? 'No tag'}
    </button>
  )
}

/** Inline tag picker: chips for each tag plus a "new tag" field. */
export function TagPicker({ value, onChange }: {
  value: string | null
  onChange: (id: string | null) => void
}) {
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
        <TagDot tag={undefined} /> No tag
      </button>
      {tags.map((t) => (
        <button type="button" key={t.id} className={`chip${value === t.id ? ' selected' : ''}`} onClick={() => onChange(t.id)}>
          <TagDot tag={t} /> {t.name}
        </button>
      ))}
      {adding ? (
        <form className="chip-input" onSubmit={(e) => { e.preventDefault(); void add() }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name" maxLength={24} onBlur={() => !name && setAdding(false)} />
          <button type="submit" className="chip selected">Add</button>
        </form>
      ) : (
        <button type="button" className="chip ghost" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> New tag
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
  return (
    <Sheet open={open} onClose={onClose} title="What are you focusing on?">
      <TagPicker value={value} onChange={(id) => { onChange(id); onClose() }} />
    </Sheet>
  )
}

/** Grid of owned tree species. */
export function SpeciesPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const owns = useOwns()
  return (
    <div className="species-grid">
      {SPECIES.filter(owns).map((s) => (
        <button type="button" key={s.id} className={`species-option${s.id === value ? ' selected' : ''}`} onClick={() => onChange(s.id)}>
          <Tree species={s} size={52} />
          <span>{s.name}</span>
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
  return (
    <Sheet open={open} onClose={onClose} title="Choose your tree">
      <SpeciesPicker value={value} onChange={(id) => { onChange(id); onClose() }} />
      <p className="hint center">Unlock more trees in the shop with the coins you earn.</p>
    </Sheet>
  )
}
