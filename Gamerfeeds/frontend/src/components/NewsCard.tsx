interface CardData {
  id: number;
  image_url: string;
  title: string;
}

export default function NewsCard({ id, image_url, title }: CardData) {
  return (
    <div className="rounded-md relative h-49 border-2 hover:cursor-pointer hover:border-0 border-transparent text-white">
      <img
        src={image_url}
        alt={`Card Image ${id}`}
        className="object-cover w-full h-full rounded-lg"
      />
      <div
        className="absolute bottom-0 left-0 w-full px-3 py-2 bg-neutral-900/60 
               font-[Hubot_Sans] rounded-b-lg"
      >
        <h3 className="text-xs font-bold">{title}</h3>
      </div>
    </div>
  );
}
