import { useEffect, useState } from 'react'
import { editableFields } from '../objectFields'

export default function RecordModal({ mode, objectName, record, onClose, onSave, onDelete, loading, error }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    setForm(record ?? {})
  }, [record])

  const isEdit = mode === 'edit'
  const isDelete = mode === 'delete'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isDelete ? `Delete ${objectName}` : isEdit ? `Edit ${objectName}` : `View ${objectName}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {isDelete ? (
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete this {objectName.toLowerCase()} (
              <span className="font-mono">{record?.Id}</span>)? This cannot be undone.
            </p>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-400">Id</dt>
                <dd className="font-mono text-sm text-gray-700">{record?.Id}</dd>
              </div>
              {editableFields(objectName).map((field) => (
                <div key={field}>
                  <dt className="text-xs font-medium uppercase text-gray-400">{field}</dt>
                  {isEdit ? (
                    <input
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      value={form[field] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    />
                  ) : (
                    <dd className="text-sm text-gray-700">{record?.[field] ?? '—'}</dd>
                  )}
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          {isEdit && (
            <button
              onClick={() => onSave(form)}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          )}
          {isDelete && (
            <button
              onClick={onDelete}
              disabled={loading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
