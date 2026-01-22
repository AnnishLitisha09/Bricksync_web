export default function Input({
    label,
    name,
    value,
    onChange,
    type = "text",
}: {
    label?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required
                className="border-2 border-orange-500 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-400 outline-none transition"
            />
        </div>
    );
}