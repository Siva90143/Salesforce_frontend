import { useCallback, useEffect, useRef, useState } from 'react'
import { OBJECTS, FIELDS } from './objectFields'
import {
  loginUrl,
  getAuthStatus,
  logout as logoutRequest,
  listRecords,
  getRecord,
  updateRecord,
  deleteRecord,
} from './api/salesforce'
import RecordModal from './components/RecordModal'
import ToastContainer from './components/ToastContainer'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [instanceUrl, setInstanceUrl] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [objectName, setObjectName] = useState(OBJECTS[0])
  const [records, setRecords] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState('')

  const [modal, setModal] = useState(null) // { mode: 'view'|'edit'|'delete', record }
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const status = await getAuthStatus()
      setAuthenticated(status.authenticated)
      setInstanceUrl(status.instanceUrl)
    } catch {
      setAuthenticated(false)
    } finally {
      setCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    const params = new URLSearchParams(window.location.search)
    if (params.get('sf_connected') === 'true') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [checkAuth])

  const loadPage = useCallback(
    async (obj, pageNum) => {
      setLoadingList(true)
      setListError('')
      try {
        const data = await listRecords(obj, pageNum)

        // Salesforce's `done` flag reflects only this LIMIT/OFFSET batch, not
        // whether the object has more rows beyond it — a full page (20 rows)
        // means there may be more, a short page means this is the last one.
        if (data.records.length === 0 && pageNum > 0) {
          setHasMore(false)
          return
        }

        setRecords(data.records)
        setHasMore(data.records.length === 20)
        setPage(pageNum)
      } catch (err) {
        setListError(err.response?.data?.message || err.message || 'Failed to load records')
      } finally {
        setLoadingList(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!authenticated) return
    loadPage(objectName, 0)
  }, [authenticated, objectName, loadPage])

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch {
      // even if the request fails, drop the client-side session state
    } finally {
      setAuthenticated(false)
      setInstanceUrl('')
      setRecords([])
      setPage(0)
      setHasMore(true)
    }
  }

  function goToPreviousPage() {
    if (page === 0 || loadingList) return
    loadPage(objectName, page - 1)
  }

  function goToNextPage() {
    if (!hasMore || loadingList) return
    loadPage(objectName, page + 1)
  }

  async function openView(record) {
    setModal({ mode: 'view', record })
    setModalError('')
    try {
      const fresh = await getRecord(objectName, record.Id)
      setModal({ mode: 'view', record: fresh })
    } catch {
      // fall back to the row data already shown in the list
    }
  }

  async function openEdit(record) {
    setModal({ mode: 'edit', record })
    setModalError('')
  }

  function openDelete(record) {
    setModal({ mode: 'delete', record })
    setModalError('')
  }

  async function handleSave(form) {
    setModalLoading(true)
    setModalError('')
    try {
      const { Id, ...fields } = form
      await updateRecord(objectName, Id, fields)
      setRecords((prev) => prev.map((r) => (r.Id === Id ? { ...r, ...fields } : r)))
      setModal(null)
      showToast(`${objectName} updated successfully.`)
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to save record'
      setModalError(message)
      showToast(message, 'error')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete() {
    setModalLoading(true)
    setModalError('')
    try {
      const id = modal.record.Id
      await deleteRecord(objectName, id)
      setRecords((prev) => prev.filter((r) => r.Id !== id))
      setModal(null)
      showToast(`${objectName} deleted successfully.`)
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to delete record'
      setModalError(message)
      showToast(message, 'error')
    } finally {
      setModalLoading(false)
    }
  }

  const fields = FIELDS[objectName]

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} />

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Salesforce Records</h1>
          {checkingAuth ? (
            <span className="text-sm text-gray-400">Checking connection…</span>
          ) : authenticated ? (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected {instanceUrl ? `(${new URL(instanceUrl).hostname})` : ''}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <a
              href={loginUrl()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Log in to Salesforce
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {!authenticated && !checkingAuth && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Log in to Salesforce to browse and manage your records.
          </div>
        )}

        {authenticated && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <label htmlFor="object-select" className="text-sm font-medium text-gray-700">
                Object
              </label>
              <select
                id="object-select"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold focus:border-blue-500 focus:outline-none"
              >
                {OBJECTS.map((obj) => (
                  <option key={obj} value={obj} className="font-semibold">
                    {obj}
                  </option>
                ))}
              </select>
            </div>

            {listError && (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{listError}</div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {fields.map((f) => (
                      <th key={f} className="truncate px-4 py-2 text-left font-medium text-gray-500">
                        {f}
                      </th>
                    ))}
                    <th className="w-44 shrink-0 truncate border-l border-gray-200 bg-gray-50 px-4 py-3 text-center font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => (
                    <tr key={record.Id} className="group hover:bg-gray-50">
                      {fields.map((f) => (
                        <td key={f} title={record[f] ?? ''} className="truncate px-4 py-2 text-gray-700">
                          {record[f] ?? '—'}
                        </td>
                      ))}
                      <td className="w-44 shrink-0 truncate border-l border-gray-200 bg-white px-4 py-2 text-center group-hover:bg-gray-50">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openView(record)}
                            className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEdit(record)}
                            className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => openDelete(record)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loadingList && records.length === 0 && !listError && (
                    <tr>
                      <td colSpan={fields.length + 1} className="px-4 py-8 text-center text-gray-400">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-gray-500">
                {loadingList ? 'Loading…' : `Page ${page + 1}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={page === 0 || loadingList}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={!hasMore || loadingList}
                  className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {modal && (
        <RecordModal
          mode={modal.mode}
          objectName={objectName}
          record={modal.record}
          loading={modalLoading}
          error={modalError}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default App
