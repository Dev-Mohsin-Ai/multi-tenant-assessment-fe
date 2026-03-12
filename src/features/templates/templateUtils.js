export const YES_NO_OPTIONS = [
  { response_type: 'yes', description: '', score: 10 },
  { response_type: 'no', description: '', score: 0 },
]

export const MULTI_RESPONSE_OPTIONS = [
  { response_type: 'satisfactory', description: '', score: 10 },
  { response_type: 'acceptable_risk', description: '', score: 7 },
  { response_type: 'needs_attention', description: '', score: 5 },
  { response_type: 'at_risk', description: '', score: 2 },
  { response_type: 'not_applicable', description: '', score: 0 },
  { response_type: 'unknown', description: '', score: 0 },
]

export const getResponseBadgeClass = (value, index = 0) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('satisfactory')) return 'bg-green-100 text-green-700'
  if (normalized.includes('acceptable')) return 'bg-blue-100 text-blue-700'
  if (normalized.includes('needs')) return 'bg-orange-100 text-orange-700'
  if (normalized.includes('at_risk')) return 'bg-red-100 text-red-700'
  if (normalized.includes('not_applicable')) return 'bg-purple-100 text-purple-700'
  if (normalized.includes('unknown')) return 'bg-gray-100 text-gray-700'
  if (normalized.includes('yes')) return 'bg-green-100 text-green-700'
  if (normalized.includes('partial')) return 'bg-orange-100 text-orange-700'
  if (normalized.includes('no')) return 'bg-red-100 text-red-700'
  const palette = [
    'bg-teal-100 text-teal-700',
    'bg-amber-100 text-amber-700',
    'bg-sky-100 text-sky-700',
    'bg-rose-100 text-rose-700',
    'bg-lime-100 text-lime-700',
  ]
  return palette[index % palette.length]
}

export const formatResponseLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const getDefaultOptions = (type) => {
  if (type === 'multi_response') return MULTI_RESPONSE_OPTIONS
  return YES_NO_OPTIONS
}

export const getNextMultiResponse = (current = []) => {
  const index = current.length % MULTI_RESPONSE_OPTIONS.length
  return { ...MULTI_RESPONSE_OPTIONS[index] }
}

export const createCategory = (weight = 0) => ({
  title: '',
  description: '',
  weight_percentage: weight,
  sub_categories: [],
})

export const createSubcategory = (weight = 0) => ({
  title: '',
  description: '',
  weight_percentage: weight,
  scoring_instructions: '',
  remediation_tips: '',
  type: 'yes_no',
  response_options: getDefaultOptions('yes_no'),
})

export const normalizeTemplate = (template) => ({
  id: template?.id,
  title: template?.title || template?.name || '',
  description: template?.description || '',
  categories: (template?.categories || []).map((category) => ({
    title: category?.title || '',
    description: category?.description || '',
    weight_percentage: category?.weight_percentage ?? 0,
    order: category?.order ?? 0,
    sub_categories: (category?.sub_categories || category?.subcategories || []).map(
      (subcategory) => ({
        title: subcategory?.title || '',
        description: subcategory?.description || '',
        weight_percentage: subcategory?.weight_percentage ?? 0,
        scoring_instructions: subcategory?.scoring_instructions || '',
        remediation_tips: subcategory?.remediation_tips || '',
        type: subcategory?.type === 'multi_response' ? 'multi_response' : 'yes_no',
        order: subcategory?.order ?? 0,
        response_options: (
          subcategory?.response_options ||
          subcategory?.responseOptions ||
          []
        ).map((option) => ({
          response_type: option?.response_type || '',
          description: option?.description || '',
          score: option?.score ?? 0,
          order: option?.order ?? 0,
        })),
      })
    ),
  })),
})

export const buildPayload = (template) => ({
  title: template.title.trim(),
  description: String(template.description || '').trim(),
  categories: template.categories.map((category, categoryIndex) => ({
    title: category.title.trim(),
    description: category.description || '',
    weight_percentage: Number(category.weight_percentage) || 0,
    order: categoryIndex,
    sub_categories: category.sub_categories.map((subcategory, subIndex) => {
      const type = subcategory.type === 'multi_response' ? 'multi_response' : 'yes_no'
      const allowedTypes =
        type === 'multi_response'
          ? [
              'satisfactory',
              'acceptable_risk',
              'needs_attention',
              'at_risk',
              'not_applicable',
              'unknown',
            ]
          : ['yes', 'no']
      const response_options =
        type === 'multi_response'
          ? subcategory.response_options.filter((option) =>
              allowedTypes.includes(option.response_type)
            )
          : allowedTypes.map((value) => {
              const existing = subcategory.response_options.find(
                (option) => option.response_type === value
              )
              return {
                response_type: value,
                description: existing?.description || '',
              }
            })
      return {
        title: subcategory.title.trim(),
        description: subcategory.description || '',
        weight_percentage: Number(subcategory.weight_percentage) || 0,
        scoring_instructions: subcategory.scoring_instructions || '',
        remediation_tips: subcategory.remediation_tips || '',
        type,
        order: subIndex,
        response_options: response_options.map((option, optionIndex) => ({
          response_type: option.response_type,
          description: option.description || '',
          order: optionIndex,
        })),
      }
    }),
  })),
})
