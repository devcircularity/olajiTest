
// components/chat/tools/blocks/FormBlock.tsx
'use client'
import { useState } from 'react'
import { FormBlock as FormBlockType, Action } from '../types'

interface Props {
  block: FormBlockType
  onAction?: (action: Action) => void
}

export function FormBlock({ block, onAction }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, you'd make the API call here
      console.log('Form submission:', {
        endpoint: block.config.submit.endpoint,
        method: block.config.submit.method,
        data: formData
      })

      if (onAction) {
        onAction({
          type: 'mutation',
          endpoint: block.config.submit.endpoint,
          method: block.config.submit.method,
          data: formData
        } as any)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.key] || ''

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className="input min-h-20"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
          />
        )

      case 'select':
        return (
          <select
            className="input"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'date':
        return (
          <input
            type="date"
            className="input"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            className="input"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
          />
        )

      default:
        return (
          <input
            type="text"
            className="input"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
          />
        )
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        {block.config.title}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {block.config.fields.map((field) => (
          <div key={field.key}>
            <label className="label">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            className="btn border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            onClick={() => setFormData({})}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}