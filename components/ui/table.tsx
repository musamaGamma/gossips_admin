import * as React from 'react'

export function Table({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`[&_tr]:border-b ${className}`} {...props}>{children}</thead>
}

export function TableBody({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>{children}</tbody>
}

export function TableRow({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle font-medium text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  )
}
