import ResetPasswordCard from "../components/ResetPasswordCard";

export default function ChangePassword() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col z-10">
      <h1 className="div-header font-[Black_Ops_one] text-3xl mt-25">
        Reset Password
      </h1>
      <div className="flex-grow flex items-center justify-center">
        <ResetPasswordCard />
      </div>
    </div>
  );
}
