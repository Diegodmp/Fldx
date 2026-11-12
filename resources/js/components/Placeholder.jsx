export default function Placeholder({ title = 'Próximamente' }) {
    return (
        <div className="p-8 text-txt-dim">
            <div className="font-serif text-2xl text-txt">{title}</div>
            <div className="mt-2 text-sm">Esta sección está en construcción.</div>
        </div>
    );
}
