'use client'

interface DeleteButtonProps {
  action: () => Promise<void>
  confirmMessage?: string
  className?: string
  children?: React.ReactNode
}

export function DeleteButton({
  action,
  confirmMessage = 'Bu kayıt kalıcı olarak silinecek. Emin misiniz?',
  className = 'sb-btn-secondary text-xs text-red-500 hover:text-red-600 hover:border-red-200',
  children = 'Sil',
}: DeleteButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (confirm(confirmMessage)) action()
      }}
    >
      {children}
    </button>
  )
}
