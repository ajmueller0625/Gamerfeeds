import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="flex justify-center mt-auto">
      <div className="py-6 flex flex-row items-center justify-between font-[Hubot_Sans] font-semibold max-w-7xl w-full">
        <Link to="" className="hover:underline">
          About Us
        </Link>
        <h2>&#169; 2025 Nackademin. All rights reserved.</h2>
        <Link to="" className="hover:underline">
          Contact Us
        </Link>
      </div>
    </footer>
  );
}
