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

export const CONTACTS = ['Hamza Abid', 'Sara Ahmed', 'Ali Khan', 'Usman Raza']
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

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
