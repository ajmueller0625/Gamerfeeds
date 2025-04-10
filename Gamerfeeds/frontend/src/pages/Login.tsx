import LoginCard from "../components/LoginCard";

export default function Login() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col z-10">
      <h1 className="div-header font-[Black_Ops_one] text-3xl mt-25">Login</h1>
      <div className="flex-grow flex items-center justify-center">
        <LoginCard />
      </div>
    </div>
  );
}
