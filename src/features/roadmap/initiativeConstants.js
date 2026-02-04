export const STATUS_OPTIONS = [
  'Open',
  'Proposed',
  'Approved',
  'In Progress',
  'Completed',
  'On Hold',
  'Declined',
]

export const PRIORITY_OPTIONS = [
  { label: 'Minimal', value: 'Minimal', display: '.' },
  { label: 'Low', value: 'Low', display: '!' },
  { label: 'Medium', value: 'Medium', display: '!!' },
  { label: 'High', value: 'High', display: '!!!' },
]

export const CONTACTS = [
  { id: 1, full_name: 'Hamza Abid' },
  { id: 2, full_name: 'Sara Ahmed' },
  { id: 3, full_name: 'Ali Khan' },
  { id: 4, full_name: 'Usman Raza' },
]
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export const STATUS_TO_API = {
  Open: 'open',
  Proposed: 'proposed',
  Approved: 'approved',
  'In Progress': 'in_progress',
  Completed: 'completed',
  'On Hold': 'on_hold',
  Declined: 'declined',
}

export const STATUS_FROM_API = Object.entries(STATUS_TO_API).reduce(
  (acc, [label, key]) => {
    acc[key] = label
    return acc
  },
  {}
)

export const PRIORITY_TO_API = {
  Minimal: 0,
  Low: 1,
  Medium: 2,
  High: 3,
}

export const PRIORITY_FROM_API = {
  0: 'Minimal',
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const getQuarterFromDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth()
  return QUARTERS[Math.floor(month / 3)]
}

export const getQuarterStartDate = (year, quarter) => {
  const index = QUARTERS.indexOf(quarter)
  const month = index === -1 ? 0 : index * 3
  return new Date(year, month, 1).toISOString().slice(0, 10)
}
