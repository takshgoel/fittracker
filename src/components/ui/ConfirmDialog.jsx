import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm'}>
      <p className="text-[13px] mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>{message}</p>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }} className="btn-danger flex-1">Delete</button>
      </div>
    </Modal>
  )
}
