import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="flex justify-center">
      <div className="py-5 flex flex-row items-center justify-between font-[Hubot_Sans] font-semibold max-w-7xl w-full">
        <Link to="" className="hover:underline">
          About Us
        </Link>
        <h3>
          Nackademin <span className="text-xs">&#169;</span>
        </h3>
        <Link to="" className="hover:underline">
          Contact Us
        </Link>
      </div>
    </footer>
  );
}
