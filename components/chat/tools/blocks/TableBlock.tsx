// components/chat/tools/blocks/TableBlock.tsx
'use client'
import { useState } from 'react'
import { TableBlock as TableBlockType, Action, TableRow, BadgeVariant } from '../types'
import { formatValue } from '../utils/formatters'
import { getAlignmentClass, getVariantClasses } from '../utils/styles'

interface Props {
  block: TableBlockType
  onAction?: (action: Action) => void
}

export function TableBlock({ block, onAction }: Props) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  const handleRowClick = (row: TableRow, index: number) => {
    if (row._action && onAction) {
      onAction(row._action)
    }
  }

  const handleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedRows(newSelected)
  }

  const handleActionClick = (action: any) => {
    if (onAction) {
      const actionWithSelection = {
        ...action,
        selectedRows: Array.from(selectedRows)
      }
      onAction(actionWithSelection)
    }
  }

  const renderCellValue = (value: any, column: any) => {
    if (column.format) {
      return formatValue(value, column.format)
    }

    if (column.badge && typeof value === 'string') {
      const variant = column.badge.map[value] || 'primary'
      const classes = getVariantClasses(variant as BadgeVariant)
      return (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${classes.badge}`}>
          {value}
        </span>
      )
    }

    return value
  }

  const hasSelectionActions = block.config.actions?.some(action => action.selectionRequired)

  return (
    <div className="card">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {block.config.title}
          </h3>
          
          {/* Actions */}
          {block.config.actions && block.config.actions.length > 0 && (
            <div className="flex gap-2">
              {block.config.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  disabled={action.selectionRequired && selectedRows.size === 0}
                  className="btn-primary disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Filters */}
        {block.config.filters && block.config.filters.length > 0 && (
          <div className="flex gap-4 mt-4">
            {block.config.filters.map((filter, index) => (
              <div key={index} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select className="input min-w-32">
                    <option value="">All</option>
                    {filter.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : filter.type === 'daterange' ? (
                  <input type="date" className="input" />
                ) : (
                  <input type="text" className="input" placeholder={`Filter ${filter.label}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              {hasSelectionActions && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(Array.from({ length: block.config.rows.length }, (_, i) => i)))
                      } else {
                        setSelectedRows(new Set())
                      }
                    }}
                    className="rounded border-neutral-300"
                  />
                </th>
              )}
              {block.config.columns.map((column) => (
                <th 
                  key={column.key}
                  className={`px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 ${getAlignmentClass(column.align)}`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {block.config.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`
                  hover:bg-neutral-50 dark:hover:bg-neutral-800/50
                  ${row._action ? 'cursor-pointer' : ''}
                  ${selectedRows.has(rowIndex) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onClick={() => handleRowClick(row, rowIndex)}
              >
                {hasSelectionActions && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => handleRowSelection(rowIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-neutral-300"
                    />
                  </td>
                )}
                {block.config.columns.map((column) => (
                  <td 
                    key={column.key}
                    className={`px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 ${getAlignmentClass(column.align)}`}
                  >
                    {renderCellValue(row[column.key], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {block.config.pagination && (
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              Showing {((currentPage - 1) * block.config.pagination.pageSize) + 1} to{' '}
              {Math.min(currentPage * block.config.pagination.pageSize, block.config.pagination.total)} of{' '}
              {block.config.pagination.total} results
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {Math.ceil(block.config.pagination.total / block.config.pagination.pageSize)}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(block.config.pagination.total / block.config.pagination.pageSize)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}