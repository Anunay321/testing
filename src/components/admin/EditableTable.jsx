import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

// fields: [{ key, label, type: 'text'|'number', width }]
export default function EditableTable({ title, items, fields, actions, formatters = {} }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === "number" ? 0 : ""]))
  );

  function startEdit(item) {
    setEditingId(item.id);
    setDraft(item);
  }

  function saveEdit() {
    actions.update(editingId, draft);
    setEditingId(null);
  }

  function saveNew() {
    actions.add(newDraft);
    setNewDraft(Object.fromEntries(fields.map((f) => [f.key, f.type === "number" ? 0 : ""])));
    setAdding(false);
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <p className="text-sm font-medium text-ink">{title}</p>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs font-medium text-plum"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="divide-y divide-line">
        {adding && (
          <div className="p-3 bg-cream-dim flex flex-wrap items-center gap-2">
            {fields.map((f) => (
              <input
                key={f.key}
                type={f.type === "number" ? "number" : "text"}
                value={newDraft[f.key]}
                onChange={(e) =>
                  setNewDraft((p) => ({
                    ...p,
                    [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
                placeholder={f.label}
                className="text-sm border border-line rounded-lg px-2 py-1.5 outline-none"
                style={{ width: f.width || 120 }}
              />
            ))}
            <button onClick={saveNew} className="text-sage"><Check size={18} /></button>
            <button onClick={() => setAdding(false)} className="text-ink/40"><X size={18} /></button>
          </div>
        )}

        {items.map((item) => (
          <div key={item.id} className="p-3 flex flex-wrap items-center gap-2">
            {editingId === item.id ? (
              <>
                {fields.map((f) => (
                  <input
                    key={f.key}
                    type={f.type === "number" ? "number" : "text"}
                    value={draft[f.key]}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className="text-sm border border-line rounded-lg px-2 py-1.5 outline-none"
                    style={{ width: f.width || 120 }}
                  />
                ))}
                <button onClick={saveEdit} className="text-sage"><Check size={18} /></button>
                <button onClick={() => setEditingId(null)} className="text-ink/40"><X size={18} /></button>
              </>
            ) : (
              <>
                {fields.map((f) => (
                  <span key={f.key} className="text-sm text-ink" style={{ minWidth: f.width || 120 }}>
                    {formatters[f.key] ? formatters[f.key](item[f.key]) : item[f.key]}
                  </span>
                ))}
                <button onClick={() => startEdit(item)} className="text-ink/40 ml-auto"><Pencil size={15} /></button>
                <button onClick={() => actions.remove(item.id)} className="text-rose/70"><Trash2 size={15} /></button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && !adding && (
          <p className="text-sm text-ink/40 p-4">Nothing here yet — click Add to create one.</p>
        )}
      </div>
    </div>
  );
}
