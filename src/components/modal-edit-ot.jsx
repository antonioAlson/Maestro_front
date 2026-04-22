export default function Modal({ open, onClose, children }) {
  return (
    <div onClick={onClose} className={` modal ${open ? "visible bg-black/20" : "invisible"} `}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`rounded-xl shadow p-6 transition-all section-background modal-conent
          ${open ? "scale-100 opacity-100" : "scale-125 opacity-0"}
        `}
      >
        {children}
      </div>
    </div>
  );
}
