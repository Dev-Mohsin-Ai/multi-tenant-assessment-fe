export const NOT_ASSIGNED_VALUE = 'NOT_ASSIGNED'

export const SEGMENT_PRESETS = ['TRANSFORM', 'MODERNIZE', 'EDUCATE', 'SUSTAIN']

export const formatSegmentLabel = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

