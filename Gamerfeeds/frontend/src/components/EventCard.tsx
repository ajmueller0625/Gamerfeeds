export interface EventProps {
  id: number;
  name: string;
  logo_url: string;
}

export default function EventCard({ id, name, logo_url }: EventProps) {
  return (
    <div className="rounded-lg relative w-full h-full transition-all duration-300 transform hover:scale-105 text-white">
      <img
        src={logo_url}
        alt={`Card Image ${id}`}
        className="object-cover w-full h-full rounded-lg"
      />
      <div className="absolute bottom-0 left-0 w-full px-3 py-5 bg-neutral-900/50 rounded-b-lg">
        <h3 className="text-lg font-bold">{name}</h3>
      </div>
    </div>
  );
}
